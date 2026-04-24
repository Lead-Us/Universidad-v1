import { useNavigate } from 'react-router-dom';
import {
  RiBookOpenLine, RiCalendarLine, RiBrainLine,
  RiArrowRightLine, RiSparkling2Line,
  RiFileTextLine, RiShieldCheckLine,
} from 'react-icons/ri';
import styles from './Landing.module.css';

const FEATURES = [
  {
    num: '01',
    icon: RiBookOpenLine,
    title: 'Gestión de Ramos',
    desc: 'Organiza tus asignaturas, unidades, evaluaciones y asistencia. Sin planillas, sin desorden.',
  },
  {
    num: '02',
    icon: RiCalendarLine,
    title: 'Horario & Tareas',
    desc: 'Tu semana entera de un vistazo. Clases, entregas y evaluaciones en un calendario integrado.',
  },
  {
    num: '03',
    icon: RiBrainLine,
    title: 'Aprende con IA',
    desc: 'Sube tus apuntes y la IA genera tu material de estudio personalizado. Menos tiempo preparando, más tiempo aprendiendo.',
  },
  {
    num: '04',
    icon: RiFileTextLine,
    title: 'Importa tu Semestre',
    desc: 'Sube tu carpeta de ramos y la plataforma extrae automáticamente horarios, evaluaciones y unidades.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} aria-hidden="true" />
      <div className={styles.bgGlow} aria-hidden="true" />

      {/* ── Nav ── */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}><RiBookOpenLine /></div>
            <span className={styles.logoText}>Universidad</span>
          </div>
          <div className={styles.navActions}>
            <button className={styles.navLogin} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <button className={styles.navRegister} onClick={() => navigate('/register')}>
              Empieza gratis <RiArrowRightLine />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroBeta}>
            <span className={styles.betaPulse} />
            Beta abierta — acceso gratuito para estudiantes
          </div>

          <h1 className={styles.heroTitle}>
            Tu semestre,<br />
            <em className={styles.heroEm}>sin el caos.</em>
          </h1>

          <p className={styles.heroDesc}>
            Gestiona ramos, horarios y tareas en un solo lugar.
            Estudia con inteligencia artificial.
            Pensado para el estudiante universitario chileno.
          </p>

          <div className={styles.heroCtas}>
            <button className={styles.ctaMain} onClick={() => navigate('/register')}>
              Crear cuenta gratis
              <RiArrowRightLine className={styles.ctaIcon} />
            </button>
            <button className={styles.ctaSub} onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </button>
          </div>

          <div className={styles.heroTrust}>
            <span className={styles.trustItem}>
              <RiShieldCheckLine className={styles.trustIcon} />
              Sin tarjeta de crédito
            </span>
            <span className={styles.trustSep} aria-hidden="true" />
            <span className={styles.trustItem}>Gratis durante la beta</span>
            <span className={styles.trustSep} aria-hidden="true" />
            <span className={styles.trustItem}>Todas las universidades</span>
          </div>
        </section>

        {/* ── Features ── */}
        <section className={styles.features}>
          <div className={styles.featuresInner}>
            <div className={styles.featuresHeader}>
              <span className={styles.featuresEyebrow}>Funcionalidades</span>
              <h2 className={styles.featuresTitle}>
                Todo lo que necesitas<br />para sobrevivir el semestre
              </h2>
            </div>

            <div className={styles.featuresList}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.num}
                  className={styles.featureRow}
                  style={{ '--delay': `${i * 60}ms` }}
                >
                  <span className={styles.featureNum}>{f.num}</span>
                  <div className={styles.featureIconWrap}>
                    <f.icon />
                  </div>
                  <div className={styles.featureBody}>
                    <h3 className={styles.featureName}>{f.title}</h3>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaBoxBadge}>
              <RiSparkling2Line /> Completamente gratis
            </div>
            <h2 className={styles.ctaBoxTitle}>
              Empieza este semestre organizado
            </h2>
            <p className={styles.ctaBoxDesc}>
              Crea tu cuenta hoy. Sin límites, sin tarjeta de crédito.
            </p>
            <button className={styles.ctaMain} onClick={() => navigate('/register')}>
              Crear cuenta gratis
              <RiArrowRightLine className={styles.ctaIcon} />
            </button>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}><RiBookOpenLine /></div>
            <span className={styles.logoText}>Universidad</span>
          </div>
          <p className={styles.footerCopy}>© 2026 · Hecho para estudiantes chilenos</p>
        </div>
      </footer>
    </div>
  );
}
