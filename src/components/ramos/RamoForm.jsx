import { useState, useEffect, useRef } from 'react';
import { RAMO_COLORS } from '../../lib/ramoColors.js';
import {
  RiAddLine, RiDeleteBinLine, RiTimeLine, RiPencilLine,
  RiCheckLine, RiCloseLine, RiUploadLine, RiLoader4Line, RiSparkling2Line,
} from 'react-icons/ri';
import Button from '../shared/Button.jsx';
import styles from './RamoForm.module.css';

const DAYS_LIST  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_INDEX  = { Lunes: 0, Martes: 1, Miércoles: 2, Jueves: 3, Viernes: 4, Sábado: 5 };

const EMPTY_RAMO = {
  name: '', code: '', professor: '', credits: '',
  section: '', color: RAMO_COLORS[0].hex, blocks: [],
};

const EMPTY_BLOCK = {
  day: 'Lunes', start_time: '08:30', end_time: '09:40',
  sala: '', has_attendance: true,
};

// Read a File as base64 string (strips the data URL prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract raw text from a DOCX file (client-side, no server needed)
async function extractDocxText(file) {
  const { unzipSync } = await import('fflate');
  const arr = await file.arrayBuffer();
  const zip = unzipSync(new Uint8Array(arr));
  const xmlBytes = zip['word/document.xml'];
  if (!xmlBytes) throw new Error('No se pudo leer el archivo DOCX');
  const xml = new TextDecoder().decode(xmlBytes);
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
}

