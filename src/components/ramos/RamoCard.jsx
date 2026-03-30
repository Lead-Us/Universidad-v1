import { useNavigate } from 'react-router-dom';
import { RiPencilLine, RiUserLine, RiBookOpenLine } from 'react-icons/ri';
import styles from './RamoCard.module.css';

const DAYS_SHORT = {
  Lunes: 'L', Martes: 'Ma', Miércoles: 'Mi',
  Jueves: 'J', Viernes: 'V', Sábado: 'S',
};

export default function RamoCard({ ramo, onEdit }) {
  const navigate = useNavigate();

  return (
    <div
      className={styles.card}
      style={{ background: ramo.color }}
      onClick={() => navigate(`/ramos/${ramo.id}`)}
    >
      <div className={styles.top}>
        <span className={styles.code}>{ramo.code}</span>
        <button
          className={styles.editBtn}
          onClick={e => { e.stopPropagation(); onEdit(ramo); }}
          title="Editar ramo"
        >
          <RiPencilLine />
        </button>
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
