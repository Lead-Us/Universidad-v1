import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase, getUid } from '../lib/supabase.js';
import { getRamos } from '../services/ramosService.js';
import { uploadRamoFile, addFileRecord } from '../services/ramoFilesService.js';
import { v4 as uuidv4 } from 'uuid';
import {
  RiFolderOpenLine, RiCheckLine, RiLoader4Line, RiErrorWarningLine,
  RiEyeLine, RiArrowRightLine, RiDeleteBinLine, RiBookLine,
  RiCalendarLine, RiFileTextLine, RiAddLine, RiEditLine,
  RiCloseLine, RiFileLine, RiArrowDownSLine, RiArrowRightSLine,
  RiFileSearchLine, RiAlertLine, RiArrowLeftLine,
  RiRefreshLine,
} from 'react-icons/ri';
import styles from './ImportarArchivos.module.css';

// Set up pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

const STEPS = ['Subir carpeta', 'Editar', 'Procesando IA', 'Vista previa', 'Organizar', 'Listo'];

const DEFAULT_FOLDER_OPTIONS = [
  { key: 'todos',                label: 'Todos los archivos'   },
  { key: 'evaluaciones_pasadas', label: 'Evaluaciones pasadas' },
  { key: 'ejercicios',           label: 'Ejercicios'           },
  { key: 'ppt',                  label: 'PPT'                  },
];

// ── Detect program file candidates ────────────────────────────────────
function detectProgramCandidates(fileNames) {
  return fileNames.filter(f => {
    if (!/\.(pdf|docx)$/i.test(f)) return false;
    const name = f.toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/\.[^.]+$/, '');
    if (/programa|syllabus|reglas|guia|plan de estudios|course outline|letras/.test(name)) return true;
    // Code-only or numeric filename (e.g. "ECO355.pdf", "12345.pdf")
    if (/^[a-z0-9]{3,12}$/.test(name)) return true;
    return false;
  });
}

