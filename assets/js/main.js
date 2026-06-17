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

/* ══════════════════════════════════════════════════════════
   INTERACTIVE LAYER  (v2)
   ══════════════════════════════════════════════════════════ */

function currentLang(){ return localStorage.getItem('preferred-lang') === 'gr' ? 'gr' : 'en'; }
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Theme toggle (dark wine <-> parchment) ---- */
function initThemeToggle(){
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const saved = localStorage.getItem('preferred-theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  btn.addEventListener('click', () => {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    if (light) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('preferred-theme','dark'); }
    else       { document.documentElement.setAttribute('data-theme','light'); localStorage.setItem('preferred-theme','light'); }
  });
}

/* ---- Ambient generative audio (Web Audio, no asset) ---- */
function initAmbientAudio(){
  const btn = document.getElementById('audio-toggle');
  if (!btn) return;
  let ctx, master, nodes = [], lfo, playing = false;

  function build(){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 620; filter.Q.value = 0.6;
    filter.connect(master);
    // soft detuned drone — a quiet chord (A2, E3, A3)
    [110, 164.81, 220].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f; o.detune.value = (i - 1) * 4;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 0.5 : 0.28;
      o.connect(g); g.connect(filter); o.start(); nodes.push(o, g);
    });
    // slow filter LFO for breathing motion
    lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
    nodes.push(lfo, lfoGain);
  }

  function fade(to, t){ if (master) master.gain.setTargetAtTime(to, ctx.currentTime, t); }

  btn.addEventListener('click', async () => {
    if (!ctx) build();
    if (ctx.state === 'suspended') await ctx.resume();
    playing = !playing;
    btn.classList.toggle('playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    fade(playing ? 0.12 : 0, playing ? 2.5 : 1.0);
  });
}

/* ---- Whisper a line ---- */
function initWhisper(){
  const lineEl = document.getElementById('whisper-line');
  const srcEl  = document.getElementById('whisper-source');
  const btn    = document.getElementById('whisper-btn');
  if (!lineEl || !btn) return;

  const LINES = [
    { en:"We are made of the words we never said.", gr:"Είμαστε φτιαγμένοι από τις λέξεις που δεν είπαμε ποτέ.", src:"The Weight of Silence" },
    { en:"Memory is a house with the lights left on in empty rooms.", gr:"Η μνήμη είναι ένα σπίτι με τα φώτα αναμμένα σε άδεια δωμάτια.", src:"Letters to No One" },
    { en:"Some afternoons are long enough to hold an entire life.", gr:"Κάποια απογεύματα είναι αρκετά μεγάλα για να χωρέσουν μια ολόκληρη ζωή.", src:"Before the Light Fades" },
    { en:"To write in two languages is to be homesick in both.", gr:"Το να γράφεις σε δύο γλώσσες είναι να νοσταλγείς και στις δύο.", src:"Letters to No One" },
    { en:"The sea forgets nothing; it only learns to be quiet about it.", gr:"Η θάλασσα δεν ξεχνά τίποτα· μαθαίνει μόνο να σιωπά γι' αυτό.", src:"The Weight of Silence" },
    { en:"Grief is just love with nowhere left to go.", gr:"Η θλίψη είναι αγάπη που δεν έχει πού αλλού να πάει.", src:"Before the Light Fades" },
    { en:"He measured time not in years but in the people who stopped calling.", gr:"Μετρούσε τον χρόνο όχι σε χρόνια αλλά στους ανθρώπους που σταμάτησαν να τηλεφωνούν.", src:"Before the Light Fades" },
  ];
  let idx = -1, typing = null;

  function show(){
    if (typing) { clearTimeout(typing); }
    const lang = currentLang();
    let n; do { n = Math.floor(Math.random() * LINES.length); } while (n === idx && LINES.length > 1);
    idx = n;
    const text = LINES[n][lang] || LINES[n].en;
    srcEl.classList.remove('show'); srcEl.textContent = '';
    lineEl.classList.remove('fade-in'); lineEl.classList.add('fade-out');

    setTimeout(() => {
      lineEl.classList.remove('fade-out'); lineEl.classList.add('fade-in');
      if (reduceMotion()) {
        lineEl.textContent = text;
        srcEl.textContent = '— ' + LINES[n].src; srcEl.classList.add('show');
        return;
      }
      lineEl.innerHTML = '<span class="cursor">&nbsp;</span>';
      let i = 0;
      (function type(){
        if (i <= text.length){
          lineEl.innerHTML = text.slice(0, i) + '<span class="cursor">&nbsp;</span>';
          i++; typing = setTimeout(type, 34);
        } else {
          lineEl.textContent = text;
          srcEl.textContent = '— ' + LINES[n].src; srcEl.classList.add('show');
        }
      })();
    }, 300);
  }

  btn.addEventListener('click', show);
  // first line when section scrolls into view
  if ('IntersectionObserver' in window){
    const obs = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting){ show(); obs.disconnect(); } });
    }, { threshold: 0.4 });
    obs.observe(document.getElementById('whisper'));
  } else { show(); }
}

