import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiPencilLine, RiUserLine, RiBookOpenLine, RiDeleteBinLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import styles from './RamoCard.module.css';

export default function RamoCard({ ramo, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirming(true);
  };
  const handleConfirm = (e) => {
    e.stopPropagation();
    onDelete?.(ramo.id);
  };
  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <div
      className={styles.card}
      style={{ borderLeft: `3px solid ${ramo.color}` }}
      onClick={() => !confirming && navigate(`/ramos/${ramo.id}`)}
    >
      <div className={styles.top}>
        <span className={styles.code}>{ramo.code}</span>
        <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
          {confirming ? (
            <>
              <span className={styles.confirmLabel}>¿Eliminar?</span>
              <button className={styles.confirmBtn} onClick={handleConfirm} title="Confirmar"><RiCheckLine /></button>
              <button className={styles.editBtn}    onClick={handleCancel}  title="Cancelar"><RiCloseLine /></button>
            </>
          ) : (
            <>
              <button className={styles.editBtn}   onClick={e => { e.stopPropagation(); onEdit(ramo); }} title="Editar"><RiPencilLine /></button>
              <button className={styles.deleteBtn} onClick={handleDeleteClick} title="Eliminar ramo"><RiDeleteBinLine /></button>
            </>
          )}
        </div>
      </div>

      <h3 className={styles.name}>{ramo.name}</h3>

      <div className={styles.profRow}>
        <RiUserLine className={styles.profIcon} />
        <span className={styles.prof}>{ramo.professor}</span>
      </div>

      <div className={styles.footer}>
        <RiBookOpenLine className={styles.footIcon} />
        <span className={styles.meta}>{ramo.section}</span>
        <span className={styles.metaDot}>·</span>
        <span className={styles.meta}>{ramo.credits} cr.</span>
        {ramo.has_attendance && (
          <span className={styles.att} title="Tiene asistencia">● Asistencia</span>
        )}
      </div>
    </div>
  );
}
