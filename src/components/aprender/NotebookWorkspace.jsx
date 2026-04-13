import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiSendPlaneLine,
  RiRobot2Line, RiUserLine, RiFileTextLine,
  RiArrowLeftLine, RiBook2Line, RiUploadLine,
  RiCheckLine, RiLightbulbLine,
} from 'react-icons/ri';
import { getLearningModels, getSubmodules } from '../../services/aprendizajeService.js';
import { useRamos } from '../../hooks/useRamos.js';
import styles from './NotebookWorkspace.module.css';

// ── Source types ──────────────────────────────────────────────────────────────
const SOURCE_TYPES = [
  { id: 'text',  label: 'Texto',      icon: RiFileTextLine },
  { id: 'file',  label: 'Archivo',    icon: RiUploadLine   },
  { id: 'ramo',  label: 'Desde ramo', icon: RiBook2Line    },
];

// ── Add source form ───────────────────────────────────────────────────────────
function AddSourceForm({ onAdd, onCancel, ramos }) {
  const [tab, setTab]     = useState('text');
  const [title, setTitle] = useState('');
  const [text, setText]   = useState('');
  const [ramoId, setRamoId] = useState(ramos[0]?.id ?? '');
  const fileRef = useRef(null);

  const handleText = () => {
    if (!text.trim()) return;
    onAdd({ title: title.trim() || 'Fuente sin título', content: text.trim() });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onAdd({ title: file.name, content: ev.target.result });
    };
    reader.readAsText(file);
  };

  const handleRamo = () => {
    const ramo = ramos.find(r => r.id === ramoId);
    if (!ramo) return;
    onAdd({
      title: `Ramo: ${ramo.name}`,
      content: `Ramo: ${ramo.name}\nColor: ${ramo.color}\n${ramo.description ? `Descripción: ${ramo.description}` : ''}`,
    });
  };

  return (
    <div className={styles.addForm}>
      <div className={styles.addFormTabs}>
        {SOURCE_TYPES.map(t => (
          <button
            key={t.id}
            className={[styles.addFormTab, tab === t.id ? styles.addFormTabActive : ''].join(' ')}
            onClick={() => setTab(t.id)}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      <div className={styles.addFormBody}>
        {tab === 'text' && (
          <>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título (ej: Clase 3 – Termodinámica)"
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Pega aquí tus apuntes, resúmenes o definiciones…"
              rows={5}
              autoFocus
            />
            <div className={styles.addFormActions}>
              <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleText} disabled={!text.trim()}>
                <RiCheckLine /> Guardar
              </button>
            </div>
          </>
        )}

        {tab === 'file' && (
          <>
            <p className={styles.fileHint}>Sube un archivo .txt — su contenido se usará como fuente.</p>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
              <RiUploadLine /> Seleccionar archivo
            </button>
            <div className={styles.addFormActions}>
              <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
            </div>
          </>
        )}

        {tab === 'ramo' && (
          <>
            {ramos.length === 0 ? (
              <p className={styles.fileHint}>No tienes ramos registrados.</p>
            ) : (
              <>
                <select value={ramoId} onChange={e => setRamoId(e.target.value)}>
                  {ramos.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <div className={styles.addFormActions}>
                  <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
                  <button className={styles.saveBtn} onClick={handleRamo} disabled={!ramoId}>
                    <RiCheckLine /> Agregar
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sources section ───────────────────────────────────────────────────────────
function SourcesSection({ sources, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const { ramos } = useRamos();

  return (
    <div className={styles.sourcesSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>Fuentes</span>
        <button className={styles.addBtn} onClick={() => setAdding(v => !v)}>
          <RiAddLine /> Agregar
        </button>
      </div>

      <div className={styles.sourceList}>
        {adding && (
          <AddSourceForm
            ramos={ramos}
            onAdd={(src) => { onAdd(src); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}

        {sources.length === 0 && !adding && (
          <p className={styles.emptyHint}>
            Agrega fuentes para que la IA las use al responder.
          </p>
        )}

        {sources.map((s, i) => (
          <div key={i} className={styles.sourceCard}>
            <div className={styles.sourceCardRow}>
              <RiFileTextLine className={styles.sourceIcon} />
              <span className={styles.sourceTitle}>{s.title}</span>
              <button
                className={styles.deleteBtn}
                onClick={() => onDelete(i)}
                title="Eliminar fuente"
              >
                <RiDeleteBinLine />
              </button>
            </div>
            <p className={styles.sourcePreview}>
              {s.content.slice(0, 100)}{s.content.length > 100 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Model selector ────────────────────────────────────────────────────────────
function ModelSelector({ selectedModelId, selectedSubId, onSelect }) {
  const [models, setModels]     = useState([]);
  const [subs, setSubs]         = useState({});
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const ms = await getLearningModels();
      setModels(ms.filter(m => !m.name.toLowerCase().includes('notebook')));
      const subsMap = {};
      await Promise.all(ms.map(async m => {
        if (!m.name.toLowerCase().includes('notebook')) {
          subsMap[m.id] = await getSubmodules(m.id);
        }
      }));
      setSubs(subsMap);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className={styles.modelSection}>
      <div className={styles.sectionHeader}>
        <RiLightbulbLine className={styles.sectionIcon} />
        <span className={styles.sectionLabel}>Modo de aprendizaje</span>
      </div>

      <div className={styles.modelList}>
        {models.length === 0 && (
          <p className={styles.emptyHint}>Sin métodos de aprendizaje.</p>
        )}
        {models.map(m => (
          <div key={m.id} className={styles.modelItem}>
            <button
              className={[styles.modelBtn, expanded === m.id ? styles.modelBtnOpen : ''].join(' ')}
              onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            >
              <span className={styles.modelDot} style={{ background: m.color }} />
              <span className={styles.modelName}>{m.name}</span>
            </button>
            {expanded === m.id && (subs[m.id] ?? []).map(sub => (
              <button
                key={sub.id}
                className={[styles.subBtn, selectedSubId === sub.id ? styles.subBtnActive : ''].join(' ')}
                onClick={() => onSelect(m, sub)}
              >
                {selectedSubId === sub.id && <RiCheckLine className={styles.subCheck} />}
                {sub.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat message ──────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.message} ${isUser ? styles.userMsg : styles.aiMsg}`}>
      <div className={styles.msgBubble}>
        <p className={styles.msgText}>{msg.content}</p>
      </div>
    </div>
  );
}

// ── Main workspace ────────────────────────────────────────────────────────────
export default function NotebookWorkspace({ notebook, onBack }) {
  const storageKey = `notebook_${notebook.id}`;

  const [sources, setSources]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_sources`) ?? '[]'); }
    catch { return []; }
  });
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_chat`) ?? '[]'); }
    catch { return []; }
  });
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [selModel, setSelModel] = useState(null);
  const [selSub, setSelSub]     = useState(null);
  const bottomRef               = useRef(null);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_sources`, JSON.stringify(sources));
  }, [sources, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_chat`, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);

  const addSource    = (src) => setSources(prev => [...prev, src]);
  const deleteSource = (i)   => setSources(prev => prev.filter((_, idx) => idx !== i));

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg     = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/notebook-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources,
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          learningContext: selSub ? `Método: ${selModel?.name} — ${selSub.name}\n${selSub.prompt_content}` : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error del servidor');
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-content">
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={onBack}>
            <RiArrowLeftLine /> Cuadernos
          </button>
          <h2 className={styles.notebookTitle}>{notebook.title}</h2>
        </div>

        <div className={styles.workspace}>
          {/* Left panel: sources (top) + model selector (bottom) */}
          <div className={styles.leftPanel}>
            <SourcesSection
              sources={sources}
              onAdd={addSource}
              onDelete={deleteSource}
            />
            <ModelSelector
              selectedModelId={selModel?.id}
              selectedSubId={selSub?.id}
              onSelect={(m, sub) => { setSelModel(m); setSelSub(sub); }}
            />
          </div>

          {/* Right panel: chat */}
          <div className={styles.chatPanel}>
            <div className={styles.chatMessages}>
              {messages.length === 0 && (
                <div className={styles.chatEmpty}>
                  <RiRobot2Line className={styles.chatEmptyIcon} />
                  <p>
                    Agrega fuentes y haz una pregunta.<br />
                    {selSub
                      ? <span>Modo: <strong>{selModel?.name} › {selSub.name}</strong></span>
                      : 'Selecciona un modo de aprendizaje (opcional).'
                    }
                  </p>
                </div>
              )}
              {messages.map((msg, i) => <Message key={i} msg={msg} />)}
              {loading && (
                <div className={`${styles.message} ${styles.aiMsg}`}>
                  <div className={styles.thinking}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              )}
              {error && <p className={styles.chatError}>{error}</p>}
              <div ref={bottomRef} />
            </div>

            <div className={styles.inputRow}>
              <textarea
                className={styles.chatInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Pregunta algo… (Enter para enviar, Shift+Enter para nueva línea)"
                rows={2}
                disabled={loading}
              />
              <button
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{ '--model-color': selModel?.color ?? 'var(--accent)' }}
              >
                <RiSendPlaneLine />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
