import { useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiCheckLine, RiAlertLine } from 'react-icons/ri';
import { useEvaluations } from '../../hooks/useRamos.js';
import InlineEdit from '../shared/InlineEdit.jsx';
import { moduleAverage, formatGrade, gradeColor, totalWeight } from '../../lib/grades.js';
import styles from './EvaluationSchedule.module.css';

// ── GradeHeader ─────────────────────────────────────────────
function GradeHeader({ finalGrade, weightTotal, ramoColor }) {
  const color  = gradeColor(finalGrade);
  const ok     = weightTotal === 100;
  return (
    <div className={styles.gradeHeader}>
      <div className={styles.gradeDisplay}>
        <span className={styles.gradeLabel}>Nota actual</span>
        <span className={styles.gradeValue} style={{ color }}>
          {formatGrade(finalGrade)}
        </span>
      </div>
      <div className={styles.gradeRight}>
        <span
          className={styles.weightPill}
          style={{
            background: ok ? 'rgba(22,163,74,0.10)' : 'rgba(217,119,6,0.12)',
            color: ok ? 'var(--color-success)' : 'var(--color-warning)',
            borderColor: ok ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.30)',
          }}
        >
          {ok ? <RiCheckLine /> : <RiAlertLine />}
          {weightTotal}% ponderado
        </span>
      </div>
    </div>
  );
}

// ── ItemRow ──────────────────────────────────────────────────
function ItemRow({ item, moduleId, ramoId, onUpdate, onRemove }) {
  const [confirmDel, setConfirmDel] = useState(false);

  const handleGradeChange = (g) => {
    const n = Number(g);
    if (isNaN(n)) return;
    const clamped = Math.min(7, Math.max(1, n));
    onUpdate(moduleId, item.id, { grade: clamped });
  };

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemName}>
        <InlineEdit
          value={item.name}
          onSave={v => onUpdate(moduleId, item.id, { name: v })}
          placeholder="Nombre"
          className={styles.itemNameText}
        />
      </div>
      <div className={styles.itemGrade}>
        <InlineEdit
          value={item.grade !== null && item.grade !== undefined ? String(item.grade) : ''}
          onSave={handleGradeChange}
          type="number"
          min={1}
          max={7}
          step={0.1}
          placeholder="—"
          className={styles.gradeText}
          style={{ color: item.grade !== null ? gradeColor(item.grade) : 'var(--text-muted)' }}
        />
      </div>
      <div className={styles.itemDate}>
        <input
          type="date"
          className={styles.dateInput}
          value={item.date ?? ''}
          onChange={e => onUpdate(moduleId, item.id, { date: e.target.value || null })}
          onClick={e => e.stopPropagation()}
        />
      </div>
      <div className={styles.itemActions}>
        {confirmDel ? (
          <>
            <button className={`${styles.iconBtn} ${styles.confirm}`} onClick={() => onRemove(moduleId, item.id)}>
              ✓
            </button>
            <button className={styles.iconBtn} onClick={() => setConfirmDel(false)}>
              ✕
            </button>
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

// ── ModuleCard ───────────────────────────────────────────────
function ModuleCard({ mod, ramoId, ramoColor, onUpdateMod, onRemoveMod, onAddItem, onUpdateItem, onRemoveItem }) {
  const [collapsed, setCollapsed]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const avg    = moduleAverage(mod.items);
  const avgColor = gradeColor(avg);

  return (
    <div className={styles.moduleCard}>
      <div className={styles.moduleHeader} onClick={() => setCollapsed(c => !c)}>
        <div className={styles.moduleLeft}>
          <span className={styles.moduleChevron} style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
          <InlineEdit
            value={mod.name}
            onSave={v => onUpdateMod(mod.id, { name: v })}
            className={styles.moduleName}
          />
        </div>
        <div className={styles.moduleRight}>
          <div className={styles.moduleWeightWrap}>
            <InlineEdit
              value={String(mod.weight)}
              onSave={v => onUpdateMod(mod.id, { weight: Number(v) })}
              type="number"
              min={0}
              max={100}
              step={0.5}
              className={styles.moduleWeight}
            />
            <span className={styles.modulePct}>%</span>
          </div>
          <span className={styles.moduleAvg} style={{ color: avgColor }}>
            {avg !== null ? formatGrade(avg) : '–'}
          </span>
          {confirmDel ? (
            <div className={styles.confirmRow} onClick={e => e.stopPropagation()}>
              <button className={`${styles.iconBtn} ${styles.confirm}`} onClick={() => onRemoveMod(mod.id)}>✓</button>
              <button className={styles.iconBtn} onClick={() => setConfirmDel(false)}>✕</button>
            </div>
          ) : (
            <button className={`${styles.iconBtn} ${styles.del}`} onClick={e => { e.stopPropagation(); setConfirmDel(true); }}>
              <RiDeleteBinLine />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className={styles.moduleBody}>
          {mod.items.length === 0 ? (
            <p className={styles.emptyItems}>Sin evaluaciones aún.</p>
          ) : (
            <>
              <div className={styles.itemHeader}>
                <span>Nombre</span>
                <span>Nota</span>
                <span>Fecha</span>
                <span />
              </div>
              {mod.items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  moduleId={mod.id}
                  ramoId={ramoId}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                />
              ))}
            </>
          )}
          <button
            className={styles.addItemBtn}
            onClick={() => onAddItem(mod.id, { name: 'Nueva evaluación', grade: null, date: null })}
          >
            <RiAddLine /> Agregar evaluación
          </button>
        </div>
      )}
    </div>
  );
}

// ── EvaluationSchedule (main) ────────────────────────────────
export default function EvaluationSchedule({ ramoId, ramoColor }) {
  const {
    modules, loading,
    addModule, updateModule, removeModule,
    addItem, updateItem, removeItem,
    finalGrade, weightTotal,
  } = useEvaluations(ramoId);

  if (loading) return <div className={styles.loading}>Cargando…</div>;

  return (
    <div className={styles.wrap}>
      <GradeHeader finalGrade={finalGrade} weightTotal={weightTotal} ramoColor={ramoColor} />

      <div className={styles.modules}>
        {modules.map(mod => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            ramoId={ramoId}
            ramoColor={ramoColor}
            onUpdateMod={updateModule}
            onRemoveMod={removeModule}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />
        ))}
      </div>

      <button
        className={styles.addModuleBtn}
        onClick={() => addModule({ name: 'Nuevo módulo', weight: 0, items: [] })}
      >
        <RiAddLine /> Nuevo módulo de evaluación
      </button>
    </div>
  );
}