/* ---- Book preview modal ---- */
function initBookModal(){
  const modal = document.getElementById('book-modal');
  if (!modal) return;

  const DATA = {
    "1": {
      titleEn:"The Weight of Silence", titleGr:"Το Βάρος της Σιωπής",
      coverEn:"The Weight<br/>of Silence", coverGr:"Το Βάρος<br/>της Σιωπής",
      genreEn:"Literary Fiction", genreGr:"Λογοτεχνική Πεζογραφία",
      metaEn:["Novel","312 pp.","€9.99"], metaGr:["Μυθιστόρημα","312 σελ.","€9.99"],
      backEn:"Across three generations of a Greek family, a single unspoken truth shapes everything.",
      backGr:"Σε τρεις γενιές μιας ελληνικής οικογένειας, μία ανείπωτη αλήθεια διαμορφώνει τα πάντα.",
      excerptEn:["The house on the hill had not changed, and that was the cruelty of it. Every summer it waited, shutters half-closed against a light that no longer fell on anyone he loved.","His grandmother used to say that silence was a language too, and that some families spoke it more fluently than any other."],
      excerptGr:["Το σπίτι στον λόφο δεν είχε αλλάξει, κι αυτή ήταν η σκληρότητά του. Κάθε καλοκαίρι περίμενε, με τα παντζούρια μισόκλειστα σε ένα φως που δεν έπεφτε πια σε κανέναν αγαπημένο.","Η γιαγιά του έλεγε πως η σιωπή είναι κι αυτή μια γλώσσα, και πως κάποιες οικογένειες τη μιλούν πιο άπταιστα από κάθε άλλη."],
      buy:"YOUR_LS_PRODUCT_URL_1"
    },
    "2": {
      titleEn:"Letters to No One", titleGr:"Γράμματα σε Κανέναν",
      coverEn:"Letters to<br/>No One", coverGr:"Γράμματα<br/>σε Κανέναν",
      genreEn:"Essays", genreGr:"Δοκίμια",
      metaEn:["Essays","224 pp.","€11.99"], metaGr:["Δοκίμια","224 σελ.","€11.99"],
      backEn:"Personal essays on language, identity, and the strange privilege of thinking between tongues.",
      backGr:"Προσωπικά δοκίμια για τη γλώσσα, την ταυτότητα και το παράξενο προνόμιο να σκέφτεσαι ανάμεσα σε γλώσσες.",
      excerptEn:["I have spent my life translating myself. In one language I am precise; in the other, tender. Neither is a lie, and neither is the whole truth.","To write a letter to no one is to admit that the listening matters more than the listener."],
      excerptGr:["Πέρασα τη ζωή μου μεταφράζοντας τον εαυτό μου. Στη μία γλώσσα είμαι ακριβής· στην άλλη, τρυφερός. Καμία δεν είναι ψέμα, καμία δεν είναι όλη η αλήθεια.","Το να γράφεις γράμμα σε κανέναν σημαίνει να παραδέχεσαι πως η ακρόαση μετράει περισσότερο από τον ακροατή."],
      buy:"YOUR_LS_PRODUCT_URL_2"
    },
    "3": {
      titleEn:"Before the Light Fades", titleGr:"Πριν Σβήσει το Φως",
      coverEn:"Before the<br/>Light Fades", coverGr:"Πριν Σβήσει<br/>το Φως",
      genreEn:"Short Stories", genreGr:"Διηγήματα",
      metaEn:["14 stories","198 pp.","€8.99"], metaGr:["14 διηγήματα","198 σελ.","€8.99"],
      backEn:"Fourteen stories from the margins of ordinary life — each a world compressed to its essential truth.",
      backGr:"Δεκατέσσερα διηγήματα από τα περιθώρια της καθημερινής ζωής — το καθένα ένας κόσμος συμπιεσμένος στην ουσία του.",
      excerptEn:["The lamp flickered once, the way a thought does before you lose it. She did not get up to fix it. There are evenings you let the dark arrive.","He counted the things he would not say to her, and found there were exactly as many as the years they had left."],
      excerptGr:["Η λάμπα τρεμόπαιξε μία φορά, όπως μια σκέψη πριν τη χάσεις. Δεν σηκώθηκε να τη φτιάξει. Υπάρχουν βράδια που αφήνεις το σκοτάδι να έρθει.","Μέτρησε όσα δεν θα της έλεγε, και βρήκε πως ήταν ακριβώς τόσα όσα και τα χρόνια που τους έμεναν."],
      buy:"YOUR_LS_PRODUCT_URL_3"
    }
  };

  const book = document.getElementById('bm-book');
  const els = {
    coverTitle: document.getElementById('bm-cover-title'),
    backText:   document.getElementById('bm-back-text'),
    genre:      document.getElementById('bm-genre'),
    title:      document.getElementById('bm-title'),
    meta:       document.getElementById('bm-meta'),
    excerpt:    document.getElementById('bm-excerpt'),
    buy:        document.getElementById('bm-buy'),
  };
  let lastFocus = null, currentId = null;

  function render(id){
    const d = DATA[id]; if (!d) return;
    currentId = id;
    const gr = currentLang() === 'gr';
    els.coverTitle.innerHTML = gr ? d.coverGr : d.coverEn;
    els.backText.textContent = gr ? d.backGr : d.backEn;
    els.genre.textContent    = gr ? d.genreGr : d.genreEn;
    els.title.textContent    = gr ? d.titleGr : d.titleEn;
    els.meta.innerHTML       = (gr ? d.metaGr : d.metaEn).map(m => `<span>${m}</span>`).join('');
    els.excerpt.innerHTML    = (gr ? d.excerptGr : d.excerptEn).map(p => `<p>${p}</p>`).join('');
    els.buy.href             = d.buy;
    els.buy.textContent      = gr ? 'Αγορά' : 'Buy Now';
    book.classList.remove('flipped');
  }

  function open(id){
    render(id);
    lastFocus = document.activeElement;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.book-modal-close').focus(), 60);
  }
  function close(){
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('.look-inside').forEach(b =>
    b.addEventListener('click', () => open(b.dataset.book)));
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.getElementById('bm-flip').addEventListener('click', () => book.classList.toggle('flipped'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

  // keep modal text in sync if user flips language while open
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.addEventListener('click', () => { if (currentId && modal.classList.contains('open')) render(currentId); }));
}

/* ---- Aurora scroll-react + cursor aura ---- */
function initAmbientField(){
  if (!reduceMotion()){
    window.addEventListener('scroll', () => {
      document.documentElement.style.setProperty('--scroll-shift', (window.scrollY * 0.04).toFixed(1));
    }, { passive: true });
  }
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion()){
    const aura = document.getElementById('cursor-aura');
    document.body.classList.add('cursor-on');
    let raf = 0, x = 0, y = 0;
    window.addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        aura.style.transform = `translate(${x}px, ${y}px)`; raf = 0;
      });
    }, { passive: true });
  }
}

