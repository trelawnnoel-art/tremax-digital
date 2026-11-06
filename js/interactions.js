/* =========================================================
   TREMAX Digital — interactions
   1. Hero "digital architecture": an isometric wireframe city that builds itself
      and rises toward your cursor (auto-drifts on touch screens).
   2. Mouse-responsive hero lighting.
   3. Cursor spotlight on service cards.
   4. Gentle 3D tilt on portfolio devices.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1. Hero architecture ---------- */
  function Architecture(canvas, hero) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var N = 10;                 // grid is N x N
    var cells = [];
    var w = 0, h = 0, tile = 0, ox = 0, oy = 0;
    var mouse = { x: -9999, y: -9999, active: false, last: 0 };
    var visible = true, raf = 0, buildStart = 0;

    // deterministic layout so the skyline looks designed, not random every load
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        var ci = i - (N - 1) / 2, cj = j - (N - 1) / 2;
        var dist = Math.sqrt(ci * ci + cj * cj);
        var r = rnd();
        var tall = r < 0.5 - dist * 0.045 ? 0.6 + rnd() * rnd() * 3.6 : (r < 0.62 ? 0.25 + rnd() * 0.4 : 0);
        cells.push({
          i: i, j: j, base: tall, h: 0, glow: 0,
          delay: dist * 90 + rnd() * 160,
          beam: tall > 2 && rnd() < 0.55, phase: rnd() * Math.PI * 2
        });
      }
    }
    cells.sort(function (a, b) { return (a.i + a.j) - (b.i + b.j); }); // paint back to front

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tile = Math.min(w / (N * 2.05), h / (N * 1.2));
      ox = w / 2; oy = h * 0.55;
      if (reduce) draw(performance.now());
    }

    function P(a, b, lift) { // isometric projection
      var ca = a - N / 2, cb = b - N / 2;
      return [ox + (ca - cb) * tile, oy + (ca + cb) * tile * 0.5 - lift];
    }

    function poly(pts) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      var t = now / 1000;
      var started = root.classList.contains('hero-in');
      if (started && !buildStart) buildStart = now;
      var elapsed = buildStart ? now - buildStart : 0;

      // no mouse for a while (or touch device): a soft light drifts across the city
      if (!mouse.active || now - mouse.last > 2500) {
        mouse.x = ox + Math.sin(t * 0.45) * w * 0.28;
        mouse.y = oy + N * tile * 0.5 + Math.cos(t * 0.33) * h * 0.18;
      }

      for (var k = 0; k < cells.length; k++) {
        var c = cells[k];
        var build = reduce ? 1 : Math.max(0, Math.min(1, (elapsed - c.delay) / 700));
        build = 1 - Math.pow(1 - build, 3);

        var top = P(c.i + 0.5, c.j + 0.5, c.h * tile);
        var dx = top[0] - mouse.x, dy = top[1] - mouse.y;
        var near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (tile * 3.2));
        var targetGlow = near;
        var targetH = (c.base + near * 1.4 * (c.base > 0 ? 1 : 0.55)) * build;
        c.h += (targetH - c.h) * (reduce ? 1 : 0.09);
        c.glow += (targetGlow - c.glow) * (reduce ? 1 : 0.12);

        var wave = reduce ? 0 : (Math.sin(t * 1.2 - (c.i + c.j) * 0.55) + 1) * 0.06;
        var lift = c.h * tile;

        var g0 = P(c.i, c.j, 0), g1 = P(c.i + 1, c.j, 0), g2 = P(c.i + 1, c.j + 1, 0), g3 = P(c.i, c.j + 1, 0);

        if (lift < 1.5) { // floor tile
          poly([g0, g1, g2, g3]);
          ctx.strokeStyle = 'rgba(59,145,245,' + ((0.10 + wave + c.glow * 0.5) * Math.max(build, 0.4)).toFixed(3) + ')';
          ctx.lineWidth = 1; ctx.stroke();
          continue;
        }

        var t0 = P(c.i, c.j, lift), t1 = P(c.i + 1, c.j, lift), t2 = P(c.i + 1, c.j + 1, lift), t3 = P(c.i, c.j + 1, lift);
        var edge = 0.28 + wave + c.glow * 0.7;

        // left face
        poly([g3, g2, t2, t3]);
        ctx.fillStyle = 'rgba(8,13,24,0.94)'; ctx.fill();
        // right face
        poly([g2, g1, t1, t2]);
        ctx.fillStyle = 'rgba(13,21,36,0.94)'; ctx.fill();
        // top face, lit by the cursor
        poly([t0, t1, t2, t3]);
        ctx.fillStyle = 'rgba(59,145,245,' + (0.05 + c.glow * 0.32).toFixed(3) + ')'; ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(59,145,245,' + Math.min(edge, 1).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(g3[0], g3[1]); ctx.lineTo(t3[0], t3[1]);
        ctx.moveTo(g2[0], g2[1]); ctx.lineTo(t2[0], t2[1]);
        ctx.moveTo(g1[0], g1[1]); ctx.lineTo(t1[0], t1[1]);
        ctx.moveTo(g3[0], g3[1]); ctx.lineTo(g2[0], g2[1]); ctx.lineTo(g1[0], g1[1]);
        ctx.stroke();

        poly([t0, t1, t2, t3]);
        ctx.strokeStyle = c.glow > 0.15 ? 'rgba(117,190,255,' + Math.min(0.5 + c.glow, 1).toFixed(3) + ')' : 'rgba(59,145,245,' + Math.min(edge + 0.1, 1).toFixed(3) + ')';
        ctx.stroke();

        // floor lines inside a tall block's footprint (gives the wireframe "glass" look)
        if (c.base > 1.2) {
          ctx.strokeStyle = 'rgba(59,145,245,' + (0.12 + c.glow * 0.2).toFixed(3) + ')';
          var steps = Math.floor(c.h);
          ctx.beginPath();
          for (var s = 1; s <= steps; s++) {
            var a1 = P(c.i, c.j + 1, s * tile), a2 = P(c.i + 1, c.j + 1, s * tile), a3 = P(c.i + 1, c.j, s * tile);
            ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(a3[0], a3[1]);
          }
          ctx.stroke();
        }

        // data beam rising from the roof
        if (c.beam && build > 0.95) {
          var cx = (t0[0] + t2[0]) / 2, cy = (t0[1] + t2[1]) / 2;
          var len = tile * (2.2 + Math.sin(t * 1.4 + c.phase) * 0.8 + c.glow * 1.5);
          var grad = ctx.createLinearGradient(cx, cy, cx, cy - len);
          grad.addColorStop(0, 'rgba(117,190,255,' + (0.55 + c.glow * 0.4).toFixed(3) + ')');
          grad.addColorStop(1, 'rgba(117,190,255,0)');
          ctx.strokeStyle = grad; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - len); ctx.stroke();
          // a packet of light travelling up the beam
          var py = cy - ((t * 0.6 + c.phase) % 1) * len;
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(cx - 1, py - 1, 2, 2);
        }
      }
    }

    function loop(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.active = true; mouse.last = performance.now();
    });
    hero.addEventListener('pointerleave', function () { mouse.active = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    window.addEventListener('resize', resize);

    resize();
    if (reduce) { draw(performance.now()); } else { start(); }
  }

  var hero = document.querySelector('.hero');
  var canvas = document.querySelector('.hero__canvas');
  if (hero && canvas) {
    try { Architecture(canvas, hero); } catch (e) { canvas.style.display = 'none'; }
  }

  /* ---------- 2. Hero lighting follows the mouse ---------- */
  if (hero && finePointer && !reduce) {
    var light = hero.querySelector('.hero__light');
    var pending = false, lx = 0, ly = 0;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      lx = e.clientX - r.left; ly = e.clientY - r.top;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        light.style.setProperty('--mx', lx + 'px');
        light.style.setProperty('--my', ly + 'px');
        pending = false;
      });
    });
  }

  /* ---------- 3. Service card spotlight ---------- */
  if (finePointer) {
    document.querySelectorAll('.service').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--x', (e.clientX - r.left) + 'px');
        card.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- 4. Portfolio device tilt ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.project__devices').forEach(function (stage) {
      var project = stage.closest('.project');
      project.addEventListener('pointermove', function (e) {
        var r = project.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        stage.style.setProperty('--ry', (px * 12 - 4).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-py * 8 + 2).toFixed(2) + 'deg');
      });
      project.addEventListener('pointerleave', function () {
        stage.style.removeProperty('--ry'); stage.style.removeProperty('--rx');
      });
    });
  }
})();
