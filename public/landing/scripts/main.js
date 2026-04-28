/* ═══════════════════════════════════════════════════════
   Universidad V1 — Landing scripts
   ═══════════════════════════════════════════════════════ */

/* ─── SCROLL PROGRESS BAR ───────────────────────────────── */
const progressBar = document.getElementById('scrollProgress');
function updateProgress() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

/* ─── NAV SCROLL STATE ─────────────────────────────────── */
const nav = document.getElementById('nav');
function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', updateNav, { passive: true });

/* ─── MOBILE HAMBURGER ─────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
hamburger?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});
document.addEventListener('click', (e) => {
  if (!nav.contains(e.target)) nav.classList.remove('open');
});

/* ─── HERO PARALLAX (dot grid) ──────────────────────────── */
const dotGrid = document.querySelector('.dot-grid');
if (dotGrid && window.matchMedia('(min-width: 768px)').matches) {
  window.addEventListener('scroll', () => {
    dotGrid.style.transform = `translateY(${window.scrollY * 0.25}px)`;
  }, { passive: true });
}

/* ─── APP CAROUSEL ──────────────────────────────────────── */
const screens    = document.querySelectorAll('.app-screen');
const cdots      = document.querySelectorAll('.cdot');
const appTabs    = document.querySelectorAll('.app-tab');
let current      = 0;
let autoTimer    = null;
const INTERVAL   = 4200;

function goToScreen(n, resetTimer = true) {
  if (n === current) return;

  // Exit current
  screens[current].classList.add('exiting');
  const exitIdx = current;
  setTimeout(() => screens[exitIdx].classList.remove('exiting'), 500);
  screens[current].classList.remove('active');

  // Deactivate dots/tabs
  cdots[current].classList.remove('active');
  appTabs[current]?.classList.remove('active');

  current = ((n % screens.length) + screens.length) % screens.length;

  // Activate new
  screens[current].classList.add('active');
  cdots[current].classList.add('active');
  appTabs[current]?.classList.add('active');

  if (resetTimer) {
    clearInterval(autoTimer);
    autoTimer = setInterval(advance, INTERVAL);
  }
}

function advance() {
  goToScreen(current + 1, false);
}

// Dot clicks
cdots.forEach((dot, i) => {
  dot.addEventListener('click', () => goToScreen(i));
});

// Tab clicks
appTabs.forEach((tab, i) => {
  tab.addEventListener('click', () => goToScreen(i));
});

// Start auto-advance
autoTimer = setInterval(advance, INTERVAL);

// Pause on hover
const appWindow = document.getElementById('appWindow');
appWindow?.addEventListener('mouseenter', () => clearInterval(autoTimer));
appWindow?.addEventListener('mouseleave', () => {
  autoTimer = setInterval(advance, INTERVAL);
});

/* ─── APP WINDOW 3D PARALLAX ────────────────────────────── */
const heroVisual = document.querySelector('.hero-visual');
if (appWindow && heroVisual && window.matchMedia('(min-width: 768px)').matches) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    appWindow.style.transform = `
      perspective(900px)
      rotateY(${x * -10}deg)
      rotateX(${y *  5}deg)
      translateY(-4px)
    `;
  });
  heroVisual.addEventListener('mouseleave', () => {
    appWindow.style.transform = '';
  });
}

/* ─── INTERSECTION OBSERVER — SCROLL REVEALS ────────────── */
const REVEAL_SELECTORS = [
  '.reveal-up', '.reveal-left', '.reveal-right', '.reveal-scale',
  '.reveal-clip', '.reveal-line'
];

// Safari has a bug with negative rootMargin — use threshold only
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(REVEAL_SELECTORS.join(',')).forEach(el => {
  revealObs.observe(el);
});

/* ─── STAGGER CHILDREN DYNAMICALLY ─────────────────────── */
document.querySelectorAll('.features-grid, .ia-benefits').forEach(grid => {
  grid.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach((card, i) => {
    card.style.transitionDelay = `${i * 90}ms`;
  });
});

/* ─── MAGNETIC BUTTONS ──────────────────────────────────── */
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width  / 2;
    const y = e.clientY - rect.top  - rect.height / 2;
    btn.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* ─── IA DEMO WINDOW PARALLAX ───────────────────────────── */
const iaDemoW = document.querySelector('.ia-demo-window');
if (iaDemoW && window.matchMedia('(min-width: 1024px)').matches) {
  const iaCentral = document.querySelector('.ia-central');
  window.addEventListener('scroll', () => {
    if (!iaCentral) return;
    const rect = iaCentral.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    const progress = 1 - (rect.top / window.innerHeight);
    iaDemoW.style.transform = `translateY(${(progress - 0.5) * 20}px)`;
  }, { passive: true });
}

/* ─── FLOATING BADGES STAGGER ───────────────────────────── */
document.querySelectorAll('.ia-badge-float').forEach((badge, i) => {
  badge.style.animationDelay = `${i * 1.5}s`;
});

/* ─── HOW-STEP HOVER NUMBER COLOR ──────────────────────── */
document.querySelectorAll('.how-step').forEach(step => {
  const num = step.querySelector('.how-num');
  if (!num) return;
  step.addEventListener('mouseenter', () => {
    num.style.webkitTextStrokeColor = 'var(--accent-light)';
  });
  step.addEventListener('mouseleave', () => {
    num.style.webkitTextStrokeColor = '';
  });
});

