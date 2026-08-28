/* ═══════════════════════════════════════════════════════════
   DEREK ROBOTIS — site interactions
   starfield + shooting stars · typewriter · scroll reveal ·
   nav state · chapter accordions · excerpt modals ·
   constellation · ambient particles · progress bar ·
   rocket to-top · 3D cover tilt
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Starfield canvas (hero) ── */
  const canvas = document.getElementById("starfield");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let stars = [], w = 0, h = 0, mx = 0, my = 0;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const count = Math.min(240, Math.floor((w * h) / 6500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,          // depth → size + parallax
        tw: Math.random() * Math.PI * 2,        // twinkle phase
        hue: Math.random() < 0.12 ? "rgba(232,197,107," : Math.random() < 0.5 ? "rgba(127,178,255," : "rgba(234,231,220,"
      }));
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    });

    /* shooting stars — rare, diagonal, with fading trail */
    let meteors = [];
    function spawnMeteor() {
      meteors.push({
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.35,
        vx: 7 + Math.random() * 5,
        vy: 3 + Math.random() * 2.5,
        life: 1
      });
      setTimeout(spawnMeteor, 4000 + Math.random() * 7000);
    }
    setTimeout(spawnMeteor, 2500);

    let t = 0;
    (function frame() {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += 0.04 * s.z;                       // slow drift
        if (s.y > h + 2) s.y = -2;
        const a = 0.35 + 0.55 * Math.abs(Math.sin(t + s.tw));
        const px = s.x + mx * 26 * s.z;
        const py = s.y + my * 26 * s.z;
        ctx.beginPath();
        ctx.arc(px, py, s.z * 1.35, 0, Math.PI * 2);
        ctx.fillStyle = s.hue + (a * s.z + 0.15) + ")";
        ctx.fill();
      }
      meteors = meteors.filter(m => m.life > 0);
      for (const m of meteors) {
        m.x += m.vx; m.y += m.vy; m.life -= 0.02;
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
        grad.addColorStop(0, "rgba(255,240,200," + (m.life * 0.9) + ")");
        grad.addColorStop(1, "rgba(255,240,200,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10);
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    })();
    resize();
  }

  /* ── Typewriter — the four worlds ── */
  const typeEl = document.getElementById("typewriter");
  if (typeEl) {
    const lines = [
      "A tree of life on another world.",
      "A colony beneath the red sands of Mars.",
      "A detective and his symbiont on planet Pythos.",
      "A pyramid at Marathon, and the goddess who waits."
    ];
    if (reduced) {
      typeEl.textContent = lines[0];
    } else {
      let li = 0, ci = 0, deleting = false;
      const target = typeEl.querySelector(".type-text") || typeEl;
      (function tick() {
        const line = lines[li];
        target.textContent = line.slice(0, ci);
        let delay = deleting ? 26 : 52;
        if (!deleting && ci === line.length) { deleting = true; delay = 2400; }
        else if (deleting && ci === 0) { deleting = false; li = (li + 1) % lines.length; delay = 420; }
        else ci += deleting ? -1 : 1;
        setTimeout(tick, delay);
      })();
    }
  }

  /* ── Nav: scrolled state + burger + active link ── */
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav-burger");
  const linksList = document.querySelector(".nav-links");

  window.addEventListener("scroll", () => {
    nav && nav.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });

  if (burger && linksList) {
    burger.addEventListener("click", () => {
      const open = linksList.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    linksList.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        linksList.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  // active section highlighting
  const navAnchors = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const sections = navAnchors
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          navAnchors.forEach(a =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(s => spy.observe(s));
  }

  /* ── Scroll reveal ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("visible"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

  /* ── Chapter accordions ── */
  document.querySelectorAll(".chapters-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const box = btn.closest(".chapters");
      const open = box.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ── Excerpt modals ── */
  const modals = document.querySelectorAll(".modal");
  let lastFocus = null;

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add("open");
    document.body.classList.add("modal-locked");
    const closer = m.querySelector(".modal-close");
    closer && closer.focus();
  }
  function closeModal(m) {
    m.classList.remove("open");
    document.body.classList.remove("modal-locked");
    lastFocus && lastFocus.focus();
  }

  document.querySelectorAll("[data-modal]").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.modal)));
  modals.forEach(m => {
    m.querySelector(".modal-backdrop").addEventListener("click", () => closeModal(m));
    m.querySelector(".modal-close").addEventListener("click", () => closeModal(m));
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modals.forEach(m => m.classList.contains("open") && closeModal(m));
  });

  /* ── Constellation: hover/click a world, read the thread ── */
  const note = document.getElementById("universe-note");
  const threads = {
    tree: {
      t: "The Tree",
      p: "Harry's attic window is the bridge to everything. The coordinates he deciphers, the golden tree he finds on another heavenly body, the friends named for stars — Orion, Demeter — all begin here."
    },
    colony: {
      t: "The Second Colony",
      p: "Fabian's Mars is not empty. Beneath the red sands sleeps an ancient civilization — and a seed of the gods called ambrosia, whose bitter fruit only little Harry will eat. Watch him closely: he disappears in a flash of light."
    },
    noir: {
      t: "Shadows and Deceit",
      p: "Detective Bill and his symbiont Justin walk the smog-choked streets of Pythos, where F.T.L drives scattered ten races across one city and every face might be a doppelganger from another universe."
    },
    isida: {
      t: "The Pyramid of Isida",
      p: "Archaeologist Aristides digs at Marathon, where Herodes Atticus raised a pyramid to the goddess Isida — and the excavation opens a door through time itself, to oracles, sirens, and the Founder's warning."
    },
    anarcho: {
      t: "Το Αναρχοδαιμόνιο — Isida's twin",
      p: "Not a neighbour to Isida but its twin: the same ten chapters, the same door at Marathon opening onto another era, told under a Greek title and a harder law — know thyself, for truth is the only path. Where Isida is the myth, this is the reckoning."
    },
    caryatid: {
      t: "The Return of the Caryatid — the thread itself",
      p: "No shared cast, but the same blood. Its Orion is an archaeologist lost in the arms of time, cousin in spirit to Aristides; its 'two suns' and parallel universe are the doubled world the detective walks; ambrosia, sirens and oracles drift through it. Time that won't stay buried, myth fused with history, and always the longing to return home."
    },
    center: {
      t: "One Universe",
      p: "Six books, one thread. Four share a single unfolding story; a fifth tells the dig again in another tongue; a sixth holds the whole thread to the light. Humanity reaches past its limits — and something reaches back."
    }
  };
  document.querySelectorAll(".constellation-node").forEach(node => {
    const show = () => {
      const d = threads[node.dataset.world];
      if (!d || !note) return;
      document.querySelectorAll(".constellation-node").forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      note.classList.add("fading");
      setTimeout(() => {
        note.querySelector("h3").textContent = d.t;
        note.querySelector("p").textContent = d.p;
        note.classList.remove("fading");
      }, 180);
    };
    node.addEventListener("mouseenter", show);
    node.addEventListener("click", show);
    node.addEventListener("focus", show);
  });

  /* ── Ambient particles per world ── */
  if (!reduced) {
    const worlds = [
      { id: "tree",   cls: "mote--firefly", count: 14, peak: 0.85 }, // fireflies in the tree's glow
      { id: "colony", cls: "mote--dust",    count: 16, peak: 0.6  }, // red dust on the Martian wind
      { id: "isida",  cls: "mote--ember",   count: 12, peak: 0.7  }  // golden sand rising like incense
    ];
    worlds.forEach(({ id, cls, count, peak }) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      for (let i = 0; i < count; i++) {
        const m = document.createElement("span");
        m.className = "mote " + cls;
        m.style.left = (Math.random() * 100) + "%";
        m.style.setProperty("--dur", (11 + Math.random() * 14) + "s");
        m.style.setProperty("--delay", (-Math.random() * 20) + "s");
        m.style.setProperty("--sway", ((Math.random() - 0.5) * 90) + "px");
        m.style.setProperty("--peak", String(peak * (0.6 + Math.random() * 0.4)));
        sec.appendChild(m);
      }
    });
    // neon rain over Pythos
    const noirSec = document.getElementById("noir");
    if (noirSec) {
      for (let i = 0; i < 22; i++) {
        const r = document.createElement("span");
        r.className = "rain";
        r.style.left = (Math.random() * 100) + "%";
        r.style.setProperty("--dur", (1.4 + Math.random() * 1.6) + "s");
        r.style.setProperty("--delay", (-Math.random() * 3) + "s");
        noirSec.appendChild(r);
      }
    }
  }

  /* ── Scroll progress bar ── */
  const progress = document.querySelector(".scroll-progress span");
  if (progress) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Back-to-top rocket ── */
  const toTop = document.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("show", window.scrollY > 700);
    }, { passive: true });
    toTop.addEventListener("click", () => {
      toTop.classList.add("launch");
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      setTimeout(() => toTop.classList.remove("launch"), 900);
    });
  }

  /* ── 3D tilt on book covers (fine pointers only) ── */
  if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".book-cover").forEach(cover => {
      const frame = cover.querySelector(".cover-frame");
      if (!frame) return;
      cover.addEventListener("mousemove", e => {
        const r = cover.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transition = "transform .12s ease-out";
        frame.style.transform =
          "rotateY(" + (x * 14) + "deg) rotateX(" + (-y * 12) + "deg) translateY(-4px)";
      });
      cover.addEventListener("mouseleave", () => {
        frame.style.transition = "transform .6s cubic-bezier(.22,.8,.3,1)";
        frame.style.transform = "";
      });
    });
  }

  /* ── Theme picker (palette button in nav) ── */
  const themeBtn = document.querySelector(".theme-btn");
  const themePop = document.querySelector(".theme-pop");
  if (themeBtn && themePop) {
    themeBtn.addEventListener("click", e => {
      e.stopPropagation();
      const open = themePop.classList.toggle("open");
      themeBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", e => {
      if (!themePop.contains(e.target)) {
        themePop.classList.remove("open");
        themeBtn.setAttribute("aria-expanded", "false");
      }
    });
    const swatches = themePop.querySelectorAll(".swatch");
    const applyTheme = theme => {
      if (theme) document.documentElement.dataset.theme = theme;
      else delete document.documentElement.dataset.theme;
      try { localStorage.setItem("site-theme", theme || ""); } catch (err) {}
      swatches.forEach(s => s.classList.toggle("active", s.dataset.theme === theme));
    };
    swatches.forEach(s => s.addEventListener("click", () => {
      const current = document.documentElement.dataset.theme;
      applyTheme(current === s.dataset.theme ? "" : s.dataset.theme); // click again to reset
    }));
    // reflect saved theme in swatch state (theme itself applied by inline head script)
    swatches.forEach(s =>
      s.classList.toggle("active", s.dataset.theme === document.documentElement.dataset.theme));
  }

  /* ── Footer year ── */
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
