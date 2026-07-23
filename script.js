/* ===== Helpers ===== */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function trackMouse(canvas) {
  const m = { x: -9999, y: -9999 };
  function update(cx, cy) {
    const r = canvas.getBoundingClientRect();
    m.x = cx - r.left;
    m.y = cy - r.top;
  }
  window.addEventListener("mousemove", (e) => update(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener("mouseout", () => { m.x = -9999; m.y = -9999; });
  return m;
}

function onVisible(canvas, cb) {
  if (!("IntersectionObserver" in window)) { cb(true); return; }
  new IntersectionObserver((entries) => {
    entries.forEach((e) => cb(e.isIntersecting));
  }, { threshold: 0 }).observe(canvas);
}


/* ===== Hero particle dome (rotating sphere + mouse repulsion) ===== */
(function () {
  const canvas = document.getElementById("dome");
  if (!canvas) return;

  const N = 900;
  const points = [];
  for (let i = 0; i < N; i++) {
    // Fibonacci sphere
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = i * 2.399963229728653;
    // start far from home so the spring assembles the dome on load
    points.push({
      x: Math.cos(theta) * r, y, z: Math.sin(theta) * r,
      ox: (Math.random() - 0.5) * 900,
      oy: (Math.random() - 0.5) * 900,
      vx: 0, vy: 0
    });
  }

  let ctx, w, h;
  const mouse = trackMouse(canvas);
  const REPEL = 100, FORCE = 2.4;

  function resize() { ({ ctx, w, h } = setupCanvas(canvas)); }
  resize();
  window.addEventListener("resize", resize);

  let angle = 0;
  let running = false;

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w * 0.42, 520);
    const cx = w / 2;
    const cy = h + R * 0.35; // sphere centre below the canvas → dome look
    const sinA = Math.sin(angle), cosA = Math.cos(angle);

    for (const p of points) {
      const x1 = p.x * cosA + p.z * sinA;
      const z1 = -p.x * sinA + p.z * cosA;
      const hx = cx + x1 * R;
      const hy = cy + p.y * R;
      if (hy > h + 6) continue;

      // mouse repulsion on the projected position
      const px = hx + p.ox, py = hy + p.oy;
      const dx = px - mouse.x, dy = py - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPEL * REPEL && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = ((REPEL - d) / REPEL) * FORCE;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += -p.ox * 0.04;
      p.vy += -p.oy * 0.04;
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.ox += p.vx;
      p.oy += p.vy;

      const depth = (z1 + 1) / 2;
      const size = 0.9 + depth * 2.1;
      ctx.beginPath();
      ctx.arc(hx + p.ox, hy + p.oy, size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0," + (0.12 + depth * 0.75) + ")";
      ctx.fill();
    }

    angle += 0.0016;
    if (running && !reduceMotion) requestAnimationFrame(draw);
  }

  draw(); // first paint
  if (reduceMotion) return;
  onVisible(canvas, (vis) => {
    if (vis && !running) { running = true; draw(); }
    else if (!vis) running = false;
  });
})();

