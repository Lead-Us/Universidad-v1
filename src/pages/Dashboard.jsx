import { useState } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiPencilLine,
  RiCheckLine, RiFilterLine, RiSearchLine,
} from 'react-icons/ri';
import { useTasks } from '../hooks/useTasks.js';
import { useRamos } from '../hooks/useRamos.js';
import TaskForm from '../components/calendario/TaskForm.jsx';
import Modal   from '../components/shared/Modal.jsx';
import Button  from '../components/shared/Button.jsx';
import Badge   from '../components/shared/Badge.jsx';
import WeeklySchedule from '../components/dashboard/WeeklySchedule.jsx';
import dashStyles from './Dashboard.module.css';
import styles  from './Tareas.module.css';

const FILTERS = [
  { id: 'todas',      label: 'Todas'      },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'tarea',      label: 'Tareas'     },
  { id: 'evaluación', label: 'Evaluaciones' },
  { id: 'control',    label: 'Controles'  },
  { id: 'quiz',       label: 'Quiz'       },
];

function formatDate(ds) {
  if (!ds) return '';
  return new Date(ds + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function daysUntil(ds) {
  if (!ds) return null;
  const diff = Math.ceil((new Date(ds + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  return diff;
}

function DueBadge({ date, completed }) {
  if (completed) return <span className={`${styles.dueBadge} ${styles.doneDate}`}>{formatDate(date)}</span>;
  const d = daysUntil(date);
  if (d === null) return null;
  if (d < 0)  return <span className={`${styles.dueBadge} ${styles.overdue}`}>Vencida hace {-d}d</span>;
  if (d === 0) return <span className={`${styles.dueBadge} ${styles.today}`}>Hoy</span>;
  if (d === 1) return <span className={`${styles.dueBadge} ${styles.soon}`}>Mañana</span>;
  if (d <= 5)  return <span className={`${styles.dueBadge} ${styles.soon}`}>En {d} días</span>;
  return <span className={`${styles.dueBadge} ${styles.normal}`}>{formatDate(date)}</span>;
}

export default function Dashboard() {
  const { tasks, loading, add, update, toggle, remove } = useTasks();
  const { ramos } = useRamos();

  const [filter,   setFilter]   = useState('todas');
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const ramoMap = Object.fromEntries(ramos.map(r => [r.id, r]));

  // Filter + search
  const visible = tasks.filter(t => {
    const matchFilter =
      filter === 'todas'      ? true :
      filter === 'pendientes' ? !t.completed :
      t.type === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchCompleted = showCompleted || !t.completed;
    return matchFilter && matchSearch && matchCompleted;
  });

  // Group by due_date
  const grouped = {};
  visible.forEach(t => {
    const key = t.due_date || 'sin-fecha';
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(t);
  });
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'sin-fecha') return 1;
    if (b === 'sin-fecha') return -1;
    return a.localeCompare(b);
  });

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

  const handleDelete = async (id) => {
    await remove(id);
    setConfirmDel(null);
  };

  const pending   = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t =>  t.completed).length;

  return (
    <div className="page">
      <div className="page-content">

        {/* Weekly Schedule */}
        <section className={dashStyles.section}>
          <div className="section-header">
            <h1 className="section-title">Horario</h1>
            {ramos.length > 0 && (
              <Button onClick={() => setShowAddBlock(true)}>
                <RiAddLine /> Agregar bloque
              </Button>
            )}
          </div>
          <WeeklySchedule showAdd={showAddBlock} onAddClose={() => setShowAddBlock(false)} />
        </section>

        <hr className="divider" />

        {/* Header */}
        <div className="section-header">
          <h1 className="section-title">Tareas</h1>
          <Button onClick={() => setModal(true)}>
            <RiAddLine /> Nueva tarea
          </Button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{pending}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>{completed}</span>
            <span className={styles.statLabel}>Completadas</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{tasks.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <RiSearchLine className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar tarea…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filters}>
            <RiFilterLine className={styles.filterIcon} />
            {FILTERS.map(f => (
              <button
                key={f.id}
                className={[styles.filterBtn, filter === f.id ? styles.filterActive : ''].join(' ')}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {loading ? (
          <div className={styles.empty}>Cargando…</div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay tareas{filter !== 'todas' ? ' con este filtro' : ''}.</p>
            <Button size="sm" onClick={() => setModal(true)}><RiAddLine /> Crear tarea</Button>
          </div>
        ) : (
          <div className={styles.groups}>
            {completed > 0 && filter !== 'pendientes' && (
              <button
                className={styles.showCompletedBtn}
                onClick={() => setShowCompleted(v => !v)}
              >
                {showCompleted ? `Ocultar ${completed} completada${completed !== 1 ? 's' : ''}` : `Ver ${completed} completada${completed !== 1 ? 's' : ''}`}
              </button>
            )}
            {sortedKeys.map(key => {
              const dayTasks = grouped[key];
              const label = key === 'sin-fecha' ? 'Sin fecha' : formatDate(key);
              const d = key !== 'sin-fecha' ? daysUntil(key) : null;
              const isOverdue = d !== null && d < 0;
              const isToday   = d === 0;

              return (
                <div key={key} className={styles.group}>
                  <div className={styles.groupHeader}>
                    <span className={[styles.groupDate, isOverdue ? styles.groupOverdue : isToday ? styles.groupToday : ''].join(' ')}>
                      {label}
                    </span>
                    <span className={styles.groupCount}>{dayTasks.length}</span>
                  </div>

                  <div className={styles.taskList}>
                    {dayTasks.map(t => {
                      const ramo = ramoMap[t.ramo_id];
                      return (
                        <div
                          key={t.id}
                          className={`${styles.taskRow} ${t.completed ? styles.done : ''}`}
                        >
                          {/* Checkbox */}
                          <button
                            className={`${styles.check} ${t.completed ? styles.checkDone : ''}`}
                            onClick={() => toggle(t.id)}
                            title={t.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                          >
                            {t.completed && <RiCheckLine />}
                          </button>

                          {/* Content */}
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
                              {t.materia && (
                                <span className={styles.materiaTag}>{t.materia}</span>
                              )}
                              <DueBadge date={t.due_date} completed={t.completed} />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className={styles.taskActions}>
                            {confirmDel === t.id ? (
                              <>
                                <button className={`${styles.iconBtn} ${styles.confirmBtn}`} onClick={() => handleDelete(t.id)}>✓</button>
                                <button className={styles.iconBtn} onClick={() => setConfirmDel(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                <button className={styles.iconBtn} onClick={() => setEditTask(t)} title="Editar">
                                  <RiPencilLine />
                                </button>
                                <button className={`${styles.iconBtn} ${styles.delBtn}`} onClick={() => setConfirmDel(t.id)} title="Eliminar">
                                  <RiDeleteBinLine />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nueva tarea">
        <TaskForm
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
