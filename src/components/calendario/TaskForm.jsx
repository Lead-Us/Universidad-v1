import { useState, useEffect } from 'react';
import { useRamos } from '../../hooks/useRamos.js';
import { getUnits } from '../../services/ramosService.js';
import Button from '../shared/Button.jsx';
import styles from './TaskForm.module.css';

const TYPES = ['tarea', 'evaluación', 'control', 'quiz'];

const EMPTY = {
  title: '', type: 'tarea', ramo_id: '', unit_ids: [], materia_names: [],
  due_date: '', description: '',
};

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
  const { ramos }               = useRamos();
  const [form, setForm]         = useState(EMPTY);
  const [units, setUnits]       = useState([]);
  const [allMaterias, setAllMaterias] = useState([]); // flat list from all selected units

  // Populate form from initialTask (edit) or initialDate (create)
  useEffect(() => {
    if (initialTask) {
      setForm({
        ...EMPTY,
        ...initialTask,
        // Normalize legacy single-value fields to arrays
        unit_ids:      initialTask.unit_ids      ?? (initialTask.unit_id ? [initialTask.unit_id] : []),
        materia_names: initialTask.materia_names ?? (initialTask.materia ? [initialTask.materia] : []),
      });
    } else {
      setForm({ ...EMPTY, due_date: initialDate ?? '' });
    }
  }, [initialTask, initialDate]);

  // When ramo changes, update units list
  useEffect(() => {
    if (!form.ramo_id) { setUnits([]); setAllMaterias([]); return; }
    getUnits(form.ramo_id).then(u => {
      setUnits(u);
    });
  }, [form.ramo_id]);

  // When selected units change, compute flat materia list
  useEffect(() => {
    const materias = units
      .filter(u => form.unit_ids.includes(u.id))
      .flatMap(u => (u.materias ?? []).map(m => m.name));
    setAllMaterias([...new Set(materias)]);
    // Drop any selected materias no longer available
    setForm(f => ({
      ...f,
      materia_names: f.materia_names.filter(m => materias.includes(m)),
    }));
  }, [form.unit_ids, units]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleUnit = (id) => {
    setForm(f => ({
      ...f,
      unit_ids: f.unit_ids.includes(id)
        ? f.unit_ids.filter(x => x !== id)
        : [...f.unit_ids, id],
    }));
  };

  const toggleMateria = (name) => {
    setForm(f => ({
      ...f,
      materia_names: f.materia_names.includes(name)
        ? f.materia_names.filter(x => x !== name)
        : [...f.materia_names, name],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Also write legacy single-value fields for backward compat
    onSave({
      ...form,
      unit_id: form.unit_ids[0] ?? null,
      materia: form.materia_names[0] ?? '',
    });
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
          <select
            value={form.ramo_id}
            onChange={e => { set('ramo_id', e.target.value); set('unit_ids', []); set('materia_names', []); }}
            required
          >
            <option value="">— Selecciona ramo —</option>
            {ramos.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        {units.length > 0 && (
          <div>
            <label>Unidades <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>(selecciona una o más)</span></label>
            <div className={styles.checkGrid}>
              {units.map(u => (
                <label key={u.id} className={[styles.checkOption, form.unit_ids.includes(u.id) ? styles.checkSelected : ''].join(' ')}>
                  <input
                    type="checkbox"
                    checked={form.unit_ids.includes(u.id)}
                    onChange={() => toggleUnit(u.id)}
                  />
                  <span>{u.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {allMaterias.length > 0 && (
          <div>
            <label>Temas <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>(selecciona uno o más)</span></label>
            <div className={styles.checkGrid}>
              {allMaterias.map(m => (
                <label key={m} className={[styles.checkOption, form.materia_names.includes(m) ? styles.checkSelected : ''].join(' ')}>
                  <input
                    type="checkbox"
                    checked={form.materia_names.includes(m)}
                    onChange={() => toggleMateria(m)}
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
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
        <Button type="submit" disabled={loading || !form.title || !form.ramo_id || !form.due_date}>
          {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
      </div>
    </form>
  );
}
