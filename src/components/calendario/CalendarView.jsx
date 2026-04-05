import { useState } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { useTasksByMonth } from '../../hooks/useTasks.js';
import { useRamos } from '../../hooks/useRamos.js';
import Badge from '../shared/Badge.jsx';
import styles from './CalendarView.module.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function buildGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;  // adjust to Mon-first
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarView({ onSelectDay, selectedDay, onMonthChange, tasks: tasksProp, events: eventsProp = [] }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { tasks: tasksInternal } = useTasksByMonth(year, month);
  const tasks = tasksProp ?? tasksInternal;
  const { ramos } = useRamos();

  const ramoMap = Object.fromEntries(ramos.map(r => [r.id, r]));

  const prev = () => {
    if (month === 1) {
      const ny = year - 1; const nm = 12;
      setYear(ny); setMonth(nm); onMonthChange?.(ny, nm);
    } else {
      const nm = month - 1;
      setMonth(nm); onMonthChange?.(year, nm);
    }
  };
  const next = () => {
    if (month === 12) {
      const ny = year + 1; const nm = 1;
      setYear(ny); setMonth(nm); onMonthChange?.(ny, nm);
    } else {
      const nm = month + 1;
      setMonth(nm); onMonthChange?.(year, nm);
    }
  };

  // Group tasks + events by date string
  const tasksByDay = {};
  tasks.forEach(t => {
    tasksByDay[t.due_date] = tasksByDay[t.due_date] ?? [];
    tasksByDay[t.due_date].push({ ...t, _source: 'task' });
  });
  eventsProp.forEach(ev => {
    if (!ev.date) return;
    tasksByDay[ev.date] = tasksByDay[ev.date] ?? [];
    tasksByDay[ev.date].push({ ...ev, due_date: ev.date, _source: 'eval' });
  });

  const grid  = buildGrid(year, month);
  const todayStr = today.toISOString().split('T')[0];

  const dayStr = (d) => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={prev}><RiArrowLeftSLine /></button>
        <span className={styles.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button className={styles.navBtn} onClick={next}><RiArrowRightSLine /></button>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map(w => <div key={w} className={styles.weekday}>{w}</div>)}

        {grid.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const ds    = dayStr(day);
          const isToday    = ds === todayStr;
          const isSelected = ds === selectedDay;
          const dayTasks   = tasksByDay[ds] ?? [];

          return (
            <button
              key={ds}
              className={[
                styles.cell,
                isToday    ? styles.today    : '',
                isSelected ? styles.selected : '',
              ].join(' ')}
              onClick={() => onSelectDay(ds)}
            >
              <span className={styles.dayNum}>{day}</span>
              {dayTasks.length > 0 && (
                <div className={styles.dots}>
                  {dayTasks.slice(0, 3).map((t, idx) => {
                    const color = ramoMap[t.ramo_id]?.color ?? 'var(--text-muted)';
                    return (
                      <span
                        key={idx}
                        className={styles.dot}
                        style={{ background: color }}
                      />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
