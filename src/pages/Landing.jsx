import { useNavigate } from 'react-router-dom';
import {
  RiBookOpenLine, RiCalendarLine, RiBrainLine,
  RiCheckLine, RiArrowRightLine,
  RiTimerLine, RiGroup2Line, RiFileTextLine,
  RiSparkling2Line,
} from 'react-icons/ri';
import styles from './Landing.module.css';

const FEATURES = [
  {
    icon: RiBookOpenLine,
    title: 'Gestión de Ramos',
    desc: 'Organiza tus asignaturas, unidades, evaluaciones y asistencia en un solo lugar.',
    color: '#4f8ef7',
  },
  {
    icon: RiCalendarLine,
    title: 'Horario & Calendario',
    desc: 'Visualiza tus clases semanales y tareas con fechas de entrega en un calendario integrado.',
    color: '#7c3aed',
  },
  {
    icon: RiSparkling2Line,
    title: 'Aprender con IA',
    desc: 'Sube tus apuntes y archivos, elige un método de estudio y deja que la IA genere tu material de aprendizaje.',
    color: '#059669',
  },
  {
    icon: RiFileTextLine,
    title: 'Importar Syllabus',
    desc: 'Sube tu carpeta de ramos y la plataforma extrae automáticamente todo el contenido del semestre.',
    color: '#d97706',
  },
];

const PLAN_FEATURES = [
  'Ramos ilimitados',
  'Horario semanal y calendario',
  'Importación de archivos PDF/DOCX',
  'IA para estudio (Aprender)',
  'Seguimiento de asistencia',
  'Gestión de evaluaciones y notas',
  'Acceso desde cualquier dispositivo',
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      {/* ── Nav ── */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><RiBookOpenLine /></div>
            <span className={styles.logoText}>Universidad</span>
          </div>
          <div className={styles.navActions}>
            <button className={styles.navGhost} onClick={() => navigate('/login')}>
              Iniciar sesión
            </button>
            <button className={styles.navPrimary} onClick={() => navigate('/register')}>
              Crear cuenta <RiArrowRightLine />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroBadge}>
            <RiSparkling2Line /> Plataforma académica con IA
          </div>
          <h1 className={styles.heroTitle}>
            Tu universidad,<br />
            <span className={styles.heroAccent}>organizada al máximo</span>
          </h1>
          <p className={styles.heroSub}>
            Gestiona ramos, horarios, tareas y aprende con inteligencia artificial.
            Todo en un solo lugar, pensado para estudiantes chilenos.
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/register')}>
              Comenzar gratis <RiArrowRightLine />
            </button>
            <button className={styles.ctaGhost} onClick={() => navigate('/login')}>
              Ya tengo cuenta
            </button>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <RiTimerLine className={styles.statIcon} />
              <span>Ahorra horas de organización</span>
            </div>
            <div className={styles.statDot} />
            <div className={styles.stat}>
              <RiGroup2Line className={styles.statIcon} />
              <span>Para todas las universidades</span>
            </div>
            <div className={styles.statDot} />
            <div className={styles.stat}>
              <RiBrainLine className={styles.statIcon} />
              <span>IA integrada para estudiar</span>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className={styles.features}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionLabel}>Funcionalidades</p>
            <h2 className={styles.sectionTitle}>Todo lo que necesitas para el semestre</h2>
            <div className={styles.featuresGrid}>
              {FEATURES.map(f => (
                <div key={f.title} className={styles.featureCard}>
                  <div className={styles.featureIcon} style={{ background: `${f.color}18`, color: f.color }}>
                    <f.icon />
                  </div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className={styles.pricing}>
          <div className={styles.sectionInner}>
            <p className={styles.sectionLabel}>Planes</p>
            <h2 className={styles.sectionTitle}>Simple y transparente</h2>
            <div className={styles.pricingCard}>
              <div className={styles.pricingLeft}>
                <div className={styles.priceBadge}>Plan Completo</div>
                <div className={styles.price}>
                  <span className={styles.priceCurrency}>CLP</span>
                  <span className={styles.priceAmount}>$7.990</span>
                  <span className={styles.pricePer}>/mes</span>
                </div>
                <p className={styles.priceSub}>
                  Sin contratos. Cancela cuando quieras.
                </p>
                <button className={styles.ctaPrimary} onClick={() => navigate('/register')}>
                  Empezar ahora <RiArrowRightLine />
                </button>
              </div>
              <div className={styles.pricingRight}>
                <ul className={styles.featureList}>
                  {PLAN_FEATURES.map(f => (
                    <li key={f} className={styles.featureItem}>
                      <span className={styles.featureCheck}><RiCheckLine /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><RiBookOpenLine /></div>
            <span className={styles.logoText}>Universidad</span>
          </div>
          <p className={styles.footerText}>© 2026 Universidad. Hecho para estudiantes chilenos.</p>
        </div>
      </footer>
    </div>
  );
}
