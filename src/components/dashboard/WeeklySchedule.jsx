import { useState } from 'react';
import { RiPencilLine, RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { useSchedule } from '../../hooks/useSchedule.js';
import { useRamos }    from '../../hooks/useRamos.js';
import LoadingSpinner  from '../shared/LoadingSpinner.jsx';
import styles from './WeeklySchedule.module.css';

const DAYS      = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DAYS_ALL  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Inline block edit form ────────────────────────────────────────────
function BlockEditPopup({ entry, ramos, onSave, onClose }) {
  const [form, setForm] = useState({
    day_of_week:    entry.day_of_week,
    start_time:     entry.start_time,
    end_time:       entry.end_time,
    sala:           entry.sala ?? '',
    has_attendance: entry.has_attendance ?? false,
    ramo_id:        entry.ramo_id,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.popup} onClick={e => e.stopPropagation()}>
      <div className={styles.popupHeader}>
        <span className={styles.popupTitle}>Editar bloque</span>
        <button className={styles.popupClose} onClick={onClose}><RiCloseLine /></button>
      </div>

      <div className={styles.popupBody}>
        <label className={styles.popupLabel}>Ramo</label>
        <select
          value={form.ramo_id}
          onChange={e => set('ramo_id', e.target.value)}
          className={styles.popupSelect}
        >
          {ramos.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <label className={styles.popupLabel}>Día</label>
        <select
          value={form.day_of_week}
          onChange={e => set('day_of_week', Number(e.target.value))}
          className={styles.popupSelect}
        >
          {DAYS_ALL.map((d, i) => (
            <option key={i} value={i}>{d}</option>
          ))}
        </select>

        <div className={styles.popupRow}>
          <div>
            <label className={styles.popupLabel}>Inicio</label>
            <input
              type="time"
              value={form.start_time}
              onChange={e => set('start_time', e.target.value)}
              className={styles.popupInput}
            />
          </div>
          <div>
            <label className={styles.popupLabel}>Fin</label>
            <input
              type="time"
              value={form.end_time}
              onChange={e => set('end_time', e.target.value)}
              className={styles.popupInput}
            />
          </div>
        </div>

        <label className={styles.popupLabel}>Sala</label>
        <input
          value={form.sala}
          onChange={e => set('sala', e.target.value)}
          placeholder="B-201"
          className={styles.popupInput}
        />

        <label className={styles.popupCheck}>
          <input
            type="checkbox"
            checked={form.has_attendance}
            onChange={e => set('has_attendance', e.target.checked)}
          />
          <span>Control de asistencia</span>
        </label>
      </div>

      <div className={styles.popupActions}>
        <button className={styles.popupBtn} onClick={onClose}>Cancelar</button>
        <button className={`${styles.popupBtn} ${styles.popupBtnSave}`} onClick={() => onSave(form)}>
          <RiCheckLine /> Guardar
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function WeeklySchedule() {
  const { schedule, loading: loadingS, update } = useSchedule();
  const { ramos,    loading: loadingR }         = useRamos();
  const [editId, setEditId] = useState(null);

  if (loadingS || loadingR) {
    return <div className={styles.loadingWrap}><LoadingSpinner /></div>;
  }

  const ramoMap = Object.fromEntries(ramos.map(r => [r.id, r]));

  const byDay = DAYS.map((_, i) =>
    schedule
      .filter(s => s.day_of_week === i)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  );

  const handleSave = async (entry, data) => {
    await update(entry.id, data);
    setEditId(null);
  };

  return (
    <div className={styles.grid}>
      {DAYS.map((day, i) => (
        <div key={day} className={styles.col}>
          <div className={styles.dayLabel}>{day}</div>
          <div className={styles.blocks}>
            {byDay[i].length === 0 ? (
              <div className={styles.empty}>—</div>
            ) : (
              byDay[i].map(entry => {
                const ramo = ramoMap[entry.ramo_id];
                if (!ramo) return null;

                const bg = entry.has_attendance
                  ? ramo.color
                  : hexToRgba(ramo.color, 0.42);

                return (
                  <div key={entry.id} className={styles.blockWrap}>
                    <div
                      className={styles.block}
                      style={{ background: bg }}
                      onClick={() => setEditId(editId === entry.id ? null : entry.id)}
                    >
                      <span className={styles.blockName}>{ramo.name}</span>
                      <span className={styles.blockTime}>
                        {entry.start_time} – {entry.end_time}
                      </span>
                      {entry.sala && (
                        <span className={styles.blockSala}>{entry.sala}</span>
                      )}
                      <span
                        className={entry.has_attendance ? styles.hasAtt : styles.noAtt}
                        title={entry.has_attendance ? 'Con asistencia' : 'Sin asistencia'}
                      >
                        {entry.has_attendance ? '●' : '○'}
                      </span>
                      <RiPencilLine className={styles.editIcon} />
                    </div>

                    {editId === entry.id && (
                      <BlockEditPopup
                        entry={entry}
                        ramos={ramos}
                        onSave={(data) => handleSave(entry, data)}
                        onClose={() => setEditId(null)}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
