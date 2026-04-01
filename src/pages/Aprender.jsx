import { useState, useEffect, useCallback } from 'react';
import { RiArrowLeftLine, RiAddLine, RiPencilLine } from 'react-icons/ri';
import {
  getLearningModels, createLearningModel, updateLearningModel, deleteLearningModel,
  getSubmodules, createSubmodule, updateSubmodule, deleteSubmodule,
  seedDefaultModels,
} from '../services/aprendizajeService.js';
import { RAMO_COLORS } from '../lib/ramoColors.js';
import ModelCard    from '../components/aprender/ModelCard.jsx';
import SubmoduleCard from '../components/aprender/SubmoduleCard.jsx';
import PromptViewer  from '../components/aprender/PromptViewer.jsx';
import PromptEditor  from '../components/aprender/PromptEditor.jsx';
import Modal         from '../components/shared/Modal.jsx';
import Button        from '../components/shared/Button.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import styles from './Aprender.module.css';

// ── Level 3 — Prompt view/edit ────────────────────────────────────────────────
function PromptLevel({ model, sub, onBack, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [current, setCurrent] = useState(sub);

  const handleSave = async (content) => {
    setSaving(true);
    try {
      const updated = await updateSubmodule(current.id, model.id, { prompt_content: content });
      setCurrent(updated);
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <button className={styles.back} onClick={onBack}>
        <RiArrowLeftLine /> {model.name} › {current.name}
      </button>

      <div className={styles.levelHeader}>
        <div>
          <h1 className="section-title">{current.name}</h1>
          <p className={styles.breadcrumb}>{model.name}</p>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <RiPencilLine /> Editar
          </Button>
        )}
      </div>

      {editing ? (
        <PromptEditor
          initialContent={current.prompt_content}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          loading={saving}
        />
      ) : (
        <PromptViewer content={current.prompt_content} />
      )}
    </div>
  );
}

// ── Level 2 — Submodules list ─────────────────────────────────────────────────
function SubmodulesLevel({ model, onBack, onSelectSub }) {
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null); // sub being edited
  const [form, setForm]       = useState({ name: '', order: 1 });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try   { setSubs(await getSubmodules(model.id)); }
    finally { setLoading(false); }
  }, [model.id]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', order: subs.length + 1 });
    setModal(true);
  };

  const openEdit = (sub) => {
    setEditing(sub);
    setForm({ name: sub.name, order: sub.order });
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await updateSubmodule(editing.id, model.id, form);
      } else {
        await createSubmodule({ ...form, model_id: model.id, prompt_content: '' });
      }
      await load();
      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteSubmodule(id, model.id);
    await load();
  };

  return (
    <div className="animate-fadeIn">
      <button className={styles.back} onClick={onBack}>
        <RiArrowLeftLine /> Métodos
      </button>

      <div className={styles.levelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className={styles.modelDot} style={{ background: model.color }} />
          <h1 className="section-title">{model.name}</h1>
        </div>
        <Button size="sm" onClick={openAdd}>
          <RiAddLine /> Sub-módulo
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <LoadingSpinner />
        </div>
      ) : (
        <div className={`cards-grid stagger`}>
          {subs.map(s => (
            <SubmoduleCard
              key={s.id}
              sub={s}
              modelColor={model.color}
              onClick={() => onSelectSub(s)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          {subs.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              Sin sub-módulos aún. Agrega el primero.
            </p>
          )}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar sub-módulo' : 'Nuevo sub-módulo'}>
        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Aprender, Pulir, Practicar…"
              autoFocus
            />
          </div>
          <div>
            <label>Orden</label>
            <input
              type="number"
              min="1"
              value={form.order}
              onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
              style={{ width: '80px' }}
            />
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

// ── Level 1 — Models list (root) ──────────────────────────────────────────────
function ModelsLevel({ onSelectModel }) {
  const [models,  setModels]  = useState([]);
  const [subCounts, setSubCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', description: '', color: RAMO_COLORS[0].hex });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let ms = await getLearningModels();
      if (ms.length === 0) {
        await seedDefaultModels();
        ms = await getLearningModels();
      }
      setModels(ms);
      const counts = {};
      await Promise.all(ms.map(async m => {
        const subs = await getSubmodules(m.id);
        counts[m.id] = subs.length;
      }));
      setSubCounts(counts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', color: RAMO_COLORS[0].hex });
    setModal(true);
  };

  const openEdit = (model) => {
    setEditing(model);
    setForm({ name: model.name, description: model.description ?? '', color: model.color });
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
    <div>
      <div className="section-header">
        <h1 className="section-title">Aprender</h1>
        <Button onClick={openAdd}>
          <RiAddLine /> Nuevo método
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="cards-grid stagger">
          {models.map(m => (
            <ModelCard
              key={m.id}
              model={m}
              subCount={subCounts[m.id] ?? 0}
              onClick={() => onSelectModel(m)}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar método' : 'Nuevo método'}>
        <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Feynman Technique…"
              autoFocus
            />
          </div>
          <div>
            <label>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Breve descripción del método…"
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
                    border: form.color === c.hex ? '2px solid #fff' : '2px solid transparent',
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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Aprender() {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedSub,   setSelectedSub]   = useState(null);

  const backToModels    = () => { setSelectedModel(null); setSelectedSub(null); };
  const backToSubmodules = () => setSelectedSub(null);

  return (
    <div className="page">
      <div className="page-content">
        {!selectedModel && (
          <ModelsLevel onSelectModel={setSelectedModel} />
        )}
        {selectedModel && !selectedSub && (
          <SubmodulesLevel
            model={selectedModel}
            onBack={backToModels}
            onSelectSub={setSelectedSub}
          />
        )}
        {selectedModel && selectedSub && (
          <PromptLevel
            model={selectedModel}
            sub={selectedSub}
            onBack={backToSubmodules}
            onSaved={() => {}}
          />
        )}
      </div>
    </div>
  );
}
