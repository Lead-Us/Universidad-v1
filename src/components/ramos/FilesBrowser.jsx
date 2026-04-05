import { useState, useEffect, useCallback } from 'react';
import {
  RiArrowDownSLine, RiArrowUpSLine, RiUploadLine, RiDownloadLine,
  RiFileTextLine, RiDeleteBinLine, RiArrowRightLine, RiAddLine,
  RiEditLine, RiCheckLine, RiCloseLine, RiLoader4Line,
} from 'react-icons/ri';
import {
  getFiles, getFolders, addFolder, renameFolder, deleteFolderRecord,
  addFileRecord, moveFile, deleteFileRecord, uploadRamoFile, getSignedUrl,
  MAX_SIZE_B, getDefaultFolders,
} from '../../services/ramoFilesService.js';
import styles from './FilesBrowser.module.css';

const MAX_SIZE_MB = MAX_SIZE_B / (1024 * 1024);

function fmt(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesBrowser({ unitId: ramoId }) {
  const [folders,   setFolders]   = useState(getDefaultFolders());
  const [files,     setFiles]     = useState([]);
  const [open,      setOpen]      = useState({ todos: true });
  const [moving,    setMoving]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null);

  const [editingFolder, setEditingFolder] = useState(null);
  const [editLabel,     setEditLabel]     = useState('');
  const [addingFolder,  setAddingFolder]  = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [fds, fls] = await Promise.all([getFolders(ramoId), getFiles(ramoId)]);
      setFolders(fds);
      setFiles(fls);
    } catch (e) {
      console.error('FilesBrowser load error:', e);
    } finally {
      setLoading(false);
    }
  }, [ramoId]);

  useEffect(() => { reload(); }, [reload]);

  const toggleFolder = (key) => setOpen(o => ({ ...o, [key]: !o[key] }));

  const handleUpload = async (folderKey, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_SIZE_B) {
      alert(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploading(folderKey);
    try {
      const { path, publicUrl } = await uploadRamoFile(ramoId, file);
      await addFileRecord({
        ramoId, folder: folderKey, name: file.name,
        size: file.size, storagePath: path, publicUrl,
      });
      await reload();
    } catch (err) {
      alert(`Error al subir: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const url = file.storage_path
        ? await getSignedUrl(file.storage_path)
        : file.public_url;
      if (!url) { alert('No se puede descargar este archivo.'); return; }
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.target = '_blank'; a.click();
    } catch (err) { alert(`Error al descargar: ${err.message}`); }
  };

  const handleDelete = async (file) => {
    try {
      await deleteFileRecord(file.id, file.storage_path);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err) { alert(`Error al eliminar: ${err.message}`); }
  };

  const handleMove = async (fileId, toKey) => {
    try {
      await moveFile(fileId, toKey);
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, folder: toKey } : f));
    } catch (err) { alert(`Error al mover: ${err.message}`); }
    setMoving(null);
  };

  const handleAddFolder = async () => {
    const label = newFolderName.trim();
    if (!label) return;
    const newF = await addFolder(ramoId, label);
    setFolders(prev => [...prev, newF]);
    setNewFolderName(''); setAddingFolder(false);
  };

  const handleRenameFolder = async (key) => {
    const label = editLabel.trim();
    if (!label) { setEditingFolder(null); return; }
    try {
      await renameFolder(ramoId, key, label);
      setFolders(prev => prev.map(f => f.key === key ? { ...f, label } : f));
    } catch { /* ignore */ }
    setEditingFolder(null); setEditLabel('');
  };

  const handleDeleteFolder = async (key) => {
    const affected = files.filter(f => f.folder === key);
    await Promise.all(affected.map(f => moveFile(f.id, 'todos')));
    try { await deleteFolderRecord(ramoId, key); } catch { /* ignore */ }
    setFolders(prev => prev.filter(f => f.key !== key));
    setFiles(prev => prev.map(f => f.folder === key ? { ...f, folder: 'todos' } : f));
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <RiLoader4Line className={styles.spinner} />
        <span>Cargando archivos…</span>
      </div>
    );
  }

  return (
    <div className={styles.browser}>
      {folders.map(({ key, label, locked }) => {
        const folderFiles = files.filter(f => f.folder === key);
        const isOpen = !!open[key];
        const isUploading = uploading === key;

        return (
          <div key={key} className={styles.folder}>
            <div className={styles.folderHeader}>
              <button className={styles.folderToggle} onClick={() => toggleFolder(key)}>
                {editingFolder === key ? (
                  <div className={styles.folderRenameRow} onClick={e => e.stopPropagation()}>
                    <input
                      className={styles.folderRenameInput}
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameFolder(key);
                        if (e.key === 'Escape') setEditingFolder(null);
                      }}
                      autoFocus
                    />
                    <button className={styles.iconBtn} onClick={() => handleRenameFolder(key)}><RiCheckLine /></button>
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

              {!locked && editingFolder !== key && confirmDelete !== key && (
                <div className={styles.folderActions}>
                  <button className={styles.iconBtnSmall} onClick={() => { setEditingFolder(key); setEditLabel(label); }} title="Renombrar">
                    <RiEditLine />
                  </button>
                  <button className={styles.iconBtnSmallDanger} onClick={() => setConfirmDelete(key)} title="Eliminar carpeta">
                    <RiDeleteBinLine />
                  </button>
                </div>
              )}

              {confirmDelete === key && (
                <div className={styles.folderDeleteConfirm}>
                  <span className={styles.confirmText}>¿Eliminar? Los archivos irán a "Todos".</span>
                  <button className={styles.confirmYes} onClick={() => handleDeleteFolder(key)}><RiCheckLine /></button>
                  <button className={styles.iconBtn} onClick={() => setConfirmDelete(null)}><RiCloseLine /></button>
                </div>
              )}
            </div>

            {isOpen && (
              <div className={styles.folderBody}>
                {folderFiles.length === 0 ? (
                  <p className={styles.empty}>Sin archivos aún</p>
                ) : (
                  <ul className={styles.fileList}>
                    {folderFiles.map(f => {
                      const isMoving = moving?.fileId === f.id;
                      return (
                        <li key={f.id} className={styles.fileItem}>
                          <RiFileTextLine className={styles.fileIcon} />
                          <span className={styles.fileName} title={f.name}>{f.name}</span>
                          {f.size > 0 && <span className={styles.fileSize}>{fmt(f.size)}</span>}

                          {isMoving ? (
                            <div className={styles.moveRow}>
                              <span className={styles.moveLabel}>Mover a:</span>
                              {folders.filter(t => t.key !== key).map(t => (
                                <button key={t.key} className={styles.moveTarget} onClick={() => handleMove(f.id, t.key)}>
                                  {t.label.split(' ').slice(1).join(' ')}
                                </button>
                              ))}
                              <button className={styles.moveCancelBtn} onClick={() => setMoving(null)}>✕</button>
                            </div>
                          ) : (
                            <>
                              <button className={styles.dlBtn} onClick={() => setMoving({ fileId: f.id, fromKey: key })} title="Mover">
                                <RiArrowRightLine />
                              </button>
                              {(f.storage_path || f.public_url) && (
                                <button className={styles.dlBtn} onClick={() => handleDownload(f)} title="Descargar">
                                  <RiDownloadLine />
                                </button>
                              )}
                              <button className={`${styles.dlBtn} ${styles.delBtn}`} onClick={() => handleDelete(f)} title="Eliminar">
                                <RiDeleteBinLine />
                              </button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <label className={[styles.uploadBtn, isUploading ? styles.uploadBtnLoading : ''].join(' ')}>
                  {isUploading ? <RiLoader4Line className={styles.spinner} /> : <RiUploadLine />}
                  <span>{isUploading ? 'Subiendo…' : 'Subir archivo'}</span>
                  <input type="file" style={{ display: 'none' }} onChange={e => handleUpload(key, e)} disabled={!!uploading} />
                </label>
              </div>
            )}
          </div>
        );
      })}

      {addingFolder ? (
        <div className={styles.addFolderRow}>
          <input
            className={styles.addFolderInput}
            placeholder="Nombre de la nueva carpeta…"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') setAddingFolder(false);
            }}
            autoFocus
          />
          <button className={styles.iconBtn} onClick={handleAddFolder}><RiCheckLine /></button>
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
