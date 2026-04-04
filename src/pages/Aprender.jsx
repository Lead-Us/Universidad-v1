import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiCheckLine, RiCloseLine, RiArchive2Line as RiBoxLine } from 'react-icons/ri';
import {
  getLearningModels, createLearningModel, updateLearningModel, deleteLearningModel,
  getBlocks,
} from '../services/aprendizajeService.js';
import { RAMO_COLORS } from '../lib/ramoColors.js';
import Modal  from '../components/shared/Modal.jsx';
import Button from '../components/shared/Button.jsx';
import styles from './Aprender.module.css';

function ProjectCard({ project, blockCount, onEdit, onDelete, onClick }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e) => { e.stopPropagation(); setConfirming(true); }
  const handleConfirm = (e) => { e.stopPropagation(); onDelete(project.id); }
  const handleCancel  = (e) => { e.stopPropagation(); setConfirming(false); }

  return (
    <div
      className={styles.projectCard}
      style={{ background: project.color }}
      onClick={() => !confirming && onClick(project)}
    >
      {/* Specular highlight */}
      <div className={styles.specular} />

      <div className={styles.cardTop}>
        <span className={styles.blockCount}>
          <RiBoxLine style={{ marginRight: 4 }} />
          {blockCount} / 21 bloques
        </span>
        <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
          {confirming ? (
            <>
              <span className={styles.confirmLabel}>¿Eliminar?</span>
              <button className={styles.confirmBtn} onClick={handleConfirm}><RiCheckLine /></button>
              <button className={styles.editBtn}    onClick={handleCancel}><RiCloseLine /></button>
            </>
          ) : (
            <>
              <button className={styles.editBtn}   onClick={e => { e.stopPropagation(); onEdit(project); }}><RiPencilLine /></button>
              <button className={styles.deleteBtn} onClick={handleDelete}><RiDeleteBinLine /></button>
            </>
          )}
        </div>
      </div>

      <h3 className={styles.cardName}>{project.name}</h3>
      {project.description && (
        <p className={styles.cardDesc}>{project.description}</p>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min((blockCount / 21) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Aprender() {
  const navigate = useNavigate();

  const [projects,   setProjects]   = useState([]);
  const [blockCounts, setBlockCounts] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState({ name: '', description: '', color: RAMO_COLORS[0].hex });
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const models = await getLearningModels();
      setProjects(models);
      // Load block counts in parallel
      const counts = {};
      await Promise.all(models.map(async m => {
        const blocks = await getBlocks(m.id);
        counts[m.id] = blocks.length;
      }));
      setBlockCounts(counts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', color: RAMO_COLORS[0].hex });
    setModal(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({ name: project.name, description: project.description ?? '', color: project.color });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateLearningModel(editing.id, form);
      else         await createLearningModel(form);
      await load();
      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteLearningModel(id);
    await load();
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className="section-header">
          <h1 className="section-title">Aprender</h1>
          <Button onClick={openCreate}>
            <RiAddLine /> Nuevo proyecto
          </Button>
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><RiBoxLine /></div>
            <h3 className={styles.emptyTitle}>Sin proyectos de aprendizaje</h3>
            <p className={styles.emptyText}>
              Crea tu primer proyecto para empezar a estudiar con IA.
            </p>
            <Button onClick={openCreate}><RiAddLine /> Crear proyecto</Button>
          </div>
        ) : (
          <div className="cards-grid stagger">
            {projects.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                blockCount={blockCounts[p.id] ?? 0}
                onEdit={openEdit}
                onDelete={handleDelete}
                onClick={() => navigate(`/aprender/${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}>
        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <label>Nombre del proyecto</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Mi método de estudio…"
              autoFocus
            />
          </div>
          <div>
            <label>Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Para qué uso este proyecto…"
              style={{ minHeight: '72px' }}
            />
          </div>
          <div>
            <label>Color</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
              {RAMO_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c.hex }))}
                  style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: c.hex,
                    border: form.color === c.hex ? '3px solid #fff' : '2px solid transparent',
                    outline: form.color === c.hex ? `2px solid ${c.hex}` : 'none',
                    cursor: 'pointer',
                    transition: 'transform 150ms',
                    transform: form.color === c.hex ? 'scale(1.2)' : 'scale(1)',
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.name}>
            {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
