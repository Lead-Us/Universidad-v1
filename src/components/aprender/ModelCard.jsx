import { RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import { colorAlpha } from '../../lib/ramoColors.js';
import styles from './ModelCard.module.css';

export default function ModelCard({ model, subCount, onClick, onEdit, onDelete }) {
  return (
    <div
      className={styles.card}
      style={{ borderLeftColor: model.color }}
      onClick={onClick}
    >
      <div className={styles.top}>
        <span
          className={styles.dot}
          style={{ background: model.color }}
        />
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={e => { e.stopPropagation(); onEdit(model); }}
            title="Editar método"
          >
            <RiPencilLine />
          </button>
          <button
            className={styles.iconBtn}
            onClick={e => { e.stopPropagation(); onDelete(model.id); }}
            title="Eliminar"
          >
            <RiDeleteBinLine />
          </button>
        </div>
      </div>

      <h3 className={styles.name}>{model.name}</h3>
      {model.description && <p className={styles.desc}>{model.description}</p>}

      <div className={styles.footer}>
        <span
          className={styles.count}
          style={{ background: colorAlpha(model.color, 0.12), color: model.color }}
        >
          {subCount} sub-{subCount === 1 ? 'módulo' : 'módulos'}
        </span>
      </div>
    </div>
  );
}
