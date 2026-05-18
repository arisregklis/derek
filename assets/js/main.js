// ── Language system ────────────────────────────────────
function setLang(lang) {
  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute('data-' + lang);
    if (text) el.innerHTML = text;
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  localStorage.setItem('preferred-lang', lang);
  document.documentElement.lang = lang === 'gr' ? 'el' : 'en';
}

// ── Scroll progress bar ────────────────────────────────
function initProgressBar() {
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });
}

// ── Navbar scroll + scrollspy ──────────────────────────
function initNavbar() {
  const navbar  = document.getElementById('navbar');
  const links   = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = Array.from(links)
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  function update() {
    const scrollY = window.scrollY;

    navbar.classList.toggle('scrolled', scrollY > 40);

    let current = '';
    sections.forEach(section => {
      if (scrollY >= section.offsetTop - 120) current = '#' + section.id;
    });

    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === current);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ── Mobile menu ────────────────────────────────────────
function initMobileMenu() {
  const btn  = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', open);
    btn.setAttribute('aria-expanded', String(!open));
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ── Scroll reveal via Intersection Observer ────────────
function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ── Smooth scroll for anchor links ────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
  });
}

// ── Contact form (Formspree) ───────────────────────────
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const submit  = form?.querySelector('[type="submit"]');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submit) { submit.disabled = true; submit.style.opacity = '0.6'; }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        success.classList.remove('hidden');
        setTimeout(() => success.classList.add('hidden'), 5000);
      }
    } catch {
      /* Formspree URL not yet set — fail silently */
    } finally {
      if (submit) { submit.disabled = false; submit.style.opacity = ''; }
    }
  });
}

// ── Cinematic intro overlay ───────────────────────────
function initIntro() {
  const el = document.getElementById('site-intro');
  if (!el) return;

  // Skip entirely for reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('is-gone');
    return;
  }

  // Show once per browser session (new tab = show again, refresh = skip)
  const KEY = 'derek-intro-seen';
  if (sessionStorage.getItem(KEY)) {
    el.classList.add('is-gone');
    return;
  }

  document.body.style.overflow = 'hidden';

  const QUOTE      = '"Writing is the act of listening carefully."';
  const TYPE_SPEED = 42;
  const HOLD_MS    = 2400;

  const quoteEl    = el.querySelector('.intro-quote');
  const authorEl   = el.querySelector('.intro-author');
  const skipBtn    = el.querySelector('.intro-skip');
  const lineEl     = el.querySelector('.intro-line');
  const progressEl = el.querySelector('.intro-progress');

  // ── Canvas particles on the intro ──
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;';
  el.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let cW, cH;
  function resizeCanvas() {
    cW = canvas.width  = el.offsetWidth;
    cH = canvas.height = el.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  const pts = Array.from({ length: 50 }, () => ({
    x:     Math.random() * (cW || 1200),
    y:     Math.random() * (cH || 800),
    r:     Math.random() * 1.1 + 0.3,
    vx:    (Math.random() - 0.5) * 0.12,
    vy:    -(Math.random() * 0.16 + 0.04),
    alpha: Math.random() * 0.2 + 0.04,
  }));

  let running = true;
  function drawCanvas() {
    if (!running) return;
    ctx.clearRect(0, 0, cW, cH);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5)     { p.y = cH + 5; p.x = Math.random() * cW; }
      if (p.x < -5)     { p.x = cW + 5; }
      if (p.x > cW + 5) { p.x = -5; }
    });
    requestAnimationFrame(drawCanvas);
  }
  drawCanvas();

  // ── Dismiss ──
  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    running = false;
    sessionStorage.setItem(KEY, '1');
    document.body.style.overflow = '';
    quoteEl.classList.remove('typing');
    el.classList.add('is-exiting');
    setTimeout(() => el.classList.add('is-gone'), 1150);
  }
  skipBtn.addEventListener('click', dismiss);

  // ── Sequence ──
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {

    // 1. Draw corner ornaments
    setTimeout(() => el.classList.add('corners-visible'), 200);

    // 2. Grow top accent line
    setTimeout(() => lineEl.classList.add('grow'), 450);

    // 3. Type the quote
    quoteEl.classList.add('typing');
    let i = 0;
    function type() {
      if (dismissed) return;
      if (i < QUOTE.length) {
        quoteEl.textContent += QUOTE[i++];
        setTimeout(type, TYPE_SPEED);
      } else {
        // 4. Typing done — glow + bottom line + attribution
        quoteEl.classList.remove('typing');
        quoteEl.classList.add('glow');
        el.classList.add('line2-visible');
        setTimeout(() => authorEl.classList.add('visible'), 300);

        // 5. Progress bar
        progressEl.style.transition = `width ${HOLD_MS}ms linear`;
        progressEl.style.width = '100%';

        // 6. Auto-dismiss
        setTimeout(dismiss, HOLD_MS);
      }
    }
    setTimeout(type, 1000);
  });
}

