/* =========================================================
   TREMAX Digital — page behaviour
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var nav = $('.nav');
  var toggle = $('.nav__toggle');
  var links = $('#nav-links');

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1000) setMenu(false); });

  /* ---------- Smooth in-page links (work inside any host or subpath) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (a.hasAttribute('data-placeholder-link')) { e.preventDefault(); return; }
    if (id === '#' || id.length < 2) return;
    var target = document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    if (id === '#home') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- Scroll-linked: nav state, progress bar, back-to-top, process line ---------- */
  var bar = $('.scroll-progress span');
  var toTop = $('.to-top');
  var process = $('.process');
  var steps = $$('.process__step');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 20);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0).toFixed(4) + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > 900);

    if (process) {
      var r = process.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.75 - r.top) / (r.height + vh * 0.15);
      p = Math.max(0, Math.min(1, p));
      process.style.setProperty('--progress', p.toFixed(3));
      steps.forEach(function (s, i) { s.classList.toggle('is-lit', p >= i / (steps.length - 1) - 0.02); });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var brand = $('.nav .brand'); if (brand) brand.focus({ preventScroll: true });
  });

  /* ---------- Active nav link + section title reveals ---------- */
  if ('IntersectionObserver' in window) {
    var navMap = {};
    $$('.nav__links a[href^="#"]:not(.btn)').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id === 'pricing' || en.target.id === 'process' ? null : en.target.id;
        if (!id || !navMap[id]) return;
        Object.keys(navMap).forEach(function (k) { navMap[k].classList.toggle('is-active', k === id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { sectionIO.observe(s); });

    // Observe each title's parent: a fully clipped element never counts as intersecting in Chrome.
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.reveal', en.target).forEach(function (el) { el.classList.add('is-in'); });
        revealIO.unobserve(en.target);
      });
    }, { threshold: 0.4 });
    $$('.reveal').forEach(function (el) { revealIO.observe(el.parentElement); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Portfolio screenshots: show a clean placeholder until files are added ---------- */
  $$('img[data-fallback]').forEach(function (img) {
    function fallback() {
      if (img.dataset.failed) return;
      img.dataset.failed = '1';
      img.style.display = 'none';
      var ph = document.createElement('div');
      ph.className = 'shot-fallback';
      ph.textContent = img.getAttribute('data-fallback') + ' coming soon';
      img.parentNode.appendChild(ph);
    }
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });

  /* ---------- Inquiry form ---------- */
  var form = $('#inquiry-form');
  if (form) {
    var status = $('.form__status', form);
    var submit = $('.form__submit', form);
    var label = $('.form__label', form);
    var messages = {
      name: 'Enter your full name.',
      business: 'Enter your business name. If you don’t have one yet, write “not yet”.',
      email: 'Enter an email address like name@example.com.',
      industry: 'Choose the industry closest to yours.',
      service: 'Choose a service, or pick “Not sure yet”.',
      description: 'Tell us a little about the project so we can reply with useful next steps.'
    };

    function fieldError(input, msg) {
      var err = document.getElementById(input.id + '-err');
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) {
        err.textContent = msg || '';
        if (msg) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
      }
    }

    function check(input) {
      var v = input.value.trim();
      if (input.required && !v) return messages[input.name] || 'This field is required.';
      if (input.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return messages.email;
      if (input.type === 'tel' && v && !/^[0-9+()\-.\s]{7,}$/.test(v)) return 'Enter a phone number using digits, or leave it blank.';
      return '';
    }

    $$('input, select, textarea', form).forEach(function (input) {
      if (input.name === '_gotcha') return;
      input.addEventListener('blur', function () { if (input.getAttribute('aria-invalid') === 'true' || input.value) fieldError(input, check(input)); });
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') fieldError(input, check(input)); });
    });

    function setStatus(text, kind) {
      status.textContent = text;
      status.classList.toggle('is-ok', kind === 'ok');
      status.classList.toggle('is-error', kind === 'error');
    }

    function setLoading(on) {
      submit.disabled = on;
      submit.classList.toggle('is-loading', on);
      label.textContent = on ? 'Sending' : 'Send inquiry';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');

      var firstBad = null;
      $$('input, select, textarea', form).forEach(function (input) {
        if (input.name === '_gotcha') return;
        var msg = check(input);
        fieldError(input, msg);
        if (msg && !firstBad) firstBad = input;
      });
      if (firstBad) { setStatus('Check the highlighted fields and try again.', 'error'); firstBad.focus(); return; }

      // Spam trap filled in: quietly stop.
      if ($('[name="_gotcha"]', form).value) return;

      // the email shown in the Contact section, so it only has to be changed in index.html
      var mail = $('.contact a[href^="mailto:"]');
      var EMAIL = mail ? mail.textContent.trim() : 'us';
      var endpoint = form.getAttribute('data-endpoint') || '';
      if (!endpoint || endpoint.indexOf('YOUR_FORM_ID') !== -1) {
        setStatus('This form isn’t connected yet, so nothing was sent. Email ' + EMAIL + ' instead.', 'error');
        return;
      }

      setLoading(true);
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed with status ' + res.status);
          form.reset();
          form.classList.add('is-sent');
          setStatus('Inquiry sent. We’ll reply by email soon.', 'ok');
          label.textContent = 'Sent';
          submit.disabled = true;
          submit.classList.remove('is-loading');
        })
        .catch(function () {
          setLoading(false);
          setStatus('Your inquiry didn’t send. Check your connection and try again, or email ' + EMAIL + '.', 'error');
        });
    });
  }

  /* ---------- Footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  var replay = $('.footer__replay');
  if (replay) {
    if (reduce || !window.gsap || !window.TremaxIntro) replay.hidden = true;
    else replay.addEventListener('click', function () { window.TremaxIntro.replay(); });
  }
})();
