import { useState } from 'react';
import {
  RiArrowDownSLine, RiArrowUpSLine, RiUploadLine, RiDownloadLine,
  RiFileTextLine, RiDeleteBinLine, RiArrowRightLine,
} from 'react-icons/ri';
import styles from './FilesBrowser.module.css';

const FOLDERS = [
  { key: 'todos',                label: '📁 Todos los archivos'   },
  { key: 'evaluaciones_pasadas', label: '📄 Evaluaciones Pasadas' },
  { key: 'ejercicios',           label: '✏️ Ejercicios'           },
  { key: 'ppt',                  label: '📊 PPT'                  },
];

const MAX_SIZE = 3 * 1024 * 1024;

export default function FilesBrowser({ unitId }) {
  const storageKey = `uni_files_${unitId}`;

  const [open,   setOpen]   = useState({ todos: true });
  const [files,  setFiles]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}'); }
    catch { return {}; }
  });
  const [moving, setMoving] = useState(null); // { folderKey, index }

  const persistFiles = (updated) => {
    setFiles(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); }
    catch { alert('No se pudo guardar: el archivo es demasiado grande para el almacenamiento local.'); }
  };

  const toggleFolder = (key) => setOpen(o => ({ ...o, [key]: !o[key] }));

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
      persistFiles({ ...files, [folderKey]: [...(files[folderKey] ?? []), entry] });
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
    persistFiles({ ...files, [folderKey]: (files[folderKey] ?? []).filter((_, i) => i !== index) });
  };

  const handleMove = (fromKey, index, toKey) => {
    const file = (files[fromKey] ?? [])[index];
    if (!file) return;
    persistFiles({
      ...files,
      [fromKey]: (files[fromKey] ?? []).filter((_, i) => i !== index),
      [toKey]:   [...(files[toKey] ?? []), file],
    });
    setMoving(null);
  };

  const fmt = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.browser}>
      {FOLDERS.map(({ key, label }) => {
        const folderFiles = files[key] ?? [];
        const isOpen = open[key];
        return (
          <div key={key} className={styles.folder}>
            <button className={styles.folderHeader} onClick={() => toggleFolder(key)}>
              <span className={styles.folderLabel}>{label}</span>
              <div className={styles.folderRight}>
                <span className={styles.count}>{folderFiles.length}</span>
                {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
              </div>
            </button>

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
                              {FOLDERS.filter(t => t.key !== key).map(t => (
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
    </div>
  );
}
