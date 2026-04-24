import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import {
  RiArrowLeftLine, RiAddLine, RiDeleteBinLine,
  RiSparkling2Line, RiSendPlane2Fill,
  RiFileLine, RiLinksLine, RiText, RiCloseLine,
  RiRefreshLine, RiCheckLine, RiUploadLine,
  RiGlobalLine, RiAttachment2, RiBookOpenLine,
  RiArrowRightSLine, RiArrowLeftSLine,
} from 'react-icons/ri';
import {
  getCuadernos, getBloques,
  getFuentes, addFuente, deleteFuente, uploadFuente,
  getMensajes, addMensaje, clearMensajes,
} from '../services/aprendizajeService.js';
import styles from './AprenderBloque.module.css';

marked.setOptions({ breaks: true, gfm: true });

const ACCEPTED = '.pdf,.docx,.doc,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp';
const MAX_SIZE_MB = 50;
const MAX_SIZE_B  = MAX_SIZE_MB * 1024 * 1024;

// ── Learning methods ───────────────────────────────────────────
const METHODS = [
  {
    key:   'herrera_aprender',
    emoji: '🧠',
    name:  'Herrera — Aprender',
    short: 'Storytelling → Explicación → Verificación',
    color: '#7c3aed',
    prompt: `Usa el Método Herrera APRENDER con estos 3 pasos:
1. STORYTELLING SIMBÓLICO: Presenta el concepto como una historia o metáfora memorable que lo haga intuitivo.
2. EXPLICACIÓN CLARA: Explica el concepto desde cero, como a alguien sin conocimiento previo, construyendo paso a paso.
3. VERIFICACIÓN DE INTUICIÓN: Haz preguntas que permitan al estudiante verificar si captó la intuición detrás del concepto (no solo la mecánica).`,
  },
  {
    key:   'herrera_practicar',
    emoji: '🔄',
    name:  'Herrera — Practicar',
    short: 'Active Recall + Feynman',
    color: '#16a34a',
    prompt: `Usa el Método Herrera PRACTICAR con estos 2 pilares:
1. ACTIVE RECALL: Genera preguntas directas sobre el contenido para que el estudiante recuerde activamente sin mirar apuntes. Varía el tipo de pregunta (definición, aplicación, comparación).
2. LEARNING BY TEACHING (Feynman): Pide al estudiante que explique el concepto con sus propias palabras, como si lo enseñara a alguien más. Identifica y señala con claridad los vacíos o errores en su explicación.`,
  },
  {
    key:   'mate_practica',
    emoji: '🔵',
    name:  'Matemático — Práctica Full',
    short: '5 fases: Desglose → Mecanización → Auditoría',
    color: '#2563eb',
    prompt: `Usa el Método Matemático PRÁCTICA FULL (5 fases secuenciales):
1. DESGLOSE: Descompón el ejercicio en pasos mínimos, nombrando el concepto y la fórmula de cada uno.
2. TRADUCTOR: Convierte el enunciado a lenguaje matemático puro, identificando qué se busca y qué se tiene.
3. MECANIZACIÓN: Resuelve paso a paso con justificación explícita de cada operación.
4. PRÁCTICA INTERCALADA: Propón ejercicios similares mezclados con problemas de temas anteriores relacionados.
5. AUDITORÍA DE ERRORES: Identifica y clasifica posibles errores en: conceptual, procedimental o de cálculo.`,
  },
  {
    key:   'mate_flash',
    emoji: '🔴',
    name:  'Matemático — Flash',
    short: 'Revisión de emergencia 30–60 min',
    color: '#dc2626',
    prompt: `Usa el Método Matemático FLASH (revisión compacta pre-examen):
1. FORMULARIO CRÍTICO: Lista solo las fórmulas y definiciones esenciales para la prueba. Sin explicaciones largas.
2. DICCIONARIO DE UNIDADES: Explica las unidades y su significado para prevenir errores de interpretación.
3. DETECCIÓN V/F: Genera afirmaciones verdaderas y falsas sobre los conceptos clave para detección rápida de errores conceptuales.
Modo compacto, directo, máxima densidad de información útil.`,
  },
];

function fmtSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Source type icon ───────────────────────────────────────────
function SourceIcon({ type }) {
  const map = { file: RiFileLine, url: RiLinksLine, text: RiText, platform: RiAttachment2 };
  const Icon = map[type] ?? RiFileLine;
  return <Icon />;
}

