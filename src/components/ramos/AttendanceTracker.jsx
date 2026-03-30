import { useState } from 'react';
import { RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { useAttendance } from '../../hooks/useRamos.js';
import InlineEdit from '../shared/InlineEdit.jsx';
import styles from './AttendanceTracker.module.css';

const STATUS_LABELS = {
  present: 'Presente',
  absent:  'Ausente',
  late:    'Atraso',
};

const STATUS_COLORS = {
  present: '#16a34a',
  absent:  '#dc2626',
  late:    '#d97706',
};

const NEXT_STATUS = {
  present: 'absent',
  absent:  'late',
  late:    'present',
};

function SessionRow({ session, onUpdate, onRemove }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const color = STATUS_COLORS[session.status] ?? '#6B7280';

  const cycleStatus = () => {
    onUpdate(session.id, { status: NEXT_STATUS[session.status] ?? 'present' });
  };

  return (
    <div className={styles.sessionRow}>
      <div className={styles.sessionDate}>
        <InlineEdit
          value={session.date ?? ''}
          onSave={v => onUpdate(session.id, { date: v })}
          placeholder="Fecha"
          className={styles.dateText}
        />
      </div>

      <button
        className={styles.statusBtn}
        style={{ background: `${color}18`, color, borderColor: `${color}40` }}
        onClick={cycleStatus}
        title="Click para cambiar estado"
      >
        {STATUS_LABELS[session.status] ?? session.status}
      </button>

      <div className={styles.sessionNote}>
        <InlineEdit
          value={session.note ?? ''}
          onSave={v => onUpdate(session.id, { note: v })}
          placeholder="Nota (opcional)"
          className={styles.noteText}
        />
      </div>

      <div className={styles.sessionActions}>
        {confirmDel ? (
          <>
            <button className={`${styles.iconBtn} ${styles.confirm}`} onClick={() => onRemove(session.id)}>✓</button>
            <button className={styles.iconBtn} onClick={() => setConfirmDel(false)}>✕</button>
          </>
        ) : (
          <button className={`${styles.iconBtn} ${styles.del}`} onClick={() => setConfirmDel(true)}>
            <RiDeleteBinLine />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AttendanceTracker({ ramoId, ramoColor }) {
  const { sessions, loading, addSession, updateSession, removeSession, stats } = useAttendance(ramoId);

  if (loading) return <div className={styles.loading}>Cargando…</div>;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.wrap}>
      {/* Stats header */}
      <div className={styles.statsCard}>
        <div className={styles.mainStat}>
          <span className={styles.mainStatValue} style={{ color: ramoColor }}>
            {stats.pct !== null ? `${stats.pct}%` : '–'}
          </span>
          <span className={styles.mainStatLabel}>Asistencia</span>
        </div>
        <div className={styles.statPills}>
          <span className={styles.statPill} style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}>
            ● {stats.present} presente{stats.present !== 1 ? 's' : ''}
          </span>
          <span className={styles.statPill} style={{ background: 'rgba(217,119,6,0.10)', color: '#d97706' }}>
            ● {stats.late} atraso{stats.late !== 1 ? 's' : ''}
          </span>
          <span className={styles.statPill} style={{ background: 'rgba(220,38,38,0.10)', color: '#dc2626' }}>
            ● {stats.absent} ausente{stats.absent !== 1 ? 's' : ''}
          </span>
          <span className={styles.statTotal}>
            {stats.total} clase{stats.total !== 1 ? 's' : ''} total
          </span>
        </div>
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div className={styles.sessionList}>
          <div className={styles.listHeader}>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Nota</span>
            <span />
          </div>
          {sessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              onUpdate={updateSession}
              onRemove={removeSession}
            />
          ))}
        </div>
      )}

      {sessions.length === 0 && (
        <div className={styles.empty}>
          <p>No hay clases registradas.</p>
          <p className={styles.emptyHint}>Agrega una clase para comenzar a llevar el registro.</p>
        </div>
      )}

      <button
        className={styles.addBtn}
        onClick={() => addSession({ date: today, status: 'present', note: '' })}
      >
        <RiAddLine /> Agregar clase
      </button>
    </div>
  );
}
