import { useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiBookOpenLine, RiArrowRightSLine } from 'react-icons/ri';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/shared/Button.jsx';
import NotebookWorkspace from '../components/aprender/NotebookWorkspace.jsx';
import styles from './Notebook.module.css';

const STORAGE_KEY = 'uni_notebooks_v1';

function getNotebooks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveNotebooks(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Notebook() {
  const [notebooks, setNotebooks] = useState(getNotebooks);
  const [open, setOpen]           = useState(null);
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const createNotebook = () => {
    if (!newTitle.trim()) return;
    const nb = {
      id: uuidv4(),
      title: newTitle.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...notebooks, nb];
    setNotebooks(updated);
    saveNotebooks(updated);
    setNewTitle('');
    setAdding(false);
    setOpen(nb);
  };

  const deleteNotebook = (id) => {
    const updated = notebooks.filter(n => n.id !== id);
    setNotebooks(updated);
    saveNotebooks(updated);
    localStorage.removeItem(`notebook_${id}_sources`);
    localStorage.removeItem(`notebook_${id}_chat`);
    setConfirmDel(null);
  };

  if (open) {
    return (
      <NotebookWorkspace
        notebook={open}
        onBack={() => setOpen(null)}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        <div className="section-header">
          <h1 className="section-title">Notebook</h1>
          <Button onClick={() => setAdding(true)}>
            <RiAddLine /> Nuevo cuaderno
          </Button>
        </div>

        {adding && (
          <div className={styles.addForm}>
            <input
              autoFocus
              placeholder="Nombre del cuaderno…"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createNotebook();
                if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
              }}
            />
            <Button onClick={createNotebook} disabled={!newTitle.trim()}>Crear</Button>
            <Button variant="ghost" onClick={() => { setAdding(false); setNewTitle(''); }}>Cancelar</Button>
          </div>
        )}

        {notebooks.length === 0 && !adding ? (
          <div className={styles.empty}>
            <RiBookOpenLine className={styles.emptyIcon} />
            <p>No tienes cuadernos aún.</p>
            <Button size="sm" onClick={() => setAdding(true)}>
              <RiAddLine /> Crear cuaderno
            </Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {notebooks.map(nb => (
              <div key={nb.id} className={styles.card} onClick={() => setOpen(nb)}>
                <div className={styles.cardIconWrap}>
                  <RiBookOpenLine className={styles.cardIcon} />
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{nb.title}</h3>
                  <span className={styles.cardDate}>
                    {new Date(nb.createdAt).toLocaleDateString('es-CL', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
                {confirmDel === nb.id ? (
                  <div className={styles.delConfirm} onClick={e => e.stopPropagation()}>
                    <button className={styles.delConfirmBtn} onClick={() => deleteNotebook(nb.id)}>Eliminar</button>
                    <button className={styles.delCancelBtn} onClick={() => setConfirmDel(null)}>✕</button>
                  </div>
                ) : (
                  <>
                    <button
                      className={styles.deleteBtn}
                      onClick={e => { e.stopPropagation(); setConfirmDel(nb.id); }}
                      title="Eliminar cuaderno"
                    >
                      <RiDeleteBinLine />
                    </button>
                    <RiArrowRightSLine className={styles.cardArrow} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
