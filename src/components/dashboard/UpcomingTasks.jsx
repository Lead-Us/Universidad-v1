import { useState } from 'react';
import { RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import { useUpcomingTasks } from '../../hooks/useTasks.js';
import { useRamos } from '../../hooks/useRamos.js';
import Badge from '../shared/Badge.jsx';
import Modal from '../shared/Modal.jsx';
import TaskForm from '../calendario/TaskForm.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';
import styles from './UpcomingTasks.module.css';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff < 0)  return 'Vencida';
  if (diff <= 6) return `En ${diff} días`;
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

function urgencyClass(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return styles.overdue;
  if (diff <= 1) return styles.urgent;
  if (diff <= 3) return styles.soon;
  return '';
}

export default function UpcomingTasks() {
  const { tasks, loading, toggle, update, remove } = useUpcomingTasks(14);
  const { ramos } = useRamos();
  const [editing, setEditing] = useState(null); // task being edited
  const [saving,  setSaving]  = useState(false);

  const ramoMap = Object.fromEntries(ramos.map(r => [r.id, r]));

  const handleSave = async (data) => {
    setSaving(true);
    try   { await update(editing.id, data); setEditing(null); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className={styles.loadingWrap}><LoadingSpinner /></div>;
  }

  if (tasks.length === 0) {
    return <p className={styles.empty}>Sin tareas próximas — ¡todo al día!</p>;
  }

  return (
    <>
      <ul className={`${styles.list} stagger`}>
        {tasks.map(task => {
          const ramo = ramoMap[task.ramo_id];
          return (
            <li
              key={task.id}
              className={`${styles.item} ${task.completed ? styles.done : ''}`}
            >
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggle(task.id)}
                  className={styles.check}
                />
              </label>

              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <span className={styles.title}>{task.title}</span>
                  <Badge type={task.type} mode="type" />
                </div>
                <div className={styles.meta}>
                  {ramo && <span style={{ color: ramo.color }}>{ramo.name}</span>}
                  {task.materia && <span>· {task.materia}</span>}
                </div>
              </div>

              <span className={`${styles.date} ${urgencyClass(task.due_date)}`}>
                {formatDate(task.due_date)}
              </span>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => setEditing(task)}
                  title="Editar tarea"
                >
                  <RiPencilLine />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.delBtn}`}
                  onClick={() => remove(task.id)}
                  title="Eliminar tarea"
                >
                  <RiDeleteBinLine />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar tarea">
        <TaskForm
          initialTask={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          loading={saving}
        />
      </Modal>
    </>
  );
}
