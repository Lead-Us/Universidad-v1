import { useState } from 'react';
import { RiPencilLine, RiCloseLine, RiCheckLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { useSchedule } from '../../hooks/useSchedule.js';
import { useRamos }    from '../../hooks/useRamos.js';
import styles from './WeeklySchedule.module.css';

const DAYS      = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DAYS_ALL  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const BLOCK_TYPES = [
  { value: 'catedra',   label: 'Cátedra' },
  { value: 'ayudantia', label: 'Ayudantía' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'otro',      label: 'Otro' },
];
const BLOCK_TYPE_LABEL = { catedra: 'Cát.', ayudantia: 'Ay.', laboratorio: 'Lab.', otro: '' };

// ── Inline block edit form ────────────────────────────────────────────
function BlockEditPopup({ entry, ramos, onSave, onClose, onDelete }) {
  const [form, setForm] = useState({
    day_of_week:    entry.day_of_week,
    start_time:     entry.start_time,
    end_time:       entry.end_time,
    sala:           entry.sala ?? '',
    has_attendance: entry.has_attendance ?? false,
    ramo_id:        entry.ramo_id,
    block_type:     entry.block_type ?? 'catedra',
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

        <label className={styles.popupLabel}>Tipo</label>
        <select
          value={form.block_type}
          onChange={e => set('block_type', e.target.value)}
          className={styles.popupSelect}
        >
          {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

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
        <button className={`${styles.popupBtn} ${styles.popupBtnDel}`} onClick={onDelete} title="Eliminar bloque">
          <RiDeleteBinLine />
        </button>
        <button className={styles.popupBtn} onClick={onClose}>Cancelar</button>
        <button className={`${styles.popupBtn} ${styles.popupBtnSave}`} onClick={() => onSave(form)}>
          <RiCheckLine /> Guardar
        </button>
      </div>
    </div>
  );
}

// ── Quick-add block popup ─────────────────────────────────────────────
function BlockAddPopup({ ramos, onSave, onClose }) {
  const [form, setForm] = useState({
    ramo_id:        ramos[0]?.id ?? '',
    day_of_week:    0,
    start_time:     '08:30',
    end_time:       '10:00',
    sala:           '',
    has_attendance: false,
    block_type:     'catedra',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className={styles.addOverlay} onClick={onClose}>
      <div className={styles.popup} style={{ position: 'static', width: 240, animation: 'scaleIn 220ms var(--ease-spring) both' }} onClick={e => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <span className={styles.popupTitle}>Nuevo bloque</span>
          <button className={styles.popupClose} onClick={onClose}><RiCloseLine /></button>
        </div>
        <div className={styles.popupBody}>
          <label className={styles.popupLabel}>Ramo</label>
          <select value={form.ramo_id} onChange={e => set('ramo_id', e.target.value)} className={styles.popupSelect}>
            {ramos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <label className={styles.popupLabel}>Día</label>
          <select value={form.day_of_week} onChange={e => set('day_of_week', Number(e.target.value))} className={styles.popupSelect}>
            {DAYS_ALL.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>

          <div className={styles.popupRow}>
            <div>
              <label className={styles.popupLabel}>Inicio</label>
              <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={styles.popupInput} />
            </div>
            <div>
              <label className={styles.popupLabel}>Fin</label>
              <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={styles.popupInput} />
            </div>
          </div>

          <label className={styles.popupLabel}>Tipo</label>
          <select value={form.block_type} onChange={e => set('block_type', e.target.value)} className={styles.popupSelect}>
            {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <label className={styles.popupLabel}>Sala</label>
          <input value={form.sala} onChange={e => set('sala', e.target.value)} placeholder="B-201" className={styles.popupInput} />

          <label className={styles.popupCheck}>
            <input type="checkbox" checked={form.has_attendance} onChange={e => set('has_attendance', e.target.checked)} />
            <span>Control de asistencia</span>
          </label>
        </div>
        <div className={styles.popupActions}>
          <button className={styles.popupBtn} onClick={onClose}>Cancelar</button>
          <button className={`${styles.popupBtn} ${styles.popupBtnSave}`} onClick={() => onSave(form)} disabled={!form.ramo_id}>
            <RiCheckLine /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function WeeklySchedule({ showAdd: showAddProp, onAddClose }) {
  const { schedule, loading: loadingS, add, update, remove } = useSchedule();
  const { ramos,    loading: loadingR }              = useRamos();
  const [editId,  setEditId]  = useState(null);
  const [showAddLocal, setShowAddLocal] = useState(false);

  const showAdd = showAddProp ?? showAddLocal;
  const setShowAdd = (v) => {
    if (showAddProp !== undefined) { if (!v) onAddClose?.(); }
    else setShowAddLocal(v);
  };

  if (loadingS || loadingR) {
    return <div className={styles.loadingWrap} />;
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

  const handleDelete = async (entryId) => {
    await remove(entryId);
    setEditId(null);
  };

  const handleAdd = async (data) => {
    await add(data);
    setShowAdd(false);
  };

  return (
    <div className={styles.wrapper}>
      {showAdd && (
        <BlockAddPopup
          ramos={ramos}
          onSave={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}

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

                return (
                  <div key={entry.id} className={styles.blockWrap}>
                    <div
                      className={styles.block}
                      style={{ background: `${ramo.color}15`, borderColor: `${ramo.color}40` }}
                      onClick={() => setEditId(editId === entry.id ? null : entry.id)}
                    >
                      <div className={styles.blockHeader}>
                        <span className={styles.blockName}>{ramo.name}</span>
                        {entry.block_type && (
                          <span className={styles.blockTypeBadge}>{BLOCK_TYPE_LABEL[entry.block_type] || entry.block_type}</span>
                        )}
                        {entry.sala && (
                          <span className={styles.blockSalaInline}>{entry.sala}</span>
                        )}
                      </div>
                      <span className={styles.blockTime}>
                        {entry.start_time} – {entry.end_time}
                      </span>
                      {ramo.professor && (
                        <span className={styles.blockProf}>{ramo.professor}</span>
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
                        onDelete={() => handleDelete(entry.id)}
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
    </div>
  );
}
