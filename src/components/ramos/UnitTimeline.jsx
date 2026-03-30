import { useState } from 'react';
import {
  RiAddLine, RiPencilLine, RiDeleteBinLine,
  RiCheckLine, RiCloseLine, RiFileLine, RiAttachmentLine,
} from 'react-icons/ri';
import { useUnits } from '../../hooks/useRamos.js';
import Button from '../shared/Button.jsx';
import styles from './UnitTimeline.module.css';

// ── Materia file chips (view) ─────────────────────────────────────────
function MateriaChip({ materia, allFiles, onFilesChange }) {
  const [expanded, setExpanded] = useState(false);
  const files = materia.files ?? [];

  return (
    <div className={styles.materiaItem}>
      <button
        type="button"
        className={styles.chip}
        onClick={() => setExpanded(e => !e)}
        title={materia.description || undefined}
      >
        {materia.name}
        {files.length > 0 && (
          <span className={styles.chipFileBadge}>{files.length}</span>
        )}
      </button>

      {expanded && (
        <div className={styles.materiaFiles}>
          {files.length > 0 ? (
            files.map((f, fi) => (
              <span key={fi} className={styles.fileChip}>
                <RiFileLine className={styles.fileChipIcon} />
                {f}
              </span>
            ))
          ) : (
            <span className={styles.noFiles}>Sin archivos</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unit row ───────────────────────────────────────────────────────────
function UnitRow({ unit, allFiles, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [name,     setName]     = useState(unit.name);
  const [materias, setMaterias] = useState(unit.materias ?? []);
  const [newMat,   setNewMat]   = useState('');
  const [editMat,  setEditMat]  = useState(null); // index being edited for files

  const save = async () => {
    await onUpdate(unit.id, { name, materias });
    setEditing(false);
  };

  const addMateria = () => {
    if (!newMat.trim()) return;
    setMaterias(m => [...m, { name: newMat.trim(), description: '', files: [] }]);
    setNewMat('');
  };

  const removeMateria = (i) => setMaterias(m => m.filter((_, idx) => idx !== i));

  // Toggle a file in a materia's files array
  const toggleFile = (matIdx, fileName) => {
    setMaterias(prev => prev.map((m, i) => {
      if (i !== matIdx) return m;
      const has = (m.files ?? []).includes(fileName);
      return {
        ...m,
        files: has
          ? m.files.filter(f => f !== fileName)
          : [...(m.files ?? []), fileName],
      };
    }));
  };

  return (
    <div className={styles.unit}>
      <div className={styles.dot} />
      <div className={styles.unitContent}>
        {editing ? (
          <div className={styles.editBlock}>
            {/* Unit name */}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.nameInput}
              autoFocus
            />

            {/* Materias edit list */}
            <div className={styles.materiasList}>
              {materias.map((m, i) => (
                <div key={i} className={styles.materiaEditItem}>
                  <div className={styles.materiaEditTop}>
                    <span className={styles.materiaEdit}>
                      {m.name}
                      <button type="button" onClick={() => removeMateria(i)} className={styles.removeMat}>
                        <RiCloseLine />
                      </button>
                    </span>
                    <button
                      type="button"
                      className={styles.fileEditToggle}
                      onClick={() => setEditMat(editMat === i ? null : i)}
                      title="Seleccionar archivos"
                    >
                      <RiAttachmentLine />
                      {(m.files ?? []).length > 0 && (
                        <span className={styles.fileCount}>{m.files.length}</span>
                      )}
                    </button>
                  </div>

                  {/* File selector for this materia */}
                  {editMat === i && allFiles.length > 0 && (
                    <div className={styles.fileSelector}>
                      <p className={styles.fileSelectorLabel}>
                        Selecciona archivos del ramo:
                      </p>
                      <div className={styles.fileSelectorList}>
                        {allFiles.map((f, fi) => {
                          const selected = (m.files ?? []).includes(f);
                          return (
                            <label key={fi} className={[styles.fileOption, selected ? styles.fileOptionSelected : ''].join(' ')}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleFile(i, f)}
                              />
                              <RiFileLine className={styles.fileOptionIcon} />
                              <span className={styles.fileOptionName}>{f}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add materia */}
            <div className={styles.addMateriaRow}>
              <input
                value={newMat}
                onChange={e => setNewMat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMateria())}
                placeholder="Nueva materia…"
                className={styles.addMateriaInput}
              />
              <Button type="button" variant="ghost" size="sm" onClick={addMateria}>
                <RiAddLine /> Agregar
              </Button>
            </div>

            <div className={styles.editActions}>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                <RiCloseLine /> Cancelar
              </Button>
              <Button type="button" size="sm" onClick={save}>
                <RiCheckLine /> Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.unitHeader}>
              <h4 className={styles.unitName}>{unit.name}</h4>
              <div className={styles.unitActions}>
                <button className={styles.iconBtn} onClick={() => setEditing(true)} title="Editar">
                  <RiPencilLine />
                </button>
                <button className={styles.iconBtn} onClick={() => onDelete(unit.id)} title="Eliminar">
                  <RiDeleteBinLine />
                </button>
              </div>
            </div>
            {materias.length > 0 && (
              <div className={styles.chips}>
                {materias.map((m, i) => (
                  <MateriaChip key={i} materia={m} allFiles={allFiles} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export default function UnitTimeline({ ramoId, ramoColor, allFiles = [] }) {
  const { units, loading, add, update, remove } = useUnits(ramoId);
  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await add({ ramo_id: ramoId, name: newName.trim(), order: units.length + 1, materias: [] });
    setNewName('');
    setAdding(false);
  };

  return (
    <div className={styles.timeline} style={{ '--ramo-color': ramoColor }}>
      <div className={styles.line} />

      {units.map(u => (
        <UnitRow
          key={u.id}
          unit={u}
          allFiles={allFiles}
          onDelete={remove}
          onUpdate={update}
        />
      ))}

      {adding ? (
        <div className={styles.addRow}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nombre de la unidad…"
            autoFocus
          />
          <Button size="sm" onClick={handleAdd}>Agregar</Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName(''); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <button className={styles.addUnitBtn} onClick={() => setAdding(true)}>
          <RiAddLine /> Agregar unidad
        </button>
      )}
    </div>
  );
}
