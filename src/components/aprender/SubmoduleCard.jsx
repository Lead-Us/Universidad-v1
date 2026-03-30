import { RiPencilLine, RiDeleteBinLine } from 'react-icons/ri';
import styles from './SubmoduleCard.module.css';

export default function SubmoduleCard({ sub, modelColor, onClick, onEdit, onDelete }) {
  return (
    <div
      className={styles.card}
      style={{ borderTopColor: modelColor }}
      onClick={onClick}
    >
      <div className={styles.header}>
        <span className={styles.order}>{String(sub.order).padStart(2, '0')}</span>
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={e => { e.stopPropagation(); onEdit(sub); }}
            title="Editar"
          >
            <RiPencilLine />
          </button>
          <button
            className={styles.iconBtn}
            onClick={e => { e.stopPropagation(); onDelete(sub.id); }}
            title="Eliminar"
          >
            <RiDeleteBinLine />
          </button>
        </div>
      </div>
      <h4 className={styles.name}>{sub.name}</h4>
      <p className={styles.preview}>
        {sub.prompt_content
          ? sub.prompt_content.slice(0, 80) + (sub.prompt_content.length > 80 ? '…' : '')
          : 'Sin contenido aún'}
      </p>
    </div>
  );
}
