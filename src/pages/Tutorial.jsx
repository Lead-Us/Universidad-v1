import { useEffect } from 'react';
import '../styles/landing-tokens.css';
import '../styles/tutorial.css';

export default function Tutorial() {
  useEffect(() => {
    const observers = [];

    /* ─── SCROLL PROGRESS ───────────────────────────────── */
    const prog = document.getElementById('scrollProgress');
    function updateProgress() {
      if (!prog) return;
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
      prog.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });

    /* ─── NAV SCROLL ────────────────────────────────────── */
    const nav = document.getElementById('nav');
    function updateNav() {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }
    window.addEventListener('scroll', updateNav, { passive: true });

    /* ─── SCROLL REVEALS ────────────────────────────────── */
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
    observers.push(revealObs);
    document.querySelectorAll('.reveal-left, .reveal-right, .reveal-scale').forEach(el => revealObs.observe(el));

    /* ─── ACTIVE STEP NAV ───────────────────────────────── */
    const stepObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          document.querySelectorAll('.step-nav-pill').forEach(p => {
            p.classList.toggle('active', p.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.4 });
    observers.push(stepObs);
    document.querySelectorAll('.tut-step[id]').forEach(s => stepObs.observe(s));

    return () => {
      observers.forEach(obs => obs.disconnect());
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('scroll', updateNav);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" id="scrollProgress"></div>

      {/* NAV */}
      <nav className="nav" id="nav">
        <div className="container nav-inner">
          <a href="/" className="logo">
            <svg className="logo-mark" viewBox="0 0 44 40" fill="none" aria-hidden="true">
              <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Universidad <strong>V1</strong></span>
          </a>
          <div className="nav-actions">
            <a href="/" className="nav-link">← Volver</a>
            <a href="/register" className="btn btn-primary">Comenzar gratis</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="tut-hero">
        <div className="tut-hero-glow" aria-hidden="true"></div>
        <div className="container">
          <div className="tut-hero-content">
            <div className="badge">TUTORIAL</div>
            <h1 className="tut-title">De cero a estudiante<br /><span className="accent">organizado en 5 minutos.</span></h1>
            <p className="tut-subtitle">
              4 pasos. Sin configuración complicada. Al final del tutorial
              ya tendrás tu primer plan de estudio con IA listo.
            </p>
            <div className="tut-steps-nav">
              <a href="#paso-1" className="step-nav-pill active" data-step="1">01 Registro</a>
              <a href="#paso-2" className="step-nav-pill" data-step="2">02 Ramos</a>
              <a href="#paso-3" className="step-nav-pill" data-step="3">03 Archivos</a>
              <a href="#paso-4" className="step-nav-pill" data-step="4">04 Tutor IA</a>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 1 */}
      <section className="tut-step" id="paso-1">
        <div className="container tut-step-inner">
          <div className="tut-step-text reveal-left">
            <div className="step-badge">PASO 01</div>
            <h2>Crea tu cuenta.<br />En 60 segundos.</h2>
            <p>
              Ve a <strong>universidadv1.com</strong> y regístrate con tu email.
              No necesitas tarjeta de crédito — la beta es 100% gratuita.
            </p>
            <p>
              Puedes entrar con email y contraseña. Una vez dentro, ves tu
              panel principal vacío y listo para configurar.
            </p>
            <div className="tut-tip">
              <span className="tip-icon">💡</span>
              <span>Usa tu email universitario para facilitar el acceso entre dispositivos.</span>
            </div>
            <a href="/register" className="btn btn-primary">Ir a crear cuenta →</a>
          </div>
          <div className="tut-step-visual reveal-right">
            <div className="mockup-card">
              <div className="mockup-bar">
                <div className="mockup-dots">
                  <span className="md red"></span><span className="md yellow"></span><span className="md green"></span>
                </div>
                <div className="mockup-url">universidadv1.com</div>
              </div>
              <div className="mockup-body login-screen">
                <div className="login-logo">
                  <svg viewBox="0 0 44 40" fill="none" width="36" height="32">
                    <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
                    <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
                    <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="login-brand">Universidad <strong>V1</strong></span>
                </div>
                <div className="login-form">
                  <div className="form-field">
                    <label>Email</label>
                    <div className="form-input">tu@email.com</div>
                  </div>
                  <div className="form-field">
                    <label>Contraseña</label>
                    <div className="form-input password">••••••••</div>
                  </div>
                  <div className="form-btn">Crear cuenta gratis</div>
                  <div className="form-note">Sin tarjeta · Sin costo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2 */}
      <section className="tut-step tut-step--alt" id="paso-2">
        <div className="container tut-step-inner tut-step-inner--reversed">
          <div className="tut-step-visual reveal-left">
            <div className="mockup-card">
              <div className="mockup-bar">
                <div className="mockup-dots">
                  <span className="md red"></span><span className="md yellow"></span><span className="md green"></span>
                </div>
                <div className="mockup-url">universidadv1.com / ramos</div>
              </div>
              <div className="mockup-body">
                <div className="mock-section-label">MIS RAMOS</div>
                <div className="mock-ramo-form">
                  <div className="mock-field-row">
                    <div className="mock-field-label">Nombre del ramo</div>
                    <div className="mock-field-input typing">Cálculo II<span className="cursor">|</span></div>
                  </div>
                  <div className="mock-field-row">
                    <div className="mock-field-label">Módulos de evaluación</div>
                    <div className="mock-modules">
                      <div className="mock-module filled">Parcial 1 · 25%</div>
                      <div className="mock-module filled">Parcial 2 · 25%</div>
                      <div className="mock-module filled">Final · 40%</div>
                      <div className="mock-module filled">Tareas · 10%</div>
                    </div>
                  </div>
                  <div className="mock-add-btn">+ Agregar ramo</div>
                </div>
                <div className="mock-ramos-list">
                  <div className="mock-ramo-item">
                    <span className="mock-ramo-dot color-1"></span>
                    <span>Cálculo II</span>
                    <span className="mock-ramo-check">✓</span>
                  </div>
                  <div className="mock-ramo-item">
                    <span className="mock-ramo-dot color-2"></span>
                    <span>Estadística</span>
                    <span className="mock-ramo-check">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tut-step-text reveal-right">
            <div className="step-badge">PASO 02</div>
            <h2>Agrega tus ramos<br />del semestre.</h2>
            <p>
              Para cada ramo que llevas actualmente, ingresa el nombre
              y define los módulos de evaluación con sus ponderaciones.
            </p>
            <p>
              Por ejemplo: Parcial 1 (25%), Parcial 2 (25%), Examen (40%), Tareas (10%).
              El sistema calculará tu promedio automáticamente.
            </p>
            <div className="tut-tip">
              <span className="tip-icon">💡</span>
              <span>Puedes agregar el horario de cada ramo para que aparezca en tu calendario semanal.</span>
            </div>
            <div className="tut-features-mini">
              <div className="tfm-item"><span className="tfm-check">✓</span> Temario con unidades</div>
              <div className="tfm-item"><span className="tfm-check">✓</span> Módulos de evaluación</div>
              <div className="tfm-item"><span className="tfm-check">✓</span> Horario semanal</div>
              <div className="tfm-item"><span className="tfm-check">✓</span> Control de asistencia</div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3 */}
      <section className="tut-step" id="paso-3">
        <div className="container tut-step-inner">
          <div className="tut-step-text reveal-left">
            <div className="step-badge">PASO 03</div>
            <h2>Sube tus archivos.<br />La IA los organiza.</h2>
            <p>
              Para cada ramo, sube los archivos que tienes: apuntes en PDF,
              presentaciones, guías de ejercicios, lo que sea. La IA los
              lee y los clasifica automáticamente.
            </p>
            <p>
              Estos archivos son los que usa el tutor de IA para preparar
              tus sesiones de estudio. Sin archivos, el tutor trabaja con
              conocimiento general — con archivos, trabaja con <em>tu</em> material.
            </p>
            <div className="tut-tip">
              <span className="tip-icon">🚀</span>
              <span>Mientras más archivos subas, más personalizado es el plan de estudio que genera el tutor.</span>
            </div>
          </div>
          <div className="tut-step-visual reveal-right">
            <div className="mockup-card">
              <div className="mockup-bar">
                <div className="mockup-dots">
                  <span className="md red"></span><span className="md yellow"></span><span className="md green"></span>
                </div>
                <div className="mockup-url">Cálculo II / Archivos</div>
              </div>
              <div className="mockup-body">
                <div className="mock-section-label">ARCHIVOS — CÁLCULO II</div>
                <div className="upload-zone">
                  <div className="upload-icon">↑</div>
                  <div className="upload-text">Arrastra tus archivos aquí</div>
                  <div className="upload-sub">PDF, PPT, DOCX · Máx. 50MB</div>
                </div>
                <div className="file-list">
                  <div className="file-item">
                    <div className="file-icon pdf">PDF</div>
                    <div className="file-info">
                      <div className="file-name">Apuntes_Unidad2.pdf</div>
                      <div className="file-meta">2.4 MB · Clasificado por IA ✓</div>
                    </div>
                  </div>
                  <div className="file-item">
                    <div className="file-icon pdf">PDF</div>
                    <div className="file-info">
                      <div className="file-name">Ejercicios_Integrales.pdf</div>
                      <div className="file-meta">1.1 MB · Clasificado por IA ✓</div>
                    </div>
                  </div>
                  <div className="file-item uploading">
                    <div className="file-icon ppt">PPT</div>
                    <div className="file-info">
                      <div className="file-name">Clase12_Derivadas.pptx</div>
                      <div className="file-progress">
                        <div className="progress-bar"><div className="progress-fill" style={{width:'65%'}}></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 4 */}
      <section className="tut-step tut-step--alt" id="paso-4">
        <div className="container tut-step-inner tut-step-inner--reversed">
          <div className="tut-step-visual reveal-left">
            <div className="mockup-card ia-card">
              <div className="mockup-bar">
                <div className="mockup-dots">
                  <span className="md red"></span><span className="md yellow"></span><span className="md green"></span>
                </div>
                <div className="mockup-url">Tutor IA — Cálculo II</div>
              </div>
              <div className="mockup-body chat-body">
                <div className="chat-messages">
                  <div className="chat-row bot">
                    <div className="chat-av">IA</div>
                    <div className="chat-bbl">
                      Analicé tus 3 archivos de Cálculo II. Tu prueba es en <strong>4 días</strong>. Armé tu plan de estudio.
                    </div>
                  </div>
                  <div className="plan-preview">
                    <div className="pp-row"><span className="pp-day">Hoy</span><span>Integración por partes · 45 min</span></div>
                    <div className="pp-row"><span className="pp-day">Mañana</span><span>Integrales impropias · 40 min</span></div>
                    <div className="pp-row"><span className="pp-day">Jue</span><span>Ejercitación práctica · 50 min</span></div>
                    <div className="pp-row"><span className="pp-day">Vie AM</span><span>Repaso estratégico · 25 min</span></div>
                  </div>
                  <div className="chat-row bot">
                    <div className="chat-av">IA</div>
                    <div className="chat-bbl">¿Empezamos con la Sesión 1 ahora?</div>
                  </div>
                  <div className="chat-row user">
                    <div className="chat-bbl user-bbl">Sí, empecemos</div>
                  </div>
                </div>
                <div className="chat-input-row">
                  <div className="chat-input-mock">Escribe tu respuesta...</div>
                  <button className="chat-send">→</button>
                </div>
              </div>
            </div>
          </div>
          <div className="tut-step-text reveal-right">
            <div className="step-badge">PASO 04</div>
            <h2>El tutor planifica.<br />Tú estudias.</h2>
            <p>
              Selecciona un ramo y activa el tutor de IA. En segundos,
              analiza tus archivos, detecta tu prueba o entrega más próxima
              y genera un plan de estudio completo.
            </p>
            <p>
              El tutor guía cada sesión usando técnicas comprobadas por
              la psicología cognitiva — adapta el ritmo a cuánto tiempo
              tienes disponible antes de la evaluación.
            </p>
            <div className="ia-pillars">
              <div className="ia-pillar">
                <div className="ia-pillar-icon">📅</div>
                <div>
                  <strong>Plan personalizado</strong>
                  <p>Basado en tus archivos, fechas y tiempo disponible.</p>
                </div>
              </div>
              <div className="ia-pillar">
                <div className="ia-pillar-icon">🧠</div>
                <div>
                  <strong>Ciencia cognitiva</strong>
                  <p>Repetición espaciada, práctica activa, elaboración profunda.</p>
                </div>
              </div>
              <div className="ia-pillar">
                <div className="ia-pillar-icon">⚡</div>
                <div>
                  <strong>Adaptable a cualquier plazo</strong>
                  <p>¿Prueba mañana? ¿Entrega en una semana? El tutor se ajusta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tut-final">
        <div className="tut-final-glow" aria-hidden="true"></div>
        <div className="container tut-final-inner reveal-scale">
          <svg className="cta-mark" viewBox="0 0 44 40" fill="none" aria-hidden="true">
            <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
            <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
            <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h2 className="tut-final-title">Listo. Ahora a organizarte.</h2>
          <p className="tut-final-sub">
            5 minutos para configurar. El resto del semestre, estudiando mejor.
          </p>
          <a href="/register" className="btn btn-primary btn-large">
            Crear cuenta gratis →
          </a>
          <div className="tut-final-meta">Sin tarjeta · Beta gratuita · Hecho en Chile 🇨🇱</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <a href="/" className="logo logo-footer">
            <svg className="logo-mark" viewBox="0 0 44 40" fill="none">
              <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Universidad <strong>V1</strong></span>
          </a>
          <div className="footer-links">
            <a href="/">Inicio</a>
            <span>·</span>
            <a href="https://instagram.com/universidadv1" target="_blank" rel="noopener noreferrer">@universidadv1</a>
          </div>
          <div className="footer-copy">© 2026 Universidad V1.</div>
        </div>
      </footer>
    </>
  );
}
