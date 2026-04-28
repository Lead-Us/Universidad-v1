import { useState, useRef, useCallback } from 'react';
import {
  RiFolderOpenLine, RiFolderLine, RiFileLine, RiAddLine, RiEditLine,
  RiDeleteBinLine, RiDownloadLine, RiMoreLine, RiCheckLine, RiCloseLine,
  RiArrowDownSLine, RiArrowRightSLine, RiLoader4Line, RiUploadLine,
  RiFileTextLine, RiImage2Line,
} from 'react-icons/ri';
import {
  getAllUserFiles, getFolders, addFolder, renameFolder, deleteFolderRecord,
  moveFile, deleteFileRecord, getSignedUrl, uploadToFolder, getDefaultFolders,
  renameFile,
} from '../../services/ramoFilesService.js';
import styles from './Biblioteca.module.css';

function fmt(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <RiImage2Line />;
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return <RiFileTextLine />;
  return <RiFileLine />;
}

export default function Biblioteca({ ramos }) {
  const [collapsed, setCollapsed]           = useState(false);
  const [loaded, setLoaded]                 = useState(false);
  const [loading, setLoading]               = useState(false);
  const [allFiles, setAllFiles]             = useState([]);
  const [allFolders, setAllFolders]         = useState({}); // { ramoId: Folder[] }
  const [selectedRamoId, setSelectedRamoId] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState('todos');

  // Context menu for files
  const [contextMenu, setContextMenu] = useState(null); // { fileId, x, y }
  const [movingTo, setMovingTo]       = useState(null);  // fileId being moved

  // Folder editing
  const [editingFolder, setEditingFolder] = useState(null); // { ramoId, key }
  const [editLabel, setEditLabel]         = useState('');
  const [addingFolder, setAddingFolder]   = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Rename file
  const [renamingFile, setRenamingFile] = useState(null); // fileId
  const [renameValue, setRenameValue]   = useState('');

  // Upload
  const uploadRef = useRef(null);
  const [uploading, setUploading]       = useState(false);

  const handleExpand = useCallback(async () => {
    setCollapsed(false);
    if (loaded || !ramos?.length) return;
    setLoading(true);
    try {
      const [files, ...folderArrays] = await Promise.all([
        getAllUserFiles(),
        ...ramos.map(r => getFolders(r.id)),
      ]);
      setAllFiles(files);
      const folderMap = {};
      ramos.forEach((r, i) => { folderMap[r.id] = folderArrays[i]; });
      setAllFolders(folderMap);
      setSelectedRamoId(ramos[0]?.id ?? null);
      setLoaded(true);
    } catch (e) {
      console.error('Biblioteca load error:', e);
    } finally {
      setLoading(false);
    }
  }, [loaded, ramos]);

  const toggleCollapse = () => {
    if (collapsed) handleExpand();
    else setCollapsed(true);
  };

  const currentRamo    = ramos?.find(r => r.id === selectedRamoId);
  const currentFolders = allFolders[selectedRamoId] ?? getDefaultFolders();
  const currentFiles   = allFiles.filter(
    f => f.ramos?.id === selectedRamoId && f.folder === selectedFolder
  );

  // File counts per folder for the selected ramo
  const ramoFiles = allFiles.filter(f => f.ramos?.id === selectedRamoId);
  const folderCount = (key) => ramoFiles.filter(f => f.folder === key).length;

  // Total files per ramo for sidebar badge
  const ramoFileCount = (ramoId) => allFiles.filter(f => f.ramos?.id === ramoId).length;

  // ── Download ──────────────────────────────────────────────────────────
  const download = async (file) => {
    setContextMenu(null);
    try {
      const url = await getSignedUrl(file.storage_path);
      const a = document.createElement('a');
      a.href = url; a.download = file.name; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { console.error('Download error:', e); }
  };

  // ── Move file ─────────────────────────────────────────────────────────
  const handleMove = async (fileId, newFolder) => {
    setContextMenu(null); setMovingTo(null);
    await moveFile(fileId, newFolder);
    setAllFiles(prev => prev.map(f => f.id === fileId ? { ...f, folder: newFolder } : f));
  };

  // ── Delete file ───────────────────────────────────────────────────────
  const handleDeleteFile = async (file) => {
    setContextMenu(null);
    if (!confirm(`¿Eliminar "${file.name}"?`)) return;
    await deleteFileRecord(file.id, file.storage_path);
    setAllFiles(prev => prev.filter(f => f.id !== file.id));
  };

  // ── Rename file ───────────────────────────────────────────────────────
  const startRename = (file) => {
    setContextMenu(null);
    setRenamingFile(file.id);
    setRenameValue(file.name);
  };

  const confirmRename = async (file) => {
    if (!renameValue.trim() || renameValue === file.name) { setRenamingFile(null); return; }
    await renameFile(file.id, renameValue.trim());
    setAllFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: renameValue.trim() } : f));
    setRenamingFile(null);
  };

  // ── Create folder ─────────────────────────────────────────────────────
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !selectedRamoId) return;
    const folder = await addFolder(selectedRamoId, newFolderName.trim());
    setAllFolders(prev => ({ ...prev, [selectedRamoId]: [...(prev[selectedRamoId] ?? getDefaultFolders()), folder] }));
    setNewFolderName(''); setAddingFolder(false);
  };

  // ── Rename folder ─────────────────────────────────────────────────────
  const handleRenameFolder = async () => {
    if (!editLabel.trim() || !editingFolder) return;
    await renameFolder(editingFolder.ramoId, editingFolder.key, editLabel.trim());
    setAllFolders(prev => ({
      ...prev,
      [editingFolder.ramoId]: (prev[editingFolder.ramoId] ?? getDefaultFolders()).map(f =>
        f.key === editingFolder.key ? { ...f, label: editLabel.trim() } : f
      ),
    }));
    setEditingFolder(null);
  };

  // ── Delete folder ─────────────────────────────────────────────────────
  const handleDeleteFolder = async (folder) => {
    if (!confirm(`¿Eliminar carpeta "${folder.label}"? Los archivos se moverán a "Todos los archivos".`)) return;
    // Move files to "todos"
    const filesInFolder = allFiles.filter(f => f.ramos?.id === selectedRamoId && f.folder === folder.key);
    await Promise.all(filesInFolder.map(f => moveFile(f.id, 'todos')));
    setAllFiles(prev => prev.map(f =>
      f.ramos?.id === selectedRamoId && f.folder === folder.key ? { ...f, folder: 'todos' } : f
    ));
    await deleteFolderRecord(selectedRamoId, folder.key);
    setAllFolders(prev => ({
      ...prev,
      [selectedRamoId]: (prev[selectedRamoId] ?? getDefaultFolders()).filter(f => f.key !== folder.key),
    }));
    if (selectedFolder === folder.key) setSelectedFolder('todos');
  };

  // ── Upload files ──────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !selectedRamoId) return;
    setUploading(true);
    try {
      for (const file of files) {
        const record = await uploadToFolder(selectedRamoId, selectedFolder, file);
        setAllFiles(prev => [{ ...record, ramos: currentRamo }, ...prev]);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <button className={styles.header} onClick={toggleCollapse}>
        <RiFolderOpenLine className={styles.headerIcon} />
        <span className={styles.headerTitle}>Biblioteca</span>
        {loaded && (
          <span className={styles.headerCount}>{allFiles.length} archivos</span>
        )}
        <span className={[styles.chevron, collapsed ? styles.chevronUp : ''].join(' ')}>
          <RiArrowDownSLine />
        </span>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingRow}>
              <RiLoader4Line className={styles.spinner} />
              <span>Cargando archivos…</span>
            </div>
          )}

          {!loading && loaded && (
            <div className={styles.finder}>
              {/* ── Left: Ramos sidebar ── */}
              <div className={styles.sidebar}>
                <p className={styles.sidebarLabel}>Ramos</p>
                {ramos?.map(ramo => (
                  <button
                    key={ramo.id}
                    className={[styles.ramoItem, selectedRamoId === ramo.id ? styles.ramoItemActive : ''].join(' ')}
                    onClick={() => { setSelectedRamoId(ramo.id); setSelectedFolder('todos'); }}
                  >
                    <span className={styles.ramoColor} style={{ background: ramo.color }} />
                    <span className={styles.ramoName}>{ramo.name}</span>
                    {ramoFileCount(ramo.id) > 0 && (
                      <span className={styles.ramoBadge}>{ramoFileCount(ramo.id)}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Right: Folders + Files ── */}
              <div className={styles.main}>
                {/* Folders */}
                <div className={styles.foldersSection}>
                  <div className={styles.foldersList}>
                    {currentFolders.map(folder => (
                      <div key={folder.key} className={styles.folderRow}>
                        {editingFolder?.key === folder.key && editingFolder?.ramoId === selectedRamoId ? (
                          <div className={styles.folderEditRow}>
                            <input
                              className={styles.folderEditInput}
                              value={editLabel}
                              onChange={e => setEditLabel(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(); if (e.key === 'Escape') setEditingFolder(null); }}
                              autoFocus
                            />
                            <button className={styles.iconBtn} onClick={handleRenameFolder}><RiCheckLine /></button>
                            <button className={styles.iconBtn} onClick={() => setEditingFolder(null)}><RiCloseLine /></button>
                          </div>
                        ) : (
                          <>
                            <button
                              className={[styles.folderBtn, selectedFolder === folder.key ? styles.folderBtnActive : ''].join(' ')}
                              onClick={() => setSelectedFolder(folder.key)}
                            >
                              {selectedFolder === folder.key ? <RiFolderOpenLine /> : <RiFolderLine />}
                              <span className={styles.folderLabel}>{folder.label}</span>
                              <span className={styles.folderCount}>{folderCount(folder.key)}</span>
                            </button>
                            {!folder.locked && (
                              <div className={styles.folderActions}>
                                <button
                                  className={styles.iconBtn}
                                  title="Renombrar"
                                  onClick={() => { setEditingFolder({ ramoId: selectedRamoId, key: folder.key }); setEditLabel(folder.label); }}
                                >
                                  <RiEditLine />
                                </button>
                                <button
                                  className={styles.iconBtnDanger}
                                  title="Eliminar"
                                  onClick={() => handleDeleteFolder(folder)}
                                >
                                  <RiDeleteBinLine />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add folder */}
                    {addingFolder ? (
                      <div className={styles.folderEditRow}>
                        <input
                          className={styles.folderEditInput}
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); } }}
                          placeholder="Nombre de carpeta…"
                          autoFocus
                        />
                        <button className={styles.iconBtn} onClick={handleAddFolder}><RiCheckLine /></button>
                        <button className={styles.iconBtn} onClick={() => { setAddingFolder(false); setNewFolderName(''); }}><RiCloseLine /></button>
                      </div>
                    ) : (
                      <button className={styles.addFolderBtn} onClick={() => setAddingFolder(true)}>
                        <RiAddLine /> Nueva carpeta
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.divider} />

                {/* Files */}
                <div className={styles.filesSection}>
                  <div className={styles.filesHeader}>
                    <span className={styles.filesTitle}>
                      {currentFolders.find(f => f.key === selectedFolder)?.label ?? 'Archivos'}
                    </span>
                    <div className={styles.filesHeaderActions}>
                      {uploading && <RiLoader4Line className={styles.spinner} />}
                      <button
                        className={styles.uploadBtn}
                        onClick={() => uploadRef.current?.click()}
                        title="Subir archivos"
                        disabled={uploading}
                      >
                        <RiUploadLine /> Subir
                      </button>
                      <input
                        ref={uploadRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                        accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
                      />
                    </div>
                  </div>

                  {currentFiles.length === 0 && (
                    <p className={styles.emptyFiles}>Sin archivos en esta carpeta</p>
                  )}

                  {currentFiles.map(file => (
                    <div key={file.id} className={styles.fileRow}>
                      <span className={styles.fileIconWrap}>{fileIcon(file.name)}</span>

                      {renamingFile === file.id ? (
                        <input
                          className={styles.renameInput}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmRename(file); if (e.key === 'Escape') setRenamingFile(null); }}
                          onBlur={() => confirmRename(file)}
                          autoFocus
                        />
                      ) : (
                        <span className={styles.fileName}>{file.name}</span>
                      )}

                      <span className={styles.fileSize}>{fmt(file.size)}</span>

                      {/* Context menu trigger */}
                      <div className={styles.fileMenuWrap}>
                        <button
                          className={styles.iconBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenu(contextMenu?.fileId === file.id ? null : { fileId: file.id });
                            setMovingTo(null);
                          }}
                        >
                          <RiMoreLine />
                        </button>

                        {contextMenu?.fileId === file.id && (
                          <div className={styles.contextMenu} onClick={e => e.stopPropagation()}>
                            <button className={styles.ctxItem} onClick={() => download(file)}>
                              <RiDownloadLine /> Descargar
                            </button>
                            <button className={styles.ctxItem} onClick={() => startRename(file)}>
                              <RiEditLine /> Renombrar
                            </button>
                            {/* Move submenu */}
                            <button
                              className={styles.ctxItem}
                              onClick={() => setMovingTo(movingTo === file.id ? null : file.id)}
                            >
                              <RiFolderLine /> Mover a… <RiArrowRightSLine />
                            </button>
                            {movingTo === file.id && (
                              <div className={styles.subMenu}>
                                {currentFolders
                                  .filter(f => f.key !== file.folder)
                                  .map(f => (
                                    <button
                                      key={f.key}
                                      className={styles.ctxItem}
                                      onClick={() => handleMove(file.id, f.key)}
                                    >
                                      <RiFolderLine /> {f.label}
                                    </button>
                                  ))}
                              </div>
                            )}
                            <div className={styles.ctxDivider} />
                            <button className={[styles.ctxItem, styles.ctxItemDanger].join(' ')} onClick={() => handleDeleteFile(file)}>
                              <RiDeleteBinLine /> Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && !loaded && !ramos?.length && (
            <p className={styles.emptyFiles}>No tienes ramos aún. Agrega ramos para organizar tus archivos.</p>
          )}
        </div>
      )}

      {/* Close context menu on outside click */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => { setContextMenu(null); setMovingTo(null); }}
        />
      )}
    </div>
  );
}
