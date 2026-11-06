/* =========================================================
   TREMAX Digital — cinematic intro (about 6 seconds)
   1. Spark   a point of light stretches into a horizontal streak
   2. Build   the streak unfolds into a 3D grid floor; wireframe towers rise and rush past
   3. Warp    everything becomes light streaks rushing to the centre; the T/X monogram draws itself
   4. Name    TREMAX scrambles and locks in, a wave of blue light runs across it,
              DIGITAL spreads out, the tagline types itself
   5. Reveal  the screen folds into one glowing line, the line flashes out,
              the monogram flies into the nav logo and the homepage appears
   Canvas + GSAP. Plays once per browsing session. Skippable. Never blocks the page.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro) return;

  var KEY = 'tremax-intro-seen';
  var TAGLINE = 'You Want. We Deliver.';
  var SYMBOLS = '<>/{}[]=+*#$%&01_;:';
  var tl = null;

  var screen = intro.querySelector('.intro__screen');
  var canvas = intro.querySelector('.intro__canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  var slot = intro.querySelector('.intro__slot');
  var mark = intro.querySelector('.intro__mark');
  var markPaths = mark.querySelectorAll('path');
  var letters = intro.querySelectorAll('.intro__word span');
  var digital = intro.querySelector('.intro__digital');
  var tagline = intro.querySelector('.intro__tagline');
  var typed = intro.querySelector('.intro__typed');
  var line = intro.querySelector('.intro__line');
  var skipBtn = intro.querySelector('.intro__skip');
  var FINAL = Array.prototype.map.call(letters, function (l) { return l.textContent; });

  function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  function startHero() { root.classList.add('hero-in'); }

  function finish() {
    if (tl) { tl.kill(); tl = null; }
    root.classList.remove('intro-playing', 'intro-running');
    root.classList.add('intro-skipped', 'intro-done');
    intro.style.display = 'none';
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    markSeen();
    startHero();
  }

  function skip() {
    if (!window.gsap) return finish();
    if (tl) { tl.kill(); tl = null; }
    startHero();
    gsap.to(intro, { opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: finish });
  }

  function onKey(e) { if (e.key === 'Escape') skip(); }

  /* ---------- Canvas scene ---------- */
  var W = 0, H = 0, F = 1;
  var S = {};              // scene values tweened by the timeline
  var towers = [], warpLines = [];

  function seeded(seed) {
    return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }

  function build() {
    var rnd = seeded(7);
    towers = [];
    for (var i = 0; i < 30; i++) {
      var side = i % 2 ? 1 : -1;
      towers.push({
        x: side * (1.5 + rnd() * 4.5), z: 3 + i * 1.25,
        w: 0.45 + rnd() * 0.7, d: 0.5 + rnd() * 0.9, h: 1.4 + rnd() * 4.6,
        delay: rnd() * 0.45
      });
    }
    warpLines = [];
    for (var k = 0; k < 220; k++) {
      warpLines.push({ a: rnd() * Math.PI * 2, r: 0.55 + rnd() * 0.7, delay: rnd() * 0.35, hot: rnd() < 0.2 });
    }
  }

  function resize() {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    F = Math.min(H * 0.55, W * 0.8);   // focal length: keeps the floor filling phones and desktops
  }

  // world (x, y up, z forward) -> screen; `unfold` 0 flattens the world onto the horizon streak
  function proj(x, y, z) {
    var s = F / z;
    return [W / 2 + x * s, H / 2 + (1 - y) * s * S.unfold];
  }

  function seg(a, b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }

  function drawWorld(alpha) {
    var near = 0.45, far = 34, cy = H / 2;
    var fade = ctx.createLinearGradient(0, cy, 0, H);
    fade.addColorStop(0, 'rgba(59,145,245,0)');
    fade.addColorStop(0.25, 'rgba(59,145,245,' + (0.35 * alpha).toFixed(3) + ')');
    fade.addColorStop(1, 'rgba(117,190,255,' + (0.7 * alpha).toFixed(3) + ')');
    ctx.strokeStyle = fade; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = -14; x <= 14; x++) seg(proj(x, 0, near), proj(x, 0, far));
    var off = S.travel % 1;
    for (var k = 1; k < far; k++) {
      var z = k - off;
      if (z < near) continue;
      seg(proj(-14, 0, z), proj(14, 0, z));
    }
    ctx.stroke();

    // wireframe towers on both sides, recycled to the far end once they pass the camera
    var range = 38;
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var tz = t.z - S.travel;
      while (tz < near + t.d) tz += range;
      if (tz > far) continue;
      var grow = Math.max(0, Math.min(1, (S.rise - t.delay) / 0.55));
      grow = 1 - Math.pow(1 - grow, 3);
      if (grow <= 0) continue;
      var h = t.h * grow;
      var dist = Math.min(1, (far - tz) / 10) * alpha;
      var x0 = t.x - t.w / 2, x1 = t.x + t.w / 2, z0 = tz - t.d / 2, z1 = tz + t.d / 2;
      var b0 = proj(x0, 0, z0), b1 = proj(x1, 0, z0), b2 = proj(x1, 0, z1), b3 = proj(x0, 0, z1);
      var t0 = proj(x0, h, z0), t1 = proj(x1, h, z0), t2 = proj(x1, h, z1), t3 = proj(x0, h, z1);
      ctx.strokeStyle = 'rgba(59,145,245,' + (0.75 * dist).toFixed(3) + ')';
      ctx.beginPath();
      seg(b0, t0); seg(b1, t1); seg(b2, t2); seg(b3, t3);
      seg(b0, b1); seg(b1, b2); seg(b2, b3); seg(b3, b0);
      for (var f = 1; f < h; f += 1) { // floor lines give the "glass" look
        var p0 = proj(x0, f, z0), p1 = proj(x1, f, z0), p2 = proj(x1, f, z1);
        seg(p0, p1); seg(p1, p2);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(117,190,255,' + (0.95 * dist).toFixed(3) + ')';
      ctx.beginPath(); seg(t0, t1); seg(t1, t2); seg(t2, t3); seg(t3, t0); ctx.stroke();
    }
  }

  function drawStreak() {
    var cx = W / 2, cy = H / 2, half = Math.max(2, S.streak * W * 0.56);
    var g = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
    g.addColorStop(0, 'rgba(59,145,245,0)');
    g.addColorStop(0.35, 'rgba(117,190,255,' + (0.8 * S.streakA).toFixed(3) + ')');
    g.addColorStop(0.5, 'rgba(255,255,255,' + S.streakA.toFixed(3) + ')');
    g.addColorStop(0.65, 'rgba(117,190,255,' + (0.8 * S.streakA).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(59,145,245,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - half, cy - 1, half * 2, 2);
    ctx.globalAlpha = 0.25; ctx.fillRect(cx - half, cy - 7, half * 2, 14); ctx.globalAlpha = 1;
  }

  function drawGlow(r, a) {
    var cx = W / 2, cy = H / 2;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
    g.addColorStop(0.2, 'rgba(117,190,255,' + (a * 0.7).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(59,145,245,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  function drawWarp() {
    var cx = W / 2, cy = H / 2, R = Math.sqrt(W * W + H * H) / 2;
    ctx.lineWidth = 1.4;
    for (var i = 0; i < warpLines.length; i++) {
      var w = warpLines[i];
      var p = Math.max(0, Math.min(1, (S.warp - w.delay) / 0.65));
      if (p <= 0 || p >= 1) continue;
      var r = w.r * R * (1 - p * p);           // rushing inward, faster near the end
      var len = 20 + 260 * p * (r / R);
      var ca = Math.cos(w.a), sa = Math.sin(w.a);
      ctx.strokeStyle = w.hot ? 'rgba(255,255,255,' + (0.8 * S.warpA).toFixed(3) + ')' : 'rgba(117,190,255,' + (0.7 * S.warpA).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(cx + ca * r, cy + sa * r);
      ctx.lineTo(cx + ca * (r + len), cy + sa * (r + len));
      ctx.stroke();
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var world = 1 - S.warp;
    if (S.unfold > 0.001 && world > 0.01) drawWorld(world);
    if (S.streakA > 0.01) drawStreak();
    if (S.spark > 0.01) drawGlow(10 + S.spark * Math.min(W, H) * 0.12, S.spark);
    if (S.warpA > 0.01) drawWarp();
    if (S.glow > 0.01) drawGlow(Math.min(W, H) * 0.35 * S.glow, S.glow * 0.6);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- Monogram + name helpers ---------- */
  function placeMark() {
    var r = slot.getBoundingClientRect();
    if (!r.width) return;
    gsap.set(mark, { left: r.left, top: r.top, width: r.width, height: r.height });
  }

  function onResize() { resize(); placeMark(); draw(); }

  function prepWord() {
    // lock each letter's width so scrambling symbols don't make the word jitter
    for (var i = 0; i < letters.length; i++) {
      letters[i].style.width = '';
      letters[i].textContent = FINAL[i];
      letters[i].style.width = letters[i].getBoundingClientRect().width + 'px';
    }
  }

  var scr = { p: 0 }, typ = { n: 0 };
  function scramble() {
    var e = scr.p * 0.75;
    for (var i = 0; i < letters.length; i++) {
      var l = letters[i];
      if (e < i * 0.04) { l.style.opacity = 0; continue; }
      l.style.opacity = 1;
      if (e >= 0.18 + i * 0.095) {
        l.textContent = FINAL[i]; l.style.color = '#FFFFFF';
      } else {
        var step = Math.floor(e / 0.05) * 7 + i * 13;
        l.textContent = SYMBOLS.charAt(step % SYMBOLS.length); l.style.color = '#3B91F5';
      }
    }
  }
  function typeTag() { typed.textContent = TAGLINE.slice(0, Math.round(typ.n)); }

  /* ---------- Hand-off: the monogram flies into the nav logo ---------- */
  function handoff() {
    startHero();
    var navMark = document.querySelector('.nav .brand__mark');
    var a = mark.getBoundingClientRect();
    var b = navMark ? navMark.getBoundingClientRect() : null;
    var dur = 0.75;
    mark.classList.remove('is-glowing');
    if (b && b.width && a.width) {
      gsap.to(mark, {
        x: (b.left + b.width / 2) - (a.left + a.width / 2),
        y: (b.top + b.height / 2) - (a.top + a.height / 2),
        scale: b.width / a.width,
        duration: dur, ease: 'power3.inOut'
      });
    } else {
      gsap.to(mark, { opacity: 0, duration: 0.4 });
    }
    gsap.to(skipBtn, { opacity: 0, duration: 0.3 });
    gsap.to(intro, { backgroundColor: 'rgba(8,13,24,0)', duration: dur, ease: 'power2.inOut', onComplete: finish });
  }

  /* ---------- The timeline ---------- */
  function play() {
    if (!window.gsap) return finish();
    root.classList.add('intro-running');
    root.classList.remove('intro-skipped', 'intro-done');
    root.classList.add('intro-playing');
    intro.style.display = '';
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    if (!towers.length) build();
    resize();

    // reset everything (also used for "Replay intro")
    S = { spark: 0, streak: 0, streakA: 0, unfold: 0, travel: 0, rise: 0, warp: 0, warpA: 0, glow: 0 };
    scr.p = 0; typ.n = 0; typed.textContent = '';
    gsap.killTweensOf([intro, mark, skipBtn]);
    gsap.set(intro, { opacity: 1, backgroundColor: '#080D18' });
    gsap.set(screen, { scaleY: 1, opacity: 1 });
    gsap.set(line, { opacity: 0, scaleX: 1, scaleY: 1 });
    gsap.set(skipBtn, { opacity: 1 });
    gsap.set(mark, { x: 0, y: 0, scale: 1, opacity: 0 });
    gsap.set(markPaths, { strokeDashoffset: 1 });
    gsap.set(letters, { opacity: 0, color: '#FFFFFF', textShadow: '0 0 0px rgba(59,145,245,0)' });
    gsap.set(digital, { opacity: 0, letterSpacing: '0em' });
    gsap.set(tagline, { opacity: 0 });
    mark.classList.remove('is-glowing');
    placeMark();
    draw();

    var small = window.innerWidth < 640;

    tl = gsap.timeline({ onUpdate: draw });

    // 1 — Spark (0–0.95s)
    tl.to(S, { spark: 1, duration: 0.45, ease: 'power2.out' }, 0.1)
      .set(S, { streakA: 1 }, 0.45)
      .to(S, { streak: 1, duration: 0.5, ease: 'expo.out' }, 0.45)
      .to(S, { spark: 0.35, duration: 0.4 }, 0.6)

    // 2 — Build (0.95–2.55s)
      .to(S, { unfold: 1, duration: 0.7, ease: 'power3.inOut' }, 0.95)
      .to(S, { streakA: 0.35, duration: 0.6 }, 1.1)
      .to(S, { spark: 0, duration: 0.5 }, 1.2)
      .to(S, { travel: 24, duration: 1.75, ease: 'power2.in' }, 1.0)
      .to(S, { rise: 1, duration: 1.1, ease: 'power2.out' }, 1.15)

    // 3 — Warp + monogram (2.55–3.45s)
      .to(S, { warp: 1, duration: 0.75, ease: 'power2.in' }, 2.55)
      .to(S, { warpA: 1, duration: 0.2 }, 2.55)
      .to(S, { streakA: 0, duration: 0.3 }, 2.55)
      .to(S, { glow: 1, duration: 0.5, ease: 'power2.in' }, 2.75)
      .to(S, { warpA: 0, duration: 0.35 }, 3.2)
      .add(placeMark, 2.75)
      .set(mark, { opacity: 1 }, 2.8)
      .to(markPaths, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut', stagger: 0.08 }, 2.85)
      .add(function () { mark.classList.add('is-glowing'); }, 3.3)
      .to(mark, { scale: 1.08, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 3.3)
      .to(S, { glow: 0, duration: 0.6 }, 3.35)

    // 4 — Name (3.4–4.95s)
      .add(prepWord, 3.4)
      .to(scr, { p: 1, duration: 0.75, ease: 'none', onUpdate: scramble }, 3.45)
      .to(letters, { color: '#75BEFF', textShadow: '0 0 18px rgba(59,145,245,.95)', duration: 0.16, stagger: 0.055, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 4.2)
      .to(digital, { opacity: 1, letterSpacing: small ? '0.45em' : '0.6em', duration: 0.7, ease: 'power3.out' }, 4.1)
      .set(tagline, { opacity: 1 }, 4.3)
      .to(typ, { n: TAGLINE.length, duration: 0.6, ease: 'none', onUpdate: typeTag }, 4.35)
      .add(function () { mark.classList.remove('is-glowing'); }, 4.95)

    // 5 — Reveal (5.0–6.2s)
      .to(screen, { scaleY: 0.004, duration: 0.4, ease: 'power4.in' }, 5.0)
      .to(line, { opacity: 1, duration: 0.12 }, 5.28)
      .to(line, { scaleY: 3, duration: 0.08, ease: 'power2.out' }, 5.42)
      .to(line, { scaleX: 0, scaleY: 0.5, opacity: 0, duration: 0.3, ease: 'power2.in' }, 5.5)
      .set(screen, { opacity: 0 }, 5.5)
      .add(handoff, 5.5);
  }

  // Replay from the footer link.
  window.TremaxIntro = {
    replay: function () {
      if (!window.gsap) return;
      window.scrollTo(0, 0);
      play();
    }
  };

  skipBtn.addEventListener('click', skip);

  if (root.classList.contains('intro-playing')) {
    try { play(); } catch (e) { finish(); }
  } else {
    root.classList.add('intro-done');
    // let the first frame paint so the hero entrance actually animates
    requestAnimationFrame(function () { setTimeout(startHero, 80); });
  }
})();
