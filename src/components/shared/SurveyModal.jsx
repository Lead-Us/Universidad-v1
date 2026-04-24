import { useState } from 'react';
import { RiCloseLine, RiStarLine, RiStarFill } from 'react-icons/ri';
import styles from './SurveyModal.module.css';

const LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'];

export default function SurveyModal({ onSubmit, onDismiss }) {
  const [score,   setScore]   = useState(0);
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score) return;
    setSaving(true);
    try { await onSubmit(score, comment); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="survey-title">
        <button className={styles.closeBtn} onClick={onDismiss} aria-label="Cerrar"><RiCloseLine /></button>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Feedback rápido</p>
          <h2 id="survey-title" className={styles.title}>¿Cómo va tu experiencia con la app?</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.stars} role="group" aria-label="Puntaje del 1 al 5">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={[styles.star, n <= score ? styles.starFill : ''].join(' ')}
                onClick={() => setScore(n)}
                aria-label={`${n} estrellas — ${LABELS[n - 1]}`}
                aria-pressed={n === score}
              >
                {n <= score ? <RiStarFill /> : <RiStarLine />}
              </button>
            ))}
          </div>

          {score > 0 && (
            <p className={styles.scoreLabel}>{LABELS[score - 1]}</p>
          )}

          <textarea
            className={styles.comment}
            placeholder="¿Qué mejorarías? (opcional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            maxLength={500}
          />

          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onDismiss}>
              Ahora no
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!score || saving}>
              {saving ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
