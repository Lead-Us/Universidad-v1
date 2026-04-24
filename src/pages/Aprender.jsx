import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiBookOpenLine, RiAddLine, RiMoreLine,
  RiEditLine, RiDeleteBinLine, RiCheckLine,
  RiCloseLine, RiSearchLine,
} from 'react-icons/ri';
import {
  getCuadernos, createCuaderno, updateCuaderno, deleteCuaderno, getBloquesCount,
} from '../services/aprendizajeService.js';
import { useRamos } from '../hooks/useRamos.js';
import styles from './Aprender.module.css';

const COLORS = [
  '#4f7cf6', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#db2777', '#65a30d',
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)        return 'Hace un momento';
  if (diff < 3600)      return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)     return `Hace ${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `Hace ${Math.floor(diff / 86400)} días`;
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

// ── Color picker ───────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className={styles.colorRow} role="group" aria-label="Color del cuaderno">
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          className={[styles.colorSwatch, value === c ? styles.colorActive : ''].join(' ')}
          style={{ background: c }}
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          aria-pressed={value === c}
        >
          {value === c && <RiCheckLine className={styles.colorCheck} />}
        </button>
      ))}
    </div>
  );
}

// ── Create / Edit modal ────────────────────────────────────────
function NotebookModal({ initial, ramos = [], onSave, onClose }) {
  const [name,   setName]   = useState(initial?.name ?? '');
  const [desc,   setDesc]   = useState(initial?.description ?? '');
  const [color,  setColor]  = useState(initial?.color ?? COLORS[0]);
  const [ramoId, setRamoId] = useState(initial?.ramo_id ?? '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError('');
    try {
      await onSave({ name: name.trim(), description: desc.trim(), color, ramoId: ramoId || null });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="nb-modal-title">
        <div className={styles.modalHead}>
          <h2 id="nb-modal-title" className={styles.modalTitle}>
            {initial ? 'Editar cuaderno' : 'Nuevo cuaderno'}
          </h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar">
            <RiCloseLine />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="nb-name">Nombre</label>
            <input
              id="nb-name" ref={inputRef}
              className={styles.input}
              placeholder="ej. Cálculo II, Redes, Historia…"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              maxLength={80}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="nb-desc">
              Descripción <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="nb-desc"
              className={[styles.input, styles.textarea].join(' ')}
              placeholder="¿De qué trata este cuaderno?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              maxLength={200}
            />
          </div>

          {ramos.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nb-ramo">
                Ramo <span className={styles.optional}>(opcional)</span>
              </label>
              <select
                id="nb-ramo"
                className={styles.input}
                value={ramoId}
                onChange={e => setRamoId(e.target.value)}
              >
                <option value="">Sin ramo</option>
                {ramos.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando…' : initial ? 'Guardar' : 'Crear cuaderno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Card context menu ──────────────────────────────────────────
function CardMenu({ onEdit, onDelete }) {
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
        aria-label="Más opciones"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <RiMoreLine />
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          {confirm ? (
            <div className={styles.menuConfirm}>
              <p className={styles.menuConfirmText}>¿Eliminar este cuaderno?</p>
              <button
                className={styles.menuDanger}
                role="menuitem"
                onClick={() => { onDelete(); setOpen(false); }}
              >
                <RiDeleteBinLine /> Confirmar
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

// ── Notebook card ──────────────────────────────────────────────
function NotebookCard({ nb, count, ramoName, onOpen, onEdit, onDelete }) {
  return (
    <article
      className={styles.card}
      onClick={onOpen}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      role="button"
      aria-label={`Abrir ${nb.name}`}
    >
      <div
        className={styles.cover}
        style={{ background: '#1a1a1a', borderBottom: `2px solid ${nb.color}` }}
      >
        <RiBookOpenLine className={styles.coverIcon} />
        <CardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className={styles.body}>
        <h3 className={styles.cardTitle}>{nb.name}</h3>
        {nb.description && <p className={styles.cardDesc}>{nb.description}</p>}
        <div className={styles.cardMeta}>
          <span>{timeAgo(nb.updated_at ?? nb.created_at)}</span>
          {ramoName && <span className={styles.ramoTag}>{ramoName}</span>}
          <span className={styles.blockPill}>
            {count === 1 ? '1 bloque' : `${count} bloques`}
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function Aprender() {
  const navigate = useNavigate();
  const { ramos } = useRamos();
  const [notebooks,   setNotebooks]   = useState([]);
  const [blockCounts, setBlockCounts] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showCreate,  setShowCreate]  = useState(false);
  const [editing,     setEditing]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nbs = await getCuadernos();
      setNotebooks(nbs);
      const counts = {};
      await Promise.all(nbs.map(async nb => {
        counts[nb.id] = await getBloquesCount(nb.id);
      }));
      setBlockCounts(counts);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => { await createCuaderno(data); await load(); };
  const handleEdit   = async (data) => { await updateCuaderno(editing.id, { ...data, ramo_id: data.ramoId ?? null }); setEditing(null); await load(); };
  const handleDelete = async (id)   => { await deleteCuaderno(id); await load(); };

  const filtered = notebooks.filter(nb =>
    `${nb.name} ${nb.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Mis cuadernos</h1>
            <p className={styles.pageSub}>Organiza tu estudio en cuadernos y bloques temáticos</p>
          </div>
          <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
            <RiAddLine /> Nuevo cuaderno
          </button>
        </div>

        {/* Search */}
        {notebooks.length > 4 && (
          <div className={styles.searchRow}>
            <RiSearchLine className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar cuadernos…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar cuadernos"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard} aria-hidden>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonBody}>
                  <div className={styles.skeletonLine} style={{ width: '55%' }} />
                  <div className={styles.skeletonLine} style={{ width: '75%', height: '11px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><RiBookOpenLine /></div>
            <h2 className={styles.emptyTitle}>
              {notebooks.length === 0 ? 'Ningún cuaderno aún' : `Sin resultados para "${search}"`}
            </h2>
            {notebooks.length === 0 && (
              <>
                <p className={styles.emptyText}>
                  Crea tu primer cuaderno y empieza a organizar tu estudio con IA.
                </p>
                <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
                  <RiAddLine /> Crear primer cuaderno
                </button>
              </>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(nb => (
              <NotebookCard
                key={nb.id}
                nb={nb}
                count={blockCounts[nb.id] ?? 0}
                ramoName={ramos.find(r => r.id === nb.ramo_id)?.name}
                onOpen={() => navigate(`/aprender/${nb.id}`)}
                onEdit={() => setEditing(nb)}
                onDelete={() => handleDelete(nb.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && <NotebookModal ramos={ramos} onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      {editing    && <NotebookModal ramos={ramos} initial={editing} onSave={handleEdit} onClose={() => setEditing(null)} />}
    </div>
  );
}
