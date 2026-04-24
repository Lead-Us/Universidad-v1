import { useState } from 'react';
import { RiMessage3Line, RiCloseLine, RiSendPlane2Fill, RiCheckLine } from 'react-icons/ri';
import { submitFeedback } from '../../services/feedbackService.js';
import styles from './FeedbackButton.module.css';

export default function FeedbackButton() {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleOpen = () => {
    setOpen(true);
    setSent(false);
    setError('');
    setText('');
  };

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setError('');
    setText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      await submitFeedback({ message: text });
      setSent(true);
      setTimeout(() => { setOpen(false); setSent(false); setText(''); }, 2000);
    } catch (err) {
      setError(err.message || 'Error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        className={styles.fab}
        onClick={handleOpen}
        aria-label="Enviar feedback"
        title="Enviar feedback"
      >
        <RiMessage3Line />
      </button>

      {open && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && handleClose()}>
          <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="fb-title">
            <div className={styles.head}>
              <span id="fb-title" className={styles.title}>¿Qué mejorarías?</span>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
                <RiCloseLine />
              </button>
            </div>

            {sent ? (
              <div className={styles.successState}>
                <RiCheckLine className={styles.successIcon} />
                <p className={styles.successText}>¡Gracias por tu feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <textarea
                  className={styles.textarea}
                  placeholder="Cuéntanos qué encontraste confuso, qué faltó, o qué te gustó..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  autoFocus
                />
                {error && <p className={styles.error} role="alert">{error}</p>}
                <div className={styles.footer}>
                  <span className={styles.hint}>Beta — tu opinión mejora la plataforma</span>
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={sending || !text.trim()}
                  >
                    {sending ? 'Enviando…' : <><RiSendPlane2Fill /> Enviar</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
