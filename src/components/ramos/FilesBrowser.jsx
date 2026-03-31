import { useState } from 'react';
import {
  RiArrowDownSLine, RiArrowUpSLine, RiUploadLine, RiDownloadLine,
  RiFileTextLine, RiDeleteBinLine, RiArrowRightLine, RiAddLine,
  RiEditLine, RiCheckLine, RiCloseLine,
} from 'react-icons/ri';
import styles from './FilesBrowser.module.css';

const DEFAULT_FOLDERS = [
  { key: 'todos',                label: '📁 Todos los archivos',   locked: true  },
  { key: 'evaluaciones_pasadas', label: '📄 Evaluaciones Pasadas', locked: false },
  { key: 'ejercicios',           label: '✏️ Ejercicios',           locked: false },
  { key: 'ppt',                  label: '📊 PPT',                  locked: false },
];

const MAX_SIZE = 3 * 1024 * 1024;

function initState(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    const folders = saved._folders ?? DEFAULT_FOLDERS;
    const files   = Object.fromEntries(
      Object.entries(saved).filter(([k]) => k !== '_folders'),
    );
    return { folders, files };
  } catch {
    return { folders: DEFAULT_FOLDERS, files: {} };
  }
}

export default function FilesBrowser({ unitId }) {
  const storageKey = `uni_files_${unitId}`;

  const [open,    setOpen]    = useState({ todos: true });
  const [moving,  setMoving]  = useState(null);

  const [{ folders, files }, setState] = useState(() => initState(storageKey));

  // Folder editing
  const [editingFolder, setEditingFolder] = useState(null); // key being edited
  const [editLabel,     setEditLabel]     = useState('');
  const [addingFolder,  setAddingFolder]  = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // folder key

  const persist = (nextFiles, nextFolders) => {
    const newState = { folders: nextFolders ?? folders, files: nextFiles ?? files };
    setState(newState);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        ...newState.files,
        _folders: newState.folders,
      }));
    } catch {
      alert('No se pudo guardar: el archivo es demasiado grande para el almacenamiento local.');
    }
  };

  const toggleFolder = (key) => setOpen(o => ({ ...o, [key]: !o[key] }));

  // ── File operations ──────────────────────────────────────────────────
  const handleUpload = (folderKey, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_SIZE) {
      alert(`El archivo supera el límite de 3 MB. Tamaño: ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const entry = { name: file.name, size: file.size, uploadedAt: new Date().toISOString(), data: reader.result };
      persist({ ...files, [folderKey]: [...(files[folderKey] ?? []), entry] });
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (file) => {
    if (!file.data) { alert('Este archivo fue importado como referencia. Súbelo manualmente para poder descargarlo.'); return; }
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.name;
    a.click();
  };

  const handleDelete = (folderKey, index) => {
    persist({ ...files, [folderKey]: (files[folderKey] ?? []).filter((_, i) => i !== index) });
  };

  const handleMove = (fromKey, index, toKey) => {
    const file = (files[fromKey] ?? [])[index];
    if (!file) return;
    persist({
      ...files,
      [fromKey]: (files[fromKey] ?? []).filter((_, i) => i !== index),
      [toKey]:   [...(files[toKey] ?? []), file],
    });
    setMoving(null);
  };

  // ── Folder operations ─────────────────────────────────────────────────
  const addFolder = () => {
    const label = newFolderName.trim();
    if (!label) return;
    const key = `folder_${Date.now()}`;
    persist(files, [...folders, { key, label: `📁 ${label}`, locked: false }]);
    setNewFolderName('');
    setAddingFolder(false);
  };

  const renameFolder = (key) => {
    const label = editLabel.trim();
    if (!label) { setEditingFolder(null); return; }
    persist(files, folders.map(f => f.key === key ? { ...f, label } : f));
    setEditingFolder(null);
    setEditLabel('');
  };

  const deleteFolder = (key) => {
    // Move files to 'todos'
    const folderFiles = files[key] ?? [];
    const nextFiles = { ...files };
    nextFiles['todos'] = [...(nextFiles['todos'] ?? []), ...folderFiles];
    delete nextFiles[key];
    persist(nextFiles, folders.filter(f => f.key !== key));
    setConfirmDelete(null);
  };

  const fmt = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.browser}>
      {folders.map(({ key, label, locked }) => {
        const folderFiles = files[key] ?? [];
        const isOpen = open[key];
        return (
          <div key={key} className={styles.folder}>
            {/* Folder header */}
            <div className={styles.folderHeader}>
              <button className={styles.folderToggle} onClick={() => toggleFolder(key)}>
                {editingFolder === key ? (
                  <div className={styles.folderRenameRow} onClick={e => e.stopPropagation()}>
                    <input
                      className={styles.folderRenameInput}
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameFolder(key); if (e.key === 'Escape') setEditingFolder(null); }}
                      autoFocus
                    />
                    <button className={styles.iconBtn} onClick={() => renameFolder(key)}><RiCheckLine /></button>
                    <button className={styles.iconBtn} onClick={() => setEditingFolder(null)}><RiCloseLine /></button>
                  </div>
                ) : (
                  <>
                    <span className={styles.folderLabel}>{label}</span>
                    <div className={styles.folderRight}>
                      <span className={styles.count}>{folderFiles.length}</span>
                      {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                    </div>
                  </>
                )}
              </button>

              {/* Folder edit/delete buttons (non-locked only) */}
              {!locked && editingFolder !== key && confirmDelete !== key && (
                <div className={styles.folderActions}>
                  <button className={styles.iconBtnSmall} onClick={() => { setEditingFolder(key); setEditLabel(label); }} title="Renombrar carpeta">
                    <RiEditLine />
                  </button>
                  <button className={styles.iconBtnSmallDanger} onClick={() => setConfirmDelete(key)} title="Eliminar carpeta">
                    <RiDeleteBinLine />
                  </button>
                </div>
              )}

              {/* Delete confirmation */}
              {confirmDelete === key && (
                <div className={styles.folderDeleteConfirm}>
                  <span className={styles.confirmText}>¿Eliminar? Los archivos irán a "Todos".</span>
                  <button className={styles.confirmYes} onClick={() => deleteFolder(key)}><RiCheckLine /></button>
                  <button className={styles.iconBtn} onClick={() => setConfirmDelete(null)}><RiCloseLine /></button>
                </div>
              )}
            </div>

            {/* Folder body */}
            {isOpen && (
              <div className={styles.folderBody}>
                {folderFiles.length === 0 ? (
                  <p className={styles.empty}>Sin archivos aún</p>
                ) : (
                  <ul className={styles.fileList}>
                    {folderFiles.map((f, i) => {
                      const isMoving = moving?.folderKey === key && moving?.index === i;
                      return (
                        <li key={i} className={styles.fileItem}>
                          <RiFileTextLine className={styles.fileIcon} />
                          <span className={styles.fileName} title={f.name}>{f.name}</span>
                          {f.size > 0 && <span className={styles.fileSize}>{fmt(f.size)}</span>}

                          {isMoving ? (
                            <div className={styles.moveRow}>
                              <span className={styles.moveLabel}>Mover a:</span>
                              {folders.filter(t => t.key !== key).map(t => (
                                <button key={t.key} className={styles.moveTarget} onClick={() => handleMove(key, i, t.key)}>
                                  {t.label.split(' ').slice(1).join(' ')}
                                </button>
                              ))}
                              <button className={styles.moveCancelBtn} onClick={() => setMoving(null)}>✕</button>
                            </div>
                          ) : (
                            <>
                              <button className={styles.dlBtn} onClick={() => setMoving({ folderKey: key, index: i })} title="Mover a carpeta">
                                <RiArrowRightLine />
                              </button>
                              <button className={styles.dlBtn} onClick={() => handleDownload(f)} title={f.data ? 'Descargar' : 'Sin datos'} style={{ opacity: f.data ? 1 : 0.4 }}>
                                <RiDownloadLine />
                              </button>
                              <button className={`${styles.dlBtn} ${styles.delBtn}`} onClick={() => handleDelete(key, i)} title="Eliminar">
                                <RiDeleteBinLine />
                              </button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <label className={styles.uploadBtn}>
                  <RiUploadLine />
                  <span>Subir archivo</span>
                  <input type="file" style={{ display: 'none' }} onChange={e => handleUpload(key, e)} />
                </label>
              </div>
            )}
          </div>
        );
      })}

      {/* Add folder */}
      {addingFolder ? (
        <div className={styles.addFolderRow}>
          <input
            className={styles.addFolderInput}
            placeholder="Nombre de la nueva carpeta…"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addFolder(); if (e.key === 'Escape') setAddingFolder(false); }}
            autoFocus
          />
          <button className={styles.iconBtn} onClick={addFolder}><RiCheckLine /></button>
          <button className={styles.iconBtn} onClick={() => setAddingFolder(false)}><RiCloseLine /></button>
        </div>
      ) : (
        <button className={styles.addFolderBtn} onClick={() => setAddingFolder(true)}>
          <RiAddLine /> Nueva carpeta
        </button>
      )}
    </div>
  );
}
