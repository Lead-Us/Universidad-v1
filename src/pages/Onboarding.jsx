import { useState } from 'react';
import {
  RiBookOpenLine, RiCalendarLine, RiCheckLine,
  RiArrowRightLine, RiArrowLeftLine, RiSkipForwardLine,
  RiHome4Line, RiBook2Line, RiUploadLine, RiRocketLine,
} from 'react-icons/ri';
import ImportarArchivos from './ImportarArchivos.jsx';
import styles from './Onboarding.module.css';

const STEPS = [
  {
    id: 'bienvenida',
    icon: RiRocketLine,
    title: '¡Bienvenido a Universidad!',
    subtitle: 'Tu espacio académico personal',
    body: 'Organiza tus ramos, horario, tareas y más en un solo lugar. En los próximos pasos te explicamos cómo funciona cada sección.',
  },
  {
    id: 'ramos',
    icon: RiBook2Line,
    title: 'Ramos',
    subtitle: 'Tus asignaturas centralizadas',
    body: 'En la sección Ramos puedes agregar todas tus asignaturas, registrar tus unidades, evaluaciones y controlar tu asistencia. Cada ramo tiene su propio color para identificarlo fácilmente.',
    tip: 'Puedes asignarle un color a cada ramo para que aparezca en el calendario y horario.',
  },
  {
    id: 'horario',
    icon: RiCalendarLine,
    title: 'Horario y Calendario',
    subtitle: 'Nunca más pierdas una clase',
    body: 'Agrega los bloques de cada ramo en el horario semanal del Inicio. En el Calendario verás tus tareas y evaluaciones organizadas por fecha.',
    tip: 'Los puntos de colores en el calendario representan las tareas de cada ramo.',
  },
  {
    id: 'tareas',
    icon: RiCheckLine,
    title: 'Tareas',
    subtitle: 'Mantén el control de tus entregas',
    body: 'Crea tareas, controles, quizzes y evaluaciones con fecha límite. Puedes marcarlas como completadas y filtrarlas por tipo o ramo.',
    tip: 'Las tareas vencidas aparecen en rojo para que no se te pasen.',
  },
  {
    id: 'notebook',
    icon: RiBookOpenLine,
    title: 'Notebook',
    subtitle: 'Tu asistente de estudio con IA',
    body: 'En Notebook creas cuadernos para cada tema o ramo. Agrega fuentes (apuntes, resúmenes) y hazle preguntas a la IA. Puedes seleccionar el método de aprendizaje que prefieras.',
    tip: 'Prueba el Método Herrera o el Método Matemático para estudiar con IA.',
  },
  {
    id: 'importar',
    icon: RiUploadLine,
    title: 'Importar tus ramos',
    subtitle: 'Empieza con un click',
    body: 'Sube el programa de tus ramos o una carpeta con archivos y la IA detectará automáticamente las asignaturas, evaluaciones y fechas.',
    isImport: true,
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;
  const isImport = current.isImport;

  const next = () => {
    if (isLast) { onComplete(); return; }
    setStep(s => s + 1);
  };

  const prev = () => {
    if (isFirst) return;
    setStep(s => s - 1);
  };

  return (
    <div className={styles.wrap}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        {/* Progress dots */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={[styles.dot, i === step ? styles.dotActive : i < step ? styles.dotDone : ''].join(' ')}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Header */}
        <div className={styles.iconWrap}>
          <current.icon className={styles.stepIcon} />
        </div>
        <h1 className={styles.title}>{current.title}</h1>
        <p className={styles.subtitle}>{current.subtitle}</p>

        {/* Body */}
        {isImport ? (
          <div className={styles.importSection}>
            <p className={styles.body}>{current.body}</p>
            <div className={styles.importEmbed}>
              <ImportarArchivos embedded />
            </div>
          </div>
        ) : (
          <div className={styles.bodySection}>
            <p className={styles.body}>{current.body}</p>
            {current.tip && (
              <div className={styles.tip}>
                <span className={styles.tipIcon}>💡</span>
                <span>{current.tip}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <div className={styles.actionsLeft}>
            {!isFirst && (
              <button className={styles.prevBtn} onClick={prev}>
                <RiArrowLeftLine /> Atrás
              </button>
            )}
          </div>
          <div className={styles.actionsRight}>
            {isLast ? (
              <>
                <button className={styles.skipBtn} onClick={onComplete}>
                  <RiSkipForwardLine /> Saltar
                </button>
                <button className={styles.nextBtn} onClick={onComplete}>
                  <RiHome4Line /> Ir a la plataforma
                </button>
              </>
            ) : (
              <>
                <button className={styles.skipBtn} onClick={onComplete}>
                  <RiSkipForwardLine /> Saltar
                </button>
                <button className={styles.nextBtn} onClick={next}>
                  Siguiente <RiArrowRightLine />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
