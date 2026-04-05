import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import styles from './CalendarView.module.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function buildGrid(year, month) {
  const firstDay    = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Controlled calendar grid.
 * Props:
 *   year, month          — current view (numbers)
 *   onPrev, onNext       — navigation callbacks
 *   tasks[]              — { due_date, _ramoColor } — for task dots
 *   events[]             — { date, _ramoColor }     — for eval dots
 *   selectedDay          — 'YYYY-MM-DD' | null
 *   onSelectDay(ds|null) — called when a cell is clicked
 */
export default function CalendarView({ year, month, onPrev, onNext, tasks = [], events = [], selectedDay, onSelectDay }) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Group dots by date
  const dotsByDay = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    dotsByDay[t.due_date] = dotsByDay[t.due_date] ?? [];
    dotsByDay[t.due_date].push(t._ramoColor ?? '#6b7280');
  });
  events.forEach(ev => {
    if (!ev.date) return;
    dotsByDay[ev.date] = dotsByDay[ev.date] ?? [];
    dotsByDay[ev.date].push(ev._ramoColor ?? '#6b7280');
  });

  const grid   = buildGrid(year, month);
  const dayStr = d => `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={onPrev} aria-label="Mes anterior">
          <RiArrowLeftSLine />
        </button>
        <span className={styles.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button className={styles.navBtn} onClick={onNext} aria-label="Mes siguiente">
          <RiArrowRightSLine />
        </button>
      </div>

      <div className={styles.grid}>
        {WEEKDAYS.map(w => <div key={w} className={styles.weekday}>{w}</div>)}
        {grid.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const ds      = dayStr(day);
          const dots    = dotsByDay[ds] ?? [];
          const isToday = ds === todayStr;
          const isSel   = ds === selectedDay;
          return (
            <button
              key={ds}
              className={[styles.cell, isToday ? styles.today : '', isSel ? styles.selected : ''].join(' ')}
              onClick={() => onSelectDay(isSel ? null : ds)}
              aria-pressed={isSel}
              aria-label={`${day} de ${MONTHS[month - 1]}`}
            >
              <span className={styles.dayNum}>{day}</span>
              {dots.length > 0 && (
                <div className={styles.dots}>
                  {dots.slice(0, 3).map((color, idx) => (
                    <span key={idx} className={styles.dot} style={{ background: color }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
