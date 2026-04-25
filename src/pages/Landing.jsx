import { useEffect } from 'react';
import '../styles/landing-tokens.css';
import '../styles/landing.css';

export default function Landing() {
  useEffect(() => {
    let destroyed = false;
    const observers = [];
    let autoTimer = null;

    /* ─── SCROLL PROGRESS BAR ─────────────────────────────── */
    const progressBar = document.getElementById('scrollProgress');
    function updateProgress() {
      if (!progressBar) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });

    /* ─── NAV SCROLL STATE ───────────────────────────────── */
    const nav = document.getElementById('nav');
    function updateNav() {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }
    window.addEventListener('scroll', updateNav, { passive: true });

    /* ─── MOBILE HAMBURGER ───────────────────────────────── */
    const hamburger = document.getElementById('hamburger');
    function handleHamburger() {
      if (!nav) return;
      const open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open);
    }
    function handleClickOutside(e) {
      if (nav && !nav.contains(e.target)) nav.classList.remove('open');
    }
    hamburger?.addEventListener('click', handleHamburger);
    document.addEventListener('click', handleClickOutside);

    /* ─── HERO PARALLAX (dot grid) ───────────────────────── */
    const dotGrid = document.querySelector('.dot-grid');
    function handleDotParallax() {
      if (dotGrid) dotGrid.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    }
    if (dotGrid && window.matchMedia('(min-width: 768px)').matches) {
      window.addEventListener('scroll', handleDotParallax, { passive: true });
    }

    /* ─── APP CAROUSEL ───────────────────────────────────── */
    const screens = document.querySelectorAll('.app-screen');
    const cdots = document.querySelectorAll('.cdot');
    const appTabs = document.querySelectorAll('.app-tab');
    let current = 0;
    const INTERVAL = 4200;

    function goToScreen(n, resetTimer = true) {
      if (n === current || screens.length === 0) return;
      screens[current].classList.add('exiting');
      const exitIdx = current;
      setTimeout(() => screens[exitIdx]?.classList.remove('exiting'), 500);
      screens[current].classList.remove('active');
      cdots[current]?.classList.remove('active');
      appTabs[current]?.classList.remove('active');
      current = ((n % screens.length) + screens.length) % screens.length;
      screens[current].classList.add('active');
      cdots[current]?.classList.add('active');
      appTabs[current]?.classList.add('active');
      if (resetTimer) {
        clearInterval(autoTimer);
        autoTimer = setInterval(advance, INTERVAL);
      }
    }

    function advance() { goToScreen(current + 1, false); }

    cdots.forEach((dot, i) => dot.addEventListener('click', () => goToScreen(i)));
    appTabs.forEach((tab, i) => tab.addEventListener('click', () => goToScreen(i)));
    autoTimer = setInterval(advance, INTERVAL);

    const appWindow = document.getElementById('appWindow');
    function pauseCarousel() { clearInterval(autoTimer); }
    function resumeCarousel() { autoTimer = setInterval(advance, INTERVAL); }
    appWindow?.addEventListener('mouseenter', pauseCarousel);
    appWindow?.addEventListener('mouseleave', resumeCarousel);

    /* ─── APP WINDOW 3D PARALLAX ─────────────────────────── */
    const heroVisual = document.querySelector('.hero-visual');
    function handleAppParallax(e) {
      if (!appWindow) return;
      const rect = heroVisual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      appWindow.style.transform = `
        perspective(900px)
        rotateY(${x * -10}deg)
        rotateX(${y * 5}deg)
        translateY(-4px)
      `;
    }
    function resetAppParallax() {
      if (appWindow) appWindow.style.transform = '';
    }
    if (appWindow && heroVisual && window.matchMedia('(min-width: 768px)').matches) {
      heroVisual.addEventListener('mousemove', handleAppParallax);
      heroVisual.addEventListener('mouseleave', resetAppParallax);
    }

    /* ─── INTERSECTION OBSERVER — SCROLL REVEALS ─────────── */
    const REVEAL_SELECTORS = [
      '.reveal-up', '.reveal-left', '.reveal-right', '.reveal-scale', '.reveal-line',
    ];
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -56px 0px' });
    observers.push(revealObs);

    document.querySelectorAll(REVEAL_SELECTORS.join(',')).forEach(el => revealObs.observe(el));

    /* ─── STAGGER CHILDREN ──────────────────────────────── */
    document.querySelectorAll('.features-grid, .ia-benefits').forEach(grid => {
      grid.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach((card, i) => {
        card.style.transitionDelay = `${i * 90}ms`;
      });
    });

    /* ─── MAGNETIC BUTTONS ──────────────────────────────── */
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    /* ─── IA DEMO WINDOW PARALLAX ───────────────────────── */
    const iaDemoW = document.querySelector('.ia-demo-window');
    function handleIAParallax() {
      if (!iaDemoW) return;
      const iaCentral = document.querySelector('.ia-central');
      if (!iaCentral) return;
      const rect = iaCentral.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      const progress = 1 - (rect.top / window.innerHeight);
      iaDemoW.style.transform = `translateY(${(progress - 0.5) * 20}px)`;
    }
    if (iaDemoW && window.matchMedia('(min-width: 1024px)').matches) {
      window.addEventListener('scroll', handleIAParallax, { passive: true });
    }

    /* ─── FLOATING BADGES STAGGER ───────────────────────── */
    document.querySelectorAll('.ia-badge-float').forEach((badge, i) => {
      badge.style.animationDelay = `${i * 1.5}s`;
    });

    /* ─── HOW-STEP HOVER NUMBER COLOR ──────────────────── */
    document.querySelectorAll('.how-step').forEach(step => {
      const num = step.querySelector('.how-num');
      if (!num) return;
      step.addEventListener('mouseenter', () => { num.style.webkitTextStrokeColor = 'var(--accent-light)'; });
      step.addEventListener('mouseleave', () => { num.style.webkitTextStrokeColor = ''; });
    });

    /* ─── IA DEMO ANIMATION ─────────────────────────────── */
    const iaDemoWindow = document.getElementById('iaDemoWindow');
    if (iaDemoWindow) {
      const demoForm    = document.getElementById('demoForm');
      const dfiProgress = document.getElementById('dfiProgress');
      const dfi2        = document.getElementById('dfi2');
      const dfiCheck    = document.getElementById('dfiCheck');
      const dlOpts      = document.querySelectorAll('.dl-opt');
      const genBtn      = document.getElementById('demoGenBtn');
      const genBtnText  = document.getElementById('genBtnText');
      const demoTyping  = document.getElementById('demoTyping');
      const demoResp    = document.getElementById('demoResponse');
      const rpItems     = document.querySelectorAll('.ia-rp-item');
      const startBtn    = document.getElementById('demoStartBtn');
      const statusDot   = iaDemoWindow.querySelector('.dw-dot');
      const statusText  = document.getElementById('demoStatusText');

      let demoRunning = false;

      function setStatus(text, isLoading) {
        if (!statusText || !statusDot) return;
        statusText.textContent = text;
        statusText.className = 'dw-status-text' + (isLoading ? ' loading' : '');
        statusDot.className = 'dw-dot' + (isLoading ? ' loading' : '');
      }

      function resetState() {
        if (!demoForm) return;
        demoForm.classList.remove('fading');
        demoForm.style.display = '';
        if (dfi2) dfi2.classList.remove('done');
        if (dfiProgress) dfiProgress.style.width = '0%';
        if (dfiCheck) { dfiCheck.textContent = '···'; dfiCheck.className = 'dfi-check pending'; }
        dlOpts.forEach(o => o.classList.remove('selected', 'hovered', 'visible'));
        if (genBtn) { genBtn.disabled = true; genBtn.classList.remove('ready', 'clicking'); }
        if (genBtnText) genBtnText.textContent = 'Generar plan de estudio';
        if (demoTyping) demoTyping.classList.add('hidden');
        if (demoResp) demoResp.classList.add('hidden');
        rpItems.forEach(r => r.classList.remove('visible'));
        if (startBtn) startBtn.classList.remove('visible');
        setStatus('Listo', false);
      }

      function animate() {
        if (destroyed) return;
        resetState();

        const T = (ms) => new Promise(r => setTimeout(r, ms));

        async function run() {
          await T(400);
          let w = 0;
          const step = () => {
            if (destroyed) return;
            if (w >= 100) { if (dfiProgress) dfiProgress.style.width = '100%'; return; }
            w = Math.min(100, w + (w < 60 ? 2.5 : 1.2));
            if (dfiProgress) dfiProgress.style.width = w + '%';
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);

          await T(1600);
          if (destroyed) return;
          if (dfiCheck) { dfiCheck.textContent = '✓'; dfiCheck.className = 'dfi-check ok'; }
          if (dfi2) { dfi2.classList.add('done'); dfi2.style.borderLeft = '2px solid var(--accent)'; }

          await T(700);
          if (destroyed) return;
          for (let i = 0; i < dlOpts.length; i++) {
            await T(i === 0 ? 0 : 180);
            if (destroyed) return;
            dlOpts[i].classList.add('visible');
          }

          await T(500);
          if (destroyed) return;
          dlOpts[2]?.classList.add('hovered');
          await T(400);
          if (destroyed) return;
          dlOpts[2]?.classList.remove('hovered');
          dlOpts[2]?.classList.add('selected');
          if (genBtn) { genBtn.disabled = false; genBtn.classList.add('ready'); }

          await T(1200);
          if (destroyed) return;
          if (genBtn) genBtn.classList.add('clicking');
          setStatus('Analizando...', true);
          await T(300);
          if (genBtnText) genBtnText.textContent = 'Generando plan...';

          await T(800);
          if (destroyed) return;
          if (demoForm) demoForm.classList.add('fading');
          await T(420);
          if (destroyed) return;
          if (demoForm) demoForm.style.display = 'none';
          if (demoTyping) demoTyping.classList.remove('hidden');

          await T(1500);
          if (destroyed) return;
          if (demoTyping) demoTyping.classList.add('hidden');
          if (demoResp) demoResp.classList.remove('hidden');
          setStatus('Plan listo', false);

          for (let i = 0; i < rpItems.length; i++) {
            await T(i === 0 ? 200 : 380);
            if (destroyed) return;
            rpItems[i].classList.add('visible');
          }

          await T(500);
          if (destroyed) return;
          if (startBtn) startBtn.classList.add('visible');

          await T(3800);
          if (!destroyed) animate();
        }

        run();
      }

      const triggerObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !demoRunning) {
            demoRunning = true;
            animate();
          }
        });
      }, { threshold: 0.25 });
      observers.push(triggerObs);
      triggerObs.observe(iaDemoWindow);
    }

    /* ─── SECTION ACTIVE HIGHLIGHT ──────────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.4 });
    observers.push(sectionObs);
    sections.forEach(s => sectionObs.observe(s));

    /* ─── MARQUEE PAUSE ON HOVER ────────────────────────── */
    const marqueeTrack = document.querySelector('.ia-marquee-track');
    const iaMarquee = document.querySelector('.ia-marquee');
    function pauseMarquee() { if (marqueeTrack) marqueeTrack.style.animationPlayState = 'paused'; }
    function resumeMarquee() { if (marqueeTrack) marqueeTrack.style.animationPlayState = 'running'; }
    iaMarquee?.addEventListener('mouseenter', pauseMarquee);
    iaMarquee?.addEventListener('mouseleave', resumeMarquee);

    /* ─── CHAT TYPING SIMULATION (screen-3) ─────────────── */
    const s3el = document.getElementById('screen-3');
    function simulateTyping() {
      if (!s3el) return;
      const bubbles = s3el.querySelectorAll('.chat-bubble');
      bubbles.forEach((b, i) => {
        b.style.opacity = '0';
        b.style.transform = 'translateY(8px)';
        b.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => {
          b.style.opacity = '1';
          b.style.transform = 'translateY(0)';
        }, i * 600 + 200);
      });
    }
    const chatObs = new MutationObserver(() => {
      if (s3el?.classList.contains('active')) simulateTyping();
    });
    observers.push(chatObs);
    if (s3el) chatObs.observe(s3el, { attributes: true, attributeFilter: ['class'] });

    /* ─── CLEANUP ──────────────────────────────────────── */
    return () => {
      destroyed = true;
      clearInterval(autoTimer);
      observers.forEach(obs => obs.disconnect());
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('scroll', updateNav);
      window.removeEventListener('scroll', handleDotParallax);
      window.removeEventListener('scroll', handleIAParallax);
      document.removeEventListener('click', handleClickOutside);
      hamburger?.removeEventListener('click', handleHamburger);
      heroVisual?.removeEventListener('mousemove', handleAppParallax);
      heroVisual?.removeEventListener('mouseleave', resetAppParallax);
      appWindow?.removeEventListener('mouseenter', pauseCarousel);
      appWindow?.removeEventListener('mouseleave', resumeCarousel);
      iaMarquee?.removeEventListener('mouseenter', pauseMarquee);
      iaMarquee?.removeEventListener('mouseleave', resumeMarquee);
    };
  }, []);

  return (
    <>
      {/* Scroll progress */}
      <div className="scroll-progress" id="scrollProgress"></div>

      {/* ══ NAV ══════════════════════════════════════════════ */}
      <nav className="nav" id="nav">
        <div className="container nav-inner">
          <a href="#" className="logo">
            <svg className="logo-mark" viewBox="0 0 44 40" fill="none" aria-hidden="true">
              <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Universidad <strong>V1</strong></span>
          </a>
          <div className="nav-actions">
            <a href="/tutorial" className="nav-link">Cómo funciona</a>
            <a href="/login" className="nav-link">Iniciar sesión</a>
            <a href="/register" className="btn btn-nav">Comenzar gratis</a>
          </div>
          <button className="nav-hamburger" id="hamburger" aria-label="Abrir menú">
            <span></span><span></span>
          </button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="hero" id="hero">
        <div className="hero-glow" aria-hidden="true"></div>
        <div className="dot-grid" aria-hidden="true"></div>

        <div className="container hero-inner">
          {/* Left */}
          <div className="hero-content">
            <div className="badge float-in" style={{'--delay':'0ms'}}>BETA GRATUITA</div>
            <h1 className="hero-title">
              <span className="word-reveal" style={{'--delay':'80ms'}}>Tu universidad</span>
              <span className="word-reveal" style={{'--delay':'200ms'}}>entera,</span>
              <span className="word-reveal accent-word" style={{'--delay':'320ms'}}>en una app.</span>
            </h1>
            <p className="hero-sub float-in" style={{'--delay':'440ms'}}>
              Ramos, notas, horario y tareas — centralizados. Con un tutor de IA que
              planifica todo tu aprendizaje para que estudies menos y aprendas más.
            </p>
            <div className="hero-tags float-in" style={{'--delay':'540ms'}} aria-hidden="true">
              <span>Ramos</span><span className="dot">·</span>
              <span>Notas</span><span className="dot">·</span>
              <span>Horario</span><span className="dot">·</span>
              <span>Tutor IA</span>
            </div>
            <div className="hero-cta float-in" style={{'--delay':'620ms'}}>
              <a href="/register" className="btn btn-primary magnetic-btn">
                Comenzar gratis <span className="arrow" aria-hidden="true">→</span>
              </a>
              <a href="/tutorial" className="btn-ghost">Ver cómo funciona</a>
            </div>
            <p className="cta-note float-in" style={{'--delay':'720ms'}}>Sin tarjeta · 100% gratis en beta</p>
          </div>

          {/* Right: animated carousel */}
          <div className="hero-visual float-in" style={{'--delay':'200ms'}}>
            <div className="app-window" id="appWindow">
              <div className="app-header">
                <span className="app-dot red"></span>
                <span className="app-dot yellow"></span>
                <span className="app-dot green"></span>
                <div className="app-nav-tabs">
                  <button className="app-tab active" data-screen="0">Ramos</button>
                  <button className="app-tab" data-screen="1">Horario</button>
                  <button className="app-tab" data-screen="2">Tareas</button>
                  <button className="app-tab" data-screen="3">Tutor IA</button>
                </div>
              </div>

              <div className="app-carousel">
                {/* Screen 0: Ramos */}
                <div className="app-screen active" id="screen-0">
                  <div className="app-section-label">MIS RAMOS — SEMESTRE ACTUAL</div>
                  <div className="ramo-card">
                    <div className="ramo-tag">01</div>
                    <div className="ramo-info">
                      <div className="ramo-name">Cálculo II</div>
                      <div className="ramo-meta">Módulo Integrales · 3 eval.</div>
                    </div>
                    <div className="ramo-grade pass">5.8</div>
                  </div>
                  <div className="ramo-card">
                    <div className="ramo-tag">02</div>
                    <div className="ramo-info">
                      <div className="ramo-name">Estadística</div>
                      <div className="ramo-meta">Prueba el jue 28 abr</div>
                    </div>
                    <div className="ramo-grade warn">4.2</div>
                  </div>
                  <div className="ramo-card">
                    <div className="ramo-tag">03</div>
                    <div className="ramo-info">
                      <div className="ramo-name">Programación</div>
                      <div className="ramo-meta">Tarea entregada ✓</div>
                    </div>
                    <div className="ramo-grade pass">6.1</div>
                  </div>
                  <div className="app-upcoming">
                    <div className="upcoming-label">PRÓXIMA EVALUACIÓN</div>
                    <div className="upcoming-item">
                      <span className="upcoming-icon">⚠</span>
                      <span>Prueba Estadística — jue 28 abr</span>
                    </div>
                  </div>
                </div>

                {/* Screen 1: Horario */}
                <div className="app-screen" id="screen-1">
                  <div className="app-section-label">HORARIO — HOY, MAR 22 ABR</div>
                  <div className="schedule-list">
                    <div className="schedule-item">
                      <div className="sch-time">08:00</div>
                      <div className="sch-block color-1">
                        <div className="sch-name">Cálculo II</div>
                        <div className="sch-room">Sala J-201 · 2h</div>
                      </div>
                    </div>
                    <div className="schedule-item">
                      <div className="sch-time">10:30</div>
                      <div className="sch-block color-2">
                        <div className="sch-name">Estadística</div>
                        <div className="sch-room">Sala B-104 · 1.5h</div>
                      </div>
                    </div>
                    <div className="schedule-item">
                      <div className="sch-time">14:00</div>
                      <div className="sch-block color-3">
                        <div className="sch-name">Programación</div>
                        <div className="sch-room">Lab C-302 · 2h</div>
                      </div>
                    </div>
                  </div>
                  <div className="sch-tomorrow">
                    <div className="upcoming-label">MAÑANA — MIÉ 23 ABR</div>
                    <div className="sch-tomorrow-items">
                      <span className="sch-pill color-1">Cálculo II 09:00</span>
                      <span className="sch-pill color-2">Estadística 11:00</span>
                    </div>
                  </div>
                </div>

                {/* Screen 2: Tareas */}
                <div className="app-screen" id="screen-2">
                  <div className="app-section-label">TAREAS — PRÓXIMAS ENTREGAS</div>
                  <div className="task-list">
                    <div className="task-item urgent">
                      <div className="task-check"></div>
                      <div className="task-info">
                        <div className="task-name">Prueba Estadística</div>
                        <div className="task-due">jue 28 abr · Evaluación</div>
                      </div>
                      <div className="task-badge urgent-badge">URGENTE</div>
                    </div>
                    <div className="task-item">
                      <div className="task-check"></div>
                      <div className="task-info">
                        <div className="task-name">Informe Programación</div>
                        <div className="task-due">vie 29 abr · Tarea</div>
                      </div>
                      <div className="task-days">2d</div>
                    </div>
                    <div className="task-item">
                      <div className="task-check"></div>
                      <div className="task-info">
                        <div className="task-name">Tarea Cálculo II</div>
                        <div className="task-due">lun 2 may · Tarea</div>
                      </div>
                      <div className="task-days">5d</div>
                    </div>
                    <div className="task-item done">
                      <div className="task-check checked">✓</div>
                      <div className="task-info">
                        <div className="task-name">Control Programación</div>
                        <div className="task-due">completado</div>
                      </div>
                    </div>
                  </div>
                  <div className="task-summary">3 pendientes · 1 completada</div>
                </div>

                {/* Screen 3: Tutor IA */}
                <div className="app-screen" id="screen-3">
                  <div className="app-section-label">TUTOR IA — ESTADÍSTICA</div>
                  <div className="chat-feed">
                    <div className="chat-msg bot">
                      <div className="chat-avatar">IA</div>
                      <div className="chat-bubble">
                        Analicé tus apuntes. Tienes prueba en <strong>3 días</strong>. Ya armé tu plan de estudio.
                      </div>
                    </div>
                    <div className="chat-plan">
                      <div className="plan-row">
                        <span className="plan-day">Hoy</span>
                        <span className="plan-topic">→ Probabilidad condicional · 45 min</span>
                      </div>
                      <div className="plan-row">
                        <span className="plan-day">Mañana</span>
                        <span className="plan-topic">→ Distribuciones normales · 50 min</span>
                      </div>
                      <div className="plan-row">
                        <span className="plan-day">Jue AM</span>
                        <span className="plan-topic">→ Repaso estratégico · 30 min</span>
                      </div>
                    </div>
                    <div className="chat-msg user">
                      <div className="chat-bubble user-bubble">Empecemos</div>
                    </div>
                  </div>
                  <button className="chat-cta-btn">Iniciar sesión 1 →</button>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="carousel-dots" aria-label="Pantallas de la app">
              <button className="cdot active" data-screen="0" aria-label="Ramos"></button>
              <button className="cdot" data-screen="1" aria-label="Horario"></button>
              <button className="cdot" data-screen="2" aria-label="Tareas"></button>
              <button className="cdot" data-screen="3" aria-label="Tutor IA"></button>
            </div>
          </div>
        </div>
        <div className="hero-line" aria-hidden="true"></div>
      </section>

      {/* ══ STATS BAR ══════════════════════════════════════════ */}
      <div className="stats-bar">
        <div className="container stats-inner">
          <div className="stat-item">
            <span className="stat-num">∞</span>
            <span className="stat-label">ramos, sin límite</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">IA</span>
            <span className="stat-label">planifica por ti</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">&lt; 5</span>
            <span className="stat-label">min para configurar</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">100%</span>
            <span className="stat-label">gratuito en beta</span>
          </div>
        </div>
      </div>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header reveal-up">
            <div className="section-tag">FEATURES</div>
            <h2 className="section-title">Un solo lugar.<br />Todo lo que necesitas.</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card reveal-left">
              <div className="feature-num">01</div>
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3>Todos tus ramos,<br />organizados de verdad.</h3>
              <p>Temario, archivos y notas de cada ramo en un solo lugar. Sube tus apuntes y la IA los clasifica automáticamente.</p>
              <ul className="feature-list">
                <li>Temario con unidades y materias</li>
                <li>Calificaciones por módulo de evaluación</li>
                <li>Control de asistencia automático</li>
                <li>Archivos clasificados con IA</li>
              </ul>
            </div>

            <div className="feature-card reveal-right">
              <div className="feature-num">02</div>
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <h3>¿Vas pasando?<br />Descúbrelo al instante.</h3>
              <p>Promedio ponderado automático. Sabe exactamente si estás en zona de aprobación sin abrir una calculadora.</p>
              <ul className="feature-list">
                <li>Promedio ponderado en tiempo real</li>
                <li>Indicador de aprobación por ramo</li>
                <li>"¿Qué nota necesito para pasar?"</li>
                <li>Historial completo de evaluaciones</li>
              </ul>
            </div>

            <div className="feature-card reveal-left">
              <div className="feature-num">03</div>
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9h18M9 4v5M15 4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Tu semana entera<br />en un vistazo.</h3>
              <p>Horario semanal con colores por ramo, clases y horas libres. Sin buscar el PDF de la U cada lunes.</p>
              <ul className="feature-list">
                <li>Horario semanal visual con colores</li>
                <li>Vista semanal y mensual</li>
                <li>Sincronizado con tareas y evaluaciones</li>
                <li>Alertas de pruebas próximas</li>
              </ul>
            </div>

            <div className="feature-card reveal-right">
              <div className="feature-num">04</div>
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Nada se te<br />escapa.</h3>
              <p>Tareas, controles, entregas y pruebas — cada una en su ramo con fecha y estado. Zero recordatorios perdidos.</p>
              <ul className="feature-list">
                <li>Tareas organizadas por ramo</li>
                <li>Tarea · Evaluación · Quiz · Control</li>
                <li>Fechas de entrega siempre visibles</li>
                <li>Estado completado / pendiente</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ IA — GRAN SECCIÓN ══════════════════════════════════ */}
      <section className="ia-section" id="ia">
        <div className="ia-bg-glow ia-glow-1" aria-hidden="true"></div>
        <div className="ia-bg-glow ia-glow-2" aria-hidden="true"></div>

        <div className="container">
          {/* Big headline */}
          <div className="ia-hero reveal-up">
            <div className="section-tag">TUTOR DE IA</div>
            <h2 className="ia-big-title">
              <span className="reveal-line" style={{'--delay':'0ms'}}>El tutor que planifica</span>
              <span className="reveal-line ia-accent-line" style={{'--delay':'120ms'}}>todo tu semestre.</span>
            </h2>
            <p className="ia-lead reveal-up" style={{'--delay':'200ms'}}>
              No más adivinar qué estudiar ni cuándo. La IA analiza tus apuntes,
              conoce tus fechas y arma un plan de estudio completo y personalizado —
              basado en técnicas comprobadas por la psicología cognitiva.
            </p>
          </div>

          {/* Central visual — animated demo */}
          <div className="ia-central reveal-scale">
            <div className="ia-demo-window" id="iaDemoWindow">
              {/* Window header */}
              <div className="ia-dw-header">
                <div className="ia-dw-avatar">IA</div>
                <div className="ia-dw-info">
                  <div className="ia-dw-title">Tutor IA — Estadística</div>
                  <div className="ia-dw-subtitle">Planificación personalizada de estudio</div>
                </div>
                <div className="ia-dw-status" id="demoStatus">
                  <span className="dw-dot"></span>
                  <span className="dw-status-text" id="demoStatusText">Listo</span>
                </div>
              </div>

              {/* FORM PHASE */}
              <div className="ia-dw-form" id="demoForm">
                {/* Files */}
                <div className="ia-dw-block">
                  <div className="ia-dw-block-label">FUENTES DE ESTUDIO</div>
                  <div className="demo-file-list">
                    <div className="demo-fi done">
                      <div className="dfi-badge">PDF</div>
                      <div className="dfi-info">
                        <div className="dfi-name">Apuntes_Probabilidad.pdf</div>
                        <div className="dfi-meta">2.1 MB · Analizado</div>
                      </div>
                      <div className="dfi-check">✓</div>
                    </div>
                    <div className="demo-fi uploading" id="dfi2">
                      <div className="dfi-badge">PDF</div>
                      <div className="dfi-info">
                        <div className="dfi-name">Ejercicios_Estadística.pdf</div>
                        <div className="dfi-meta upload-meta">
                          <div className="dfi-bar"><div className="dfi-fill" id="dfiProgress"></div></div>
                        </div>
                      </div>
                      <div className="dfi-check pending" id="dfiCheck">···</div>
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                <div className="ia-dw-block" id="deadlineBlock">
                  <div className="ia-dw-block-label">¿CUÁNDO ES LA PRUEBA?</div>
                  <div className="deadline-opts" id="deadlineOpts">
                    <button className="dl-opt" id="dlo0">Mañana</button>
                    <button className="dl-opt" id="dlo1">3 días</button>
                    <button className="dl-opt" id="dlo2">4 días</button>
                    <button className="dl-opt" id="dlo3">1 semana</button>
                    <button className="dl-opt" id="dlo4">2 semanas</button>
                  </div>
                </div>

                {/* Generate */}
                <button className="ia-gen-btn" id="demoGenBtn" disabled>
                  <span id="genBtnText">Generar plan de estudio</span>
                  <span className="gen-arrow" id="genArrow">→</span>
                </button>
              </div>

              {/* TYPING INDICATOR */}
              <div className="ia-dw-typing hidden" id="demoTyping">
                <div className="ia-dw-avatar small">IA</div>
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>

              {/* RESPONSE PHASE */}
              <div className="ia-dw-response hidden" id="demoResponse">
                <div className="ia-resp-row">
                  <div className="ia-dw-avatar small">IA</div>
                  <div className="ia-resp-msg" id="respMsg">
                    Analicé tus 2 archivos. Para <strong>4 días</strong>, tu plan:
                  </div>
                </div>
                <div className="ia-resp-plan" id="respPlan">
                  <div className="ia-rp-item hidden-row" id="rp0">
                    <span className="rp-num">01</span>
                    <div className="rp-body">
                      <span className="rp-when">Hoy · 45 min</span>
                      <span className="rp-topic">Probabilidad condicional</span>
                    </div>
                  </div>
                  <div className="ia-rp-item hidden-row" id="rp1">
                    <span className="rp-num">02</span>
                    <div className="rp-body">
                      <span className="rp-when">Mañana · 40 min</span>
                      <span className="rp-topic">Distribuciones normales</span>
                    </div>
                  </div>
                  <div className="ia-rp-item hidden-row" id="rp2">
                    <span className="rp-num">03</span>
                    <div className="rp-body">
                      <span className="rp-when">Mié · 50 min</span>
                      <span className="rp-topic">Práctica de ejercicios</span>
                    </div>
                  </div>
                  <div className="ia-rp-item hidden-row" id="rp3">
                    <span className="rp-num">04</span>
                    <div className="rp-body">
                      <span className="rp-when">Jue AM · 25 min</span>
                      <span className="rp-topic">Repaso estratégico</span>
                    </div>
                  </div>
                </div>
                <button className="ia-resp-start hidden-row" id="demoStartBtn">Iniciar Sesión 1 →</button>
              </div>
            </div>

            {/* Floating badges */}
            <div className="ia-badge-float badge-f1 float-badge">
              <span className="badge-icon">🧠</span>
              <span>Psicología cognitiva</span>
            </div>
            <div className="ia-badge-float badge-f2 float-badge">
              <span className="badge-icon">⚡</span>
              <span>Personalizado a ti</span>
            </div>
            <div className="ia-badge-float badge-f3 float-badge">
              <span className="badge-icon">📅</span>
              <span>Planificación automática</span>
            </div>
          </div>

          {/* 4 benefit cards */}
          <div className="ia-benefits">
            <div className="ia-benefit-card reveal-up" style={{'--stagger':'0ms'}}>
              <div className="ia-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 12v4M12 12l2-2M12 12l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Plan automático para cada prueba</h4>
              <p>Antes de cada evaluación, la IA genera un plan de estudio completo: qué estudiar, cuándo y por cuánto tiempo. Sin adivinar.</p>
            </div>

            <div className="ia-benefit-card reveal-up" style={{'--stagger':'80ms'}}>
              <div className="ia-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Técnicas comprobadas por la psicología</h4>
              <p>Repetición espaciada, recuperación activa, elaboración profunda. Tu cerebro retiene más en menos horas de estudio.</p>
            </div>

            <div className="ia-benefit-card reveal-up" style={{'--stagger':'160ms'}}>
              <div className="ia-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>Estudia con tu propio material</h4>
              <p>La IA lee tus apuntes, PDFs y presentaciones. Te enseña con tu material de ramo — no con contenido genérico de internet.</p>
            </div>

            <div className="ia-benefit-card reveal-up" style={{'--stagger':'240ms'}}>
              <div className="ia-benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Se adapta a cualquier plazo</h4>
              <p>¿Prueba mañana? ¿Entrega en 5 días? La IA ajusta el plan a tu tiempo disponible. Siempre listo para lo que venga.</p>
            </div>
          </div>

          {/* Marquee strip */}
          <div className="ia-marquee-wrap reveal-up">
            <div className="ia-marquee">
              <div className="ia-marquee-track">
                <span>Repetición espaciada</span><span className="m-dot">·</span>
                <span>Recuperación activa</span><span className="m-dot">·</span>
                <span>Elaboración profunda</span><span className="m-dot">·</span>
                <span>Práctica de interleaving</span><span className="m-dot">·</span>
                <span>Chunking cognitivo</span><span className="m-dot">·</span>
                <span>Mapas de conocimiento</span><span className="m-dot">·</span>
                <span>Técnica Feynman</span><span className="m-dot">·</span>
                <span>Repetición espaciada</span><span className="m-dot">·</span>
                <span>Recuperación activa</span><span className="m-dot">·</span>
                <span>Elaboración profunda</span><span className="m-dot">·</span>
                <span>Práctica de interleaving</span><span className="m-dot">·</span>
                <span>Chunking cognitivo</span><span className="m-dot">·</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PAIN QUOTE ═════════════════════════════════════════ */}
      <section className="pain-section">
        <div className="container">
          <div className="pain-inner">
            <p className="pain-quote reveal-up">"¿Cuántas veces te ha pillado de sorpresa una prueba?"</p>
            <p className="pain-answer reveal-up" style={{'--delay':'200ms'}}>Universidad V1 te avisa — y te prepara — antes.</p>
          </div>
        </div>
      </section>

      {/* ══ COMO FUNCIONA ══════════════════════════════════════ */}
      <section className="how-section" id="como">
        <div className="container">
          <div className="section-header reveal-up">
            <div className="section-tag">PROCESO</div>
            <h2 className="section-title">Listo en 5 minutos.</h2>
          </div>

          <div className="how-steps">
            <div className="how-step reveal-left">
              <div className="how-num">01</div>
              <div className="how-content">
                <h3>Registra tus ramos</h3>
                <p>Agrega los ramos del semestre: nombre, créditos y módulos de evaluación. El sistema organiza todo lo demás.</p>
              </div>
            </div>
            <div className="how-connector"></div>
            <div className="how-step reveal-up">
              <div className="how-num">02</div>
              <div className="how-content">
                <h3>Sube tus archivos</h3>
                <p>PDFs, apuntes, presentaciones. La IA los lee, los clasifica por ramo y los deja listos para el tutor.</p>
              </div>
            </div>
            <div className="how-connector"></div>
            <div className="how-step reveal-right">
              <div className="how-num">03</div>
              <div className="how-content">
                <h3>El tutor planifica todo</h3>
                <p>Elige una prueba o tarea. El tutor arma tu plan de estudio completo con tus fechas y tu material real.</p>
              </div>
            </div>
            <div className="how-connector"></div>
            <div className="how-step reveal-up">
              <div className="how-num">04</div>
              <div className="how-content">
                <h3>Estudia y aprueba</h3>
                <p>Sigue el plan. Registra tus notas. El sistema actualiza tu promedio en tiempo real y te avisa de lo siguiente.</p>
              </div>
            </div>
          </div>

          <div className="how-cta reveal-up">
            <a href="/tutorial" className="btn btn-primary">Ver tutorial completo →</a>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════ */}
      <section className="final-cta">
        <div className="cta-glow" aria-hidden="true"></div>
        <div className="container">
          <div className="final-cta-inner reveal-scale">
            <svg className="cta-mark" viewBox="0 0 44 40" fill="none" aria-hidden="true">
              <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <h2 className="cta-title">
              <span className="reveal-line" style={{'--delay':'0ms'}}>Únete a la</span>
              <span className="reveal-line" style={{'--delay':'100ms'}}>beta gratuita.</span>
            </h2>
            <p className="cta-sub reveal-up" style={{'--delay':'200ms'}}>
              Sin tarjeta de crédito. Sin límites artificiales.<br />
              Solo tus ramos, organizados como se debe.
            </p>
            <a href="/register" className="btn btn-primary btn-large magnetic-btn reveal-up" style={{'--delay':'300ms'}}>
              Comenzar gratis <span className="arrow" aria-hidden="true">→</span>
            </a>
            <div className="cta-meta reveal-up" style={{'--delay':'400ms'}}>
              Hecho en Chile 🇨🇱 &nbsp;·&nbsp; Para universitarios chilenos
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="container footer-inner">
          <a href="#" className="logo logo-footer" aria-label="Universidad V1">
            <svg className="logo-mark" viewBox="0 0 44 40" fill="none" aria-hidden="true">
              <path d="M22 3L41 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <path d="M22 3L3 37" stroke="#C9A84C" strokeWidth="6" strokeLinecap="round"/>
              <line x1="7" y1="37" x2="37" y2="37" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Universidad <strong>V1</strong></span>
          </a>
          <div className="footer-links">
            <a href="/tutorial">Tutorial</a>
            <span>·</span>
            <a href="https://instagram.com/universidadv1" target="_blank" rel="noopener noreferrer">@universidadv1</a>
            <span>·</span>
            <a href="/register">Comenzar gratis</a>
          </div>
          <div className="footer-copy">© 2026 Universidad V1. Beta gratuita.</div>
        </div>
      </footer>
    </>
  );
}
