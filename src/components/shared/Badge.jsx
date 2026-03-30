import { colorAlpha } from '../../lib/ramoColors.js';
import styles from './Badge.module.css';

const TYPE_LABELS = {
  tarea:      'Tarea',
  evaluación: 'Evaluación',
  control:    'Control',
  quiz:       'Quiz',
};

/**
 * mode 'type'  — muestra el tipo de tarea (tarea/evaluación/control/quiz)
 * mode 'color' — badge coloreado con el color del ramo
 * mode 'plain' — badge gris estándar
 */
export default function Badge({ children, type, color, mode = 'plain', className = '' }) {
  if (mode === 'type') {
    return (
      <span className={[styles.badge, styles.type, styles[type], className].join(' ')}>
        {TYPE_LABELS[type] ?? type}
      </span>
    );
  }

  if (mode === 'color' && color) {
    return (
      <span
        className={[styles.badge, styles.colorBadge, className].join(' ')}
        style={{ background: colorAlpha(color, 0.15), color }}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={[styles.badge, styles.plain, className].join(' ')}>
      {children}
    </span>
  );
}
