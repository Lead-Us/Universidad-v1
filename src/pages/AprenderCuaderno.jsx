import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiAddLine, RiMoreLine,
  RiEditLine, RiDeleteBinLine, RiCloseLine,
  RiCheckLine, RiBookOpenLine, RiGridLine,
} from 'react-icons/ri';
import {
  getCuadernos, getBloques, createBloque, updateBloque, deleteBloque,
} from '../services/aprendizajeService.js';
import styles from './AprenderCuaderno.module.css';

const MAX_BLOQUES = 21;

// ── Block context menu ─────────────────────────────────────────
function BlockMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setConfirm(false); return; }
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div className={styles.menuWrap} ref={ref} onClick={e => e.stopPropagation()}>
      <button
        className={styles.menuBtn}
        onClick={() => setOpen(v => !v)}
        aria-label="Opciones del bloque"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <RiMoreLine />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {confirm ? (
            <div className={styles.menuConfirm}>
              <p className={styles.menuConfirmText}>¿Eliminar este bloque?</p>
              <button
                className={styles.menuDanger}
                role="menuitem"
                onClick={() => { onDelete(); setOpen(false); }}
              >
                <RiDeleteBinLine /> Eliminar
              </button>
              <button
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setConfirm(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <>
              <button className={styles.menuItem} role="menuitem" onClick={() => { onEdit(); setOpen(false); }}>
                <RiEditLine /> Renombrar
              </button>
              <button className={styles.menuDanger} role="menuitem" onClick={() => setConfirm(true)}>
                <RiDeleteBinLine /> Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Block card ─────────────────────────────────────────────────
function BlockCard({ block, color, onOpen, onEdit, onDelete }) {
  return (
    <article
      className={styles.blockCard}
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      role="button"
      aria-label={`Abrir bloque ${block.title}`}
    >
      <div className={styles.blockNum} style={{ color, borderColor: `${color}44`, background: `${color}12` }}>
        {String(block.order).padStart(2, '0')}
      </div>
      <div className={styles.blockInfo}>
        <h3 className={styles.blockTitle}>{block.title}</h3>
      </div>
      <BlockMenu onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}

// ── Inline rename form ─────────────────────────────────────────
function RenameModal({ block, onSave, onClose }) {
  const [title, setTitle] = useState(block.title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave(title.trim()); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="rename-title">
        <div className={styles.modalHead}>
          <h2 id="rename-title" className={styles.modalTitle}>Renombrar bloque</h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">
            <RiCloseLine />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <input
            ref={inputRef}
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Nombre del bloque"
          />
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !title.trim()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create block modal ─────────────────────────────────────────
function CreateModal({ nextOrder, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Escribe un nombre.'); return; }
    setSaving(true);
    try { await onSave(title.trim()); onClose(); }
    catch (err) { setError(err.message || 'Error al crear.'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div className={styles.modalHead}>
          <h2 id="create-title" className={styles.modalTitle}>Nuevo bloque</h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">
            <RiCloseLine />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="bloque-name">Nombre del bloque</label>
            <input
              id="bloque-name"
              ref={inputRef}
              className={styles.input}
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder={`ej. Bloque ${String(nextOrder).padStart(2, '0')} — Introducción`}
              maxLength={80}
            />
          </div>
          {error && <p className={styles.formError} role="alert">{error}</p>}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Creando…' : 'Crear bloque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function AprenderCuaderno() {
  const { notebookId } = useParams();
  const navigate = useNavigate();

  const [notebook,  setNotebook]  = useState(null);
  const [blocks,    setBlocks]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [renaming,  setRenaming]  = useState(null); // block being renamed

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nbs, blks] = await Promise.all([getCuadernos(), getBloques(notebookId)]);
      setNotebook(nbs.find(n => n.id === notebookId) ?? null);
      setBlocks(blks);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [notebookId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (title) => {
    const order = blocks.length + 1;
    await createBloque({ notebookId, title, order });
    await load();
  };

  const handleRename = async (block, title) => {
    await updateBloque(block.id, { title });
    setRenaming(null);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteBloque(id);
    await load();
  };

  const color = notebook?.color ?? '#4f7cf6';

  if (loading) {
    return (
      <div className="page">
        <div className={styles.inner}>
          <div className={styles.loadingGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonBlock} aria-hidden />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="page">
        <div className={styles.inner}>
          <button className={styles.backBtn} onClick={() => navigate('/aprender')}>
            <RiArrowLeftLine /> Volver
          </button>
          <p style={{ color: 'var(--color-danger)' }}>Cuaderno no encontrado.</p>
        </div>
      </div>
    );
  }

  const atMax = blocks.length >= MAX_BLOQUES;

  return (
    <div className="page">
      <div className={styles.inner}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/aprender')}
            aria-label="Volver a mis cuadernos"
          >
            <RiArrowLeftLine />
            <span>Mis cuadernos</span>
          </button>
        </div>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.nbIcon} style={{ background: `linear-gradient(135deg, ${color}ee, ${color}88)` }}>
              <RiBookOpenLine />
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ '--nb-color': color }}>{notebook.name}</h1>
              {notebook.description && (
                <p className={styles.pageSub}>{notebook.description}</p>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.countPill} style={{ color, borderColor: `${color}44`, background: `${color}12` }}>
              <RiGridLine /> {blocks.length} / {MAX_BLOQUES}
            </span>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowCreate(true)}
              disabled={atMax}
              title={atMax ? `Máximo ${MAX_BLOQUES} bloques alcanzado` : 'Crear nuevo bloque'}
            >
              <RiAddLine /> Nuevo bloque
            </button>
          </div>
        </div>

        {/* ── Blocks ── */}
        {blocks.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} style={{ background: `${color}18`, color }}>
              <RiGridLine />
            </div>
            <h2 className={styles.emptyTitle}>Sin bloques aún</h2>
            <p className={styles.emptyText}>
              Los bloques son subcuadernos temáticos. Crea el primero para empezar a añadir fuentes y chatear con IA.
            </p>
            <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
              <RiAddLine /> Crear primer bloque
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {blocks.map(block => (
              <BlockCard
                key={block.id}
                block={block}
                color={color}
                onOpen={() => navigate(`/aprender/${notebookId}/${block.id}`)}
                onEdit={() => setRenaming(block)}
                onDelete={() => handleDelete(block.id)}
              />
            ))}

            {/* Ghost add card */}
            {!atMax && (
              <button
                className={styles.addCard}
                onClick={() => setShowCreate(true)}
                aria-label="Añadir bloque"
              >
                <RiAddLine className={styles.addCardIcon} />
                <span>Nuevo bloque</span>
              </button>
            )}
          </div>
        )}

        {atMax && (
          <p className={styles.maxNote}>Has alcanzado el máximo de {MAX_BLOQUES} bloques por cuaderno.</p>
        )}
      </div>

      {showCreate && (
        <CreateModal
          nextOrder={blocks.length + 1}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
      {renaming && (
        <RenameModal
          block={renaming}
          onSave={(title) => handleRename(renaming, title)}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}
