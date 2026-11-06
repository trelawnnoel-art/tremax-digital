/* =========================================================
   TREMAX Digital — sample dashboard (dashboard.html)
   Every number here is made up for a pretend bakery. October matches the
   preview on the home page (index.html, "See How Your Site Is Doing").
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var mk = function (tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------- Sample data (monthly totals, May to October) ---------- */
  var MONTHS = ['May', 'June', 'July', 'August', 'September', 'October'];
  var SHORT = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  var M = {
    visitors: [310, 480, 640, 820, 1090, 1284],
    searches: [820, 1350, 2110, 2870, 3940, 4920],
    clicks: [150, 235, 320, 415, 555, 650],
    calls: [18, 25, 33, 40, 49, 55],
    directions: [13, 19, 25, 30, 37, 41],
    forms: [6, 9, 12, 15, 18, 23]
  };
  var RANGES = {
    month: { idx: [5], prev: [4], label: 'October', vs: 'vs September', visits: 'Per day in October, compared with September' },
    quarter: { idx: [3, 4, 5], prev: [0, 1, 2], label: 'August to October', vs: 'vs May to July', visits: 'Per week, August to October, compared with May to July' },
    all: { idx: [0, 1, 2, 3, 4, 5], prev: null, label: 'May to October', vs: 'since launch in May', visits: 'Per week since launch' }
  };
  var KPIS = [
    ['visitors', 'Visitors'],
    ['searches', 'Showed up in Google'],
    ['clicks', 'Clicks from Google'],
    ['calls', 'Calls'],
    ['directions', 'Direction requests'],
    ['forms', 'Form messages']
  ];
  var SOURCES = [['Google search', .52], ['Instagram', .21], ['Typed the address', .17], ['Google Maps', .10]];
  var DISTANCE = [['Within 5 miles', .58], ['5 to 15 miles', .24], ['15 to 50 miles', .12], ['Farther away', .06]];
  var DEVICES = [['Phone', .68], ['Computer', .27], ['Tablet', .05]];
  // October base: [search, times shown, clicks, average position]
  var QUERIES = [
    ['bakery near me', 1140, 118, 4.2], ['rise bakery hours', 410, 182, 1.1], ['rise bakery', 260, 141, 1.0],
    ['sourdough bread', 860, 64, 6.8], ['croissants downtown', 285, 41, 3.5], ['bakery open early', 190, 30, 5.1],
    ['best cinnamon rolls', 230, 22, 7.9], ['custom birthday cake', 170, 15, 9.4]
  ];
  // October base: [page, views, average seconds on page]
  var PAGES = [['Home', 1180, 48], ['Menu', 620, 92], ['Visit us (hours & map)', 340, 39], ['Custom cakes', 210, 161], ['About', 150, 65], ['Contact', 120, 52]];
  // visitors by weekday (rows) and time of day (columns); bigger = busier
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var SLOTS = ['6–9am', '9–12', '12–3pm', '3–6pm', '6–9pm', '9pm–12'];
  var SLOTS_LONG = ['6 to 9am', '9am to noon', 'noon to 3pm', '3 to 6pm', '6 to 9pm', '9pm to midnight'];
  var HEAT = [[6, 5, 4, 3, 3, 1], [6, 5, 4, 3, 3, 1], [7, 5, 4, 3, 3, 1], [7, 6, 5, 3, 4, 1], [9, 7, 5, 4, 5, 2], [14, 12, 7, 4, 4, 2], [11, 12, 6, 3, 3, 1]];

  var sum = function (key, idx) { return idx.reduce(function (t, i) { return t + M[key][i]; }, 0); };

  /* ---------- Daily visitors, generated once and scaled to the monthly totals ---------- */
  var DAILY = (function () {
    var seed = 7;
    var rand = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var WEEKDAY = [1.25, .8, .85, .9, .95, 1.1, 1.45];       // Sun..Sat
    var out = [];
    M.visitors.forEach(function (total, m) {
      var days = new Date(2026, m + 5, 0).getDate();           // May = month index 4
      var next = M.visitors[m + 1] || total * 1.12, row = [];
      for (var d = 0; d < days; d++) {
        var date = new Date(2026, m + 4, d + 1);
        var growth = 1 + (next / total - 1) * (d / days);
        row.push({ date: date, m: m, w: growth * WEEKDAY[date.getDay()] * (0.85 + rand() * 0.3) });
      }
      var tw = row.reduce(function (t, r) { return t + r.w; }, 0);
      row.forEach(function (r) { r.v = r.w / tw * total; out.push(r); });
    });
    return out;
  })();

  var dayLabel = function (d) { return SHORT[d.getMonth() - 4] + ' ' + d.getDate(); };
  // 7-day blocks counted back from the last day, so the newest week is always complete
  var weeks = function (rows) {
    var out = [];
    for (var end = rows.length; end - 7 >= 0; end -= 7) {
      var chunk = rows.slice(end - 7, end);
      out.unshift({ v: chunk.reduce(function (t, r) { return t + r.v; }, 0), label: dayLabel(chunk[0].date), long: dayLabel(chunk[0].date) + ' to ' + dayLabel(chunk[6].date) });
    }
    return out;
  };
  var visitsSeries = function (range) {
    var pick = function (idx) { return DAILY.filter(function (r) { return idx.indexOf(r.m) !== -1; }); };
    if (range === 'month') {
      var map = function (r) { return { v: r.v, label: String(r.date.getDate()), long: DAYS_LONG[(r.date.getDay() + 6) % 7] + ', ' + MONTHS[r.m] + ' ' + r.date.getDate() }; };
      return { cur: pick([5]).map(map), prev: pick([4]).map(map), tickEvery: 5, unit: 'visitors' };
    }
    var R = RANGES[range];
    return { cur: weeks(pick(R.idx)), prev: R.prev ? weeks(pick(R.prev)) : null, tickEvery: range === 'all' ? 4 : 2, unit: 'visitors that week' };
  };

  /* ---------- KPI tiles ---------- */
  var drawSpark = function (svg, values, hi) {
    var W = svg.clientWidth, H = svg.clientHeight;
    if (!W) return;
    var lo = Math.min.apply(null, values), top = Math.max.apply(null, values);
    var p = values.map(function (n, i) { return [4 + i * (W - 8) / (values.length - 1), H - 4 - (n - lo) / (top - lo || 1) * (H - 8)]; });
    var d = p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.textContent = '';
    mk('path', { 'class': 's-area', d: d + ' L' + p[p.length - 1][0] + ' ' + H + ' L' + p[0][0] + ' ' + H + ' Z' }, svg);
    mk('path', { 'class': 's-line', d: d }, svg);
    hi.forEach(function (i) { mk('circle', { 'class': 's-dot', cx: p[i][0], cy: p[i][1], r: i === values.length - 1 ? 4 : 3 }, svg); });
  };
  var renderKpis = function (range) {
    var R = RANGES[range], box = $('[data-kpis]');
    box.textContent = '';
    KPIS.forEach(function (k) {
      var cur = sum(k[0], R.idx), el = document.createElement('div');
      el.className = 'dp-kpi';
      var delta;
      if (R.prev) {
        var prev = sum(k[0], R.prev), pct = Math.round((cur - prev) / prev * 100);
        delta = '<em><span aria-hidden="true">↑</span> ' + pct + '% ' + R.vs + '</em>';
      } else {
        delta = '<em class="is-flat">Total ' + R.vs + '</em>';
      }
      el.innerHTML = '<small>' + k[1] + '</small><b>' + fmt(cur) + '</b>' + delta + '<svg aria-hidden="true"></svg>';
      box.appendChild(el);
      drawSpark($('svg', el), M[k[0]], R.idx.length === 6 ? [5] : R.idx);
    });
  };

  /* ---------- Visitors line chart (one axis; previous period dashed and gray) ---------- */
  var lineEl = $('[data-chart="visits"]');
  var tip = document.createElement('div');
  tip.className = 'dp-tip'; tip.setAttribute('aria-hidden', 'true');
  var chart = null, active = -1;

  var niceMax = function (v) {
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return step * p;
  };
  var drawLine = function (range) {
    var S = visitsSeries(range), W = lineEl.clientWidth, H = lineEl.clientHeight;
    if (!W) return;
    var all = S.cur.concat(S.prev || []).map(function (d) { return d.v; });
    var max = niceMax(Math.max.apply(null, all) * 1.08);
    var lead = max / Math.pow(10, Math.floor(Math.log10(max)));
    var steps = lead === 5 || lead === 2.5 ? 5 : 4;                    // ticks land on round numbers (100s, 50s, 25s)
    var pad = { l: 40, r: 40, t: 14, b: 26 }, n = S.cur.length;
    var x = function (i) { return pad.l + i * (W - pad.l - pad.r) / (n - 1); };
    var y = function (v) { return pad.t + (1 - v / max) * (H - pad.t - pad.b); };
    lineEl.textContent = '';
    var svg = mk('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' }, lineEl);
    var g = mk('g', { 'class': 'grid' }, svg);
    for (var t = 0; t <= steps; t++) {
      var v = max / steps * t, yy = Math.round(y(v)) + .5;
      mk('line', { x1: pad.l, x2: W - pad.r + 6, y1: yy, y2: yy }, g);
      mk('text', { 'class': 'tick', x: pad.l - 8, y: yy + 4, 'text-anchor': 'end' }, svg).textContent = fmt(v);
    }
    S.cur.forEach(function (d, i) {
      if (i % S.tickEvery && i !== n - 1) return;
      if (i !== n - 1 && n - 1 - i < S.tickEvery / 2) return;      // keep the last label clear of its neighbour
      mk('text', { 'class': 'tick', x: x(i), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = range === 'month' ? (i === 0 ? 'Oct 1' : d.label) : d.label;
    });
    var path = function (arr) { return arr.map(function (d, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(d.v).toFixed(1); }).join(' '); };
    var pc = path(S.cur);
    mk('path', { 'class': 'area', d: pc + ' L' + x(n - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z' }, svg);
    if (S.prev) mk('path', { 'class': 'prev', d: path(S.prev.slice(0, n)) }, svg);
    mk('path', { 'class': 'cur', d: pc }, svg);
    var cross = mk('line', { 'class': 'cross', y1: pad.t, y2: y(0), x1: -10, x2: -10, opacity: 0 }, svg);
    var last = S.cur[n - 1];
    mk('circle', { 'class': 'end', cx: x(n - 1), cy: y(last.v), r: 4.5 }, svg);
    mk('text', { 'class': 'end-label', x: x(n - 1) + 8, y: y(last.v) + 4 }, svg).textContent = fmt(last.v);
    var hdot = mk('circle', { 'class': 'hdot', r: 5, cx: -10, cy: -10, opacity: 0 }, svg);
    lineEl.appendChild(tip);
    chart = { S: S, x: x, y: y, n: n, cross: cross, hdot: hdot };
    lineEl.setAttribute('aria-label', 'Line chart of visitors, ' + RANGES[range].visits.toLowerCase() + '. The latest point is ' + fmt(last.v) + '.');
  };
  var point = function (i) {
    active = i;
    if (!chart || i < 0) { tip.classList.remove('on'); if (chart) { chart.cross.setAttribute('opacity', 0); chart.hdot.setAttribute('opacity', 0); } return; }
    var d = chart.S.cur[i], p = chart.S.prev && chart.S.prev[i], px = chart.x(i), py = chart.y(d.v);
    chart.cross.setAttribute('x1', px); chart.cross.setAttribute('x2', px); chart.cross.setAttribute('opacity', 1);
    chart.hdot.setAttribute('cx', px); chart.hdot.setAttribute('cy', py); chart.hdot.setAttribute('opacity', 1);
    tip.innerHTML = '<small>' + d.long + '</small><span class="row"><i></i><b>' + fmt(d.v) + '</b>&nbsp;' + chart.S.unit + '</span>' +
      (p ? '<span class="row"><i class="p"></i>' + fmt(p.v) + ' period before (' + p.long + ')</span>' : '');
    var W = lineEl.clientWidth, half = tip.offsetWidth / 2;
    tip.style.left = Math.min(Math.max(px, half), W - half) + 'px';
    tip.style.top = Math.max(-8, py - tip.offsetHeight - 14) + 'px';
    tip.classList.add('on');
  };
  var nearest = function (clientX) {
    var r = lineEl.getBoundingClientRect(), rel = clientX - r.left, best = 0;
    for (var i = 1; i < chart.n; i++) if (Math.abs(chart.x(i) - rel) < Math.abs(chart.x(best) - rel)) best = i;
    return best;
  };
  lineEl.addEventListener('pointermove', function (e) { if (chart) point(nearest(e.clientX)); });
  lineEl.addEventListener('pointerdown', function (e) { if (chart) point(nearest(e.clientX)); });
  lineEl.addEventListener('pointerleave', function () { point(-1); });
  lineEl.addEventListener('blur', function () { point(-1); });
  lineEl.addEventListener('keydown', function (e) {
    if (!chart) return;
    var i = active;
    if (e.key === 'ArrowRight') i = i < 0 ? 0 : Math.min(chart.n - 1, i + 1);
    else if (e.key === 'ArrowLeft') i = i < 0 ? chart.n - 1 : Math.max(0, i - 1);
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = chart.n - 1;
    else if (e.key === 'Escape') i = -1;
    else return;
    e.preventDefault(); point(i);
  });

  /* ---------- Funnel, bars, tables ---------- */
  var renderFunnel = function (range) {
    var R = RANGES[range];
    var shown = sum('searches', R.idx), clicked = sum('clicks', R.idx);
    var menu = Math.round(clicked * .55), contacted = sum('calls', R.idx) + sum('directions', R.idx) + sum('forms', R.idx);
    var steps = [['Showed up in Google', shown], ['Clicked through to your site', clicked], ['Looked at your menu', menu], ['Contacted you', contacted]];
    var box = $('[data-funnel]');
    box.innerHTML = steps.map(function (s, i) {
      var rate = i ? Math.round(s[1] / steps[i - 1][1] * 100) + '% of the step before' : 'Everyone who saw you in search results';
      return '<li><div class="f-top"><span>' + s[0] + '</span><b>' + fmt(s[1]) + '</b></div>' +
        '<div class="f-bar" style="--v:' + (s[1] / shown * 100).toFixed(1) + '%"></div><span class="f-rate">' + rate + '</span></li>';
    }).join('');
  };
  var renderBars = function (range) {
    var visitors = sum('visitors', RANGES[range].idx);
    [['sources', SOURCES], ['distance', DISTANCE], ['devices', DEVICES]].forEach(function (b) {
      $('[data-bars="' + b[0] + '"]').innerHTML = b[1].map(function (r) {
        return '<li style="--v:' + r[1] * 100 + '%"><span>' + r[0] + '</span><b>' + Math.round(r[1] * 100) + '%<small>' + fmt(visitors * r[1]) + '</small></b><i></i></li>';
      }).join('');
    });
  };
  var mmss = function (s) { return Math.floor(s / 60) + ':' + ('0' + Math.round(s % 60)).slice(-2); };
  var renderTables = function (range) {
    var R = RANGES[range];
    var fShown = sum('searches', R.idx) / M.searches[5], fClicks = sum('clicks', R.idx) / M.clicks[5], fViews = sum('visitors', R.idx) / M.visitors[5];
    var drift = range === 'all' ? .6 : range === 'quarter' ? .3 : 0;    // positions were a little lower earlier on
    var maxShown = QUERIES[0][1] * fShown;
    $('[data-table="queries"] tbody').innerHTML = QUERIES.map(function (q) {
      var shown = q[1] * fShown, clicks = q[2] * fClicks;
      return '<tr><td>' + q[0] + '</td><td>' + fmt(shown) + '<span class="meter" style="--v:' + (shown / maxShown * 100).toFixed(0) + '%" aria-hidden="true"></span></td><td>' + fmt(clicks) + '</td><td>' +
        (clicks / shown * 100).toFixed(1) + '%</td><td>' + (q[3] === 1 ? 1 : q[3] + drift).toFixed(1) + '</td></tr>';
    }).join('');
    var maxViews = PAGES[0][1] * fViews;
    $('[data-table="pages"] tbody').innerHTML = PAGES.map(function (p) {
      var views = p[1] * fViews;
      return '<tr><td>' + p[0] + '</td><td>' + fmt(views) + '<span class="meter" style="--v:' + (views / maxViews * 100).toFixed(0) + '%" aria-hidden="true"></span></td><td>' + mmss(p[2]) + '</td></tr>';
    }).join('');
  };

  /* ---------- Heatmap ---------- */
  var heatTip = $('[data-heat-tip]');
  var renderHeat = function (range) {
    var R = RANGES[range], weeksIn = R.idx.reduce(function (t, i) { return t + new Date(2026, i + 5, 0).getDate(); }, 0) / 7;
    var perWeek = sum('visitors', R.idx) / weeksIn;
    var total = HEAT.reduce(function (t, r) { return t + r.reduce(function (a, b) { return a + b; }, 0); }, 0);
    var max = 14, box = $('[data-heat]'), html = '<span></span>';
    SLOTS.forEach(function (s) { html += '<span class="h-col">' + s + '</span>'; });
    HEAT.forEach(function (row, d) {
      html += '<span class="h-row">' + DAYS[d] + '</span>';
      row.forEach(function (w, s) {
        var label = DAYS_LONG[d] + ', ' + SLOTS_LONG[s] + ': about ' + fmt(perWeek * w / total) + ' visitors a week';
        html += '<button type="button" style="--a:' + (0.1 + 0.9 * w / max).toFixed(2) + '" aria-label="' + label + '" data-tip="' + label + '"></button>';
      });
    });
    box.innerHTML = html;
    var best = DAYS_LONG[5] + ', ' + SLOTS_LONG[0] + ': about ' + fmt(perWeek * HEAT[5][0] / total) + ' visitors a week (the busiest time)';
    heatTip.textContent = best;
    $$('button', box).forEach(function (b) {
      var on = function () { heatTip.textContent = b.getAttribute('data-tip'); };
      b.addEventListener('mouseenter', on); b.addEventListener('focus', on); b.addEventListener('click', on);
    });
    box.onmouseleave = function () { heatTip.textContent = best; };
  };

  /* ---------- Calls & directions columns (all six months; months outside the range are dimmed) ---------- */
  var renderCols = function (range) {
    var R = RANGES[range], max = 60;
    $('[data-cols="actions"]').innerHTML = SHORT.map(function (m, i) {
      var c = M.calls[i], d = M.directions[i], dim = R.idx.indexOf(i) === -1;
      return '<li tabindex="0" style="--top:' + (Math.max(c, d) / max * 100).toFixed(1) + '%;' + (dim ? 'opacity:.35' : '') + '" aria-label="' + MONTHS[i] + ': ' + c + ' calls, ' + d + ' direction requests">' +
        '<i style="--h:' + (c / max * 100).toFixed(1) + '%"></i><i style="--h:' + (d / max * 100).toFixed(1) + '%"></i><span>' + m + '</span>' +
        '<b class="c-tip">' + MONTHS[i] + '<br>' + c + ' calls · ' + d + ' directions</b></li>';
    }).join('');
  };

  /* ---------- Range switch ---------- */
  var current = 'month';
  var render = function (range) {
    current = range;
    var R = RANGES[range];
    $$('[data-range]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-range') === range)); });
    $('[data-range-label]').textContent = R.label;
    $('[data-visits-sub]').textContent = R.visits;
    $('[data-visits-legend]').hidden = !R.prev;
    point(-1);
    renderKpis(range); drawLine(range); renderFunnel(range); renderBars(range); renderTables(range); renderHeat(range); renderCols(range);
  };
  $$('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () { render(b.getAttribute('data-range')); });
  });

  var lastW = 0;
  window.addEventListener('resize', function () {
    if (lineEl.clientWidth === lastW) return;
    lastW = lineEl.clientWidth;
    point(-1); drawLine(current); renderKpis(current);
  });
  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  render('month');
  lastW = lineEl.clientWidth;
})();
