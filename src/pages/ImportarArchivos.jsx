import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUid } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import {
  RiFolderOpenLine, RiUploadCloud2Line, RiCheckLine,
  RiLoader4Line, RiErrorWarningLine, RiEyeLine,
  RiArrowRightLine, RiDeleteBinLine, RiBookLine,
  RiCalendarLine, RiFileTextLine,
} from 'react-icons/ri';
import styles from './ImportarArchivos.module.css';

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = ['Subir carpeta', 'Procesando IA', 'Vista previa', 'Listo'];

export default function ImportarArchivos() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const [step,      setStep]      = useState(0); // 0-3
  const [dragging,  setDragging]  = useState(false);
  const [structure, setStructure] = useState({}); // { ramoName: [fileName, ...] }
  const [texts,     setTexts]     = useState({}); // { path: text }
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [progress,  setProgress]  = useState('');

  // ── Parse folder input ───────────────────────────────────────────────────────
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

      // Read text files for extra context
      if (f.size < 50000 && /\.(txt|md|csv)$/i.test(f.name)) {
        try {
          const text = await f.text();
          txtMap[f.webkitRelativePath] = text;
        } catch (_) { /* skip */ }
      }
    }

    setStructure(tree);
    setTexts(txtMap);
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  const onDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const items = e.dataTransfer?.items;
    if (!items) return;
    // For drag & drop, fall back to input (folder drag not universally supported)
    inputRef.current?.click();
  };

  const onFileInput = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    await parseFiles(files);
  };

  // ── Call API Route ───────────────────────────────────────────────────────────
  const processWithAI = async () => {
    if (!Object.keys(structure).length) {
      setError('Selecciona una carpeta primero.');
      return;
    }
    setError('');
    setStep(1);
    setProgress('Enviando estructura al agente IA…');

    try {
      const resp = await fetch('/api/process-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structure, textContents: texts }),
      });

      const json = await resp.json();
      if (json.error) throw new Error(json.error);

      setResult(json);
      setStep(2);
    } catch (err) {
      setError(`Error al procesar: ${err.message}`);
      setStep(0);
    }
  };

  // ── Save to Supabase ──────────────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    setError('');
    try {
      const uid = await getUid();

      for (const ramo of result.ramos) {
        setProgress(`Guardando ramo: ${ramo.name}…`);

        // Insert ramo
        const { data: ramoRow, error: ramoErr } = await supabase.from('ramos').insert({
          user_id:             uid,
          name:                ramo.name,
          code:                ramo.code || null,
          professor:           ramo.professor || null,
          section:             ramo.section || null,
          credits:             ramo.credits ?? 0,
          color:               ramo.color ?? '#4f8ef7',
          has_attendance:      ramo.has_attendance ?? false,
          evaluation_modules:  (ramo.evaluationModules ?? []).map(m => ({ ...m, id: m.id || uuidv4(), items: (m.items || []).map(i => ({ ...i, id: i.id || uuidv4() })) })),
          attendance_sessions: [],
        }).select().single();

        if (ramoErr) throw ramoErr;
        const ramoId = ramoRow.id;

        // Insert schedule blocks
        if (ramo.schedule?.length) {
          const blocks = ramo.schedule.map(b => ({
            user_id:     uid,
            ramo_id:     ramoId,
            day_of_week: b.day_of_week,
            start_time:  b.start_time,
            end_time:    b.end_time,
            sala:        b.sala || '',
          }));
          await supabase.from('schedule').insert(blocks);
        }

        // Insert units
        if (ramo.units?.length) {
          const units = ramo.units.map(u => ({
            user_id:  uid,
            ramo_id:  ramoId,
            name:     u.name,
            order:    u.order ?? 0,
            materias: u.materias ?? [],
          }));
          await supabase.from('units').insert(units);
        }
      }

      setStep(3);
    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
      setProgress('');
    }
  };

  const removeRamo = (idx) => {
    setResult(r => ({ ...r, ramos: r.ramos.filter((_, i) => i !== idx) }));
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Importar archivos</h1>
        <p className={styles.subtitle}>
          Sube tu carpeta de ramos y la IA creará toda la estructura automáticamente
        </p>
      </div>

      {/* Step indicator */}
      <div className={styles.steps}>
        {STEPS.map((label, i) => (
          <div key={i} className={[styles.stepItem, i <= step ? styles.stepDone : ''].join(' ')}>
            <div className={styles.stepCircle}>
              {i < step ? <RiCheckLine /> : i + 1}
            </div>
            <span className={styles.stepLabel}>{label}</span>
            {i < STEPS.length - 1 && <div className={styles.stepLine} />}
          </div>
        ))}
      </div>

      {/* Step 0 — Upload */}
      {step === 0 && (
        <div className={styles.card}>
          <div
            className={[styles.dropzone, dragging ? styles.dropping : ''].join(' ')}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              webkitdirectory=""
              multiple
              style={{ display: 'none' }}
              onChange={onFileInput}
            />
            <RiFolderOpenLine className={styles.dropIcon} />
            <p className={styles.dropTitle}>
              {Object.keys(structure).length
                ? `${Object.keys(structure).length} ramos detectados`
                : 'Haz clic o arrastra tu carpeta aquí'
              }
            </p>
            <p className={styles.dropSub}>
              {Object.keys(structure).length
                ? Object.keys(structure).join(', ')
                : 'Estructura: Ramos/ → NombreRamo/ → archivos'
              }
            </p>
          </div>

          {/* Preview of detected ramos */}
          {Object.keys(structure).length > 0 && (
            <div className={styles.previewList}>
              {Object.entries(structure).map(([ramo, files]) => (
                <div key={ramo} className={styles.previewItem}>
                  <RiBookLine className={styles.previewIcon} />
                  <div>
                    <span className={styles.previewRamo}>{ramo}</span>
                    <span className={styles.previewCount}>{files.length} archivos</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={processWithAI}
              disabled={!Object.keys(structure).length}
            >
              Procesar con IA <RiArrowRightLine />
            </button>
          </div>

          {/* Instructions */}
          <div className={styles.instructions}>
            <h3>Estructura esperada de la carpeta</h3>
            <pre className={styles.tree}>{`📁 MisCarpeta/          (cualquier nombre)
  📁 Econometría/
      Unidad 1.pdf
      Syllabus ECO355.pdf
      horario.txt
  📁 Finanzas/
      Unidad 1 Introducción.pdf
      Control 1.pdf
  📁 ...`}</pre>
            <p>Mientras más descriptivos sean los nombres de los archivos, mejor será el resultado.</p>
          </div>
        </div>
      )}

      {/* Step 1 — Processing */}
      {step === 1 && (
        <div className={[styles.card, styles.cardCenter].join(' ')}>
          <RiLoader4Line className={styles.spinner} />
          <h2 className={styles.processingTitle}>Analizando con IA…</h2>
          <p className={styles.processingMsg}>{progress}</p>
          <p className={styles.processingHint}>
            Claude está leyendo la estructura y generando ramos, unidades, módulos de evaluación y horarios.
          </p>
        </div>
      )}

      {/* Step 2 — Preview */}
      {step === 2 && result && (
        <div className={styles.card}>
          <div className={styles.previewHeader}>
            <RiEyeLine />
            <h2>Vista previa — {result.ramos.length} ramos detectados</h2>
          </div>
          <p className={styles.previewNote}>
            Revisa y elimina lo que no quieras antes de guardar.
          </p>

          <div className={styles.ramoCards}>
            {result.ramos.map((ramo, idx) => (
              <div key={idx} className={styles.ramoCard}>
                <div className={styles.ramoCardTop}>
                  <div className={styles.ramoColorDot} style={{ background: ramo.color }} />
                  <div className={styles.ramoCardInfo}>
                    <strong>{ramo.name}</strong>
                    {ramo.code && <span className={styles.badge}>{ramo.code}</span>}
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeRamo(idx)}>
                    <RiDeleteBinLine />
                  </button>
                </div>

                <div className={styles.ramoCardMeta}>
                  {ramo.professor && <span>👤 {ramo.professor}</span>}
                  {ramo.credits   && <span>📚 {ramo.credits} créditos</span>}
                  {ramo.section   && <span>🔖 {ramo.section}</span>}
                </div>

                <div className={styles.ramoCardStats}>
                  {ramo.units?.length > 0 && (
                    <span><RiFileTextLine /> {ramo.units.length} unidades</span>
                  )}
                  {ramo.schedule?.length > 0 && (
                    <span><RiCalendarLine /> {ramo.schedule.length} bloques de horario</span>
                  )}
                  {ramo.evaluationModules?.length > 0 && (
                    <span>📊 {ramo.evaluationModules.length} módulos de evaluación</span>
                  )}
                  {ramo.files?.length > 0 && (
                    <span>📎 {ramo.files.length} archivos</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && <p className={styles.error}><RiErrorWarningLine /> {error}</p>}

          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => { setStep(0); setResult(null); }}>
              Volver
            </button>
            <button className={styles.btnPrimary} onClick={saveAll} disabled={saving || !result.ramos.length}>
              {saving ? <><RiLoader4Line className={styles.spinnerSmall} /> {progress || 'Guardando…'}</> : <>Guardar todo <RiCheckLine /></>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 3 && (
        <div className={[styles.card, styles.cardCenter].join(' ')}>
          <div className={styles.successIcon}><RiCheckLine /></div>
          <h2 className={styles.successTitle}>¡Importación completada!</h2>
          <p className={styles.successMsg}>
            Todos los ramos, horarios y unidades han sido creados en tu cuenta.
          </p>
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
