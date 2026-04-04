import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine, RiAddLine, RiDeleteBinLine,
  RiSparkling2Line as RiSparklingLine,
  RiFileLine, RiLink as RiLinkLine, RiArticleLine as RiText2Line, RiFolderLine,
  RiArrowDownSLine as RiChevronDownLine, RiArrowUpSLine as RiChevronUpLine, RiSendPlane2Fill as RiSendPlanLine,
  RiRefreshLine, RiCheckLine, RiCloseLine,
} from 'react-icons/ri';
import {
  getLearningModels, getSubmodules,
  getBlocks, getSources, addSource, deleteSource, uploadSourceFile,
  getChatMessages, saveChatMessage, clearChatHistory,
} from '../services/aprendizajeService.js';
import { useRamos } from '../hooks/useRamos.js';
import Button from '../components/shared/Button.jsx';
import styles from './AprenderBlock.module.css';

const ACCEPTED_FILES = '.pdf,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.img';

// ── Source type icons ──────────────────────────────────────────
const SOURCE_ICONS = { text: RiText2Line, file: RiFileLine, url: RiLinkLine, platform: RiFolderLine };

function SourceItem({ source, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const Icon = SOURCE_ICONS[source.type] ?? RiFileLine;

  return (
    <div className={styles.sourceItem}>
      <Icon className={styles.sourceIcon} />
      <div className={styles.sourceInfo}>
        <span className={styles.sourceTitle}>{source.title || source.file_name || 'Fuente'}</span>
        {source.content && (
          <span className={styles.sourcePreview}>{source.content.slice(0, 60)}…</span>
        )}
      </div>
      <div className={styles.sourceActions}>
        {confirming ? (
          <>
            <button className={styles.confirmDelBtn} onClick={() => onDelete(source.id)}>
              <RiCheckLine />
            </button>
            <button className={styles.cancelDelBtn} onClick={() => setConfirming(false)}>
              <RiCloseLine />
            </button>
          </>
        ) : (
          <button className={styles.delBtn} onClick={() => setConfirming(true)}>
            <RiDeleteBinLine />
          </button>
        )}
      </div>
    </div>
  );
}

function CollapsiblePanel({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${styles.panel} ${open ? styles.panelOpen : styles.panelClosed}`}>
      <button className={styles.panelHeader} onClick={() => setOpen(v => !v)}>
        <div className={styles.panelHeaderLeft}>
          <Icon className={styles.panelIcon} />
          <span className={styles.panelTitle}>{title}</span>
          {badge != null && <span className={styles.panelBadge}>{badge}</span>}
        </div>
        {open ? <RiChevronUpLine className={styles.chevron} /> : <RiChevronDownLine className={styles.chevron} />}
      </button>
      {open && <div className={styles.panelBody}>{children}</div>}
    </div>
  );
}

// ── Add source form ────────────────────────────────────────────
function AddSourceForm({ blockId, onAdded, onClose }) {
  const [tab,     setTab]     = useState('text');
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [url,     setUrl]     = useState('');
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (tab === 'text') {
        if (!content.trim()) { setError('Escribe el texto.'); setSaving(false); return; }
        await addSource({ blockId, type: 'text', title: title || 'Texto', content });
      } else if (tab === 'url') {
        if (!url.trim()) { setError('Ingresa una URL.'); setSaving(false); return; }
        await addSource({ blockId, type: 'url', title: title || url, content: url });
      } else if (tab === 'file') {
        if (!file) { setError('Selecciona un archivo.'); setSaving(false); return; }
        const { publicUrl } = await uploadSourceFile(blockId, file);
        await addSource({ blockId, type: 'file', title: title || file.name, fileUrl: publicUrl, fileName: file.name });
      }
      onAdded();
    } catch (err) {
      setError(err.message || 'Error al agregar fuente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.addForm} onSubmit={handleSubmit}>
      {/* Tabs */}
      <div className={styles.addTabs}>
        {[
          { id: 'text', label: 'Texto', icon: RiText2Line },
          { id: 'file', label: 'Archivo', icon: RiFileLine },
          { id: 'url',  label: 'URL',     icon: RiLinkLine },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            className={`${styles.addTab} ${tab === t.id ? styles.addTabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      <input
        className={styles.addInput}
        placeholder="Título (opcional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      {tab === 'text' && (
        <textarea
          className={styles.addTextarea}
          placeholder="Pega tu texto, apuntes o contenido…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          required
        />
      )}
      {tab === 'url' && (
        <input
          className={styles.addInput}
          type="url"
          placeholder="https://…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
      )}
      {tab === 'file' && (
        <label className={styles.fileLabel}>
          <input
            type="file"
            accept={ACCEPTED_FILES}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            style={{ display: 'none' }}
          />
          <RiFileLine />
          {file ? file.name : 'Seleccionar archivo'}
        </label>
      )}

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Subiendo…' : 'Agregar'}
        </Button>
      </div>
    </form>
  );
}