/* ===== Morphing particle sculpture (temple → robot → YANTRAX) ===== */
(function () {
  const canvas = document.getElementById("evolution");
  if (!canvas) return;

  const OW = 360, OH = 200; // offscreen sampling space

  function drawTemple(c) {
    // pediment
    c.beginPath();
    c.moveTo(40, 62); c.lineTo(180, 14); c.lineTo(320, 62); c.closePath();
    c.fill();
    c.fillRect(48, 70, 264, 12);
    // columns
    for (let i = 0; i < 5; i++) c.fillRect(64 + i * 52, 92, 24, 74);
    // steps
    c.fillRect(44, 172, 272, 10);
    c.fillRect(30, 186, 300, 12);
  }

  function drawRobot(c) {
    // antenna + head
    c.fillRect(172, 6, 16, 18);
    c.beginPath(); c.arc(180, 8, 8, 0, Math.PI * 2); c.fill();
    c.fillRect(136, 26, 88, 52);
    // eyes (punch out)
    c.save(); c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.arc(160, 52, 9, 0, Math.PI * 2); c.arc(200, 52, 9, 0, Math.PI * 2); c.fill();
    c.restore();
    // body
    c.fillRect(120, 88, 120, 82);
    // screen (punch out)
    c.save(); c.globalCompositeOperation = "destination-out";
    c.fillRect(140, 102, 80, 52);
    c.restore();
    // arms
    c.fillRect(92, 96, 20, 56); c.fillRect(248, 96, 20, 56);
    // base + wheels
    c.fillRect(132, 170, 96, 12);
    c.beginPath(); c.arc(150, 190, 10, 0, Math.PI * 2); c.arc(210, 190, 10, 0, Math.PI * 2); c.fill();
  }

  function drawWord(c) {
    c.font = "700 64px 'Overused Grotesk', Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("YANTRAX", OW / 2, OH / 2 + 4);
  }

  function sample(drawFn) {
    const off = document.createElement("canvas");
    off.width = OW; off.height = OH;
    const c = off.getContext("2d");
    c.fillStyle = "#000";
    drawFn(c);
    const data = c.getImageData(0, 0, OW, OH).data;
    const pts = [];
    const step = 4;
    for (let py = 0; py < OH; py += step) {
      for (let px = 0; px < OW; px += step) {
        if (data[(py * OW + px) * 4 + 3] > 128) pts.push({ x: px / OW, y: py / OH });
      }
    }
    return pts;
  }

  const shapes = [sample(drawTemple), sample(drawRobot), sample(drawWord)];
  const N = Math.max.apply(null, shapes.map(function (s) { return s.length; }));

  let ctx, w, h, scale, offX, offY;
  const mouse = trackMouse(canvas);
  const REPEL = 90, FORCE = 2.6;

  const particles = [];
  for (let i = 0; i < N; i++) {
    particles.push({
      x: Math.random(), y: Math.random(), // normalized start
      px: 0, py: 0, vx: 0, vy: 0,
      r: 1 + Math.random() * 1.4,
      a: 0.35 + Math.random() * 0.6
    });
  }

  let shapeIdx = 0;
  function assign(idx) {
    const pts = shapes[idx];
    for (let i = 0; i < N; i++) {
      const t = pts[(i * 7919) % pts.length]; // prime stride shuffles assignments
      particles[i].tx = t.x + (Math.random() - 0.5) * 0.006;
      particles[i].ty = t.y + (Math.random() - 0.5) * 0.006;
    }
  }
  assign(0);

  function resize() {
    ({ ctx, w, h } = setupCanvas(canvas));
    const availW = w * 0.86, availH = h * 0.86;
    scale = Math.min(availW / OW, availH / OH) * OW; // px per normalized-x unit
    offX = (w - scale) / 2;
    offY = (h - scale * (OH / OW)) / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  let running = false;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      const hx = offX + p.tx * scale;
      const targetY = offY + p.ty * (scale * OH / OW);
      if (p.cx === undefined) { p.cx = p.x * w; p.cy = p.y * h; }

      const dx = p.cx - mouse.x, dy = p.cy - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPEL * REPEL && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = ((REPEL - d) / REPEL) * FORCE;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (hx - p.cx) * 0.045;
      p.vy += (targetY - p.cy) * 0.045;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.cx += p.vx;
      p.cy += p.vy;

      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0," + p.a + ")";
      ctx.fill();
    }
    if (running && !reduceMotion) requestAnimationFrame(draw);
  }

  draw();
  if (!reduceMotion) {
    setInterval(function () {
      shapeIdx = (shapeIdx + 1) % shapes.length;
      assign(shapeIdx);
    }, 4200);
    onVisible(canvas, function (vis) {
      if (vis && !running) { running = true; draw(); }
      else if (!vis) running = false;
    });
  }
})();