/* ─── IA DEMO ANIMATION ─────────────────────────────────── */
(function runDemoAnimation() {
  const win = document.getElementById('iaDemoWindow');
  if (!win) return;

  // Elements
  const demoForm    = document.getElementById('demoForm');
  const dfiProgress = document.getElementById('dfiProgress');
  const dfi2        = document.getElementById('dfi2');
  const dfiCheck    = document.getElementById('dfiCheck');
  const dlOpts      = document.querySelectorAll('.dl-opt');
  const genBtn      = document.getElementById('demoGenBtn');
  const genBtnText  = document.getElementById('genBtnText');
  const genArrow    = document.getElementById('genArrow');
  const demoTyping  = document.getElementById('demoTyping');
  const demoResp    = document.getElementById('demoResponse');
  const rpItems     = document.querySelectorAll('.ia-rp-item');
  const startBtn    = document.getElementById('demoStartBtn');
  const statusDot   = win.querySelector('.dw-dot');
  const statusText  = document.getElementById('demoStatusText');

  let loopTimer = null;
  let running   = false;

  function setStatus(text, isLoading) {
    statusText.textContent = text;
    statusText.className   = 'dw-status-text' + (isLoading ? ' loading' : '');
    statusDot.className    = 'dw-dot' + (isLoading ? ' loading' : '');
  }

  function resetState() {
    // Form visible
    demoForm.classList.remove('fading');
    demoForm.style.display = '';
    // File 2 reset
    dfi2.classList.remove('done');
    dfiProgress.style.width = '0%';
    dfiCheck.textContent = '···';
    dfiCheck.className = 'dfi-check pending';
    // Deadline pills
    dlOpts.forEach(o => o.classList.remove('selected', 'hovered', 'visible'));
    // Button
    genBtn.disabled = true;
    genBtn.classList.remove('ready', 'clicking');
    genBtnText.textContent = 'Generar plan de estudio';
    // Hide response / typing
    demoTyping.classList.add('hidden');
    demoResp.classList.add('hidden');
    // Plan rows
    rpItems.forEach(r => r.classList.remove('visible'));
    startBtn.classList.remove('visible');
    // Status
    setStatus('Listo', false);
  }

  function animate() {
    resetState();

    const T = (ms) => new Promise(r => setTimeout(r, ms));

    async function run() {
      // Phase 1: upload file 2 (progress bar)
      await T(400);
      let w = 0;
      const step = () => {
        if (w >= 100) {
          dfiProgress.style.width = '100%';
          return;
        }
        w = Math.min(100, w + (w < 60 ? 2.5 : 1.2));
        dfiProgress.style.width = w + '%';
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      // Phase 2: file done
      await T(1600);
      dfiCheck.textContent = '✓';
      dfiCheck.className   = 'dfi-check ok';
      dfi2.classList.add('done');
      dfi2.style.borderLeft = '2px solid var(--accent)';

      // Phase 3: deadline pills appear
      await T(700);
      for (let i = 0; i < dlOpts.length; i++) {
        await T(i === 0 ? 0 : 180);
        dlOpts[i].classList.add('visible');
      }

      // Phase 4: hover effect on "4 días" then select
      await T(500);
      dlOpts[2].classList.add('hovered');
      await T(400);
      dlOpts[2].classList.remove('hovered');
      dlOpts[2].classList.add('selected');
      genBtn.disabled = false;
      genBtn.classList.add('ready');

      // Phase 5: click button
      await T(1200);
      genBtn.classList.add('clicking');
      setStatus('Analizando...', true);
      await T(300);
      genBtnText.textContent = 'Generando plan...';

      // Phase 6: fade form, show typing
      await T(800);
      demoForm.classList.add('fading');
      await T(420);
      demoForm.style.display = 'none';
      demoTyping.classList.remove('hidden');

      // Phase 7: show response
      await T(1500);
      demoTyping.classList.add('hidden');
      demoResp.classList.remove('hidden');
      setStatus('Plan listo', false);

      // Phase 8: reveal plan rows
      for (let i = 0; i < rpItems.length; i++) {
        await T(i === 0 ? 200 : 380);
        rpItems[i].classList.add('visible');
      }

      // Phase 9: start button
      await T(500);
      startBtn.classList.add('visible');

      // Phase 10: hold, then loop
      await T(3800);
      animate();
    }

    run();
  }

  // Start when window enters viewport
  const triggerObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !running) {
        running = true;
        animate();
      }
    });
  }, { threshold: 0.25 });

  triggerObs.observe(win);
})();

/* ─── SECTION ACTIVE HIGHLIGHT ──────────────────────────── */
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
sections.forEach(s => sectionObs.observe(s));

/* ─── MARQUEE SPEED ON HOVER ─────────────────────────────── */
const marqueeTrack = document.querySelector('.ia-marquee-track');
const iaMarquee    = document.querySelector('.ia-marquee');
iaMarquee?.addEventListener('mouseenter', () => {
  if (marqueeTrack) marqueeTrack.style.animationPlayState = 'paused';
});
iaMarquee?.addEventListener('mouseleave', () => {
  if (marqueeTrack) marqueeTrack.style.animationPlayState = 'running';
});

/* ─── CHAT TYPING SIMULATION (screen-3) ─────────────────── */
function simulateTyping() {
  const screen3 = document.getElementById('screen-3');
  if (!screen3) return;
  const bubbles = screen3.querySelectorAll('.chat-bubble');
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

// Re-trigger on screen change
const originalGoTo = goToScreen;
// Monkey-patch to trigger typing on screen 3
function afterScreenChange(n) {
  if (n === 3 || current === 3) {
    setTimeout(simulateTyping, 200);
  }
}
// Watch for when screen 3 becomes active
const chatObs = new MutationObserver(() => {
  const s3 = document.getElementById('screen-3');
  if (s3?.classList.contains('active')) simulateTyping();
});
const s3el = document.getElementById('screen-3');
if (s3el) chatObs.observe(s3el, { attributes: true, attributeFilter: ['class'] });
