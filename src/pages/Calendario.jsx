import { useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiPencilLine, RiCalendar2Line, RiTimeLine } from 'react-icons/ri';
import CalendarView from '../components/calendario/CalendarView.jsx';
import TaskForm     from '../components/calendario/TaskForm.jsx';
import Modal        from '../components/shared/Modal.jsx';
import Button       from '../components/shared/Button.jsx';
import Badge        from '../components/shared/Badge.jsx';
import { useTasksByMonth } from '../hooks/useTasks.js';
import { useRamos }        from '../hooks/useRamos.js';
import { useSchedule }     from '../hooks/useSchedule.js';
import styles from './Calendario.module.css';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatDayLabel(ds) {
  if (!ds) return '';
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function Calendario() {
  const today  = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selDay,   setSelDay]   = useState(null);
  const [modal,    setModal]    = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const { tasks, add, update, toggle, remove } = useTasksByMonth(year, month);
  const { ramos }    = useRamos();
  const { schedule } = useSchedule();

  const ramoMap  = Object.fromEntries(ramos.map(r => [r.id, r]));
  const dayTasks = tasks.filter(t => t.due_date === selDay);

  // Clases del día seleccionado
  const dayOfWeek = selDay
    ? (new Date(selDay + 'T12:00:00').getDay() + 6) % 7 // 0=Lun … 6=Dom (mismo formato que schedule)
    : null;
  const dayClasses = schedule.filter(s => s.day_of_week === dayOfWeek);

  const handleCreate = async (data) => {
    setSaving(true);
    try   { await add(data); setModal(false); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try   { await update(editTask.id, data); setEditTask(null); }
    finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="page-content">

        <div className="section-header">
          <h1 className="section-title">Calendario</h1>
          <Button onClick={() => setModal(true)}>
            <RiAddLine /> Nueva tarea
          </Button>
        </div>

        <div className={styles.layout}>
          <div className={styles.calWrap}>
            <CalendarView
              onSelectDay={setSelDay}
              selectedDay={selDay}
              onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
            />
          </div>

          {/* Panel del día */}
          {selDay && (
            <div className={`${styles.dayPanel} animate-slideInRight`}>
              <div className={styles.dayHeader}>
                <div>
                  <h3 className={styles.dayTitle}>{formatDayLabel(selDay)}</h3>
                </div>
                <Button size="sm" onClick={() => { setModal(true); }}>
                  <RiAddLine /> Tarea
                </Button>
              </div>

              {/* Clases del día */}
              {dayClasses.length > 0 && (
                <div className={styles.classesSection}>
                  <span className={styles.sectionLabel}>
                    <RiTimeLine /> Clases
                  </span>
                  <div className={styles.classesList}>
                    {dayClasses.map(c => {
                      const ramo = ramoMap[c.ramo_id];
                      return (
                        <div
                          key={c.id}
                          className={styles.classChip}
                          style={ramo ? { borderLeftColor: ramo.color, background: `${ramo.color}12` } : undefined}
                        >
                          <span className={styles.classTime}>{c.start_time}–{c.end_time}</span>
                          <span className={styles.className}>{ramo?.name ?? 'Clase'}</span>
                          {c.sala && <span className={styles.classSala}>{c.sala}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bloque de tareas */}
              <div className={styles.taskBlock}>
                <div className={styles.taskBlockHeader}>
                  <span className={styles.sectionLabel}>
                    <RiCalendar2Line /> Bloque de tareas
                  </span>
                  <span className={styles.taskCount}>{dayTasks.length}</span>
                </div>

                {dayTasks.length === 0 ? (
                  <p className={styles.empty}>Sin tareas este día.</p>
                ) : (
                  <ul className={styles.taskList}>
                    {dayTasks.map(t => {
                      const ramo = ramoMap[t.ramo_id];
                      return (
                        <li
                          key={t.id}
                          className={`${styles.taskItem} ${t.completed ? styles.done : ''}`}
                          style={ramo ? { borderLeftColor: ramo.color } : undefined}
                        >
                          <label className={styles.checkLabel}>
                            <input
                              type="checkbox"
                              checked={t.completed}
                              onChange={() => toggle(t.id)}
                            />
                          </label>
                          <div className={styles.taskInfo}>
                            <span className={styles.taskTitle}>{t.title}</span>
                            {t.description && (
                              <span className={styles.taskDesc}>{t.description}</span>
                            )}
                            <div className={styles.taskMeta}>
                              <Badge type={t.type} mode="type" />
                              {ramo && (
                                <span style={{ color: ramo.color, fontSize: 'var(--text-xs)' }}>
                                  {ramo.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={styles.taskActions}>
                            <button
                              className={styles.iconBtn}
                              onClick={() => setEditTask(t)}
                              title="Editar"
                            >
                              <RiPencilLine />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.delBtn}`}
                              onClick={() => remove(t.id)}
                              title="Eliminar"
                            >
                              <RiDeleteBinLine />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva tarea">
        <TaskForm
          initialDate={selDay}
          onSave={handleCreate}
          onCancel={() => setModal(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Editar tarea">
        <TaskForm
          initialTask={editTask}
          onSave={handleEdit}
          onCancel={() => setEditTask(null)}
          loading={saving}
        />
      </Modal>
    </div>
  );
}
