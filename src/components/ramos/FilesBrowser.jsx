import { useState } from 'react';
import { RiArrowDownSLine, RiArrowUpSLine, RiUploadLine, RiDownloadLine, RiFileTextLine, RiDeleteBinLine } from 'react-icons/ri';
import styles from './FilesBrowser.module.css';

const FOLDERS = [
  { key: 'evaluaciones_pasadas', label: '📄 Evaluaciones Pasadas' },
  { key: 'ejercicios',           label: '✏️ Ejercicios'           },
  { key: 'ppt',                  label: '📊 PPT'                  },
];

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB

export default function FilesBrowser({ unitId }) {
  const storageKey = `uni_files_${unitId}`;

  const [open,  setOpen]  = useState({});
  const [files, setFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}'); }
    catch { return {}; }
  });

  const persistFiles = (updated) => {
    setFiles(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      alert('No se pudo guardar: el archivo es demasiado grande para el almacenamiento local.');
    }
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
      const entry = {
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        data: reader.result,
      };
      const updated = {
        ...files,
        [folderKey]: [...(files[folderKey] ?? []), entry],
      };
      persistFiles(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (file) => {
    const a = document.createElement('a');
    a.href = file.data ?? '#';
    a.download = file.name;
    a.click();
  };

  const handleDelete = (folderKey, index) => {
    const updated = {
      ...files,
      [folderKey]: (files[folderKey] ?? []).filter((_, i) => i !== index),
    };
    persistFiles(updated);
  };

  const fmt = (bytes) => {
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
            <button
              className={styles.folderHeader}
              onClick={() => toggleFolder(key)}
            >
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
                    {folderFiles.map((f, i) => (
                      <li key={i} className={styles.fileItem}>
                        <RiFileTextLine className={styles.fileIcon} />
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileSize}>{fmt(f.size)}</span>
                        <button
                          className={styles.dlBtn}
                          onClick={() => handleDownload(f)}
                          title="Descargar"
                        >
                          <RiDownloadLine />
                        </button>
                        <button
                          className={`${styles.dlBtn} ${styles.delBtn}`}
                          onClick={() => handleDelete(key, i)}
                          title="Eliminar"
                        >
                          <RiDeleteBinLine />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className={styles.uploadBtn}>
                  <RiUploadLine />
                  <span>Subir archivo</span>
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => handleUpload(key, e)}
                  />
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
