import { useState, useEffect } from 'react';
import { useRamos } from '../../hooks/useRamos.js';
import { getUnits } from '../../services/ramosService.js';
import Button from '../shared/Button.jsx';
import styles from './TaskForm.module.css';

const TYPES = ['tarea', 'evaluación', 'control', 'quiz'];

const EMPTY = { title: '', type: 'tarea', ramo_id: '', unit_id: '', materia: '', due_date: '', description: '' };

/**
 * TaskForm — creates or edits a task.
 * Props:
 *   initialDate  string    — pre-fill due_date (create flow)
 *   initialTask  object    — pre-fill all fields (edit flow)
 *   onSave       fn(data)  — called with form data
 *   onCancel     fn()
 *   loading      bool
 */
export default function TaskForm({ initialDate, initialTask, onSave, onCancel, loading }) {
  const { ramos }                   = useRamos();
  const [form, setForm]             = useState(EMPTY);
  const [units, setUnits]           = useState([]);
  const [materias, setMaterias]     = useState([]);

  // Populate form from initialTask (edit) or initialDate (create)
  useEffect(() => {
    if (initialTask) {
      setForm({ ...EMPTY, ...initialTask });
    } else {
      setForm({ ...EMPTY, due_date: initialDate ?? '' });
    }
  }, [initialTask, initialDate]);

  // When ramo changes, update units list
  useEffect(() => {
    if (!form.ramo_id) { setUnits([]); setMaterias([]); return; }
    getUnits(form.ramo_id).then(u => {
      setUnits(u);
      if (!initialTask || form.ramo_id !== initialTask?.ramo_id) {
        setForm(f => ({ ...f, unit_id: '', materia: '' }));
        setMaterias([]);
      }
    });
  }, [form.ramo_id]);

  // When unit changes, update materias list
  useEffect(() => {
    if (!form.unit_id) { setMaterias([]); return; }
    const unit = units.find(u => u.id === form.unit_id);
    setMaterias(unit?.materias ?? []);
    if (!initialTask || form.unit_id !== initialTask?.unit_id) {
      setForm(f => ({ ...f, materia: '' }));
    }
  }, [form.unit_id, units]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const isEdit = !!initialTask;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className="form-group">

        <div>
          <label>Título</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Solemne 1, Tarea 2…"
            required
          />
        </div>

        <div className="form-row">
          <div>
            <label>Tipo</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Fecha</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label>Ramo</label>
          <select value={form.ramo_id} onChange={e => set('ramo_id', e.target.value)} required>
            <option value="">— Selecciona ramo —</option>
            {ramos.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {units.length > 0 && (
          <div>
            <label>Unidad</label>
            <select value={form.unit_id} onChange={e => set('unit_id', e.target.value)}>
              <option value="">— Sin unidad —</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {materias.length > 0 && (
          <div>
            <label>Materia</label>
            <select value={form.materia} onChange={e => set('materia', e.target.value)}>
              <option value="">— Sin materia —</option>
              {materias.map((m, i) => (
                <option key={i} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label>Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'var(--text-xs)' }}>(opcional)</span></label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Detalles, instrucciones, páginas del libro…"
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading || !form.title || !form.ramo_id}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  );
}
