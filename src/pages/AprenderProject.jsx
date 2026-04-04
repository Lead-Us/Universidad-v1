import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiAddLine, RiPencilLine, RiDeleteBinLine,
  RiCheckLine, RiCloseLine, RiBookOpenLine, RiSparkling2Line as RiSparklingLine,
} from 'react-icons/ri';
import {
  getLearningModels, getSubmodules, createSubmodule, updateSubmodule, deleteSubmodule,
  getBlocks, createBlock, updateBlock, deleteBlock,
} from '../services/aprendizajeService.js';
import Modal  from '../components/shared/Modal.jsx';
import Button from '../components/shared/Button.jsx';
import styles from './AprenderProject.module.css';

const MAX_BLOCKS = 21;

function BlockCard({ block, projectColor, onEdit, onDelete, onClick }) {
  const [confirming, setConfirming] = useState(false);

  const stopProp = fn => e => { e.stopPropagation(); fn(e); };

  return (
    <div
      className={styles.blockCard}
      style={{ '--project-color': projectColor }}
      onClick={() => !confirming && onClick(block)}
    >
      <div className={styles.blockTop}>
        <span className={styles.blockNumber}>
          {String(block.order).padStart(2, '0')}
        </span>
        <div className={styles.blockActions} onClick={e => e.stopPropagation()}>
          {confirming ? (
            <>
              <span className={styles.confirmLabel}>¿Eliminar?</span>
              <button className={styles.confirmBtn} onClick={stopProp(() => onDelete(block.id))}><RiCheckLine /></button>
              <button className={styles.cancelBtn}  onClick={stopProp(() => setConfirming(false))}><RiCloseLine /></button>
            </>
          ) : (
            <>
              <button className={styles.actionBtn} onClick={stopProp(() => onEdit(block))} title="Renombrar"><RiPencilLine /></button>
              <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={stopProp(() => setConfirming(true))} title="Eliminar"><RiDeleteBinLine /></button>
            </>
          )}
        </div>
      </div>
      <h4 className={styles.blockTitle}>{block.title}</h4>
      <div className={styles.blockFooter}>
        <RiSparklingLine className={styles.aiIcon} />
        <span>Abrir bloque</span>
      </div>
    </div>
  );
}

function AddBlockCard({ onClick, disabled }) {
  return (
    <button
      className={styles.addCard}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Límite de 21 bloques alcanzado' : 'Agregar bloque'}
    >
      <RiAddLine className={styles.addIcon} />
      <span>{disabled ? 'Límite alcanzado' : 'Agregar bloque'}</span>
    </button>
  );
}