// ── Chat panel ─────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`${styles.msg} ${isUser ? styles.msgUser : styles.msgAssistant}`}>
      {!isUser && (
        <div className={styles.aiAvatar}><RiSparklingLine /></div>
      )}
      <div className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        <div className={styles.msgContent}>{msg.content}</div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function AprenderBlock() {
  const { projectId, blockId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [project,       setProject]       = useState(null);
  const [block,         setBlock]         = useState(null);
  const [sources,       setSources]       = useState([]);
  const [methods,       setMethods]       = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [input,         setInput]         = useState('');
  const [generating,    setGenerating]    = useState(false);
  const [loadingData,   setLoadingData]   = useState(true);
  const [error,         setError]         = useState('');

  const { ramos } = useRamos();

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [models, blks, srcs, msgs, subs] = await Promise.all([
        getLearningModels(),
        getBlocks(projectId),
        getSources(blockId),
        getChatMessages(blockId),
        getSubmodules(projectId),
      ]);
      const proj = models.find(m => m.id === projectId);
      const blk  = blks.find(b => b.id === blockId);
      setProject(proj ?? null);
      setBlock(blk ?? null);
      setSources(srcs);
      setMessages(msgs);
      setMethods(subs);
      if (subs.length > 0 && !selectedMethod) setSelectedMethod(subs[0]);
    } finally {
      setLoadingData(false);
    }
  }, [projectId, blockId, selectedMethod]);

  useEffect(() => { loadData(); }, [blockId, projectId]); // eslint-disable-line

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSourceAdded = async () => {
    const srcs = await getSources(blockId);
    setSources(srcs);
    setShowAddSource(false);
  };

  const handleDeleteSource = async (id) => {
    await deleteSource(id);
    const srcs = await getSources(blockId);
    setSources(srcs);
  };

  const handleGenerate = async () => {
    if (sources.length === 0) {
      setError('Agrega al menos una fuente antes de generar.');
      return;
    }
    setError('');
    setGenerating(true);

    // Build user message
    const userText = input.trim() || 'Genera el material de estudio basado en las fuentes y el método seleccionado.';
    const userMsg  = { role: 'user', content: userText };

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { ...userMsg, id: tempId }]);
    setInput('');

    try {
      // Save user message
      const savedUser = await saveChatMessage({ blockId, role: 'user', content: userText });

      const res = await fetch('/api/aprender-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources:       sources.map(s => ({ title: s.title, content: s.content || s.file_url || '' })),
          methodPrompt:  selectedMethod?.prompt_content ?? '',
          messages:      messages.map(m => ({ role: m.role, content: m.content })).concat([userMsg]),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      const aiContent = data.reply ?? '';
      const savedAi = await saveChatMessage({ blockId, role: 'assistant', content: aiContent });

      // Replace temp message with saved ones + AI response
      setMessages(prev =>
        prev
          .filter(m => m.id !== tempId)
          .concat([savedUser, savedAi])
      );
    } catch (err) {
      setError(err.message || 'Error al generar. Intenta de nuevo.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setGenerating(false);
    }
  };

  const handleClearChat = async () => {
    await clearChatHistory(blockId);
    setMessages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  if (loadingData) {
    return (
      <div className="page">
        <div className="page-content">
          <div className={styles.loadingWrap}>
            <RiRefreshLine className={styles.loadingIcon} />
            <span>Cargando bloque…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!block || !project) {
    return (
      <div className="page">
        <div className="page-content">
          <button className={styles.back} onClick={() => navigate(`/aprender/${projectId}`)}>
            <RiArrowLeftLine /> Volver
          </button>
          <p style={{ color: 'var(--color-danger)' }}>Bloque no encontrado.</p>
        </div>
      </div>
    );
  }

  const canGenerate = sources.length > 0 && !generating;

  return (
    <div className={styles.blockPage}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate(`/aprender/${projectId}`)}>
          <RiArrowLeftLine />
          <span className={styles.backText}>{project.name}</span>
        </button>
        <div className={styles.blockMeta}>
          <span className={styles.blockNumber}>{String(block.order).padStart(2, '0')}</span>
          <h1 className={styles.blockTitle}>{block.title}</h1>
        </div>
        <button className={styles.clearBtn} onClick={handleClearChat} title="Limpiar chat">
          <RiRefreshLine /> Limpiar chat
        </button>
      </div>

      {/* ── 3-panel layout ── */}
      <div className={styles.layout}>
        {/* ── Left column ── */}
        <div className={styles.leftCol}>
          {/* Sources panel */}
          <CollapsiblePanel
            title="Fuentes"
            icon={RiFolderLine}
            badge={sources.length > 0 ? sources.length : null}
          >
            {sources.length === 0 && !showAddSource && (
              <p className={styles.emptyPanelText}>
                Agrega archivos, texto o URLs como base de conocimiento.
              </p>
            )}

            {sources.map(s => (
              <SourceItem key={s.id} source={s} onDelete={handleDeleteSource} />
            ))}

            {showAddSource ? (
              <AddSourceForm
                blockId={blockId}
                onAdded={handleSourceAdded}
                onClose={() => setShowAddSource(false)}
              />
            ) : (
              <button
                className={styles.addSourceBtn}
                onClick={() => setShowAddSource(true)}
              >
                <RiAddLine /> Agregar fuente
              </button>
            )}
          </CollapsiblePanel>

          {/* Method selector panel */}
          <CollapsiblePanel
            title="Método de estudio"
            icon={RiSparklingLine}
            defaultOpen={true}
          >
            {methods.length === 0 ? (
              <p className={styles.emptyPanelText}>
                No hay métodos en este proyecto.{' '}
                <button
                  className={styles.inlineLink}
                  onClick={() => navigate(`/aprender/${projectId}`)}
                >
                  Agregar método →
                </button>
              </p>
            ) : (
              <div className={styles.methodList}>
                {methods.map(m => (
                  <button
                    key={m.id}
                    className={`${styles.methodOption} ${selectedMethod?.id === m.id ? styles.methodSelected : ''}`}
                    onClick={() => setSelectedMethod(m)}
                    style={selectedMethod?.id === m.id ? { '--method-color': project.color } : undefined}
                  >
                    <span className={styles.methodName}>{m.name}</span>
                    {selectedMethod?.id === m.id && <RiCheckLine className={styles.methodCheck} />}
                  </button>
                ))}
              </div>
            )}
          </CollapsiblePanel>

          {/* Generate button */}
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={canGenerate ? { '--project-color': project.color } : undefined}
          >
            <RiSparklingLine />
            {generating ? 'Generando…' : 'Generar'}
          </button>

          {error && <p className={styles.leftError}>{error}</p>}
        </div>

        {/* ── Right column — Chat ── */}
        <div className={styles.rightCol}>
          <div className={styles.chatHeader}>
            <RiSparklingLine className={styles.chatHeaderIcon} />
            <span className={styles.chatHeaderTitle}>Respuesta IA</span>
            {selectedMethod && (
              <span className={styles.chatMethodBadge}>{selectedMethod.name}</span>
            )}
          </div>

          <div className={styles.chatMessages}>
            {messages.length === 0 && !generating && (
              <div className={styles.chatEmpty}>
                <RiSparklingLine className={styles.chatEmptyIcon} />
                <p>Agrega fuentes, selecciona un método y presiona <strong>Generar</strong> para empezar.</p>
              </div>
            )}

            {messages.map(msg => (
              <ChatMessage key={msg.id || msg.created_at} msg={msg} />
            ))}

            {generating && (
              <div className={`${styles.msg} ${styles.msgAssistant}`}>
                <div className={styles.aiAvatar}><RiSparklingLine /></div>
                <div className={`${styles.msgBubble} ${styles.bubbleAssistant}`}>
                  <div className={styles.typing}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className={styles.chatInputWrap}>
            <textarea
              className={styles.chatInput}
              placeholder="Escribe un mensaje o deja vacío para generar con el método…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={generating}
            />
            <button
              className={styles.sendBtn}
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={canGenerate ? { '--project-color': project.color } : undefined}
              aria-label="Enviar"
            >
              <RiSendPlanLine />
            </button>
          </div>

          <p className={styles.chatHint}>
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