// ── Add Source modal ───────────────────────────────────────────
function AddSourceModal({ blockId, onAdded, onClose }) {
  const [tab,          setTab]          = useState('file');
  const [title,        setTitle]        = useState('');
  const [content,      setContent]      = useState('');
  const [url,          setUrl]          = useState('');
  const [instructions, setInstructions] = useState('');
  const [files,        setFiles]        = useState([]);
  const [progress,     setProgress]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [drag,         setDrag]         = useState(false);
  const fileRef = useRef(null);

  const addFiles = (incoming) => {
    const valid = [];
    const errs  = [];
    for (const f of incoming) {
      if (f.size > MAX_SIZE_B) { errs.push(`${f.name} supera ${MAX_SIZE_MB} MB`); }
      else { valid.push(f); }
    }
    if (errs.length) setError(errs.join(', '));
    setFiles(prev => {
      const names = new Set(prev.map(x => x.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (tab === 'file') {
        if (files.length === 0) { setError('Selecciona al menos un archivo.'); setSaving(false); return; }
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setProgress(`Subiendo ${i + 1} de ${files.length}: ${f.name}`);
          const { path, publicUrl } = await uploadFuente(blockId, f);
          await addFuente({ blockId, type: 'file', name: title || f.name, url: publicUrl, filePath: path, instructions });
        }
        setProgress('');
      } else if (tab === 'url') {
        if (!url.trim()) { setError('Ingresa una URL válida.'); setSaving(false); return; }
        await addFuente({ blockId, type: 'url', name: title || url, url: url.trim(), instructions });
      } else {
        if (!content.trim()) { setError('Escribe el contenido.'); setSaving(false); return; }
        await addFuente({ blockId, type: 'text', name: title || 'Texto', content, instructions });
      }
      onAdded();
    } catch (err) {
      setProgress('');
      setError(err.message || 'Error al agregar fuente.');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'file', label: 'Archivos', icon: RiUploadLine },
    { id: 'url',  label: 'URL',      icon: RiLinksLine },
    { id: 'text', label: 'Texto',    icon: RiText },
  ];

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.addModal} role="dialog" aria-modal="true" aria-labelledby="add-source-title">
        <div className={styles.addModalHead}>
          <h2 id="add-source-title" className={styles.addModalTitle}>Agregar fuentes</h2>
          <button className={styles.iconBtn} onClick={onClose} aria-label="Cerrar"><RiCloseLine /></button>
        </div>

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
          {tab !== 'file' && (
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
          )}

          {tab === 'file' && (
            <>
              <div
                className={[styles.dropZone, drag ? styles.dropZoneActive : ''].join(' ')}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Zona para soltar archivos"
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED}
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  aria-hidden
                />
                <RiUploadLine className={styles.dropIcon} />
                <p className={styles.dropText}>Arrastra archivos o haz clic para seleccionar</p>
                <span className={styles.dropHint}>PDF, DOCX, PPT, TXT, imágenes · hasta {MAX_SIZE_MB} MB c/u</span>
              </div>

              {files.length > 0 && (
                <ul className={styles.fileList}>
                  {files.map((f, i) => (
                    <li key={i} className={styles.fileItem}>
                      <RiFileLine className={styles.fileItemIcon} />
                      <span className={styles.fileItemName}>{f.name}</span>
                      <span className={styles.fileItemSize}>{fmtSize(f.size)}</span>
                      <button
                        type="button"
                        className={styles.fileItemRemove}
                        onClick={() => removeFile(i)}
                        aria-label={`Quitar ${f.name}`}
                      >
                        <RiCloseLine />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {progress && (
                <p className={styles.progressText} role="status">{progress}</p>
              )}
            </>
          )}

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

          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="src-instructions">
              Instrucciones para la IA <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="src-instructions"
              className={styles.formInput}
              placeholder="ej. Enfócate solo en las fórmulas de esta fuente"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              maxLength={300}
            />
          </div>

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <div className={styles.formActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving
                ? (progress || 'Subiendo…')
                : tab === 'file' && files.length > 1
                  ? `Subir ${files.length} archivos`
                  : 'Agregar'}
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
        <p className={styles.sourceName}>{source.name || 'Fuente'}</p>
        {source.type === 'text' && source.content && (
          <p className={styles.sourcePreview}>{source.content.slice(0, 80)}{source.content.length > 80 ? '…' : ''}</p>
        )}
        {source.type === 'url' && source.url && (
          <p className={styles.sourcePreview}>{source.url}</p>
        )}
      </div>
      <div className={styles.sourceActions}>
        {confirming ? (
          <div className={styles.sourceConfirm}>
            <button className={styles.confirmBtn} onClick={() => onDelete(source.id)} aria-label="Confirmar eliminación">
              <RiCheckLine />
            </button>
            <button className={styles.cancelBtn} onClick={() => setConfirming(false)} aria-label="Cancelar">
              <RiCloseLine />
            </button>
          </div>
        ) : (
          <button className={styles.deleteBtn} onClick={() => setConfirming(true)} aria-label={`Eliminar fuente ${source.name}`}>
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
      <div className={styles.bubbleTyping} aria-label="Generando respuesta">
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

  const [notebook,       setNotebook]       = useState(null);
  const [block,          setBlock]          = useState(null);
  const [fuentes,        setFuentes]        = useState([]);
  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState('');
  const [generating,     setGenerating]     = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [showSources,    setShowSources]    = useState(true);
  const [showMethod,     setShowMethod]     = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

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

  const handleSelectMethod = (method) => {
    setSelectedMethod(prev => prev?.key === method.key ? null : method);
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
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setGenerating(true);

    try {
      const savedUser = await addMensaje({ blockId, role: 'user', content: userContent });

      const res = await fetch('/api/aprender-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources:   fuentes.map(f => ({ title: f.name || '', content: f.content || f.url || '', instructions: f.instructions || '' })),
          methodKey: selectedMethod?.key ?? '',
          messages:     messages
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

  const handleInputResize = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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
          {/* Sources toggle */}
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

          {/* Method toggle */}
          <button
            className={[styles.iconBtnSm, showMethod ? styles.iconBtnActive : ''].join(' ')}
            onClick={() => setShowMethod(v => !v)}
            aria-label="Mostrar/ocultar método de estudio"
            aria-pressed={showMethod}
            title="Método de estudio"
            style={selectedMethod ? { color: selectedMethod.color } : undefined}
          >
            <RiBookOpenLine />
            {selectedMethod && <span className={styles.badge} style={{ background: selectedMethod.color }}>✓</span>}
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
        <aside
          className={[
            styles.sourcesPanel,
            showSources ? styles.sourcesPanelOpen : styles.sourcesPanelClosed,
          ].join(' ')}
          aria-label="Panel de fuentes"
        >
          <div className={styles.sourcesPanelHead}>
            <div className={styles.sourcesPanelTitle}>
              <RiAttachment2 className={styles.sourcesPanelIcon} />
              <span>Fuentes</span>
              {fuentes.length > 0 && (
                <span className={styles.sourceCount}>{fuentes.length}</span>
              )}
            </div>
            <button
              className={styles.panelCollapseBtn}
              onClick={() => setShowSources(false)}
              aria-label="Ocultar fuentes"
              title="Ocultar"
            >
              <RiArrowLeftSLine />
            </button>
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

        {/* ── Center: Chat ── */}
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
                {selectedMethod && (
                  <div className={styles.methodPill} style={{ '--m-color': selectedMethod.color }}>
                    <span>{selectedMethod.emoji}</span>
                    <span>{selectedMethod.name}</span>
                  </div>
                )}
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
            {selectedMethod && (
              <div className={styles.methodIndicator} style={{ '--m-color': selectedMethod.color }}>
                <span className={styles.methodIndicatorEmoji}>{selectedMethod.emoji}</span>
                <span className={styles.methodIndicatorName}>{selectedMethod.name}</span>
                <button
                  className={styles.methodIndicatorClear}
                  onClick={() => setSelectedMethod(null)}
                  aria-label="Quitar método"
                >
                  <RiCloseLine />
                </button>
              </div>
            )}
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
                onInput={handleInputResize}
                rows={1}
                disabled={generating}
                aria-label="Mensaje para la IA"
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

        {/* ── Right: Method panel ── */}
        <aside
          className={[
            styles.methodPanel,
            showMethod ? styles.methodPanelOpen : styles.methodPanelClosed,
          ].join(' ')}
          aria-label="Panel de métodos de estudio"
        >
          <div className={styles.methodPanelHead}>
            <button
              className={styles.panelCollapseBtn}
              onClick={() => setShowMethod(false)}
              aria-label="Ocultar métodos"
              title="Ocultar"
            >
              <RiArrowRightSLine />
            </button>
            <div className={styles.methodPanelTitle}>
              <RiBookOpenLine className={styles.methodPanelIcon} />
              <span>Método</span>
            </div>
          </div>

          <div className={styles.methodScroll}>
            <p className={styles.methodPanelHint}>
              Selecciona cómo la IA debe enseñarte el material.
            </p>

            <div className={styles.methodCards}>
              {METHODS.map(m => {
                const isSelected = selectedMethod?.key === m.key;
                return (
                  <button
                    key={m.key}
                    className={[styles.methodCard, isSelected ? styles.methodCardSelected : ''].join(' ')}
                    style={{ '--m-color': m.color }}
                    onClick={() => handleSelectMethod(m)}
                    aria-pressed={isSelected}
                    title={m.name}
                  >
                    <div className={styles.methodCardTop}>
                      <span className={styles.methodEmoji} aria-hidden>{m.emoji}</span>
                      {isSelected && (
                        <span className={styles.methodCheckBadge} aria-label="Seleccionado">
                          <RiCheckLine />
                        </span>
                      )}
                    </div>
                    <p className={styles.methodCardName}>{m.name}</p>
                    <p className={styles.methodCardShort}>{m.short}</p>
                  </button>
                );
              })}
            </div>

            {!selectedMethod && (
              <p className={styles.methodNoneHint}>Sin método activo — la IA usará un modo tutor general.</p>
            )}
          </div>
        </aside>
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