export default function RamoForm({ initial, onSave, onCancel, loading }) {
  const [form,        setForm]        = useState(EMPTY_RAMO);
  const [newBlock,    setNewBlock]    = useState({ ...EMPTY_BLOCK });
  const [addingBlock, setAddingBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editBlock,      setEditBlock]      = useState(null);

  // Syllabus extraction state
  const [extracting,    setExtracting]    = useState(false);
  const [extractResult, setExtractResult] = useState(null); // 'ok' | 'error'
  const [extractMsg,    setExtractMsg]    = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (initial) {
      setForm({
        ...EMPTY_RAMO,
        ...initial,
        credits: String(initial.credits ?? ''),
        blocks:  initial.blocks ?? [],
      });
    } else {
      setForm(EMPTY_RAMO);
    }
  }, [initial]);

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setNB = (k, v) => setNewBlock(nb => ({ ...nb, [k]: v }));

  const addBlock = () => {
    const block = {
      ...newBlock,
      day_of_week: DAY_INDEX[newBlock.day] ?? 0,
      id: crypto.randomUUID(),
    };
    set('blocks', [...form.blocks, block]);
    setNewBlock({ ...EMPTY_BLOCK });
    setAddingBlock(false);
  };

  const removeBlock = (id) => set('blocks', form.blocks.filter(b => b.id !== id));

  const startEditBlock = (b) => {
    setEditingBlockId(b.id);
    setEditBlock({ ...b, day: DAYS_LIST[b.day_of_week] ?? b.day ?? 'Lunes' });
  };

  const saveEditBlock = () => {
    set('blocks', form.blocks.map(b =>
      b.id === editingBlockId
        ? { ...editBlock, day_of_week: DAY_INDEX[editBlock.day] ?? 0 }
        : b
    ));
    setEditingBlockId(null);
    setEditBlock(null);
  };

  const setEB = (k, v) => setEditBlock(eb => ({ ...eb, [k]: v }));

  // ── Syllabus extraction ─────────────────────────────────────────────────────
  const handleSyllabusFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext)) {
      setExtractResult('error');
      setExtractMsg('Formato no soportado. Usa PDF o DOCX.');
      return;
    }

    setExtracting(true);
    setExtractResult(null);
    setExtractMsg('');

    try {
      let body;

      if (ext === 'pdf') {
        const base64 = await fileToBase64(file);
        body = { type: 'pdf', base64, filename: file.name };
      } else {
        // DOCX / DOC — extract text client-side
        const content = await extractDocxText(file);
        body = { type: 'text', content, filename: file.name };
      }

      const res  = await fetch('/api/extract-syllabus', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      // Apply extracted fields to the form
      const filled = [];
      setForm(prev => {
        const next = { ...prev };
        if (data.name     && !prev.name)     { next.name      = data.name;              filled.push('Nombre'); }
        if (data.code     && !prev.code)     { next.code      = data.code;              filled.push('Código'); }
        if (data.professor)                  { next.professor = data.professor;          filled.push('Profesor'); }
        if (data.section)                    { next.section   = data.section;            filled.push('Sección'); }
        if (data.credits)                    { next.credits   = String(data.credits);   filled.push('Créditos'); }

        // Add schedule blocks if found and none exist yet
        if (Array.isArray(data.blocks) && data.blocks.length > 0 && prev.blocks.length === 0) {
          next.blocks = data.blocks.map(b => ({
            ...b,
            day_of_week:    DAY_INDEX[b.day] ?? 0,
            has_attendance: data.has_attendance ?? false,
            id:             crypto.randomUUID(),
          }));
          filled.push('Horario');
        }

        return next;
      });

      setExtractResult('ok');
      setExtractMsg(filled.length > 0
        ? `Extraído: ${filled.join(', ')}`
        : 'Documento procesado — no se encontraron campos adicionales'
      );
    } catch (err) {
      setExtractResult('error');
      setExtractMsg(err.message || 'No se pudo extraer la información');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, credits: Number(form.credits) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className="form-group">

        {/* ── Syllabus extraction ── */}
        <div className={styles.syllabusRow}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc"
            style={{ display: 'none' }}
            onChange={handleSyllabusFile}
            aria-hidden
          />
          <button
            type="button"
            className={[styles.syllabusBtn, extracting ? styles.syllabusBtnLoading : ''].join(' ')}
            onClick={() => { setExtractResult(null); fileRef.current?.click(); }}
            disabled={extracting}
          >
            {extracting
              ? <RiLoader4Line className={styles.syllabusSpinner} />
              : <RiSparkling2Line />
            }
            {extracting ? 'Extrayendo información…' : 'Extraer datos del programa (PDF · DOCX)'}
          </button>

          {extractResult === 'ok' && (
            <span className={styles.syllabusOk}>
              <RiCheckLine /> {extractMsg}
            </span>
          )}
          {extractResult === 'error' && (
            <span className={styles.syllabusErr}>
              {extractMsg}
            </span>
          )}
        </div>

        <div className="form-row">
          <div>
            <label>Nombre del ramo</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Cálculo I"
              required
            />
          </div>
          <div>
            <label>Código</label>
            <input
              value={form.code}
              onChange={e => set('code', e.target.value)}
              placeholder="MAT1101"
              className={styles.mono}
            />
          </div>
        </div>

        <div>
          <label>Profesor/a</label>
          <input
            value={form.professor}
            onChange={e => set('professor', e.target.value)}
            placeholder="Nombre del profesor"
          />
        </div>

        <div className="form-row">
          <div>
            <label>Sección</label>
            <input
              value={form.section}
              onChange={e => set('section', e.target.value)}
              placeholder="Sección 3"
            />
          </div>
          <div>
            <label>Créditos</label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.credits}
              onChange={e => set('credits', e.target.value)}
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <label>Color</label>
          <div className={styles.colorRow}>
            {RAMO_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                className={[styles.colorSwatch, form.color === c.hex ? styles.colorActive : ''].join(' ')}
                style={{ background: c.hex }}
                title={c.name}
                onClick={() => set('color', c.hex)}
              />
            ))}
          </div>
        </div>

        {/* ── Bloques de clase ── */}
        <div>
          <label>Bloques de clase</label>
          <div className={styles.blocksList}>
            {form.blocks.map(b => (
              <div key={b.id} className={styles.blockCard}>
                {editingBlockId === b.id && editBlock ? (
                  <div className={styles.blockEditForm}>
                    <div className="form-row">
                      <div>
                        <label>Día</label>
                        <select value={editBlock.day} onChange={e => setEB('day', e.target.value)}>
                          {DAYS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label>Sala</label>
                        <input value={editBlock.sala ?? ''} onChange={e => setEB('sala', e.target.value)} placeholder="B-201" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div>
                        <label>Inicio</label>
                        <input type="time" value={editBlock.start_time} onChange={e => setEB('start_time', e.target.value)} />
                      </div>
                      <div>
                        <label>Fin</label>
                        <input type="time" value={editBlock.end_time} onChange={e => setEB('end_time', e.target.value)} />
                      </div>
                    </div>
                    <label className={styles.toggleRow}>
                      <input type="checkbox" checked={editBlock.has_attendance ?? true} onChange={e => setEB('has_attendance', e.target.checked)} />
                      <span>Control de asistencia</span>
                    </label>
                    <div className={styles.blockFormActions}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                        <RiCloseLine /> Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={saveEditBlock}>
                        <RiCheckLine /> Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <RiTimeLine className={styles.blockIcon} />
                    <div className={styles.blockInfo}>
                      <span className={styles.blockDay}>
                        {DAYS_LIST[b.day_of_week] ?? b.day ?? '—'}
                      </span>
                      <span className={styles.blockTime}>
                        {b.start_time} – {b.end_time}
                      </span>
                      {b.sala && <span className={styles.blockSala}>{b.sala}</span>}
                      {b.has_attendance && (
                        <span className={styles.blockAtt}>Asistencia</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.blockEdit}
                      onClick={() => startEditBlock(b)}
                      title="Editar bloque"
                    >
                      <RiPencilLine />
                    </button>
                    <button
                      type="button"
                      className={styles.blockDelete}
                      onClick={() => removeBlock(b.id)}
                      title="Eliminar bloque"
                    >
                      <RiDeleteBinLine />
                    </button>
                  </>
                )}
              </div>
            ))}

            {addingBlock ? (
              <div className={styles.blockForm}>
                <div className="form-row">
                  <div>
                    <label>Día</label>
                    <select value={newBlock.day} onChange={e => setNB('day', e.target.value)}>
                      {DAYS_LIST.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Sala</label>
                    <input
                      value={newBlock.sala}
                      onChange={e => setNB('sala', e.target.value)}
                      placeholder="B-201"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div>
                    <label>Inicio</label>
                    <input
                      type="time"
                      value={newBlock.start_time}
                      onChange={e => setNB('start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Fin</label>
                    <input
                      type="time"
                      value={newBlock.end_time}
                      onChange={e => setNB('end_time', e.target.value)}
                    />
                  </div>
                </div>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={newBlock.has_attendance}
                    onChange={e => setNB('has_attendance', e.target.checked)}
                  />
                  <span>Control de asistencia</span>
                </label>
                <div className={styles.blockFormActions}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAddingBlock(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" size="sm" onClick={addBlock}>
                    Agregar bloque
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles.addBlockBtn}
                onClick={() => setAddingBlock(true)}
              >
                <RiAddLine /> Agregar bloque de clase
              </button>
            )}
          </div>
        </div>

      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading || !form.name}>
          {loading ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear ramo'}
        </Button>
      </div>
    </form>
  );
}