/* ===== Milestones navigation map ===== */
(function () {
  const canvas = document.getElementById("navmap");
  if (!canvas) return;

  const WAYPOINTS = [
    { x: 0.18, y: 0.82 },
    { x: 0.52, y: 0.45 },
    { x: 0.82, y: 0.12 }
  ];

  let ctx, w, h, gridDots = [], path = [];
  const mouse = trackMouse(canvas);
  const REPEL = 80, FORCE = 2.2;
  const trail = [];

  function buildPath() {
    // smooth S-route through the waypoints (catmull-rom-ish via quadratics)
    path = [];
    const pts = WAYPOINTS.map((p) => ({ x: p.x * w, y: p.y * h }));
    const c1 = { x: pts[0].x + w * 0.22, y: pts[0].y + h * 0.02 };
    const c2 = { x: pts[1].x - w * 0.2, y: pts[1].y + h * 0.16 };
    const c3 = { x: pts[1].x + w * 0.2, y: pts[1].y - h * 0.16 };
    const c4 = { x: pts[2].x - w * 0.2, y: pts[2].y - h * 0.02 };
    const seg = (a, b, cA, cB, n) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        path.push({
          x: u * u * u * a.x + 3 * u * u * t * cA.x + 3 * u * t * t * cB.x + t * t * t * b.x,
          y: u * u * u * a.y + 3 * u * u * t * cA.y + 3 * u * t * t * cB.y + t * t * t * b.y
        });
      }
    };
    seg(pts[0], pts[1], c1, c2, 60);
    seg(pts[1], pts[2], c3, c4, 60);
  }

  function init() {
    ({ ctx, w, h } = setupCanvas(canvas));
    gridDots = [];
    const gap = 26;
    for (let gy = gap; gy < h - 4; gy += gap) {
      for (let gx = gap; gx < w - 4; gx += gap) {
        // start scattered so the grid assembles when it scrolls into view
        gridDots.push({ hx: gx, hy: gy, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 });
      }
    }
    buildPath();
    trail.length = 0;
  }
  init();
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(init, 200); });

  let t = 0; // 0..1 along path
  let running = false;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // interactive grid dots
    for (const p of gridDots) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPEL * REPEL && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = ((REPEL - d) / REPEL) * FORCE;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (p.hx - p.x) * 0.05;
      p.vy += (p.hy - p.y) * 0.05;
      p.vx *= 0.82;
      p.vy *= 0.82;
      p.x += p.vx;
      p.y += p.vy;
      const disp = Math.abs(p.x - p.hx) + Math.abs(p.y - p.hy);
      ctx.beginPath();
      ctx.arc(p.x, p.y, disp > 1.5 ? 1.8 : 1.1, 0, Math.PI * 2);
      ctx.fillStyle = disp > 1.5 ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.18)";
      ctx.fill();
    }

    // planned route (dashed)
    ctx.beginPath();
    path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);

    // waypoint crosshairs
    for (const wp of WAYPOINTS) {
      const x = wp.x * w, y = wp.y * h, s = 9;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x - s, y - s, s * 2, s * 2);
      ctx.beginPath();
      ctx.moveTo(x - s - 5, y); ctx.lineTo(x - s + 3, y);
      ctx.moveTo(x + s + 5, y); ctx.lineTo(x + s - 3, y);
      ctx.moveTo(x, y - s - 5); ctx.lineTo(x, y - s + 3);
      ctx.moveTo(x, y + s + 5); ctx.lineTo(x, y + s - 3);
      ctx.stroke();
    }

    // traveling robot dot + trail
    const idx = Math.max(0, Math.min(path.length - 1, Math.floor(t * (path.length - 1))));
    const pos = path[idx];
    trail.push({ x: pos.x, y: pos.y });
    if (trail.length > 26) trail.shift();
    trail.forEach((tp, i) => {
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 1 + (i / trail.length) * 2.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(199,63,46," + (i / trail.length) * 0.5 + ")";
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#c73f2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 9 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(199,63,46,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    t += 0.0016;
    if (t > 1.06) t = -0.06; // small pause at the ends

    if (running && !reduceMotion) requestAnimationFrame(draw);
  }

  draw();
  if (reduceMotion) return;
  onVisible(canvas, (vis) => {
    if (vis && !running) { running = true; draw(); }
    else if (!vis) running = false;
  });
})();

