import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import {
  RiArrowLeftLine, RiAddLine, RiDeleteBinLine,
  RiSparkling2Line, RiSendPlane2Fill,
  RiFileLine, RiLinksLine, RiText, RiCloseLine,
  RiRefreshLine, RiCheckLine, RiUploadLine,
  RiGlobalLine, RiAttachment2,
} from 'react-icons/ri';
import {
  getCuadernos, getBloques,
  getFuentes, addFuente, deleteFuente, uploadFuente,
  getMensajes, addMensaje, clearMensajes,
} from '../services/aprendizajeService.js';
import styles from './AprenderBloque.module.css';

marked.setOptions({ breaks: true, gfm: true });

const ACCEPTED = '.pdf,.docx,.doc,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.img';

// ── Source type icon ───────────────────────────────────────────
function SourceIcon({ type }) {
  const map = { file: RiFileLine, url: RiLinksLine, text: RiText, platform: RiAttachment2 };
  const Icon = map[type] ?? RiFileLine;
  return <Icon />;
}

// ── Add Source modal ───────────────────────────────────────────
function AddSourceModal({ blockId, onAdded, onClose }) {
  const [tab,     setTab]     = useState('file');
  const [title,   setTitle]   = useState('');
  const [content, setContent] = useState('');
  const [url,     setUrl]     = useState('');
  const [file,    setFile]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [drag,    setDrag]    = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (tab === 'file') {
        if (!file) { setError('Selecciona un archivo.'); setSaving(false); return; }
        const { publicUrl } = await uploadFuente(blockId, file);
        await addFuente({ blockId, type: 'file', title: title || file.name, fileUrl: publicUrl, fileName: file.name });
      } else if (tab === 'url') {
        if (!url.trim()) { setError('Ingresa una URL válida.'); setSaving(false); return; }
        await addFuente({ blockId, type: 'url', title: title || url, content: url });
      } else {
        if (!content.trim()) { setError('Escribe el contenido.'); setSaving(false); return; }
        await addFuente({ blockId, type: 'text', title: title || 'Texto', content });
      }
      onAdded();
    } catch (err) {
      setError(err.message || 'Error al agregar fuente.');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'file', label: 'Archivo', icon: RiUploadLine },
    { id: 'url',  label: 'URL',    icon: RiLinksLine },
    { id: 'text', label: 'Texto',  icon: RiText },
  ];

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.addModal} role="dialog" aria-modal="true" aria-labelledby="add-source-title">
        <div className={styles.addModalHead}>
          <h2 id="add-source-title" className={styles.addModalTitle}>Agregar fuente</h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar"><RiCloseLine /></button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={[styles.tab, tab === t.id ? styles.tabActive : ''].join(' ')}
              onClick={() => { setTab(t.id); setError(''); }}
            >
              <t.icon /> {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className={styles.addForm}>
          {/* Title (optional) */}
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="src-title">
              Título <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="src-title"
              className={styles.formInput}
              placeholder="Nombre de la fuente"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* File tab */}
          {tab === 'file' && (
            <div
              className={[styles.dropZone, drag ? styles.dropZoneActive : '', file ? styles.dropZoneHasFile : ''].join(' ')}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Zona para soltar archivo"
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
                aria-hidden
              />
              {file ? (
                <>
                  <RiCheckLine className={styles.dropCheck} />
                  <p className={styles.dropFileName}>{file.name}</p>
                  <span className={styles.dropChange}>Cambiar archivo</span>
                </>
              ) : (
                <>
                  <RiUploadLine className={styles.dropIcon} />
                  <p className={styles.dropText}>Arrastra un archivo o haz clic</p>
                  <span className={styles.dropHint}>PDF, DOCX, PPT, TXT, PNG, JPG</span>
                </>
              )}
            </div>
          )}

          {/* URL tab */}
          {tab === 'url' && (
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="src-url">URL</label>
              <input
                id="src-url"
                type="url"
                className={styles.formInput}
                placeholder="https://…"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
          )}

          {/* Text tab */}
          {tab === 'text' && (
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="src-text">Contenido</label>
              <textarea
                id="src-text"
                className={[styles.formInput, styles.formTextarea].join(' ')}
                placeholder="Pega tus apuntes, resumen o cualquier texto relevante…"
                value={content}
                onChange={e => { setContent(e.target.value); setError(''); }}
                rows={6}
                autoFocus
              />
            </div>
          )}

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Subiendo…' : 'Agregar fuente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Source item ────────────────────────────────────────────────
function SourceItem({ source, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.sourceItem}>
      <div className={styles.sourceIcon}>
        <SourceIcon type={source.type} />
      </div>
      <div className={styles.sourceInfo}>
        <p className={styles.sourceName}>{source.title || source.file_name || 'Fuente'}</p>
        {source.content && source.type === 'text' && (
          <p className={styles.sourcePreview}>{source.content.slice(0, 80)}{source.content.length > 80 ? '…' : ''}</p>
        )}
        {source.type === 'url' && (
          <p className={styles.sourcePreview}>{source.content}</p>
        )}
      </div>
      <div className={styles.sourceActions}>
        {confirming ? (
          <div className={styles.sourceConfirm}>
            <button
              className={styles.confirmBtn}
              onClick={() => onDelete(source.id)}
              aria-label="Confirmar eliminación"
            >
              <RiCheckLine />
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setConfirming(false)}
              aria-label="Cancelar"
            >
              <RiCloseLine />
            </button>
          </div>
        ) : (
          <button
            className={styles.deleteBtn}
            onClick={() => setConfirming(true)}
            aria-label={`Eliminar fuente ${source.title}`}
          >
            <RiDeleteBinLine />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Chat message ───────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={[styles.msg, isUser ? styles.msgUser : styles.msgAI].join(' ')}>
      {!isUser && (
        <div className={styles.aiAvatar} aria-hidden>
          <RiSparkling2Line />
        </div>
      )}
      <div className={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI].join(' ')}>
        {isUser ? (
          <p className={styles.bubbleText}>{msg.content}</p>
        ) : (
          <div
            className={styles.bubbleMarkdown}
            dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
          />
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={[styles.msg, styles.msgAI].join(' ')}>
      <div className={styles.aiAvatar} aria-hidden><RiSparkling2Line /></div>
      <div className={[styles.bubble, styles.bubbleAI, styles.bubbleTyping].join(' ')} aria-label="Generando respuesta">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function AprenderBloque() {
  const { notebookId, blockId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [notebook,    setNotebook]    = useState(null);
  const [block,       setBlock]       = useState(null);
  const [fuentes,     setFuentes]     = useState([]);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showSources, setShowSources] = useState(true); // mobile toggle

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nbs, blks, srcs, msgs] = await Promise.all([
        getCuadernos(),
        getBloques(notebookId),
        getFuentes(blockId),
        getMensajes(blockId),
      ]);
      setNotebook(nbs.find(n => n.id === notebookId) ?? null);
      setBlock(blks.find(b => b.id === blockId) ?? null);
      setFuentes(srcs);
      setMessages(msgs);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }, [notebookId, blockId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  const handleSourceAdded = async () => {
    setShowAdd(false);
    const srcs = await getFuentes(blockId);
    setFuentes(srcs);
  };

  const handleDeleteSource = async (id) => {
    await deleteFuente(id);
    const srcs = await getFuentes(blockId);
    setFuentes(srcs);
  };

  const handleClearChat = async () => {
    await clearMensajes(blockId);
    setMessages([]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && fuentes.length === 0) return;
    if (generating) return;

    const userContent = text || 'Genera un resumen o explicación del material proporcionado.';
    const tempId = `tmp-${Date.now()}`;
    const optimisticMsg = { id: tempId, role: 'user', content: userContent };

    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');
    setGenerating(true);

    try {
      const savedUser = await addMensaje({ blockId, role: 'user', content: userContent });

      const res = await fetch('/api/aprender-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources:  fuentes.map(f => ({ title: f.title || f.file_name || '', content: f.content || f.file_url || '' })),
          messages: messages
            .map(m => ({ role: m.role, content: m.content }))
            .concat([{ role: 'user', content: userContent }]),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error del servidor');

      const savedAI = await addMensaje({ blockId, role: 'assistant', content: data.reply });
      setMessages(prev => prev.filter(m => m.id !== tempId).concat([savedUser, savedAI]));
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      const errMsg = { id: `err-${Date.now()}`, role: 'assistant', content: `❌ ${err.message || 'Error al generar respuesta. Intenta de nuevo.'}` };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setGenerating(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const color = notebook?.color ?? '#4f7cf6';

  if (loading) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.loadingState} aria-label="Cargando bloque">
          <RiSparkling2Line className={styles.loadingIcon} />
          <span>Cargando…</span>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className={styles.fullPage}>
        <div className={styles.errorState}>
          <button className={styles.backBtnInline} onClick={() => navigate(`/aprender/${notebookId}`)}>
            <RiArrowLeftLine /> Volver
          </button>
          <p style={{ color: 'var(--color-danger)' }}>Bloque no encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullPage}>

      {/* ── Top bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate(`/aprender/${notebookId}`)}
            aria-label={`Volver a ${notebook?.name ?? 'cuaderno'}`}
          >
            <RiArrowLeftLine />
            <span className={styles.backLabel}>{notebook?.name ?? 'Cuaderno'}</span>
          </button>
          <div className={styles.divider} aria-hidden />
          <span className={styles.blockName}>
            <span className={styles.blockNum} style={{ color, background: `${color}18` }}>
              {String(block.order).padStart(2, '0')}
            </span>
            {block.title}
          </span>
        </div>

        <div className={styles.topBarRight}>
          {/* Mobile: toggle sources panel */}
          <button
            className={[styles.iconBtnSm, showSources ? styles.iconBtnActive : ''].join(' ')}
            onClick={() => setShowSources(v => !v)}
            aria-label="Mostrar/ocultar fuentes"
            aria-pressed={showSources}
            title="Fuentes"
          >
            <RiAttachment2 />
            {fuentes.length > 0 && <span className={styles.badge}>{fuentes.length}</span>}
          </button>

          <button
            className={styles.iconBtnSm}
            onClick={handleClearChat}
            aria-label="Limpiar conversación"
            title="Limpiar chat"
            disabled={messages.length === 0}
          >
            <RiRefreshLine />
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className={styles.layout}>

        {/* ── Left: Sources panel ── */}
        <aside className={[styles.sourcesPanel, showSources ? styles.sourcesPanelOpen : ''].join(' ')}>
          <div className={styles.sourcesPanelHead}>
            <div className={styles.sourcesPanelTitle}>
              <RiAttachment2 className={styles.sourcesPanelIcon} />
              <span>Fuentes</span>
              {fuentes.length > 0 && (
                <span className={styles.sourceCount}>{fuentes.length}</span>
              )}
            </div>
          </div>

          <div className={styles.sourcesScroll}>
            {fuentes.length === 0 ? (
              <div className={styles.sourcesEmpty}>
                <RiAttachment2 className={styles.sourcesEmptyIcon} />
                <p>Agrega archivos, URLs o texto para darle contexto a la IA.</p>
              </div>
            ) : (
              fuentes.map(f => (
                <SourceItem key={f.id} source={f} onDelete={handleDeleteSource} />
              ))
            )}
          </div>

          <div className={styles.sourcesFooter}>
            <button
              className={styles.addSourceBtn}
              onClick={() => setShowAdd(true)}
              style={{ '--color': color }}
            >
              <RiAddLine /> Agregar fuente
            </button>
          </div>
        </aside>

        {/* ── Right: Chat ── */}
        <main className={styles.chatPanel}>

          {/* Messages */}
          <div className={styles.messages} aria-live="polite" aria-label="Conversación">
            {messages.length === 0 && !generating && (
              <div className={styles.chatEmpty}>
                <div className={styles.chatEmptyIcon} style={{ background: `${color}18`, color }}>
                  <RiSparkling2Line />
                </div>
                <h3 className={styles.chatEmptyTitle}>Listo para ayudarte</h3>
                <p className={styles.chatEmptyText}>
                  {fuentes.length === 0
                    ? 'Agrega al menos una fuente y luego escribe tu consulta o presiona Generar.'
                    : 'Escribe tu consulta o presiona ↵ para que la IA genere contenido basado en tus fuentes.'}
                </p>
              </div>
            )}

            {messages.map(msg => (
              <ChatMessage key={msg.id ?? msg.created_at} msg={msg} />
            ))}

            {generating && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className={styles.inputBar}>
            <div className={styles.inputWrap}>
              <textarea
                ref={inputRef}
                className={styles.chatInput}
                placeholder={fuentes.length > 0
                  ? 'Escribe tu consulta… (↵ para enviar, Shift+↵ nueva línea)'
                  : 'Agrega fuentes para comenzar…'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={generating}
                aria-label="Mensaje para la IA"
                style={{ '--rows': Math.min(input.split('\n').length, 5) }}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={generating || (fuentes.length === 0 && !input.trim())}
                style={{ '--color': color }}
                aria-label="Enviar mensaje"
              >
                {generating
                  ? <RiRefreshLine className={styles.sendSpinner} />
                  : <RiSendPlane2Fill />
                }
              </button>
            </div>
            <p className={styles.inputHint}>↵ Enviar · Shift+↵ nueva línea</p>
          </div>
        </main>
      </div>

      {/* ── Add Source modal ── */}
      {showAdd && (
        <AddSourceModal
          blockId={blockId}
          onAdded={handleSourceAdded}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
