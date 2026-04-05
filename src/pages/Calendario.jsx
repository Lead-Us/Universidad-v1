import { useState } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiPencilLine, RiCheckLine,
  RiCalendarLine, RiTimeLine, RiCloseLine,
} from 'react-icons/ri';
import CalendarView from '../components/calendario/CalendarView.jsx';
import TaskForm     from '../components/calendario/TaskForm.jsx';
import Modal        from '../components/shared/Modal.jsx';
import Button       from '../components/shared/Button.jsx';
import Badge        from '../components/shared/Badge.jsx';
import { useTasks }    from '../hooks/useTasks.js';
import { useRamos }    from '../hooks/useRamos.js';
import { useSchedule } from '../hooks/useSchedule.js';
import styles from './Calendario.module.css';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatDateLong(ds) {
  if (!ds) return '';
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatDateShort(ds) {
  if (!ds) return '';
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function daysUntil(ds) {
  return Math.ceil((new Date(ds + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
}

export default function Calendario() {
  const today  = new Date();
  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth() + 1);
  const [selDay,   setSelDay]   = useState(null);
  const [modal,    setModal]    = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving,   setSaving]   = useState(false);

  // ALL tasks — not month-scoped
  const { tasks, loading, add, update, toggle, remove } = useTasks();
  const { ramos }    = useRamos();
  const { schedule } = useSchedule();

  const ramoMap = Object.fromEntries(ramos.map(r => [r.id, r]));

  // Enrich tasks with ramo color for calendar dots
  const enrichedTasks = tasks.map(t => ({
    ...t,
    _ramoColor: ramoMap[t.ramo_id]?.color ?? '#94a3b8',
  }));

  // Flatten evaluation items from all ramos
  const evalEvents = ramos.flatMap(r =>
    (r.evaluationModules ?? []).flatMap(mod =>
      (mod.items ?? [])
        .filter(item => item.date)
        .map(item => ({
          id:        `eval-${item.id}`,
          date:      item.date,
          _ramoColor: r.color,
          name:      item.name ?? 'Evaluación',
          mod_name:  mod.name,
          ramo_name: r.name,
          ramo_id:   r.id,
        }))
    )
  );

  // Month string for filtering: 'YYYY-MM'
  const monthStr = `${year}-${String(month).padStart(2,'0')}`;

  // For calendar dots: only items in the visible month
  const monthTasks  = enrichedTasks.filter(t => t.due_date?.startsWith(monthStr));
  const monthEvents = evalEvents.filter(ev => ev.date?.startsWith(monthStr));

  // For task panel: filtered by selDay or by month
  const panelTasks  = selDay
    ? enrichedTasks.filter(t => t.due_date === selDay)
    : enrichedTasks.filter(t => t.due_date?.startsWith(monthStr));

  const panelEvents = selDay
    ? evalEvents.filter(ev => ev.date === selDay)
    : evalEvents.filter(ev => ev.date?.startsWith(monthStr));

  // Classes for selected day
  const dayOfWeek  = selDay ? (new Date(selDay + 'T12:00:00').getDay() + 6) % 7 : null;
  const dayClasses = selDay ? schedule.filter(s => s.day_of_week === dayOfWeek) : [];

  // Navigation
  const handlePrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else { setMonth(m => m - 1); }
    setSelDay(null);
  };
  const handleNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else { setMonth(m => m + 1); }
    setSelDay(null);
  };

  // Task CRUD
  const handleCreate = async (data) => {
    setSaving(true);
    try { await add(data); setModal(false); }
    finally { setSaving(false); }
  };
  const handleEdit = async (data) => {
    setSaving(true);
    try { await update(editTask.id, data); setEditTask(null); }
    finally { setSaving(false); }
  };

  // Group panel tasks by date
  const grouped = {};
  panelTasks.forEach(t => {
    const k = t.due_date || 'sin-fecha';
    grouped[k] = grouped[k] ?? [];
    grouped[k].push(t);
  });
  const sortedDays = Object.keys(grouped).sort((a, b) => {
    if (a === 'sin-fecha') return 1;
    if (b === 'sin-fecha') return -1;
    return a.localeCompare(b);
  });

  const panelTitle = selDay
    ? formatDateLong(selDay)
    : `${MONTHS[month - 1]} ${year}`;

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

          {/* ── Left: Calendar grid ── */}
          <div className={styles.calCol}>
            <div className={styles.calCard}>
              <CalendarView
                year={year}
                month={month}
                onPrev={handlePrev}
                onNext={handleNext}
                tasks={monthTasks}
                events={monthEvents}
                selectedDay={selDay}
                onSelectDay={setSelDay}
              />
            </div>
          </div>

          {/* ── Right: Task panel ── */}
          <div className={styles.taskCol}>
            <div className={styles.panelCard}>

              {/* Panel header */}
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <span className={styles.panelTitleText}>{panelTitle}</span>
                  {selDay && (
                    <button
                      className={styles.clearBtn}
                      onClick={() => setSelDay(null)}
                      aria-label="Ver mes completo"
                    >
                      <RiCloseLine /> Ver mes
                    </button>
                  )}
                </div>
                <div className={styles.panelStats}>
                  <span className={styles.statPill}>{panelTasks.length} tarea{panelTasks.length !== 1 ? 's' : ''}</span>
                  {panelEvents.length > 0 && (
                    <span className={styles.statPill}>{panelEvents.length} eval.</span>
                  )}
                </div>
              </div>

              <div className={styles.panelBody}>

                {/* Classes (only when day selected) */}
                {dayClasses.length > 0 && (
                  <div className={styles.sectionGroup}>
                    <p className={styles.groupLabel}><RiTimeLine /> Clases</p>
                    {dayClasses.map(c => {
                      const ramo = ramoMap[c.ramo_id];
                      return (
                        <div
                          key={c.id}
                          className={styles.eventChip}
                          style={ramo ? { borderLeftColor: ramo.color, background: `${ramo.color}15` } : undefined}
                        >
                          <span className={styles.chipTime}>{c.start_time}–{c.end_time}</span>
                          <span className={styles.chipName}>{ramo?.name ?? 'Clase'}</span>
                          {c.sala && <span className={styles.chipSub}>{c.sala}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Evaluations */}
                {panelEvents.length > 0 && (
                  <div className={styles.sectionGroup}>
                    <p className={styles.groupLabel}><RiCalendarLine /> Evaluaciones</p>
                    {panelEvents.map(ev => (
                      <div
                        key={ev.id}
                        className={styles.eventChip}
                        style={{ borderLeftColor: ev._ramoColor, background: `${ev._ramoColor}15` }}
                      >
                        <div className={styles.chipInfo}>
                          <span className={styles.chipName}>{ev.name}</span>
                          <span className={styles.chipSub}>{ev.mod_name} · {ev.ramo_name}</span>
                        </div>
                        {!selDay && <span className={styles.chipDate}>{formatDateShort(ev.date)}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                <div className={styles.sectionGroup}>
                  <p className={styles.groupLabel}><RiCalendarLine /> Tareas</p>

                  {loading ? (
                    <p className={styles.emptyText}>Cargando…</p>
                  ) : panelTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p className={styles.emptyText}>
                        {selDay ? 'Sin tareas este día.' : 'Sin tareas este mes.'}
                      </p>
                      <Button size="sm" onClick={() => setModal(true)}>
                        <RiAddLine /> Crear tarea
                      </Button>
                    </div>
                  ) : (
                    <div className={styles.taskGroups}>
                      {sortedDays.map(day => (
                        <div key={day} className={styles.dayGroup}>
                          {!selDay && (
                            <div className={styles.dayGroupHeader}>
                              <span className={[
                                styles.dayGroupDate,
                                day !== 'sin-fecha' && daysUntil(day) < 0 ? styles.overdue : '',
                                day !== 'sin-fecha' && daysUntil(day) === 0 ? styles.dueToday : '',
                              ].join(' ')}>
                                {day === 'sin-fecha' ? 'Sin fecha' : formatDateShort(day)}
                              </span>
                              <span className={styles.dayGroupCount}>{grouped[day].length}</span>
                            </div>
                          )}
                          {grouped[day].map(t => {
                            const ramo = ramoMap[t.ramo_id];
                            return (
                              <div
                                key={t.id}
                                className={`${styles.taskRow} ${t.completed ? styles.done : ''}`}
                                style={ramo ? { borderLeftColor: ramo.color } : undefined}
                              >
                                <button
                                  className={`${styles.checkBtn} ${t.completed ? styles.checkDone : ''}`}
                                  onClick={() => toggle(t.id)}
                                  aria-label={t.completed ? 'Desmarcar' : 'Completar'}
                                >
                                  {t.completed && <RiCheckLine />}
                                </button>
                                <div className={styles.taskContent}>
                                  <span className={styles.taskTitle}>{t.title}</span>
                                  {t.description && (
                                    <span className={styles.taskDesc}>{t.description}</span>
                                  )}
                                  <div className={styles.taskMeta}>
                                    <Badge type={t.type} mode="type" />
                                    {ramo && (
                                      <span className={styles.ramoTag} style={{ color: ramo.color }}>
                                        {ramo.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className={styles.taskActions}>
                                  <button
                                    className={styles.iconBtn}
                                    onClick={() => setEditTask(t)}
                                    aria-label="Editar"
                                  >
                                    <RiPencilLine />
                                  </button>
                                  <button
                                    className={`${styles.iconBtn} ${styles.delBtn}`}
                                    onClick={() => remove(t.id)}
                                    aria-label="Eliminar"
                                  >
                                    <RiDeleteBinLine />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva tarea">
        <TaskForm
          initialDate={selDay}
          onSave={handleCreate}
          onCancel={() => setModal(false)}
          loading={saving}
        />
      </Modal>
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