/* ===== Milestones timeline: rail progress + active entries ===== */
(function () {
  const fill = document.getElementById("rail-fill");
  const rail = document.querySelector(".timeline-rail");
  const entries = document.querySelectorAll("[data-log]");
  if (!fill || !rail || !entries.length) return;

  function onScroll() {
    const r = rail.getBoundingClientRect();
    const mid = window.innerHeight * 0.55;
    const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    fill.style.height = (p * 100).toFixed(1) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (!("IntersectionObserver" in window)) {
    entries.forEach((e) => e.classList.add("active"));
    return;
  }
  const io = new IntersectionObserver((obs) => {
    obs.forEach((e) => e.target.classList.toggle("active", e.isIntersecting));
  }, { threshold: 0.45 });
  entries.forEach((e) => io.observe(e));
})();

/* ===== Footer particle wordmark ===== */
(function () {
  const canvas = document.getElementById("wordmark");
  if (!canvas) return;

  const OW = 900, OH = 220;
  let ctx, w, h, particles = [];
  const mouse = trackMouse(canvas);
  const REPEL = 85, FORCE = 3;

  function sampleWord() {
    const off = document.createElement("canvas");
    off.width = OW; off.height = OH;
    const c = off.getContext("2d");
    c.fillStyle = "#000";
    c.font = "700 190px 'Overused Grotesk', Arial, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("YANTRAX", OW / 2, OH * 0.52);
    const data = c.getImageData(0, 0, OW, OH).data;
    const pts = [];
    const step = 4;
    for (let py = 0; py < OH; py += step) {
      for (let px = 0; px < OW; px += step) {
        if (data[(py * OW + px) * 4 + 3] > 128) pts.push({ x: px / OW, y: py / OH });
      }
    }
    return pts;
  }

  function init() {
    ({ ctx, w, h } = setupCanvas(canvas));
    const pts = sampleWord();
    const scale = (w * 0.98) / 1; // normalized x * this = px
    const wordH = scale * (OH / OW);
    const offX = w * 0.01;
    const offY = h - wordH * 0.82; // bottom ~18% cropped below the edge
    particles = pts.map(function (p) {
      return {
        hx: offX + p.x * scale,
        hy: offY + p.y * wordH,
        // start scattered so the wordmark assembles when it scrolls into view
        x: Math.random() * w,
        y: Math.random() * h * 1.2,
        vx: 0, vy: 0,
        r: 1 + Math.random() * 1.2,
        a: 0.1 + ((p.y * wordH + offY) / h) * 0.16 // fades lighter toward the crop
      };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < REPEL * REPEL && d2 > 0.01) {
        const d = Math.sqrt(d2);
        const f = ((REPEL - d) / REPEL) * FORCE;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (p.hx - p.x) * 0.04;
      p.vy += (p.hy - p.y) * 0.04;
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h) continue; // hard crop at the bottom edge
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0," + p.a + ")";
      ctx.fill();
    }
  }

  let running = false;
  function loop() {
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    init();
    draw();
    if (reduceMotion) return;
    onVisible(canvas, function (vis) {
      if (vis && !running) { running = true; loop(); }
      else if (!vis) running = false;
    });
    let rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { init(); if (!running) draw(); }, 200); });
  }

  if (document.fonts && document.fonts.load) {
    document.fonts.load("700 190px 'Overused Grotesk'").then(start, start);
  } else {
    start();
  }
})();

/* ===== Custom crosshair cursor ===== */
(function () {
  if (reduceMotion) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const cur = document.createElement("div");
  cur.className = "cursor";
  cur.innerHTML = '<span class="c-t"></span><span class="c-b"></span><span class="c-l"></span><span class="c-r"></span><span class="c-dot"></span>';
  document.body.appendChild(cur);
  document.body.classList.add("has-cursor");

  let mx = -100, my = -100, x = -100, y = -100;
  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    const t = e.target;
    const interactive = t.closest && t.closest("a, button, .log-chips li, canvas");
    const typing = t.closest && t.closest("input, textarea");
    cur.classList.toggle("is-active", !!interactive);
    cur.classList.toggle("is-hidden", !!typing);
  }, { passive: true });
  document.addEventListener("mouseleave", function () { cur.classList.add("is-hidden"); });
  document.addEventListener("mouseenter", function () { cur.classList.remove("is-hidden"); });
  window.addEventListener("mousedown", function () { cur.classList.add("is-down"); });
  window.addEventListener("mouseup", function () { cur.classList.remove("is-down"); });

  (function follow() {
    x += (mx - x) * 0.3;
    y += (my - y) * 0.3;
    cur.style.transform = "translate(" + x + "px," + y + "px)";
    requestAnimationFrame(follow);
  })();
})();

