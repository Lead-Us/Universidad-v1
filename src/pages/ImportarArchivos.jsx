import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import {
  RiFolderOpenLine, RiCheckLine, RiLoader4Line, RiErrorWarningLine,
  RiEyeLine, RiArrowRightLine, RiDeleteBinLine, RiBookLine,
  RiCalendarLine, RiFileTextLine, RiAddLine, RiEditLine,
  RiCloseLine, RiFileLine, RiArrowDownSLine, RiArrowRightSLine,
} from 'react-icons/ri';
import styles from './ImportarArchivos.module.css';

const STEPS = ['Subir carpeta', 'Editar', 'Procesando IA', 'Vista previa', 'Listo'];

export default function ImportarArchivos() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [step,      setStep]      = useState(0);
  const [dragging,  setDragging]  = useState(false);
  const [structure, setStructure] = useState({}); // { ramoName: [fileName, ...] }
  const [texts,     setTexts]     = useState({});
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [progress,  setProgress]  = useState('');

  // Editing state
  const [editingRamo,    setEditingRamo]    = useState(null); // name being edited
  const [newRamoName,    setNewRamoName]    = useState('');
  const [addingRamo,     setAddingRamo]     = useState(false);
  const [newRamoInput,   setNewRamoInput]   = useState('');
  const [collapsedRamos, setCollapsedRamos] = useState(new Set());

  // ── Parse folder ─────────────────────────────────────────────────────────────
  const parseFiles = async (fileList) => {
    const files = Array.from(fileList);
    const tree  = {};
    const txtMap = {};
    for (const f of files) {
      const parts = f.webkitRelativePath.split('/');
      if (parts.length < 2) continue;
      const ramo = parts[1];
      if (!ramo || ramo.startsWith('.')) continue;
      if (!tree[ramo]) tree[ramo] = [];
      tree[ramo].push(f.name);
      if (f.size < 50000 && /\.(txt|md|csv)$/i.test(f.name)) {
        try { txtMap[f.webkitRelativePath] = await f.text(); } catch (_) {}
      }
    }
    setStructure(tree);
    setTexts(txtMap);
    setCollapsedRamos(new Set(Object.keys(tree)));
    setStep(1);
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); inputRef.current?.click(); };
  const onFileInput = async (e) => { if (e.target.files?.length) await parseFiles(e.target.files); };

  // ── Structure editing ────────────────────────────────────────────────────────
  const removeRamoFromStructure = (name) => {
    setStructure(s => { const n = { ...s }; delete n[name]; return n; });
  };

  const removeFileFromRamo = (ramo, file) => {
    setStructure(s => ({ ...s, [ramo]: s[ramo].filter(f => f !== file) }));
  };

  const renameRamo = (oldName) => {
    if (!newRamoName.trim() || newRamoName === oldName) { setEditingRamo(null); return; }
    setStructure(s => {
      const n = { ...s };
      n[newRamoName.trim()] = n[oldName];
      delete n[oldName];
      return n;
    });
    setEditingRamo(null);
    setNewRamoName('');
  };

  const addRamo = () => {
    const name = newRamoInput.trim();
    if (!name) return;
    setStructure(s => ({ ...s, [name]: [] }));
    setNewRamoInput('');
    setAddingRamo(false);
  };

  const toggleCollapse = (name) => {
    setCollapsedRamos(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // ── Call Gemini API ──────────────────────────────────────────────────────────
  const processWithAI = async () => {
    if (!Object.keys(structure).length) { setError('Agrega al menos un ramo.'); return; }
    setError('');
    setStep(2);
    setProgress('Enviando estructura a Gemini…');
    try {
      const resp = await fetch('/api/process-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure, textContents: texts }),
      });
      const json = await resp.json();
      if (json.error) throw new Error(json.error);
      setResult(json);
      setStep(3);
    } catch (err) {
      setError(`Error al procesar: ${err.message}`);
      setStep(1);
    }
  };

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const uid = await getUid();
      for (const ramo of result.ramos) {
        setProgress(`Guardando: ${ramo.name}…`);
        const { data: ramoRow, error: ramoErr } = await supabase.from('ramos').insert({
          user_id:             uid,
          name:                ramo.name,
          code:                ramo.code || null,
          professor:           ramo.professor || null,
          section:             ramo.section || null,
          credits:             ramo.credits ?? 0,
          color:               ramo.color ?? '#4f8ef7',
          has_attendance:      ramo.has_attendance ?? false,
          evaluation_modules:  (ramo.evaluationModules ?? []).map(m => ({
            ...m, id: m.id || uuidv4(),
            items: (m.items || []).map(i => ({ ...i, id: i.id || uuidv4() })),
          })),
          attendance_sessions: [],
        }).select().single();
        if (ramoErr) throw ramoErr;
        const ramoId = ramoRow.id;
        if (ramo.schedule?.length) {
          await supabase.from('schedule').insert(ramo.schedule.map(b => ({
            user_id: uid, ramo_id: ramoId,
            day_of_week: b.day_of_week, start_time: b.start_time,
            end_time: b.end_time, sala: b.sala || '',
          })));
        }
        if (ramo.units?.length) {
          await supabase.from('units').insert(ramo.units.map(u => ({
            user_id: uid, ramo_id: ramoId,
            name: u.name, order: u.order ?? 0, materias: u.materias ?? [],
          })));
        }

        // Save file list to localStorage for the files browser
        // We don't have actual file data (base64), but we save the filenames so they appear listed
        if (ramo.files?.length) {
          const existing = {};
          try {
            const saved = localStorage.getItem(`uni_files_${ramoId}`);
            if (saved) Object.assign(existing, JSON.parse(saved));
          } catch {}

          if (!existing['todos']) existing['todos'] = [];
          ramo.files.forEach(fileName => {
            const alreadyExists = existing['todos'].some(f => f.name === fileName);
            if (!alreadyExists) {
              existing['todos'].push({
                name: fileName,
                size: 0,
                uploadedAt: new Date().toISOString(),
                data: null, // actual file not available, only metadata
                fromImport: true,
              });
            }
          });
          try { localStorage.setItem(`uni_files_${ramoId}`, JSON.stringify(existing)); } catch {}
        }
      }
      setStep(4);
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const removeResultRamo = (idx) =>
    setResult(r => ({ ...r, ramos: r.ramos.filter((_, i) => i !== idx) }));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Importar archivos</h1>
        <p className={styles.subtitle}>Sube tu carpeta de ramos y la IA creará toda la estructura automáticamente</p>
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        {STEPS.map((label, i) => (
          <div key={i} className={[styles.stepItem, i <= step ? styles.stepDone : ''].join(' ')}>
            <div className={styles.stepCircle}>{i < step ? <RiCheckLine /> : i + 1}</div>
            <span className={styles.stepLabel}>{label}</span>
            {i < STEPS.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Upload ── */}
      {step === 0 && (
        <div className={styles.card}>
          <div
            className={[styles.dropzone, dragging ? styles.dropping : ''].join(' ')}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" webkitdirectory="" multiple
              style={{ display: 'none' }} onChange={onFileInput} />
            <RiFolderOpenLine className={styles.dropIcon} />
            <p className={styles.dropTitle}>Haz clic o arrastra tu carpeta aquí</p>
            <p className={styles.dropSub}>Estructura: Ramos/ → NombreRamo/ → archivos</p>
          </div>
          <div className={styles.instructions}>
            <h3>Estructura esperada</h3>
            <pre className={styles.tree}>{`📁 MisCarpeta/
  📁 Econometría/
      Unidad 1.pdf
      Syllabus ECO355.pdf
  📁 Finanzas/
      Control 1.pdf
      Prueba 1.pdf`}</pre>
            <p>Mientras más descriptivos sean los nombres, mejor será el resultado.</p>
          </div>
        </div>
      )}

      {/* ── Step 1: Edit structure ── */}
      {step === 1 && (
        <div className={styles.card}>
          <div className={styles.editHeader}>
            <div>
              <h2 className={styles.editTitle}>{Object.keys(structure).length} ramos detectados</h2>
              <p className={styles.editSubtitle}>Edita, añade o elimina ramos y archivos antes de procesar</p>
            </div>
            <button className={styles.btnSecondary} onClick={() => { setStructure({}); setStep(0); }}>
              Cambiar carpeta
            </button>
          </div>

          <div className={styles.ramoEditList}>
            {Object.entries(structure).map(([ramo, files]) => (
              <div key={ramo} className={styles.ramoEditCard}>
                {/* Ramo header */}
                <div className={styles.ramoEditHeader}>
                  {editingRamo === ramo ? (
                    <div className={styles.renameRow}>
                      <input
                        className={styles.renameInput}
                        value={newRamoName}
                        onChange={e => setNewRamoName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameRamo(ramo); if (e.key === 'Escape') setEditingRamo(null); }}
                        autoFocus
                      />
                      <button className={styles.iconBtnAccent} onClick={() => renameRamo(ramo)}><RiCheckLine /></button>
                      <button className={styles.iconBtnMuted} onClick={() => setEditingRamo(null)}><RiCloseLine /></button>
                    </div>
                  ) : (
                    <>
                      <button className={styles.collapseBtn} onClick={() => toggleCollapse(ramo)}>
                        {collapsedRamos.has(ramo) ? <RiArrowRightSLine /> : <RiArrowDownSLine />}
                      </button>
                      <RiBookLine className={styles.ramoEditIcon} />
                      <span className={styles.ramoEditName} onClick={() => toggleCollapse(ramo)} style={{cursor:'pointer'}}>{ramo}</span>
                      <span className={styles.ramoEditCount}>{files.length} archivos</span>
                      <button className={styles.iconBtnMuted} onClick={() => { setEditingRamo(ramo); setNewRamoName(ramo); }} title="Renombrar"><RiEditLine /></button>
                      <button className={styles.iconBtnDanger} onClick={() => removeRamoFromStructure(ramo)} title="Eliminar ramo"><RiDeleteBinLine /></button>
                    </>
                  )}
                </div>

                {/* Files list */}
                {!collapsedRamos.has(ramo) && files.length > 0 && (
                  <div className={styles.filesList}>
                    {files.map(file => (
                      <div key={file} className={styles.fileItem}>
                        <RiFileLine className={styles.fileIcon} />
                        <span className={styles.fileName}>{file}</span>
                        <button className={styles.iconBtnMuted} onClick={() => removeFileFromRamo(ramo, file)} title="Quitar archivo"><RiCloseLine /></button>
                      </div>
                    ))}
                  </div>
                )}
                {!collapsedRamos.has(ramo) && files.length === 0 && (
                  <p className={styles.emptyFiles}>Sin archivos — la IA inferirá solo por el nombre del ramo</p>
                )}
              </div>
            ))}

            {/* Add ramo */}
            {addingRamo ? (
              <div className={styles.addRamoRow}>
                <input
                  className={styles.renameInput}
                  placeholder="Nombre del nuevo ramo…"
                  value={newRamoInput}
                  onChange={e => setNewRamoInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addRamo(); if (e.key === 'Escape') setAddingRamo(false); }}
                  autoFocus
                />
                <button className={styles.iconBtnAccent} onClick={addRamo}><RiCheckLine /></button>
                <button className={styles.iconBtnMuted} onClick={() => setAddingRamo(false)}><RiCloseLine /></button>
              </div>
            ) : (
              <button className={styles.addRamoBtn} onClick={() => setAddingRamo(true)}>
                <RiAddLine /> Añadir ramo manualmente
              </button>
            )}
          </div>

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={processWithAI} disabled={!Object.keys(structure).length}>
              Procesar con IA <RiArrowRightLine />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Processing ── */}
      {step === 2 && (
        <div className={[styles.card, styles.cardCenter].join(' ')}>
          <RiLoader4Line className={styles.spinner} />
          <h2 className={styles.processingTitle}>Analizando con IA…</h2>
          <p className={styles.processingMsg}>{progress}</p>
          <p className={styles.processingHint}>
            Gemini está leyendo la estructura y generando ramos, unidades, módulos de evaluación y horarios.
          </p>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 3 && result && (
        <div className={styles.card}>
          <div className={styles.previewHeader}>
            <RiEyeLine />
            <h2>Vista previa — {result.ramos.length} ramos generados</h2>
          </div>
          <p className={styles.previewNote}>Revisa y elimina lo que no quieras antes de guardar.</p>

          <div className={styles.ramoCards}>
            {result.ramos.map((ramo, idx) => (
              <div key={idx} className={styles.ramoCard}>
                <div className={styles.ramoCardTop}>
                  <div className={styles.ramoColorDot} style={{ background: ramo.color }} />
                  <div className={styles.ramoCardInfo}>
                    <strong>{ramo.name}</strong>
                    {ramo.code && <span className={styles.badge}>{ramo.code}</span>}
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeResultRamo(idx)}>
                    <RiDeleteBinLine />
                  </button>
                </div>
                <div className={styles.ramoCardMeta}>
                  {ramo.professor && <span>👤 {ramo.professor}</span>}
                  {ramo.credits   && <span>📚 {ramo.credits} créditos</span>}
                  {ramo.section   && <span>🔖 {ramo.section}</span>}
                </div>
                <div className={styles.ramoCardStats}>
                  {ramo.units?.length > 0 && <span><RiFileTextLine /> {ramo.units.length} unidades</span>}
                  {ramo.schedule?.length > 0 && <span><RiCalendarLine /> {ramo.schedule.length} bloques horario</span>}
                  {ramo.evaluationModules?.length > 0 && <span>📊 {ramo.evaluationModules.length} módulos eval.</span>}
                </div>
              </div>
            ))}
          </div>

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => { setStep(1); setResult(null); }}>Volver</button>
            <button className={styles.btnPrimary} onClick={saveAll} disabled={saving || !result.ramos.length}>
              {saving
                ? <><RiLoader4Line className={styles.spinnerSmall} /> {progress || 'Guardando…'}</>
                : <>Guardar todo <RiCheckLine /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && (
        <div className={[styles.card, styles.cardCenter].join(' ')}>
          <div className={styles.successIcon}><RiCheckLine /></div>
          <h2 className={styles.successTitle}>¡Importación completada!</h2>
          <p className={styles.successMsg}>Todos los ramos, horarios y unidades han sido creados en tu cuenta.</p>
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => { setStep(0); setStructure({}); setResult(null); }}>
              Importar más
            </button>
            <button className={styles.btnPrimary} onClick={() => navigate('/ramos')}>
              Ver mis ramos <RiArrowRightLine />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
