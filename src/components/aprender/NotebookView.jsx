import { useState, useRef, useEffect } from 'react';
import {
  RiAddLine, RiDeleteBinLine, RiSendPlaneLine,
  RiRobot2Line, RiUserLine, RiFileTextLine,
} from 'react-icons/ri';
import styles from './NotebookView.module.css';

// ── Source panel ──────────────────────────────────────────────────────────────
function SourcePanel({ sources, onAdd, onDelete, onUpdate }) {
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState({ title: '', content: '' });

  const handleAdd = () => {
    if (!form.content.trim()) return;
    onAdd({ title: form.title.trim() || 'Fuente sin título', content: form.content.trim() });
    setForm({ title: '', content: '' });
    setAdding(false);
  };

  return (
    <div className={styles.sourcePanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Fuentes</span>
        <button className={styles.addSourceBtn} onClick={() => setAdding(true)}>
          <RiAddLine /> Agregar
        </button>
      </div>

      <div className={styles.sourceList}>
        {sources.map((s, i) => (
          <div key={i} className={styles.sourceCard}>
            <div className={styles.sourceCardHeader}>
              <RiFileTextLine className={styles.sourceIcon} />
              <span className={styles.sourceTitle}>{s.title}</span>
              <button
                className={styles.deleteSourceBtn}
                onClick={() => onDelete(i)}
                title="Eliminar fuente"
              >
                <RiDeleteBinLine />
              </button>
            </div>
            <p className={styles.sourcePreview}>
              {s.content.slice(0, 120)}{s.content.length > 120 ? '…' : ''}
            </p>
          </div>
        ))}

        {sources.length === 0 && !adding && (
          <p className={styles.emptySources}>
            Agrega notas, resúmenes o apuntes para que la IA los use al responder.
          </p>
        )}

        {adding && (
          <div className={styles.addSourceForm}>
            <input
              className={styles.sourceInput}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título (ej: Clase 3 – Termodinámica)"
            />
            <textarea
              className={styles.sourceTextarea}
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Pega aquí tus apuntes, resúmenes o definiciones…"
              rows={6}
              autoFocus
            />
            <div className={styles.addSourceActions}>
              <button className={styles.cancelBtn} onClick={() => setAdding(false)}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleAdd} disabled={!form.content.trim()}>
                Guardar fuente
              </button>
            </div>
          </div>
        )}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function NotebookView({ model, storageKey }) {
  const [sources, setSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_sources`) ?? '[]'); }
    catch { return []; }
  });
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`${storageKey}_chat`) ?? '[]'); }
    catch { return []; }
  });
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const bottomRef             = useRef(null);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_sources`, JSON.stringify(sources));
  }, [sources, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_chat`, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storageKey]);

  const addSource = (src) => setSources(prev => [...prev, src]);
  const deleteSource = (i) => setSources(prev => prev.filter((_, idx) => idx !== i));

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.notebook}>
      <SourcePanel
        sources={sources}
        onAdd={addSource}
        onDelete={deleteSource}
      />

      <div className={styles.chatPanel}>
        <div className={styles.chatMessages}>
          {messages.length === 0 && (
            <div className={styles.chatEmpty}>
              <RiRobot2Line className={styles.chatEmptyIcon} />
              <p>Agrega fuentes a la izquierda y haz una pregunta.<br />
                La IA responderá basándose en tus apuntes.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.aiMsg}`}>
              <div className={styles.thinking}>
                <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
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
            onKeyDown={handleKeyDown}
            placeholder="Pregunta algo sobre tus fuentes… (Enter para enviar)"
            rows={2}
            disabled={loading}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{ '--model-color': model.color }}
          >
            <RiSendPlaneLine />
          </button>
        </div>
      </div>
    </div>
  );
}