// ── Canvas dust particles in hero ─────────────────────
function initParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.getElementById('hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const pts = Array.from({ length: 55 }, () => ({
    x:     Math.random() * (W || 1200),
    y:     Math.random() * (H || 800),
    r:     Math.random() * 1.1 + 0.3,
    vx:    (Math.random() - 0.5) * 0.14,
    vy:    -(Math.random() * 0.18 + 0.04),
    alpha: Math.random() * 0.22 + 0.05,
  }));

  let running = true;
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${p.alpha})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5)    { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5)    { p.x = W + 5; }
      if (p.x > W + 5) { p.x = -5; }
    });
    requestAnimationFrame(draw);
  }
  draw();

  // Pause when tab hidden (saves CPU)
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) draw();
  });
}

// ── Count-up animation for stats ──────────────────────
function initCountUp() {
  const els = document.querySelectorAll('.stat-number[data-target]');
  if (!els.length || !('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur    = 1600;
      const t0     = performance.now();

      (function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const v = 1 - Math.pow(1 - p, 3);
        const n = Math.round(v * target);
        el.textContent = (n >= 1000 ? n.toLocaleString() : n) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.classList.add('counted');
      })(t0);

      obs.unobserve(el);
    });
  }, { threshold: 0.6 });

  els.forEach(el => obs.observe(el));
}

// ── 3D card tilt on mouse move ─────────────────────────
function initCardTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.book-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left)  / r.width  - 0.5;
      const y  = (e.clientY - r.top)   / r.height - 0.5;
      card.style.transform   = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      card.style.transition  = 'box-shadow 200ms, border-color 200ms';
      card.style.boxShadow   = '0 32px 72px rgba(0,0,0,0.55)';
      card.style.borderColor = 'var(--c-border)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform   = '';
      card.style.boxShadow   = '';
      card.style.borderColor = '';
      card.style.transition  = 'transform 400ms cubic-bezier(0.22,1,0.36,1), box-shadow 400ms, border-color 400ms';
    });
  });
}

// ── Magnetic buttons (pull toward cursor) ─────────────
function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.btn-primary:not([type="submit"]), .bundle-btn'
  );
  targets.forEach(btn => {
    btn.style.transition = 'transform 0.4s cubic-bezier(0.22,1,0.36,1)';
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.28;
      const y = (e.clientY - r.top  - r.height / 2) * 0.42;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

// ── Mouse parallax on hero book mockups ───────────────
function initBookParallax() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero   = document.getElementById('hero');
  const books  = document.querySelectorAll('.book-mockup');
  if (!hero || !books.length) return;

  let raf = 0, tx = 0, ty = 0;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;  // -1..1
    ty = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  hero.addEventListener('mouseleave', () => {
    tx = 0; ty = 0;
    if (!raf) raf = requestAnimationFrame(apply);
  });

  function apply() {
    raf = 0;
    books.forEach((b, i) => {
      const depth = [10, 18, 12][i] || 10;
      b.style.setProperty('--parallax-x', `${tx * depth}px`);
      b.style.setProperty('--parallax-y', `${ty * depth * 0.6}px`);
    });
  }
}

// ── FAQ accordion ──────────────────────────────────────
function initFaq() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferred-lang') || 'en';
  setLang(savedLang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
  });

  initIntro();
  initProgressBar();
  initNavbar();
  initMobileMenu();
  initReveal();
  initSmoothScroll();
  initContactForm();
  initParticles();
  initCountUp();
  initCardTilt();
  initBookParallax();
  initMagneticButtons();
  initFaq();
});