// ── Extract text from PDF / DOCX ──────────────────────────────────────
async function extractProgramText(file) {
  if (/\.pdf$/i.test(file.name)) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      return text.slice(0, 8000);
    } catch { return ''; }
  }
  if (/\.docx$/i.test(file.name)) {
    try {
      const { unzipSync } = await import('fflate');
      const buf = new Uint8Array(await file.arrayBuffer());
      const unzipped = unzipSync(buf);
      const xmlKey = Object.keys(unzipped).find(k => k === 'word/document.xml');
      if (!xmlKey) return '';
      const xml = new TextDecoder().decode(unzipped[xmlKey]);
      return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
    } catch { return ''; }
  }
  return '';
}

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
  const [editingRamo,    setEditingRamo]    = useState(null);
  const [newRamoName,    setNewRamoName]    = useState('');
  const [addingRamo,     setAddingRamo]     = useState(false);
  const [newRamoInput,   setNewRamoInput]   = useState('');
  const [collapsedRamos, setCollapsedRamos] = useState(new Set());

  // Program file state
  const [rawFileMap,    setRawFileMap]    = useState({}); // { [ramo]: { [filename]: File } }
  const [programFiles,  setProgramFiles]  = useState({}); // { [ramo]: filename | null }

  // Import mode state (step 3 preview)
  const [importMode,    setImportMode]    = useState('create'); // 'create' | 'update'
  const [existingRamos, setExistingRamos] = useState([]);       // ramos del usuario
  const [ramoMapping,   setRamoMapping]   = useState({});       // { resultIdx: existingRamoId | '' }

  // File organization state (step 4)
  const [fileAssignments, setFileAssignments] = useState({}); // { ramoName: { fileName: folderKey } }

  // Load existing ramos when reaching preview step
  useEffect(() => {
    if (step === 3) {
      getRamos().then(r => setExistingRamos(r)).catch(() => {});
    }
  }, [step]);

  // ── Parse folder ─────────────────────────────────────────────────────
  const parseFiles = async (fileList) => {
    const files  = Array.from(fileList);
    const tree   = {};
    const txtMap = {};
    const rawMap = {};

    for (const f of files) {
      const parts = f.webkitRelativePath.split('/');
      if (parts.length < 2) continue;
      const ramo = parts[1];
      if (!ramo || ramo.startsWith('.')) continue;
      if (!tree[ramo]) { tree[ramo] = []; rawMap[ramo] = {}; }
      tree[ramo].push(f.name);
      rawMap[ramo][f.name] = f;
      if (f.size < 50000 && /\.(txt|md|csv)$/i.test(f.name)) {
        try { txtMap[f.webkitRelativePath] = await f.text(); } catch (_) {}
      }
    }

    // Auto-detect program files (1 candidate → auto-select, else null)
    const detected = {};
    for (const [ramo, fileNames] of Object.entries(tree)) {
      const candidates = detectProgramCandidates(fileNames);
      detected[ramo] = candidates.length === 1 ? candidates[0] : null;
    }

    setStructure(tree);
    setTexts(txtMap);
    setRawFileMap(rawMap);
    setProgramFiles(detected);
    setCollapsedRamos(new Set()); // start all expanded so program selector is visible
    setStep(1);
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); inputRef.current?.click(); };
  const onFileInput = async (e) => { if (e.target.files?.length) await parseFiles(e.target.files); };

  // ── Structure editing ─────────────────────────────────────────────────
  const removeRamoFromStructure = (name) => {
    setStructure(s => { const n = { ...s }; delete n[name]; return n; });
  };

  const removeFileFromRamo = (ramo, file) => {
    setStructure(s => ({ ...s, [ramo]: s[ramo].filter(f => f !== file) }));
    if (programFiles[ramo] === file) {
      setProgramFiles(p => ({ ...p, [ramo]: null }));
    }
  };

  const renameRamo = (oldName) => {
    if (!newRamoName.trim() || newRamoName === oldName) { setEditingRamo(null); return; }
    const newName = newRamoName.trim();
    setStructure(s => { const n = { ...s }; n[newName] = n[oldName]; delete n[oldName]; return n; });
    setRawFileMap(r => { const n = { ...r }; n[newName] = n[oldName]; delete n[oldName]; return n; });
    setProgramFiles(p => { const n = { ...p }; n[newName] = n[oldName]; delete n[oldName]; return n; });
    setEditingRamo(null);
    setNewRamoName('');
  };

  const addRamo = () => {
    const name = newRamoInput.trim();
    if (!name) return;
    setStructure(s => ({ ...s, [name]: [] }));
    setProgramFiles(p => ({ ...p, [name]: null }));
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

  // ── Process with AI ──────────────────────────────────────────────────
  const processWithAI = async () => {
    if (!Object.keys(structure).length) { setError('Agrega al menos un ramo.'); return; }
    const ramosSinPrograma = Object.keys(structure).filter(r => !programFiles[r]);
    if (ramosSinPrograma.length) {
      setError(`Sin programa seleccionado: ${ramosSinPrograma.join(', ')}. Selecciona el archivo del programa para cada ramo.`);
      return;
    }
    setError('');
    setStep(2);
    setProgress('Extrayendo texto de programas…');

    // Extract program text from selected files
    const enrichedTexts = { ...texts };
    for (const [ramo, filename] of Object.entries(programFiles)) {
      if (!filename) continue;
      const file = rawFileMap[ramo]?.[filename];
      if (!file) continue;
      try {
        const text = await extractProgramText(file);
        if (text) enrichedTexts[`${ramo}/__programa__`] = text;
      } catch (_) {}
    }

    setProgress('Enviando estructura a la IA…');
    try {
      const resp = await fetch('/api/process-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure, textContents: enrichedTexts }),
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

  // ── Save to Supabase ─────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const uid = await getUid();
      const structureEntries = Object.entries(structure); // preserve order for index fallback

      for (const [ramoIdx, ramo] of result.ramos.entries()) {
        setProgress(`Guardando: ${ramo.name}…`);

        // Sanitize integer fields — AI may return strings like "No especificado"
        const credits = parseInt(ramo.credits, 10);

        const ramoPayload = {
          name:               ramo.name,
          code:               ramo.code && /\S/.test(ramo.code) ? ramo.code : null,
          professor:          ramo.professor && /\S/.test(ramo.professor) ? ramo.professor : null,
          section:            ramo.section && /\S/.test(ramo.section) ? ramo.section : null,
          credits:            Number.isFinite(credits) ? credits : 0,
          evaluation_modules: (ramo.evaluationModules ?? []).map(m => ({
            ...m, id: m.id || uuidv4(),
            items: (m.items || []).map(i => ({ ...i, id: i.id || uuidv4() })),
          })),
        };

        let ramoId;

        if (importMode === 'update') {
          // Update mode: apply changes to the mapped existing ramo
          const targetId = ramoMapping[ramoIdx];
          if (!targetId) continue; // sin mapeo → saltar

          const { data: updatedRow, error: updateErr } = await supabase.from('ramos')
            .update(ramoPayload)
            .eq('id', targetId)
            .select().single();
          if (updateErr) throw updateErr;
          ramoId = updatedRow.id;

          // Reemplazar bloques de horario
          if (ramo.schedule?.length) {
            await supabase.from('schedule').delete().eq('ramo_id', ramoId);
            await supabase.from('schedule').insert(ramo.schedule.map(b => ({
              user_id: uid, ramo_id: ramoId,
              day_of_week: parseInt(b.day_of_week, 10) || 0,
              start_time: b.start_time, end_time: b.end_time, sala: b.sala || '',
              block_type: b.block_type ?? 'catedra',
            })));
          }
        } else {
          // Create mode (default): insert new ramo
          const { data: ramoRow, error: ramoErr } = await supabase.from('ramos').insert({
            user_id:             uid,
            ...ramoPayload,
            color:               ramo.color ?? '#4f8ef7',
            has_attendance:      ramo.has_attendance ?? false,
            attendance_sessions: [],
          }).select().single();
          if (ramoErr) throw ramoErr;
          ramoId = ramoRow.id;

          if (ramo.schedule?.length) {
            await supabase.from('schedule').insert(ramo.schedule.map(b => ({
              user_id: uid, ramo_id: ramoId,
              day_of_week: parseInt(b.day_of_week, 10) || 0,
              start_time: b.start_time, end_time: b.end_time, sala: b.sala || '',
              block_type: b.block_type ?? 'catedra',
            })));
          }
          if (ramo.units?.length) {
            await supabase.from('units').insert(ramo.units.map((u, ui) => ({
              user_id: uid, ramo_id: ramoId,
              name: u.name, order: parseInt(u.order, 10) || ui, materias: u.materias ?? [],
            })));
          }
        }

        // Save ALL files from original folder structure to "Todos los archivos"
        // Match by name (exact, case-insensitive, or substring), fall back to index
        const rn = ramo.name.toLowerCase();
        let structureEntry = structureEntries.find(([sName]) => {
          const s = sName.toLowerCase();
          return s === rn || s.includes(rn) || rn.includes(s);
        });
        if (!structureEntry && structureEntries[ramoIdx]) {
          structureEntry = structureEntries[ramoIdx];
        }
        const allFiles = [
          ...new Set([
            ...(structureEntry ? structureEntry[1] : []),
            ...(ramo.files ?? []),
          ]),
        ];
        if (allFiles.length) {
          const ramoKey = structureEntry?.[0];
          const fileObjects = ramoKey ? (rawFileMap[ramoKey] ?? {}) : {};

          // Build reverse map: filename → folder key (from AI classification)
          const classifiedFiles = ramo.classified_files ?? {};
          const fileToFolder = {};
          for (const [folderKey, names] of Object.entries(classifiedFiles)) {
            for (const name of (names ?? [])) {
              fileToFolder[name.toLowerCase()] = folderKey;
            }
          }
          const programaFileName = ramo.programa_file ?? programFiles[ramoKey] ?? null;

          for (const fileName of allFiles) {
            const fileObj = fileObjects[fileName];
            if (!fileObj) continue;
            const ramoAssignments = fileAssignments[ramo.name] ?? {};
            const folderKey = ramoAssignments[fileName] ?? fileToFolder[fileName.toLowerCase()] ?? 'todos';
            const isPrograma = programaFileName
              ? fileName.toLowerCase() === programaFileName.toLowerCase()
              : false;
            try {
              const { path } = await uploadRamoFile(ramoId, fileObj);
              await addFileRecord({
                ramoId,
                folder:      folderKey,
                name:        fileObj.name,
                size:        fileObj.size,
                storagePath: path,
                publicUrl:   null,
                isPrograma,
              });
            } catch (fileErr) {
              console.warn(`[Importar] No se pudo guardar "${fileName}":`, fileErr);
            }
          }
        }
      }
      setStep(5);
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const removeResultRamo = (idx) =>
    setResult(r => ({ ...r, ramos: r.ramos.filter((_, i) => i !== idx) }));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <RiArrowLeftLine /> Volver
        </button>
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
              <p className={styles.editSubtitle}>Edita ramos, archivos y confirma el programa de cada ramo antes de procesar</p>
            </div>
            <button className={styles.btnSecondary} onClick={() => { setStructure({}); setStep(0); }}>
              Cambiar carpeta
            </button>
          </div>

          <div className={styles.ramoEditList}>
            {Object.entries(structure).map(([ramo, files]) => {
              const candidates = detectProgramCandidates(files);
              const selected   = programFiles[ramo] ?? null;

              return (
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
                        <span className={styles.ramoEditName} onClick={() => toggleCollapse(ramo)} style={{ cursor: 'pointer' }}>{ramo}</span>
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

                  {/* Program file selector */}
                  {!collapsedRamos.has(ramo) && (
                    <div className={styles.programRow}>
                      <RiFileSearchLine className={styles.programIcon} />
                      <div className={styles.programContent}>
                        <span className={styles.programLabel}>Programa del curso</span>
                        {selected ? (
                          <span className={styles.programDetected}><RiCheckLine /> {selected}</span>
                        ) : (
                          <span className={styles.programWarning}><RiAlertLine /> No detectado — selecciona manualmente</span>
                        )}
                      </div>
                      <select
                        className={styles.programSelect}
                        value={selected ?? ''}
                        onChange={e => setProgramFiles(p => ({ ...p, [ramo]: e.target.value || null }))}
                      >
                        <option value="">Sin programa</option>
                        {files.filter(f => /\.(pdf|docx)$/i.test(f)).map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}

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
            La IA lee la estructura y los programas para generar ramos, unidades, módulos de evaluación y horarios.
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

          {/* Mode selector */}
          <div className={styles.modeSelector}>
            <button
              className={[styles.modeBtn, importMode === 'create' ? styles.modeBtnActive : ''].join(' ')}
              onClick={() => setImportMode('create')}
            >
              <RiAddLine /> Crear nuevos ramos
            </button>
            <button
              className={[styles.modeBtn, importMode === 'update' ? styles.modeBtnActive : ''].join(' ')}
              onClick={() => setImportMode('update')}
              disabled={existingRamos.length === 0}
            >
              <RiRefreshLine /> Actualizar ramos existentes
            </button>
          </div>

          {importMode === 'update' && (
            <p className={styles.modeHint}>
              Selecciona a qué ramo existente corresponde cada ramo detectado. Los que quedes sin asignar serán ignorados.
            </p>
          )}

          <div className={styles.ramoCards}>
            {result.ramos.map((ramo, idx) => (
              <div key={idx} className={styles.ramoCard}>
                <div className={styles.ramoCardTop}>
                  <div className={styles.ramoColorDot} style={{ background: ramo.color }} />
                  <div className={styles.ramoCardInfo}>
                    <strong>{ramo.name}</strong>
                    {ramo.code && <span className={styles.badge}>{ramo.code}</span>}
                  </div>
                  {importMode === 'create' && (
                    <button className={styles.removeBtn} onClick={() => removeResultRamo(idx)}>
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>

                {/* Mapping selector for update mode */}
                {importMode === 'update' && (
                  <div className={styles.mappingRow}>
                    <select
                      className={styles.mappingSelect}
                      value={ramoMapping[idx] ?? ''}
                      onChange={e => setRamoMapping(m => ({ ...m, [idx]: e.target.value }))}
                    >
                      <option value="">— No actualizar —</option>
                      {existingRamos.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.ramoCardMeta}>
                  {ramo.professor && <span>👤 {ramo.professor}</span>}
                  {ramo.credits   && <span>📚 {ramo.credits} créditos</span>}
                  {ramo.section   && <span>🔖 {ramo.section}</span>}
                </div>
                <div className={styles.ramoCardStats}>
                  {ramo.units?.length > 0          && <span><RiFileTextLine /> {ramo.units.length} unidades</span>}
                  {ramo.schedule?.length > 0        && <span><RiCalendarLine /> {ramo.schedule.length} bloques horario</span>}
                  {ramo.evaluationModules?.length > 0 && <span>📊 {ramo.evaluationModules.length} módulos eval.</span>}
                </div>
              </div>
            ))}
          </div>

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => { setStep(1); setResult(null); }}>Volver</button>
            <button
              className={styles.btnPrimary}
              disabled={!result.ramos.length}
              onClick={() => {
                const assignments = {};
                for (const ramo of result.ramos) {
                  assignments[ramo.name] = {};
                  const classified = ramo.classified_files ?? {};
                  for (const [folderKey, names] of Object.entries(classified)) {
                    for (const name of (names ?? [])) {
                      assignments[ramo.name][name] = folderKey;
                    }
                  }
                  for (const fileName of (ramo.files ?? [])) {
                    if (!assignments[ramo.name][fileName]) {
                      assignments[ramo.name][fileName] = 'todos';
                    }
                  }
                }
                setFileAssignments(assignments);
                setStep(4);
              }}
            >
              Organizar archivos <RiArrowRightLine />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Organizar archivos ── */}
      {step === 4 && result && (
        <div className={styles.card}>
          <div className={styles.previewHeader}>
            <RiFolderOpenLine />
            <h2>Organizar archivos</h2>
          </div>
          <p className={styles.previewNote}>Asigna cada archivo a la carpeta correcta. La IA ya hizo una clasificación inicial, pero puedes ajustarla.</p>

          {result.ramos.map((ramo, ramoIdx) => {
            const ramoKey = Object.entries(structure).find(([sName]) => {
              const rn = ramo.name.toLowerCase();
              const s = sName.toLowerCase();
              return s === rn || s.includes(rn) || rn.includes(s);
            })?.[0] ?? Object.keys(structure)[ramoIdx];
            const fileNames = ramoKey ? (structure[ramoKey] ?? []) : [];
            if (!fileNames.length) return null;
            return (
              <div key={ramoIdx} className={styles.organizeRamo}>
                <div className={styles.organizeRamoHeader}>
                  <span className={styles.organizeRamoColor} style={{ background: ramo.color }} />
                  <strong>{ramo.name}</strong>
                  <span className={styles.badge}>{fileNames.length} archivos</span>
                </div>
                <div className={styles.organizeFileList}>
                  {fileNames.map(fileName => (
                    <div key={fileName} className={styles.organizeFileRow}>
                      <RiFileLine className={styles.organizeFileIcon} />
                      <span className={styles.organizeFileName}>{fileName}</span>
                      <select
                        className={styles.organizeSelect}
                        value={fileAssignments[ramo.name]?.[fileName] ?? 'todos'}
                        onChange={e => setFileAssignments(prev => ({
                          ...prev,
                          [ramo.name]: { ...(prev[ramo.name] ?? {}), [fileName]: e.target.value },
                        }))}
                      >
                        {DEFAULT_FOLDER_OPTIONS.map(f => (
                          <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => setStep(3)}>Volver</button>
            <button className={styles.btnPrimary} onClick={saveAll} disabled={saving}>
              {saving
                ? <><RiLoader4Line className={styles.spinnerSmall} /> {progress || 'Guardando…'}</>
                : <>Confirmar y guardar <RiCheckLine /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Done ── */}
      {step === 5 && (
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