/* ===== Mobile nav ===== */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ===== Scroll reveal (fallback when GSAP is unavailable) ===== */
(function () {
  const els = document.querySelectorAll(".reveal");
  if (window.gsap && window.ScrollTrigger && !reduceMotion) return; // GSAP layer handles it
  if (!("IntersectionObserver" in window) || reduceMotion) {
    els.forEach(function (el) { el.classList.add("visible"); });
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ===== GSAP: load sequence + scroll-triggered animation ===== */
(function () {
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) return;
  gsap.registerPlugin(ScrollTrigger);

  // neutralize the CSS reveal system (class carries opacity + transition
  // that fight GSAP's inline styles) — GSAP owns visibility now
  document.querySelectorAll(".reveal").forEach(function (el) { el.classList.remove("reveal"); });

  /* --- page load sequence --- */
  const load = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
  load
    .from(".site-header", { y: -24, autoAlpha: 0, duration: 0.6 })
    .from(".hero h1", { y: 46, autoAlpha: 0 }, "-=0.25")
    .from(".hero-sub", { y: 30, autoAlpha: 0, duration: 0.7 }, "-=0.55")
    .from(".hero .btn-frame", { y: 24, autoAlpha: 0, duration: 0.6 }, "-=0.45")
    .from("#dome", { autoAlpha: 0, duration: 1.1 }, "-=0.4");

  /* --- generic section reveals --- */
  const revealSets = [
    ".press .pixel-label",
    ".project-copy", ".robot-photo",
    ".section-head", ".pipe-display", ".pipe-col",
    ".mission-head", "#evolution", ".two-col p",
    ".values-strip .pixel-label",
    ".tech-visual", ".tech-copy",
    ".stat",
    ".hw-table", ".hw-actions",
    ".milestones-head", ".navmap-wrap",
    "#coverflow",
    ".team-intro", ".member-card",
    ".contact-copy", ".contact-form",
    ".footer-top"
  ];
  revealSets.forEach(function (sel) {
    gsap.utils.toArray(sel).forEach(function (el) {
      gsap.from(el, {
        y: 44,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });
  });

  /* --- log entries: slide in from the rail --- */
  gsap.utils.toArray(".log-entry").forEach(function (el, i) {
    gsap.from(el, {
      x: 60,
      autoAlpha: 0,
      duration: 0.8,
      delay: i * 0.05,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%" }
    });
  });

  /* --- ghost numbers drift slower than the page (parallax) --- */
  gsap.utils.toArray(".ghost-num").forEach(function (el) {
    gsap.fromTo(el, { y: 60 }, {
      y: -60,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* --- marquees pushed by scroll --- */
  gsap.utils.toArray(".marquee-track").forEach(function (track) {
    gsap.to(track, {
      x: -160,
      ease: "none",
      scrollTrigger: { trigger: track, start: "top bottom", end: "bottom top", scrub: 0.6 }
    });
  });

  /* --- robot photo + navmap parallax --- */
  [".robot-photo", ".navmap-wrap"].forEach(function (sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    gsap.fromTo(el, { y: 30 }, {
      y: -30,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* --- voice command lines: ink in as they cross the viewport --- */
  gsap.utils.toArray(".say-line").forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0.1, x: 40 },
      {
        opacity: 1,
        x: 0,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 88%", end: "top 45%", scrub: 0.4 }
      });
  });

  /* --- team member photos: clip-reveal --- */
  gsap.utils.toArray(".member-photo").forEach(function (el) {
    gsap.from(el, {
      clipPath: "inset(0 0 100% 0)",
      duration: 1,
      ease: "power3.inOut",
      scrollTrigger: { trigger: el, start: "top 88%" }
    });
  });

  // re-measure triggers once fonts and images have settled
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();

/* ===== Team show more / less ===== */
(function () {
  const btn = document.getElementById("toggle-team");
  const cards = document.getElementById("team-cards");
  if (!btn || !cards) return;
  btn.addEventListener("click", function () {
    const expanded = cards.classList.toggle("expanded");
    btn.textContent = expanded ? "Show less" : "Show more";
    btn.setAttribute("aria-expanded", String(expanded));
  });
})();

/* ===== Benchmark counters ===== */
(function () {
  const counts = document.querySelectorAll(".count");
  if (!counts.length) return;

  function run(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduceMotion || !window.gsap) {
      el.textContent = target.toFixed(decimals);
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: function () { el.textContent = obj.v.toFixed(decimals); }
    });
  }

  if (!("IntersectionObserver" in window)) {
    counts.forEach(run);
    return;
  }
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        run(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  counts.forEach(function (el) { io.observe(el); });
})();

/* ===== 3D Coverflow gallery ===== */
(function () {
  var root = document.getElementById("coverflow");
  if (!root) return;

  var cards = root.querySelectorAll(".coverflow-card");
  var n = cards.length;
  if (n === 0) return;

  var active = 0;
  var locked = false;
  var DEPTH = 240;
  var SCALE_STEP = 0.16;
  var MAX_VISIBLE = 2;
  var GAP_PX = 240;   // spacing between cards
  var TILT = 12;      // rotateY degrees
  var SIDE_TILT = 8;  // rotateZ degrees
  var DIM = 0.4;      // inactive overlay opacity
  var DUR = 600;      // transition ms

  // Build dot indicators
  var dotsWrap = root.querySelector(".coverflow-dots");
  for (var d = 0; d < n; d++) {
    var dot = document.createElement("button");
    dot.className = "coverflow-dot" + (d === 0 ? " active" : "");
    dot.setAttribute("aria-label", "Go to slide " + (d + 1));
    dot.dataset.index = d;
    dotsWrap.appendChild(dot);
  }
  var dots = dotsWrap.querySelectorAll(".coverflow-dot");

  function layout() {
    for (var i = 0; i < n; i++) {
      var rel = i - active;
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;

      var ax = Math.abs(rel);
      var visible = ax <= MAX_VISIBLE;
      var isActive = rel === 0;
      var sc = Math.max(0.4, 1 - ax * SCALE_STEP);
      var tx = rel * GAP_PX;
      var tz = -ax * DEPTH;
      var ry = -rel * TILT;
      var rz = rel * SIDE_TILT;

      var card = cards[i];
      card.style.transform =
        "translate(-50%, -50%) translateX(" + tx + "px) translateZ(" + tz + "px) rotateY(" + ry + "deg) rotateZ(" + rz + "deg) scale(" + sc + ")";
      card.style.opacity = visible ? 1 : 0;
      card.style.pointerEvents = visible && !isActive ? "auto" : (isActive ? "auto" : "none");

      if (isActive) {
        card.classList.add("active");
        card.style.cursor = "default";
      } else {
        card.classList.remove("active");
        card.style.cursor = visible ? "pointer" : "default";
      }

      // Dim overlay
      var dim = card.querySelector(".coverflow-dim");
      if (dim) dim.style.opacity = isActive ? 0 : DIM;
    }

    // Update dots
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle("active", j === active);
    }
  }

  function lock() {
    locked = true;
    setTimeout(function () { locked = false; }, Math.max(50, DUR));
  }

  function step(dir) {
    if (locked) return;
    lock();
    active = (((active + dir) % n) + n) % n;
    layout();
  }

  function goTo(idx) {
    if (locked || idx === active) return;
    lock();
    active = idx;
    layout();
  }

  // Card clicks
  cards.forEach(function (card, i) {
    card.addEventListener("click", function () {
      if (locked) return;
      if (i === active) {
        step(1); // clicking active advances
      } else {
        goTo(i);
      }
    });
  });

  // Arrow buttons
  var prevBtn = root.querySelector(".coverflow-prev");
  var nextBtn = root.querySelector(".coverflow-next");
  if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

  // Dot clicks
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(parseInt(dot.dataset.index, 10));
    });
  });

  // Keyboard
  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });

  // Touch / swipe
  var touchStartX = 0;
  var touchStartY = 0;
  root.addEventListener("touchstart", function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  root.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      step(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  // Initial layout
  layout();
})();

/* ===== Contact form (demo submit) ===== */
(function () {
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  if (!form || !note) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      note.textContent = "Please fill in every field before sending.";
      return;
    }
    note.textContent = "Thank you! Your message has been received.";
    form.reset();
  });
})();
