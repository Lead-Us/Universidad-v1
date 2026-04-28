import { useState, useEffect } from 'react';
import {
  RiMessage3Line, RiCloseLine, RiSendPlane2Fill,
  RiCheckLine, RiStarLine, RiStarFill, RiTimeLine,
} from 'react-icons/ri';
import { submitFeedback } from '../../services/feedbackService.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import styles from './FeedbackButton.module.css';

const CATEGORIES = ['Bug', 'Sugerencia', 'Diseño', 'Otro'];
const FREQUENCY_DAYS = 3;

function getStorageKey(userId) {
  return `uni_feedback_shown_${userId}`;
}

function shouldAutoPrompt(userId) {
  if (!userId) return false;
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) return true;
  const last = parseInt(raw, 10);
  if (isNaN(last)) return true;
  return Date.now() - last > FREQUENCY_DAYS * 24 * 60 * 60 * 1000;
}

function markShown(userId) {
  if (!userId) return;
  localStorage.setItem(getStorageKey(userId), String(Date.now()));
}

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [text,     setText]     = useState('');
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  // Auto-open once every 3 days
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      if (shouldAutoPrompt(user.id)) {
        setOpen(true);
        markShown(user.id);
      }
    }, 8000); // slight delay after page load
    return () => clearTimeout(timer);
  }, [user?.id]);

  const handleOpen = () => {
    resetForm();
    setOpen(true);
    if (user?.id) markShown(user.id);
  };

  const handleClose = () => {
    setOpen(false);
    setSent(false);
    setError('');
  };

  const resetForm = () => {
    setText('');
    setRating(0);
    setHovered(0);
    setCategory('');
    setError('');
    setSent(false);
  };

  const handlePostpone = () => {
    // Postpone by 1 day: set last shown to 2 days ago
    if (user?.id) {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      localStorage.setItem(getStorageKey(user.id), String(twoDaysAgo));
    }
    handleClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !rating) return;
    setSending(true);
    setError('');
    try {
      await submitFeedback({ message: text, rating, category });
      setSent(true);
      setTimeout(() => { setOpen(false); resetForm(); }, 2200);
    } catch (err) {
      setError(err.message || 'Error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const displayRating = hovered || rating;

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
        <div
          className={styles.overlay}
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <div className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="fb-title">

            <div className={styles.head}>
              <span id="fb-title" className={styles.title}>¿Cómo va la experiencia?</span>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar">
                <RiCloseLine />
              </button>
            </div>

            {sent ? (
              <div className={styles.successState}>
                <div className={styles.successIconWrap}>
                  <RiCheckLine />
                </div>
                <p className={styles.successTitle}>¡Gracias!</p>
                <p className={styles.successText}>Tu opinión nos ayuda a mejorar.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>

                {/* Star rating */}
                <div className={styles.ratingRow}>
                  <span className={styles.ratingLabel}>Calificación</span>
                  <div className={styles.stars} aria-label="Calificación de 1 a 5">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={styles.starBtn}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(prev => prev === n ? 0 : n)}
                        aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                        aria-pressed={rating === n}
                      >
                        {n <= displayRating
                          ? <RiStarFill className={styles.starFilled} />
                          : <RiStarLine className={styles.starEmpty} />
                        }
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category chips */}
                <div className={styles.categoryRow}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={[styles.chip, category === cat ? styles.chipActive : ''].join(' ')}
                      onClick={() => setCategory(prev => prev === cat ? '' : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  className={styles.textarea}
                  placeholder="Cuéntanos qué encontraste confuso, qué faltó, o qué te gustó…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />

                {error && <p className={styles.error} role="alert">{error}</p>}

                <div className={styles.footer}>
                  <button
                    type="button"
                    className={styles.postponeBtn}
                    onClick={handlePostpone}
                    title="Recordar en 1 día"
                  >
                    <RiTimeLine /> Más tarde
                  </button>
                  <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={sending || (!text.trim() && !rating)}
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
