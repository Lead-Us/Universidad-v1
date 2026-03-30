import { useState, useEffect } from 'react';
import { RAMO_COLORS } from '../../lib/ramoColors.js';
import { RiAddLine, RiDeleteBinLine, RiTimeLine } from 'react-icons/ri';
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

export default function RamoForm({ initial, onSave, onCancel, loading }) {
  const [form,        setForm]        = useState(EMPTY_RAMO);
  const [newBlock,    setNewBlock]    = useState({ ...EMPTY_BLOCK });
  const [addingBlock, setAddingBlock] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, credits: Number(form.credits) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className="form-group">

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

        {/* ── Bloques de clase ────────────────────────────────── */}
        <div>
          <label>Bloques de clase</label>
          <div className={styles.blocksList}>
            {form.blocks.map(b => (
              <div key={b.id} className={styles.blockCard}>
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
                  className={styles.blockDelete}
                  onClick={() => removeBlock(b.id)}
                  title="Eliminar bloque"
                >
                  <RiDeleteBinLine />
                </button>
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
