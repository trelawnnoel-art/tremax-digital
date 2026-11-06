/* =========================================================
   TREMAX Digital — interactive sections
   1. Pause looping animations while they're off screen.
   2. Pricing estimator + "Send me this quote" → inquiry form.
   3. "Animation included" live preview for the chosen package.
   4. Add-ons: tabs and live previews.
   5. Live build: code types itself while the sample site assembles.
   6. Dashboard sample: search-growth line chart with hover tooltip.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;

  // Calls fn(isVisible) whenever el scrolls in or out of view.
  function watch(el, fn, threshold) {
    if (!el) return;
    if (!hasIO) { fn(true); return; }
    new IntersectionObserver(function (entries) { fn(entries[0].isIntersecting); }, { threshold: threshold || 0 }).observe(el);
  }

  /* ---------- 1. Off-screen pause for CSS animations ---------- */
  $$('[data-motion]').forEach(function (el) {
    watch(el, function (on) { el.classList.toggle('is-paused', !on); });
  });

  /* ---------- 2. Pricing estimator ---------- */
  // Prices also appear in index.html (pricing section and the form's dropdowns). Keep them in sync.
  var PACKAGES = {
    starter: { lo: 200, hi: 400, name: 'Starter' },
    business: { lo: 600, hi: 600, name: 'Business' },
    custom: { lo: 800, hi: null, name: 'Custom' }        // null = open-ended ("$800+")
  };
  var EXTRAS = {
    ordering: { lo: 150, hi: 300, name: 'Online ordering or booking' },
    reviews: { lo: 75, hi: 150, name: 'Reviews & QR code kit' },
    app: { lo: 150, hi: 250, name: 'Your own phone app' }
  };
  var PAGE = { lo: 50, hi: 75 };
  var RUSH = 0.2;
  var CARE = { none: { price: 0 }, basic: { price: 49, name: 'Basic' }, plus: { price: 99, name: 'Plus' } };

  var estimator = $('.estimator');
  var quote = null;

  function money(n) { return '$' + (Math.round(n / 5) * 5).toLocaleString('en-US'); }   // nearest $5, so $75 stays $75
  function range(lo, hi) {
    if (hi === null) return money(lo) + '+';
    return Math.round(lo / 5) === Math.round(hi / 5) ? money(lo) : money(lo) + '–' + money(hi);
  }
  function budgetFor(lo, hi) {
    var v = hi === null ? lo : (lo + hi) / 2;
    if (v <= 400) return '$200–$400';
    if (v <= 700) return '$400–$700';
    if (v <= 1000) return '$700–$1,000';
    if (v <= 1500) return '$1,000–$1,500';
    return 'Over $1,500';
  }

  if (estimator) {
    var pagesInput = $('#est-pages');
    var pagesOut = $('#est-pages-out');
    var totalEl = $('.quote__total');
    var monthlyEl = $('.quote__monthly');
    var linesEl = $('.quote__lines');
    var deliveryEl = $('.quote__delivery');

    var calc = function () {
      var pk = $('input[name="est-package"]:checked').value;
      var p = PACKAGES[pk];
      var lo = p.lo, hi = p.hi;
      var lines = [[p.name + ' package', range(p.lo, p.hi)]];
      // Business and Custom come with the Google setup + dashboard (see the #dashboard section)
      if (pk !== 'starter') lines.push(['Google setup + live dashboard', 'Included']);

      $$('input[name="est-extra"]:checked').forEach(function (c) {
        var x = EXTRAS[c.value];
        if (!x) return;
        lo += x.lo; if (hi !== null) hi += x.hi;
        lines.push([x.name, '+' + range(x.lo, x.hi)]);
      });

      var n = +pagesInput.value;
      pagesOut.textContent = n + (n === 1 ? ' page' : ' pages');
      if (n) {
        lo += n * PAGE.lo; if (hi !== null) hi += n * PAGE.hi;
        lines.push([n + ' extra ' + (n === 1 ? 'page' : 'pages'), '+' + range(n * PAGE.lo, n * PAGE.hi)]);
      }

      var rush = $('input[name="est-extra"][value="rush"]').checked;
      if (rush) {
        lo *= 1 + RUSH; if (hi !== null) hi *= 1 + RUSH;
        lines.push(['Rush delivery in 3 days', '+20%']);
      }

      var careKey = $('input[name="est-care"]:checked').value;
      var care = CARE[careKey];
      var total = range(lo, hi);

      totalEl.textContent = total;
      monthlyEl.textContent = care.price ? 'One-time, plus $' + care.price + '/month ' + care.name + ' care plan' : 'One-time payment';
      deliveryEl.textContent = 'Delivery: ' + (rush ? 'within 3 days' : 'usually within a week');
      linesEl.textContent = '';
      lines.forEach(function (l) {
        var li = document.createElement('li');
        var a = document.createElement('span'); a.textContent = l[0];
        var b = document.createElement('span'); b.textContent = l[1];
        li.appendChild(a); li.appendChild(b); linesEl.appendChild(li);
      });

      quote = {
        pk: pk,
        budget: budgetFor(lo, hi),
        text: 'Estimate from the pricing tool: ' + total + ' one-time\n' +
          lines.map(function (l) { return '- ' + l[0] + ' (' + l[1] + ')'; }).join('\n') +
          (care.price ? '\n- ' + care.name + ' care plan ($' + care.price + '/mo)' : '') +
          '\nDelivery: ' + (rush ? 'within 3 days' : 'usually within a week')
      };
    };

    $$('input', estimator).forEach(function (i) {
      i.addEventListener('input', calc);
      i.addEventListener('change', calc);
    });
    calc();

    // "Choose Business" buttons elsewhere on the page select that package; the link scrolls to #pricing
    $$('[data-pick-package]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = $('input[name="est-package"][value="' + a.getAttribute('data-pick-package') + '"]');
        if (!r) return;
        r.checked = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Fill the inquiry form with this estimate. The link itself scrolls to #contact (main.js).
    var lastText = '';
    $('.quote__send').addEventListener('click', function () {
      calc();
      var pkg = $('#f-package'), budget = $('#f-budget'), desc = $('#f-desc');
      if (pkg) pkg.value = quote.pk;
      if (budget) budget.value = quote.budget;
      if (desc) {
        var cur = desc.value;
        if (lastText && cur.indexOf(lastText) !== -1) desc.value = cur.replace(lastText, quote.text);
        else desc.value = (cur.trim() ? cur.replace(/\s+$/, '') + '\n\n' : '') + quote.text;
        lastText = quote.text;
        desc.dispatchEvent(new Event('input', { bubbles: true }));
      }
      setTimeout(function () {
        var name = $('#f-name');
        var target = name && !name.value ? name : desc;
        if (target) target.focus({ preventScroll: true });
      }, reduce ? 0 : 700);
    });
  }

  /* ---------- 3. "Animation included" preview ---------- */
  // One sample page animated three ways (css/animations.css). .run plays the example once;
  // it holds, fades out (.out) and replays, but only while it's on screen.
  var demo = $('.motion-demo');
  if (demo) {
    var cap = $('.motion-demo__cap');
    var tagEl = $('.md-tag', demo);
    var fx = $('.md-fx', demo);
    var fctx = fx.getContext && fx.getContext('2d');
    var LEVELS = {
      starter: { tag: 'Starter · light motion', cap: 'Starter includes light motion: content fades in smoothly, and cards and buttons react when someone hovers over them.' },
      business: { tag: 'Business · signature animation', cap: 'Business includes signature animation: a glowing hero, headlines that slide in with a sweep of light, and buttons and cards that pop to draw the eye.' },
      custom: { tag: 'Custom · cinematic animation', cap: 'Custom includes cinematic animation: particle effects, 3D reveals, and intros like the one on this site.' }
    };
    var LOOP = 5600;
    var demoVisible = false, timer = 0, raf = 0, runStart = 0, parts = [];
    var level = function () { return demo.getAttribute('data-level'); };

    // Custom only: particles rush in to a line of light, it flashes, then they drift away.
    var seedParts = function (w, h) {
      parts = [];
      for (var i = 0; i < 90; i++) {
        var a = Math.random() * Math.PI * 2, r = Math.max(w, h) * (0.6 + Math.random() * 0.4);
        parts.push({
          sx: w / 2 + Math.cos(a) * r, sy: h / 2 + Math.sin(a) * r,
          tx: w / 2 + (Math.random() - 0.5) * w * 0.7, ty: h / 2 + (Math.random() - 0.5) * 6,
          dx: (Math.random() - 0.5) * 40, dy: -10 - Math.random() * 30, hot: Math.random() < 0.25
        });
      }
    };
    var clearFx = function () {
      if (!fctx) return;
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, fx.width, fx.height);
    };
    var drawFx = function (now) {
      raf = 0;
      if (!fctx) return;
      var w = fx.clientWidth, h = fx.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (!w || !h) return;
      if (fx.width !== Math.round(w * d)) { fx.width = Math.round(w * d); fx.height = Math.round(h * d); parts = []; }
      if (!parts.length) seedParts(w, h);
      fctx.setTransform(d, 0, 0, d, 0, 0);
      fctx.clearRect(0, 0, w, h);
      var t = (now - runStart) / 1000;
      var e = 1 - Math.pow(1 - Math.min(1, t / 0.9), 3);
      for (var i = 0; i < parts.length; i++) {
        var q = parts[i], x, y, a;
        if (t < 0.9) { x = q.sx + (q.tx - q.sx) * e; y = q.sy + (q.ty - q.sy) * e; a = 0.3 + 0.7 * e; }
        else { var k = t - 0.9; x = q.tx + q.dx * k; y = q.ty + q.dy * k; a = Math.max(0, 0.9 - k * 0.4); }
        if (a <= 0) continue;
        fctx.fillStyle = (q.hot ? 'rgba(255,255,255,' : 'rgba(117,190,255,') + a.toFixed(3) + ')';
        fctx.fillRect(x, y, 2, 2);
      }
      if (t > 0.8 && t < 1.4) {   // the flash
        var f = Math.max(0, 1 - Math.abs(t - 0.95) / 0.45);
        var g = fctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
        g.addColorStop(0, 'rgba(59,145,245,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,' + f.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(59,145,245,0)');
        fctx.fillStyle = g;
        fctx.fillRect(w * 0.1, h / 2 - 1, w * 0.8, 2);
        fctx.globalAlpha = f * 0.3; fctx.fillRect(w * 0.1, h / 2 - 8, w * 0.8, 16); fctx.globalAlpha = 1;
      }
      if (t < 4 && demoVisible && !document.hidden && level() === 'custom') raf = requestAnimationFrame(drawFx);
    };

    var cycle = function () {
      clearTimeout(timer); timer = 0;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      demo.classList.remove('run', 'out');
      clearFx();
      if (reduce || !demoVisible || document.hidden) return;   // the still, finished page shows instead
      void demo.offsetWidth;
      demo.classList.add('run');
      runStart = performance.now();
      if (level() === 'custom') { parts = []; raf = requestAnimationFrame(drawFx); }
      timer = setTimeout(function () {
        demo.classList.add('out');
        timer = setTimeout(cycle, 450);
      }, LOOP);
    };

    var setLevel = function () {
      var v = $('input[name="est-package"]:checked').value;
      demo.setAttribute('data-level', v);
      tagEl.textContent = LEVELS[v].tag;
      cap.textContent = LEVELS[v].cap;
      cycle();
    };
    $$('input[name="est-package"]').forEach(function (i) { i.addEventListener('change', setLevel); });
    watch(demo, function (on) {
      var was = demoVisible;
      demoVisible = on;
      if (on && !was) cycle();
      else if (!on) { clearTimeout(timer); timer = 0; }
    }, 0.3);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && demoVisible) cycle(); });
    setLevel();
  }

  /* ---------- 4. Add-ons (tabs + live previews) ---------- */
  var xp = $('.xp');
  if (xp) {
    var tabs = $$('[role="tab"]', xp);
    var panels = $$('[role="tabpanel"]', xp);

    var replay = function (panel) {
      panel.classList.remove('play'); void panel.offsetWidth; panel.classList.add('play');
    };
    var show = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) {
        var on = p.id === tab.getAttribute('aria-controls');
        p.hidden = !on;
        if (on) replay(p); else p.classList.remove('play');
      });
      if (focus) { tab.focus(); tab.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    };
    // On narrow screens the preview opens below the tab strip, often under the fold.
    // Bring it up so tapping a tab visibly shows something.
    var bringIntoView = function (tab) {
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      var strip = tab.parentNode;
      var sticky = getComputedStyle(strip).position === 'sticky';
      // where the preview should land: under the nav, plus under the strip once it sticks there
      var below = $('.nav').getBoundingClientRect().bottom + (sticky ? strip.offsetHeight : 0);
      var top = panel.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.55 || top < below - 1) {
        window.scrollBy({ top: top - below - 12, behavior: reduce ? 'auto' : 'smooth' });
      }
      // keep the tapped chip fully visible in the sideways-scrolling strip
      if (sticky) {
        var t = tab.getBoundingClientRect(), s = strip.getBoundingClientRect();
        if (t.left < s.left) strip.scrollLeft -= s.left - t.left + 8;
        else if (t.right > s.right) strip.scrollLeft += t.right - s.right + 8;
      }
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); bringIntoView(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = -1;
        if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0;
        else if (k === 'End') j = tabs.length - 1;
        if (j < 0) return;
        e.preventDefault();
        show(tabs[j], true);
      });
    });
    // the first preview plays when the section scrolls into view
    var played = false;
    watch(xp, function (on) {
      if (!on || played) return;
      played = true;
      var open = panels.filter(function (p) { return !p.hidden; })[0];
      if (open) replay(open);
    }, 0.3);

    // ordering: sample cart with a running subtotal + pickup slots
    var count = 0, subtotal = 0, cart = $('.o-cart', xp);
    $$('[data-add]', xp).forEach(function (b) {
      b.addEventListener('click', function () {
        count++; subtotal += +b.getAttribute('data-add');
        cart.textContent = count + (count === 1 ? ' item' : ' items') + ' · $' + subtotal.toFixed(2);
        cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
      });
    });
    var slots = $$('.o-slots button', xp);
    slots.forEach(function (b) {
      b.addEventListener('click', function () {
        slots.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });

    // reviews: tap a star on the sample review screen
    var stars = $$('.rv-rate button', xp), rvMsg = $('.rv-msg', xp);
    stars.forEach(function (b, i) {
      b.addEventListener('click', function () {
        stars.forEach(function (x, j) { x.classList.toggle('on', j <= i); x.setAttribute('aria-checked', String(j === i)); });
        rvMsg.textContent = (i + 1) + (i ? ' stars' : ' star') + '. With a real code, this is your Google review page, one scan away.';
      });
    });

    // phone app: a clickable phone (browser → share sheet → home screen → launch screen → app),
    // plus "Watch the demo", where a finger walks through it. Plays once the first time the tab opens.
    var phone = $('.ap-phone', xp);
    if (phone) {
      var apScreen = $('.ap-screen', phone), apMsg = $('.ap-msg', xp), finger = $('.ap-finger', phone);
      var guide = $$('.ap-guide li', xp);
      var STEPS = ['browser', 'sheet', 'home', 'splash', 'app'];
      var STEP_MSG = {
        browser: 'A customer is on your website. Tap Share at the bottom of the phone.',
        sheet: 'Now tap “Add to Home Screen.”',
        home: 'Your icon is on their home screen, next to their other apps. Tap it.',
        splash: 'Opening…',
        app: 'It opens full-screen, like an app. Try the menu, add something, and place an order.'
      };
      var timers = [], demoOn = false, splashT = null;
      var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
      var say = function (t) { apMsg.textContent = t; };

      var go = function (s) {
        clearTimeout(splashT);
        phone.setAttribute('data-step', s);
        var k = STEPS.indexOf(s === 'splash' ? 'app' : s);
        guide.forEach(function (li) {
          var j = STEPS.indexOf(li.getAttribute('data-s'));
          li.classList.toggle('done', j < k);
          li.classList.toggle('on', j === k);
        });
        if (!demoOn) say(STEP_MSG[s]);
        if (s === 'splash') splashT = setTimeout(function () { go('app'); }, reduce ? 300 : 900);
      };

      // the sample app: tabs, a cart, and a pickup order
      var cart = [], bag = $('.ap-bag', phone), bagN = $('.ap-bag__n', phone), done = $('.ap-done', phone), place = $('.ap-place', phone);
      var renderOrder = function () {
        var rows = {}, total = 0;
        cart.forEach(function (c) { rows[c.n] = rows[c.n] || { q: 0, p: c.p }; rows[c.n].q++; total += c.p; });
        var names = Object.keys(rows);
        $('.ap-lines', phone).innerHTML = names.length
          ? names.map(function (n) { return '<li><span>' + rows[n].q + ' × ' + n + '</span><b>$' + (rows[n].q * rows[n].p).toFixed(2) + '</b></li>'; }).join('')
          : '<li class="ap-empty">Nothing yet. Add something from the menu.</li>';
        $('.ap-total b', phone).textContent = '$' + total.toFixed(2);
        place.disabled = !cart.length;
        bagN.textContent = cart.length;
      };
      var tab = function (name) {
        $$('.ap-page', phone).forEach(function (p) { p.hidden = p.getAttribute('data-page') !== name; });
        $$('.ap-tabs button', phone).forEach(function (b) {
          if (b.getAttribute('data-tab') === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        });
        if (name === 'order') renderOrder();
      };
      $$('[data-tab]', phone).forEach(function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-tab')); }); });
      $$('[data-go]', phone).forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
      $$('[data-item]', phone).forEach(function (b) {
        b.addEventListener('click', function () {
          cart.push({ n: b.getAttribute('data-item'), p: +b.getAttribute('data-price') });
          done.hidden = true; orderPage.classList.remove('is-placed');
          renderOrder();
          bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
          if (!demoOn) say(b.getAttribute('data-item') + ' added. Tap Order to check out.');
        });
      });
      // placing the order swaps the cart for a confirmation that lists what was ordered
      var orderPage = $('.ap-page[data-page="order"]', phone);
      place.addEventListener('click', function () {
        $('small', done).textContent = $$('.ap-lines li span', phone).map(function (s) { return s.textContent; }).join(', ') +
          ' · ' + $('.ap-total b', phone).textContent + '. Ready tomorrow at 7:30am.';
        cart = []; renderOrder(); done.hidden = false; orderPage.classList.add('is-placed');
        if (!demoOn) say('Order placed. (Taking real orders in the app needs the Online ordering add-on.)');
      });
      var resetApp = function () { cart = []; renderOrder(); done.hidden = true; orderPage.classList.remove('is-placed'); tab('home'); };

      // the walkthrough
      var stopDemo = function () { timers.forEach(clearTimeout); timers = []; demoOn = false; phone.classList.remove('is-demo'); };
      var aim = function (sel) {
        var el = $(sel, phone), r = el.getBoundingClientRect(), s = apScreen.getBoundingClientRect();
        finger.style.setProperty('--fx', (r.left - s.left + r.width / 2) + 'px');
        finger.style.setProperty('--fy', (r.top - s.top + r.height / 2) + 'px');
        return el;
      };
      var tap = function (sel) { var el = aim(sel); finger.classList.remove('tap'); void finger.offsetWidth; finger.classList.add('tap'); el.click(); };
      var SCRIPT = [
        [0, function () { say('Watch: a customer saves your site to their phone.'); }],
        [600, function () { aim('.ap-share'); }], [1300, function () { tap('.ap-share'); say('They tap Share…'); }],
        [2100, function () { aim('.ap-sheet__opt--add'); }], [2800, function () { tap('.ap-sheet__opt--add'); say('…then “Add to Home Screen.”'); }],
        [3900, function () { aim('.ap-new'); say('Your logo is now on their phone.'); }], [4700, function () { tap('.ap-new'); say('One tap opens it, full-screen.'); }],
        [6300, function () { aim('.ap-page[data-page="home"] .ap-hero__btn'); say('They browse like it’s an app…'); }], [7000, function () { tap('.ap-page[data-page="home"] .ap-hero__btn'); }],
        [7700, function () { aim('[data-item="Croissant"]'); }], [8300, function () { tap('[data-item="Croissant"]'); say('…add a few things…'); }],
        [8900, function () { aim('[data-item="Cinnamon roll"]'); }], [9500, function () { tap('[data-item="Cinnamon roll"]'); }],
        [10200, function () { aim('.ap-tabs [data-tab="order"]'); }], [10800, function () { tap('.ap-tabs [data-tab="order"]'); }],
        [11500, function () { aim('.ap-place'); }], [12100, function () { tap('.ap-place'); say('…and order for pickup.'); }],
        [13600, function () { stopDemo(); say('Your turn: tap around the app. “Start over” adds it to the home screen again.'); }]
      ];
      var demo = function () {
        stopDemo(); resetApp(); go('browser');
        demoOn = true; phone.classList.add('is-demo');
        finger.style.setProperty('--fx', '50%'); finger.style.setProperty('--fy', '60%');
        SCRIPT.forEach(function (s) { later(s[1], s[0]); });
      };
      // a real tap inside the phone takes over from the demo
      apScreen.addEventListener('click', function (e) { if (demoOn && e.isTrusted) { stopDemo(); } }, true);
      $('[data-ap="demo"]', xp).addEventListener('click', demo);
      $('[data-ap="reset"]', xp).addEventListener('click', function () { stopDemo(); resetApp(); go('browser'); });

      go('browser');
      renderOrder();
      var appPanel = phone.closest('.xp__panel'), autoPlayed = false;
      new MutationObserver(function () {
        if (appPanel.hidden) { stopDemo(); return; }
        if (!autoPlayed && !reduce) { autoPlayed = true; later(demo, 500); }
      }).observe(appPanel, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  /* ---------- 5. Live build ---------- */
  var buildEl = $('.build');
  if (buildEl) {
    var CODE = [
      ['<!-- a new site for Rise Bakery -->', null],
      ['<nav>Rise Bakery</nav>', 'nav'],
      ['<h1>Warm bread, every morning</h1>', 'h1'],
      ['<p>Order by 9pm, pick up at 7am.</p>', 'p'],
      ['<button>Order for pickup</button>', 'btn'],
      ['<section class="menu">…</section>', 'menu'],
      ['<style> :root { --crust: #c8742f } </style>', 'style']
    ];
    var box = $('.build__lines', buildEl);
    var pv = $('.build__preview', buildEl);
    var status = $('.build__status');
    var steps = [], pos = 0, timer = 0, waiting = false, buildVisible = false, started = false;
    var DONE = 'Built. That’s a real website, made from code.';

    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var hl = function (s) {
      if (s.indexOf('<!--') === 0) return '<span class="cm">' + esc(s) + '</span>';
      return esc(s)
        .replace(/"[^"]*"/g, function (m) { return '<span class="st">' + m + '</span>'; })
        .replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="tg">$2</span>');
    };
    var reveal = function (k) {
      if (k === 'style') { pv.classList.add('styled'); return; }
      var el = $('[data-k="' + k + '"]', pv);
      if (el) el.classList.add('on');
    };
    var reset = function () {
      clearTimeout(timer); timer = 0; steps = []; pos = 0; waiting = false;
      box.textContent = '';
      pv.classList.remove('styled');
      $$('.pvx', pv).forEach(function (e) { e.classList.remove('on'); });
    };

    // Steps only advance while the demo is on screen and the tab is visible.
    var next = function () {
      timer = 0;
      if (pos >= steps.length) return;
      if (!buildVisible || document.hidden) { waiting = true; return; }
      steps[pos++][1]();
      if (pos < steps.length) timer = setTimeout(next, steps[pos][0]);
    };
    var resume = function () { if (waiting && buildVisible && !document.hidden) { waiting = false; next(); } };

    var run = function () {
      reset();
      started = true;
      if (reduce) {
        CODE.forEach(function (c) {
          var d = document.createElement('div'); d.className = 'ln'; d.innerHTML = hl(c[0]); box.appendChild(d);
          if (c[1]) reveal(c[1]);
        });
        status.textContent = DONE;
        return;
      }
      status.textContent = 'Building…';
      var gap = 200;
      CODE.forEach(function (c) {
        var src = c[0], k = c[1], ln, txt;
        steps.push([gap, function () {
          ln = document.createElement('div'); ln.className = 'ln';
          txt = document.createTextNode('');
          var cur = document.createElement('span'); cur.className = 'cur';
          ln.appendChild(txt); ln.appendChild(cur); box.appendChild(ln);
        }]);
        for (var i = 0; i < src.length; i++) {
          (function (ch) { steps.push([24, function () { txt.data += ch; }]); })(src.charAt(i));
        }
        steps.push([60, function () { ln.innerHTML = hl(src); if (k) reveal(k); }]);
        gap = k === 'style' ? 200 : 380;
      });
      steps.push([600, function () { status.textContent = DONE; }]);
      timer = setTimeout(next, steps[0][0]);
    };

    watch(pv, function (on) {
      buildVisible = on;
      if (on && !started) run();
      else resume();
    }, 0.35);
    document.addEventListener('visibilitychange', resume);
    $('.build__again').addEventListener('click', function () { buildVisible = true; run(); });
  }

  /* ---------- 6. Dashboard sample: search-growth line chart ---------- */
  var chartEl = $('.dash-chart');
  if (chartEl) {
    var NS = 'http://www.w3.org/2000/svg';
    var MONTHS = { May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October' };
    var series = chartEl.getAttribute('data-series').split(',').map(function (p) {
      var kv = p.split(':'); return { m: kv[0], v: +kv[1] };
    });
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    var mk = function (tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };
    var tip = document.createElement('div');
    tip.className = 'dash-tip'; tip.setAttribute('aria-hidden', 'true');
    var pts = [], line, cross, hoverDot, drawn = false, active = -1;

    var draw = function () {
      var W = chartEl.clientWidth, H = chartEl.clientHeight;
      if (!W) return;
      var pad = { l: 40, r: 44, t: 12, b: 24 };
      var max = 5000, steps = 5;           // clean ticks: 0, 1,000 ... 5,000
      var x = function (i) { return pad.l + i * (W - pad.l - pad.r) / (series.length - 1); };
      var y = function (v) { return pad.t + (1 - v / max) * (H - pad.t - pad.b); };
      chartEl.textContent = '';
      var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }, chartEl);
      var grid = mk('g', { 'class': 'grid' }, svg);
      for (var t = 0; t <= steps; t++) {
        var v = max / steps * t, yy = Math.round(y(v)) + .5;
        mk('line', { x1: pad.l, x2: W - pad.r + 8, y1: yy, y2: yy }, grid);
        mk('text', { 'class': 'tick', x: pad.l - 8, y: yy + 4, 'text-anchor': 'end' }, svg).textContent = v ? fmt(v) : '0';
      }
      pts = series.map(function (d, i) { return [x(i), y(d.v)]; });
      series.forEach(function (d, i) {
        mk('text', { 'class': 'tick', x: pts[i][0], y: H - 6, 'text-anchor': 'middle' }, svg).textContent = d.m;
      });
      var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      var area = mk('path', { 'class': 'area', d: path + ' L' + pts[pts.length - 1][0] + ' ' + y(0) + ' L' + pts[0][0] + ' ' + y(0) + ' Z' }, svg);
      line = mk('path', { 'class': 'line', d: path }, svg);
      cross = mk('line', { 'class': 'cross', y1: pad.t, y2: y(0), x1: -10, x2: -10, opacity: 0 }, svg);
      var last = pts[pts.length - 1];
      var endDot = mk('circle', { 'class': 'dot', cx: last[0], cy: last[1], r: 4.5 }, svg);
      var endLabel = mk('text', { 'class': 'end-label', x: last[0] + 9, y: last[1] + 4 }, svg);
      endLabel.textContent = fmt(series[series.length - 1].v);
      hoverDot = mk('circle', { 'class': 'hover-dot', r: 5, cx: -10, cy: -10, opacity: 0 }, svg);
      chartEl.appendChild(tip);

      // draw the line in once, the first time the chart is seen
      if (!drawn && !reduce) {
        var len = line.getTotalLength();
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        area.style.opacity = 0; endDot.style.opacity = 0; endLabel.style.opacity = 0;
        chartEl._pending = function () {
          line.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
          area.style.transition = endDot.style.transition = endLabel.style.transition = 'opacity .5s 1.1s';
          requestAnimationFrame(function () {
            line.style.strokeDashoffset = 0; area.style.opacity = endDot.style.opacity = endLabel.style.opacity = 1;
          });
        };
      }
    };

    var showPoint = function (i) {
      active = i;
      if (i < 0) { tip.classList.remove('on'); cross.setAttribute('opacity', 0); hoverDot.setAttribute('opacity', 0); return; }
      var p = pts[i], d = series[i], prev = series[i - 1];
      cross.setAttribute('x1', p[0]); cross.setAttribute('x2', p[0]); cross.setAttribute('opacity', 1);
      hoverDot.setAttribute('cx', p[0]); hoverDot.setAttribute('cy', p[1]); hoverDot.setAttribute('opacity', 1);
      tip.innerHTML = '<small>' + MONTHS[d.m] + '</small><b>' + fmt(d.v) + '</b> searches' +
        (prev ? '<small>+' + Math.round((d.v - prev.v) / prev.v * 100) + '% vs ' + MONTHS[prev.m] + '</small>' : '');
      var half = tip.offsetWidth / 2, W = chartEl.clientWidth;
      tip.style.left = Math.min(Math.max(p[0], half), W - half) + 'px';
      tip.style.top = Math.max(0, p[1] - tip.offsetHeight - 12) + 'px';
      tip.classList.add('on');
    };
    var nearest = function (clientX) {
      var r = chartEl.getBoundingClientRect(), best = 0;
      pts.forEach(function (p, i) { if (Math.abs(p[0] - (clientX - r.left)) < Math.abs(pts[best][0] - (clientX - r.left))) best = i; });
      return best;
    };
    chartEl.addEventListener('pointermove', function (e) { showPoint(nearest(e.clientX)); });
    chartEl.addEventListener('pointerdown', function (e) { showPoint(nearest(e.clientX)); });
    chartEl.addEventListener('pointerleave', function () { showPoint(-1); });
    chartEl.addEventListener('blur', function () { showPoint(-1); });
    chartEl.addEventListener('keydown', function (e) {
      var n = series.length, i = active;
      if (e.key === 'ArrowRight') i = i < 0 ? 0 : Math.min(n - 1, i + 1);
      else if (e.key === 'ArrowLeft') i = i < 0 ? n - 1 : Math.max(0, i - 1);
      else if (e.key === 'Escape') i = -1;
      else return;
      e.preventDefault(); showPoint(i);
    });

    // small trend lines in the number tiles: muted line, current month as a blue dot
    var sparks = function () {
      $$('.spark').forEach(function (svg) {
        var v = svg.getAttribute('data-trend').split(',').map(Number);
        var W = svg.clientWidth, H = svg.clientHeight, lo = Math.min.apply(null, v), hi = Math.max.apply(null, v);
        if (!W) return;
        var p = v.map(function (n, i) { return [4 + i * (W - 8) / (v.length - 1), H - 4 - (n - lo) / (hi - lo || 1) * (H - 8)]; });
        var d = p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.textContent = '';
        mk('path', { 'class': 's-area', d: d + ' L' + p[p.length - 1][0] + ' ' + H + ' L' + p[0][0] + ' ' + H + ' Z' }, svg);
        mk('path', { 'class': 's-line', d: d }, svg);
        mk('circle', { 'class': 's-dot', cx: p[p.length - 1][0], cy: p[p.length - 1][1], r: 4 }, svg);
      });
    };

    draw(); sparks();
    var lastW = chartEl.clientWidth;
    window.addEventListener('resize', function () {
      if (chartEl.clientWidth === lastW) return;
      lastW = chartEl.clientWidth; showPoint(-1); draw(); sparks();
    });
    var dash = chartEl.closest('.dash');
    // the dashboard is taller than a phone screen, so start when the line chart itself is in view
    watch(chartEl, function (on) {
      if (!on || drawn) return;
      drawn = true;
      dash.classList.add('play');
      if (chartEl._pending) { chartEl._pending(); chartEl._pending = null; }
    }, 0.4);
  }
})();