export default function AprenderProject() {
  const { projectId } = useParams();
  const navigate      = useNavigate();

  const [project,  setProject]  = useState(null);
  const [blocks,   setBlocks]   = useState([]);
  const [methods,  setMethods]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Block modal state
  const [blockModal,  setBlockModal]  = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockTitle,  setBlockTitle]  = useState('');
  const [savingBlock, setSavingBlock] = useState(false);

  // Method modal state
  const [methodModal,  setMethodModal]  = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [methodForm,   setMethodForm]   = useState({ name: '', order: 1, prompt_content: '' });
  const [savingMethod, setSavingMethod] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const models = await getLearningModels();
      const found  = models.find(m => m.id === projectId);
      setProject(found ?? null);
      const [blks, subs] = await Promise.all([
        getBlocks(projectId),
        getSubmodules(projectId),
      ]);
      setBlocks(blks);
      setMethods(subs);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Block handlers ──────────────────────────────────────────
  const openAddBlock = () => {
    setEditingBlock(null);
    setBlockTitle('');
    setBlockModal(true);
  };

  const openEditBlock = (block) => {
    setEditingBlock(block);
    setBlockTitle(block.title);
    setBlockModal(true);
  };

  const handleSaveBlock = async () => {
    if (!blockTitle.trim()) return;
    setSavingBlock(true);
    try {
      if (editingBlock) {
        await updateBlock(editingBlock.id, { title: blockTitle.trim() });
      } else {
        await createBlock({ projectId, title: blockTitle.trim(), order: blocks.length + 1 });
      }
      await load();
      setBlockModal(false);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (id) => {
    await deleteBlock(id);
    await load();
  };

  // ── Method handlers ─────────────────────────────────────────
  const openAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({ name: '', order: methods.length + 1, prompt_content: '' });
    setMethodModal(true);
  };

  const openEditMethod = (m) => {
    setEditingMethod(m);
    setMethodForm({ name: m.name, order: m.order, prompt_content: m.prompt_content ?? '' });
    setMethodModal(true);
  };

  const handleSaveMethod = async () => {
    setSavingMethod(true);
    try {
      if (editingMethod) {
        await updateSubmodule(editingMethod.id, projectId, methodForm);
      } else {
        await createSubmodule({ ...methodForm, model_id: projectId });
      }
      await load();
      setMethodModal(false);
    } finally {
      setSavingMethod(false);
    }
  };

  const handleDeleteMethod = async (id) => {
    await deleteSubmodule(id, projectId);
    await load();
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-content">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonGrid}>
            {[1,2,3,4].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page">
        <div className="page-content">
          <button className={styles.back} onClick={() => navigate('/aprender')}>
            <RiArrowLeftLine /> Aprender
          </button>
          <p style={{ color: 'var(--color-danger)' }}>Proyecto no encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* Back */}
        <button className={styles.back} onClick={() => navigate('/aprender')}>
          <RiArrowLeftLine /> Aprender
        </button>

        {/* Project header */}
        <div className={styles.projectHeader} style={{ borderLeftColor: project.color }}>
          <div className={styles.projectDot} style={{ background: project.color }} />
          <div>
            <h1 className="section-title" style={{ margin: 0 }}>{project.name}</h1>
            {project.description && (
              <p className={styles.projectDesc}>{project.description}</p>
            )}
          </div>
        </div>

        {/* ── Bloques de aprendizaje ── */}
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Bloques de aprendizaje</h2>
            <p className={styles.sectionSub}>{blocks.length} / {MAX_BLOCKS} bloques</p>
          </div>
        </div>

        <div className={styles.blocksGrid}>
          {blocks.map(b => (
            <BlockCard
              key={b.id}
              block={b}
              projectColor={project.color}
              onEdit={openEditBlock}
              onDelete={handleDeleteBlock}
              onClick={() => navigate(`/aprender/${projectId}/${b.id}`)}
            />
          ))}
          <AddBlockCard
            onClick={openAddBlock}
            disabled={blocks.length >= MAX_BLOCKS}
          />
        </div>

        {/* ── Métodos (submodules) ── */}
        <div className={styles.divider} />

        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Métodos de estudio</h2>
            <p className={styles.sectionSub}>Prompts de aprendizaje disponibles en este proyecto</p>
          </div>
          <Button size="sm" onClick={openAddMethod}>
            <RiAddLine /> Nuevo método
          </Button>
        </div>

        {methods.length === 0 ? (
          <p className={styles.noMethods}>
            Sin métodos aún. Agrega prompts de estudio para usarlos dentro de cada bloque.
          </p>
        ) : (
          <div className={styles.methodsGrid}>
            {methods.map(m => (
              <div key={m.id} className={styles.methodCard} style={{ borderTopColor: project.color }}>
                <div className={styles.methodTop}>
                  <span className={styles.methodOrder}>{String(m.order).padStart(2, '0')}</span>
                  <div className={styles.methodActions}>
                    <button className={styles.methodBtn} onClick={() => openEditMethod(m)}><RiPencilLine /></button>
                    <button className={`${styles.methodBtn} ${styles.methodDelete}`} onClick={() => handleDeleteMethod(m.id)}><RiDeleteBinLine /></button>
                  </div>
                </div>
                <h4 className={styles.methodName}>{m.name}</h4>
                {m.prompt_content && (
                  <p className={styles.methodPreview}>
                    {m.prompt_content.slice(0, 100)}{m.prompt_content.length > 100 ? '…' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block modal */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title={editingBlock ? 'Renombrar bloque' : 'Nuevo bloque'}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>
            Título del bloque
          </label>
          <input
            value={blockTitle}
            onChange={e => setBlockTitle(e.target.value)}
            placeholder="Ej: Clase 1 — Introducción"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSaveBlock()}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={() => setBlockModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveBlock} disabled={savingBlock || !blockTitle.trim()}>
            {savingBlock ? 'Guardando…' : editingBlock ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </Modal>

      {/* Method modal */}
      <Modal open={methodModal} onClose={() => setMethodModal(false)} title={editingMethod ? 'Editar método' : 'Nuevo método'}>
        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <label>Nombre del método</label>
            <input
              value={methodForm.name}
              onChange={e => setMethodForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Feynman, Pomodoro…"
              autoFocus
            />
          </div>
          <div>
            <label>Orden</label>
            <input
              type="number" min="1"
              value={methodForm.order}
              onChange={e => setMethodForm(f => ({ ...f, order: Number(e.target.value) }))}
              style={{ width: '80px' }}
            />
          </div>
          <div>
            <label>Prompt de instrucción</label>
            <textarea
              value={methodForm.prompt_content}
              onChange={e => setMethodForm(f => ({ ...f, prompt_content: e.target.value }))}
              placeholder="Eres un tutor que explica los conceptos usando el método Feynman…"
              style={{ minHeight: '120px' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
          <Button variant="ghost" onClick={() => setMethodModal(false)}>Cancelar</Button>
          <Button onClick={handleSaveMethod} disabled={savingMethod || !methodForm.name}>
            {savingMethod ? 'Guardando…' : editingMethod ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