/* ---- Init interactive layer ---- */
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initAmbientAudio();
  initWhisper();
  initBookModal();
  initAmbientField();
});

/* ══════════════════════════════════════════════════════════
   CINEMATIC LAYER (v3)
   ══════════════════════════════════════════════════════════ */

/* ---- Hero title: split words for staggered reveal ---- */
function splitHeroTitle() {
  if (reduceMotion()) return;
  const h1 = document.querySelector('.hero-title');
  if (!h1) return;
  h1.querySelectorAll(':scope > span').forEach(span => {
    if (span.querySelector('.w')) return;
    const words = span.textContent.trim().split(/\s+/);
    span.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  });
  let i = 0;
  h1.querySelectorAll('.w').forEach(w => {
    w.style.setProperty('--wd', (0.15 + i * 0.13).toFixed(2) + 's');
    i++;
  });
}

/* ---- Spotlight: cursor-tracking glow on cards ---- */
function initSpotlight() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.press-card, .book-card, .bundle-card, .qa-promo, .bento-tile, .newsletter-band')
    .forEach(el => {
      el.classList.add('spotlight');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
}

/* ---- Back-to-top with scroll progress ring ---- */
function initToTop() {
  const dock = document.getElementById('control-dock');
  if (!dock) return;
  const btn = document.createElement('button');
  btn.className = 'dock-btn dock-btn--top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.title = 'Back to top';
  btn.innerHTML = '<span aria-hidden="true">&#8593;</span>';
  dock.prepend(btn);
  btn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }));
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    btn.style.setProperty('--p', (total > 0 ? window.scrollY / total * 100 : 0).toFixed(1));
    dock.classList.toggle('show-top', window.scrollY > 500);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  splitHeroTitle();
  initSpotlight();
  initToTop();
  // Re-split hero title after a language switch rewrites its text
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.addEventListener('click', () => setTimeout(splitHeroTitle, 0)));
});

/* ---- Newsletter form ---- */
function initNewsletter() {
  const form    = document.getElementById('newsletter-form');
  const success = document.getElementById('nl-success');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        success.classList.remove('hidden');
      }
    } catch {
      /* Newsletter endpoint not yet configured — fail silently */
    } finally {
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    }
  });
}
document.addEventListener('DOMContentLoaded', initNewsletter);

/* ---- Start Here: recommend a book ---- */
function initStartHere() {
  document.querySelectorAll('.start-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = document.querySelector(`.book-card[data-book="${btn.dataset.target}"]`);
      if (!card) return;
      const y = card.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
      document.querySelectorAll('.book-card.pulse').forEach(c => c.classList.remove('pulse'));
      setTimeout(() => {
        card.classList.add('pulse');
        setTimeout(() => card.classList.remove('pulse'), 2600);
      }, reduceMotion() ? 0 : 500);
    });
  });
}

/* ---- Press kit: copy bio ---- */
function initCopyBio() {
  const btn = document.getElementById('copy-bio');
  const bio = document.getElementById('press-bio');
  if (!btn || !bio) return;
  btn.addEventListener('click', async () => {
    const text = bio.textContent.trim().replace(/\s+/g, ' ');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    const original = btn.textContent;
    btn.textContent = currentLang() === 'gr' ? 'Αντιγράφηκε ✓' : 'Copied ✓';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 2000);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStartHere();
  initCopyBio();
});
