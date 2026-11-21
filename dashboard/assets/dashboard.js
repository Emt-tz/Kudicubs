/* Parent Dashboard and Team Console shell (spec 005 T068, T072, T077): hash router, demo session, reviewer menu, modal, toast.
   Classic script. No network, no cookies. sessionStorage holds ONLY the scripted demo sign-in (research R10) and the demo staff role (R11). */
(function () {
  'use strict';
  var KCD = window.KCD = {};

  KCD.esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  KCD.family = function () { return JSON.parse(JSON.stringify(window.KC_FAMILY)); };   // a private copy: edits last for this page view only

  KCD.session = {
    get: function (k) { try { return window.sessionStorage.getItem('kc.dash.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem('kc.dash.' + k, v); } catch (e) { /* demo only */ } },
    del: function (k) { try { window.sessionStorage.removeItem('kc.dash.' + k); } catch (e) { /* demo only */ } }
  };

  /* #/<id>?key=value&... */
  KCD.parse = function (hash) {
    var h = String(hash || '').replace(/^#\/?/, ''), q = h.indexOf('?'), id = q < 0 ? h : h.slice(0, q), params = {};
    if (q > -1) h.slice(q + 1).split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { id: id, params: params };
  };
  KCD.href = function (id, params) {
    var q = Object.keys(params || {}).filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return '#/' + id + (q ? '?' + q : '');
  };
  KCD.go = function (id, params) { window.location.hash = KCD.href(id, params); };
  KCD.replace = function (id, params) { window.location.replace(window.location.pathname + window.location.search + KCD.href(id, params)); };

  /* ---- toast and modal ---- */
  var toastTimer = null;
  KCD.toast = function (msg) {
    var t = document.getElementById('kd-toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { t.hidden = true; }, 4000);
  };
  /* opts: title, body (html), confirm, cancel, onConfirm(), onCancel(), needsTick (label) — a confirmation the person must tick first */
  KCD.modal = function (opts) {
    var opener = document.activeElement;
    var scrim = document.createElement('div');
    scrim.className = 'kc-modal-scrim';
    scrim.innerHTML = '<div class="kc-modal" role="dialog" aria-modal="true" aria-labelledby="kd-modal-title">' +
      '<h2 id="kd-modal-title">' + KCD.esc(opts.title) + '</h2><div>' + opts.body + '</div>' +
      (opts.needsTick ? '<label class="kc-row"><input type="checkbox" id="kd-modal-tick"> <span>' + KCD.esc(opts.needsTick) + '</span></label>' : '') +
      '<div class="kd-actions"><button type="button" class="kc-btn" id="kd-modal-ok"' + (opts.needsTick ? ' disabled' : '') + '>' + KCD.esc(opts.confirm || 'Confirm') + '</button>' +
      '<button type="button" class="kc-btn kc-quiet" id="kd-modal-cancel">' + KCD.esc(opts.cancel || 'Cancel') + '</button></div></div>';
    document.body.appendChild(scrim);
    var ok = scrim.querySelector('#kd-modal-ok'), cancel = scrim.querySelector('#kd-modal-cancel'), tick = scrim.querySelector('#kd-modal-tick');
    function close(cb) { document.removeEventListener('keydown', onKey, true); scrim.remove(); if (opener && opener.focus && document.contains(opener)) opener.focus(); if (cb) cb(); }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(opts.onCancel); return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(scrim.querySelectorAll('button:not([disabled]), input')), i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
    document.addEventListener('keydown', onKey, true);
    if (tick) tick.addEventListener('change', function () { ok.disabled = !tick.checked; });
    ok.addEventListener('click', function () { close(opts.onConfirm); });
    cancel.addEventListener('click', function () { close(opts.onCancel); });
    (tick || cancel).focus();
  };

  /* ---- start(config): config = { surface, brand, routes:{id:fn(ctx)}, nav(ctx) -> [{id,label,href,primary}], reviewer(ctx) -> {items, note}, guard(ctx) -> id|null } ----
     A route returns { title, html, chrome: 'app'|'bare', current: navId, after(main) }. */
  KCD.start = function (cfg) {
    var main = document.getElementById('main'), first = true, revOpen = false;
    var side = document.getElementById('kd-side'), bottom = document.getElementById('kd-bottom'), more = document.getElementById('kd-more');

    function buildNav(ctx, items, current) {
      var link = function (n) { return '<a href="' + KCD.esc(n.href) + '"' + (n.id === current ? ' aria-current="page"' : '') + '>' + KCD.esc(n.label) + '</a>'; };
      side.innerHTML = '<div class="kc-side-nav">' + items.map(link).join('') + '</div>';
      var prim = items.filter(function (n) { return n.primary; }), rest = items.filter(function (n) { return !n.primary; });
      bottom.innerHTML = prim.map(link).join('') + (rest.length ? '<button type="button" id="kd-more-btn" aria-expanded="false" aria-controls="kd-more">More</button>' : '');
      more.innerHTML = rest.map(link).join(''); more.hidden = true;
      var mb = document.getElementById('kd-more-btn');
      if (mb) mb.addEventListener('click', function () { more.hidden = !more.hidden; mb.setAttribute('aria-expanded', String(!more.hidden)); });
      more.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { more.hidden = true; }); });
    }

    function buildReviewer(ctx) {
      var r = cfg.reviewer(ctx), panel = document.getElementById('kd-rev'), btn = document.getElementById('kd-rev-btn');
      panel.innerHTML = '<h2>Reviewer menu</h2><p class="kd-note">' + r.note + '</p><ul>' +
        r.items.map(function (i) { return '<li><a class="kc-btn kc-quiet" href="' + KCD.esc(i.href) + '">' + KCD.esc(i.label) + '</a></li>'; }).join('') + '</ul>' +
        '<h3>Viewport help</h3><p class="kc-muted">Resize the window or use the browser device toolbar. 320 px is a small phone, 768 px a tablet, 1280 px a laptop. The side navigation appears from 1024 px; below it the bottom bar and its More list keep every page one tap away.</p>' +
        '<button type="button" class="kc-btn" id="kd-rev-close">Close</button>';
      panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setRev(false); }); });
      panel.querySelector('#kd-rev-close').addEventListener('click', function () { setRev(false); btn.focus(); });
    }
    function setRev(open) {
      revOpen = open;
      document.getElementById('kd-rev').hidden = !open;
      document.getElementById('kd-rev-btn').setAttribute('aria-expanded', String(open));
    }
    document.getElementById('kd-rev-btn').addEventListener('click', function () { setRev(!revOpen); if (revOpen) document.querySelector('#kd-rev a, #kd-rev button').focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && revOpen) { setRev(false); document.getElementById('kd-rev-btn').focus(); } });

    function render() {
      var p = KCD.parse(window.location.hash), id = p.id;
      if (!cfg.routes[id]) id = cfg.fallback;
      var ctx = { id: id, params: p.params, state: p.params.state || 'default' };
      var redirect = cfg.guard ? cfg.guard(ctx) : null;
      if (redirect) { KCD.replace(redirect.id, redirect.params); return; }
      var v = cfg.routes[id](ctx);
      var chrome = v.chrome || 'app';
      document.body.setAttribute('data-chrome', chrome);
      document.body.setAttribute('data-view', id);
      document.body.setAttribute('data-state', ctx.state);
      document.title = v.title + ' | ' + cfg.brand;
      main.innerHTML = '<h1 id="kd-title" tabindex="-1">' + KCD.esc(v.title) + '</h1>' + v.html;
      main.setAttribute('aria-busy', ctx.state === 'loading' ? 'true' : 'false');
      if (chrome === 'app') buildNav(ctx, cfg.nav(ctx), v.current || id); else { side.innerHTML = ''; bottom.innerHTML = ''; more.innerHTML = ''; }
      buildReviewer(ctx);
      setRev(false);
      if (v.after) v.after(main, ctx);
      window.scrollTo(0, 0);
      if (!first) { var h = document.getElementById('kd-title'); if (h) h.focus(); }
      first = false;
    }
    window.addEventListener('hashchange', render);
    render();
  };

  /* load the first script that exists (used by the Team Console to read the app's audio manifest, never required) */
  KCD.loadScript = function (urls, done) {
    var u = urls[0];
    if (!u) { done(false); return; }
    var s = document.createElement('script');
    s.src = u; s.onload = function () { done(true); }; s.onerror = function () { s.remove(); KCD.loadScript(urls.slice(1), done); };
    document.head.appendChild(s);
  };
})();
