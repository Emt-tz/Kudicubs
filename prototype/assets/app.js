/* KudiCubs prototype — core: router, state, money, narration, idle hints, reviewer menu.
   Classic script (no modules) so the prototype runs from file:// (research D1).
   No network requests, no localStorage; only preferences in sessionStorage (research D11). */
(function () {
  'use strict';
  var KC = window.KC = window.KC || {};
  var ART = 'assets/art/';

  /* ------------------------------------------------------------ helpers */
  KC.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v === null || v === undefined) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  };
  var h = KC.h;

  KC.t = function (key, vars) {
    var s = (KC.data.strings[key] !== undefined) ? KC.data.strings[key] : key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  };

  KC.img = function (rel, alt, cls) {
    return h('img', { src: ART + rel, alt: alt || '', 'aria-hidden': alt ? null : 'true', class: cls || null, draggable: 'false' });
  };

  /* ------------------------------------------------------------ preferences + state */
  var PREF_KEY = 'kc-proto-prefs';
  function loadPrefs() {
    try { return JSON.parse(sessionStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; }
  }
  KC.savePrefs = function () {
    try { sessionStorage.setItem(PREF_KEY, JSON.stringify({ region: KC.state.region, sound: KC.state.sound, notes: KC.state.notes })); } catch (e) { /* private mode */ }
  };

  KC.resetState = function () {
    var p = loadPrefs();
    var s = KC.data.start;
    KC.state = {
      region: p.region || KC.defaultRegion,
      sound: p.sound !== undefined ? p.sound : true,
      notes: !!p.notes,
      nickname: KC.data.child.nickname,
      avatarId: KC.data.child.avatarId,
      band: null,
      coins: s.coins, savings: s.savings, xp: s.xp,
      badges: s.badges.slice(),
      items: [],
      events: [],
      pillars: Object.assign({}, KC.data.pillars),
      runId: 0,
      lostCoins: { found: 0, sortedCorrectFirstTry: true, choice: null, completedOnce: false, earned: false, applied: false },
      lastReward: null
    };
  };
  KC.resetRun = function () {
    var lc = KC.state.lostCoins;
    KC.state.runId += 1;
    KC.state.lostCoins = { found: 0, sortedCorrectFirstTry: true, choice: null, completedOnce: lc.completedOnce, earned: false, applied: false };
  };

  KC.region = function () { return KC.regions[KC.state.region] || KC.regions[KC.defaultRegion]; };
  KC.coinSrc = function (id) { return 'coins/' + KC.state.region + '/' + id + '.svg'; };
  KC.denom = function (id) {
    var list = KC.region().denominations;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  };

  /* Coins are region-neutral game units: show the region's coin picture + a number, never a price (FR-022). */
  KC.money = function (amount, opts) {
    opts = opts || {};
    var r = KC.region();
    var sign = opts.sign && amount > 0 ? '+' : (opts.sign && amount < 0 ? '−' : '');
    var label = Math.abs(amount) + ' ' + KC.t(Math.abs(amount) === 1 ? 'coin.one' : 'coin.many');
    return h('span', { class: 'kc-money' + (opts.size ? ' kc-money--' + opts.size : ''), 'data-money': true, 'data-region': r.code,
                       'data-component': 'coin-counter', 'aria-label': (sign === '−' ? 'minus ' : '') + label },
      h('img', { src: ART + KC.coinSrc(r.coinIcon), alt: '', 'aria-hidden': 'true', 'data-region': r.code, draggable: 'false' }),
      h('span', { class: 'kc-money-n' }, sign + Math.abs(amount)));
  };
  KC.currencyLabel = function () {
    var c = KC.region().currency;
    return KC.region().name + ' · ' + c.majorPlural + ' (' + c.symbol + ')';
  };

  KC.levelFor = function (xp) {
    var lv = KC.data.levels[0];
    KC.data.levels.forEach(function (l) { if (xp >= l.xpFrom) lv = l; });
    return lv;
  };
  KC.nextLevel = function (xp) {
    var cur = KC.levelFor(xp);
    return KC.data.levels.filter(function (l) { return l.n === cur.n + 1; })[0] || null;
  };

  /* Wallet ledger (mirrors spec 001 wallet_events kinds/categories) */
  KC.addEvent = function (kind, amount, category, labelKey, icon) {
    KC.state.events.unshift({ kind: kind, amount: amount, category: category, labelKey: labelKey, icon: icon, daysAgo: 0, run: KC.state.runId });
  };

  /* ------------------------------------------------------------ narration (research D8) */
  KC.audioUnlocked = false;
  var synth = window.speechSynthesis || null;
  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    var want = KC.region().voiceLang.toLowerCase();
    var exact = voices.filter(function (v) { return (v.lang || '').toLowerCase().replace('_', '-') === want; })[0];
    return exact || voices.filter(function (v) { return /^en[-_]/i.test(v.lang || ''); })[0] || null;
  }
  KC.say = function (key, vars) {
    var text = KC.t(key, vars);
    document.querySelectorAll('[data-component="speaker-cue"]').forEach(function (c) {
      if (c.getAttribute('data-narration') === key) { c.classList.add('is-speaking'); setTimeout(function () { c.classList.remove('is-speaking'); }, 1600); }
    });
    if (!KC.state.sound || !KC.audioUnlocked || !synth) return;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = KC.region().voiceLang; }
      u.rate = 0.92; u.pitch = 1.1;
      synth.speak(u);
    } catch (e) { /* speech not available: the cue still animates */ }
  };
  KC.stopSpeech = function () { try { if (synth) synth.cancel(); } catch (e) { /* ignore */ } };
  document.addEventListener('pointerdown', function unlock() {
    KC.audioUnlocked = true;
    try { if (synth) { synth.cancel(); synth.speak(new SpeechSynthesisUtterance(' ')); } } catch (e) { /* ignore */ }
    document.removeEventListener('pointerdown', unlock, true);
  }, true);

  KC.speakerCue = function (key, vars) {
    return h('button', { class: 'kc-speaker', 'data-component': 'speaker-cue', 'data-narration': key, 'aria-label': 'Listen again',
                         onclick: function (e) { e.stopPropagation(); KC.say(key, vars); } },
      KC.img('icons/speaker.svg'));
  };

  /* ------------------------------------------------------------ shared builders */
  KC.kudi = function (pose, opts) {
    opts = opts || {};
    var img = h('img', { src: ART + 'kudi/' + pose + '.svg', alt: opts.alt === undefined ? 'Kudi the Cub' : opts.alt, 'data-kudi': pose, class: 'kc-kudi-img', draggable: 'false' });
    if (!opts.say) {
      return h('div', { class: 'kc-illustration kc-kudi kc-kudi--' + (opts.size || 'md'), 'data-component': 'illustration' }, img);
    }
    return h('div', { class: 'kc-kudi-bubble kc-kudi--' + (opts.size || 'md'), 'data-component': 'kudi-bubble' },
      img,
      h('div', { class: 'kc-bubble' }, h('p', { class: 'kc-child-text' }, KC.t(opts.say, opts.vars)), KC.speakerCue(opts.say, opts.vars)));
  };

  KC.primary = function (label, onClick, opts) {
    opts = opts || {};
    return h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, onclick: onClick, 'aria-label': opts.aria || null },
      opts.icon ? KC.img('icons/' + opts.icon + '.svg') : null, h('span', null, label));
  };
  KC.secondary = function (label, onClick) {
    return h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', onclick: onClick }, label);
  };
  KC.illustration = function (rel, alt, cls) {
    return h('div', { class: 'kc-illustration ' + (cls || ''), 'data-component': 'illustration' }, KC.img(rel, alt));
  };

  /* Replace a primary group with a single primary button (FR-013: one main action at a time). */
  KC.promote = function (group, button, host) {
    if (group) group.removeAttribute('data-primary-group');
    (host || document.querySelector('#kc-screen .kc-actions') || document.getElementById('kc-screen')).appendChild(button);
    KC.resetIdle();
  };

  /* ------------------------------------------------------------ router */
  var screenEl, backBtn, backSpacer, nav, phone;
  KC.current = null;

  /* Render synchronously (instant feedback), then record the route in the hash for back/refresh. */
  var skipHash = null;
  KC.go = function (id) {
    if (location.hash !== '#/' + id) { skipHash = id; location.hash = '#/' + id; }
    KC.render(id);
  };
  KC.render = function (id) {
    var def = KC.screens[id];
    if (!def) { id = 'welcome'; def = KC.screens.welcome; }
    KC.stopSpeech();
    clearIdle();
    if (KC.current && KC.current.id !== 'parent-gate') { var ov = document.getElementById('kc-overlay'); if (ov) ov.innerHTML = ''; }
    KC.current = def;
    screenEl.innerHTML = '';
    screenEl.setAttribute('data-screen', def.id);
    screenEl.setAttribute('data-audience', def.audience);
    if (def.audience === 'child') screenEl.setAttribute('data-band', def.band || 'b4_6'); else screenEl.removeAttribute('data-band');
    screenEl.removeAttribute('data-hint-active');
    phone.setAttribute('data-audience', def.audience);
    def.render(screenEl);
    screenEl.scrollTop = 0;
    var showBack = def.id !== 'welcome';
    backBtn.hidden = !showBack; backSpacer.hidden = showBack;
    var showNav = ['home', 'wallet', 'progress'].indexOf(def.id) !== -1;
    nav.hidden = !showNav;
    nav.querySelectorAll('button').forEach(function (b) {
      if (b.getAttribute('data-route') === def.id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    markNotWired();
    if (def.audience === 'child') {
      startIdle();
      if (def.narration && def.narration.length) setTimeout(function () { if (KC.current === def) KC.say(def.narration[0]); }, 350);
    }
    if (KC.state.notes) showNotes(def);
  };

  /* ------------------------------------------------------------ idle hints (FR-013, research D9) */
  var idleTimers = [];
  var HINTS = [6000, 12000, 20000];
  function clearIdle() {
    idleTimers.forEach(clearTimeout); idleTimers = [];
    if (screenEl) {
      screenEl.removeAttribute('data-hint-active');
      screenEl.querySelectorAll('.kc-hint, .kc-hint--strong').forEach(function (n) { n.classList.remove('kc-hint', 'kc-hint--strong'); });
      screenEl.querySelectorAll('img[data-kudi]').forEach(function (k) {
        if (k.getAttribute('data-kudi-was')) { k.src = ART + 'kudi/' + k.getAttribute('data-kudi-was') + '.svg'; k.removeAttribute('data-kudi-was'); }
      });
    }
  }
  function target() {
    var t = screenEl.querySelector('[data-primary]:not([hidden])') || screenEl.querySelector('[data-primary-group]');
    return t;
  }
  function startIdle() {
    HINTS.forEach(function (ms, level) {
      idleTimers.push(setTimeout(function () {
        var t = target();
        screenEl.setAttribute('data-hint-active', String(level + 1));
        if (t) { t.classList.add('kc-hint'); if (level === 2) t.classList.add('kc-hint--strong'); }
        var k = screenEl.querySelector('img[data-kudi]');
        if (k && !k.getAttribute('data-kudi-was')) { k.setAttribute('data-kudi-was', k.getAttribute('data-kudi')); k.src = ART + 'kudi/point.svg'; }
        if (level >= 1 && KC.current && KC.current.narration && KC.current.narration.length) KC.say(KC.current.narration[KC.current.narration.length > 1 ? 1 : 0]);
      }, ms));
    });
  }
  KC.resetIdle = function () {
    if (!KC.current || KC.current.audience !== 'child') return;
    clearIdle(); startIdle();
  };
  ['pointerdown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () { KC.resetIdle(); }, true);
  });

  /* ------------------------------------------------------------ reviewer menu (FR-021, research D10) */
  var reviewer;
  KC.openReviewer = function () {
    reviewer.innerHTML = '';
    var regionRow = h('div', { class: 'kc-seg', role: 'radiogroup', 'aria-label': KC.t('review.region') });
    Object.keys(KC.regions).forEach(function (code) {
      var r = KC.regions[code];
      regionRow.appendChild(h('button', { class: 'kc-seg-btn', role: 'radio', 'aria-checked': String(KC.state.region === code), 'data-region-choice': code,
        onclick: function () { KC.setRegion(code); KC.openReviewer(); } }, r.name));
    });
    var jump = h('select', { class: 'kc-select', 'aria-label': KC.t('review.jump'), onchange: function (e) { KC.closeReviewer(); KC.go(e.target.value); } },
      h('option', { value: '' }, '— ' + KC.t('review.jump') + ' —'),
      KC.order.map(function (id) { return h('option', { value: id }, KC.screens[id].title + ' (' + id + ')'); }));
    var setSet = KC.regionCoinSet();
    reviewer.appendChild(h('div', { class: 'kc-reviewer-sheet' },
      h('div', { class: 'kc-row' }, h('h2', { class: 'kc-title kc-grow' }, KC.t('review.title')),
        h('button', { class: 'kc-icon-btn kc-icon-btn--light', 'data-component': 'icon-button', 'aria-label': KC.t('review.close'), onclick: KC.closeReviewer }, KC.img('icons/close.svg'))),
      h('p', { class: 'kc-caption kc-muted' }, 'For the client and design team. Children never see this menu.'),
      h('h3', { class: 'kc-label' }, KC.t('review.region')), regionRow,
      h('p', { class: 'kc-caption', 'data-currency-label': true }, KC.currencyLabel()),
      setSet,
      h('h3', { class: 'kc-label' }, KC.t('review.jump')), jump,
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.sound, onchange: function (e) { KC.state.sound = e.target.checked; KC.savePrefs(); if (!e.target.checked) KC.stopSpeech(); } }), KC.t('review.sound')),
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.notes, onchange: function (e) { KC.state.notes = e.target.checked; KC.savePrefs(); KC.render(KC.current.id); } }), KC.t('review.notes')),
      h('button', { class: 'kc-btn kc-btn--secondary kc-btn--light', 'data-component': 'secondary-button', onclick: function () { KC.resetState(); KC.closeReviewer(); KC.go('welcome'); } }, KC.t('review.restart')),
      h('p', { class: 'kc-caption kc-muted' }, 'Prototype ' + KC.version.prototype + ' · tokens ' + KC.version.tokens + ' · placeholder art and voice')));
    reviewer.hidden = false;
    clearIdle();
  };
  KC.closeReviewer = function () { reviewer.hidden = true; KC.resetIdle(); };
  KC.setRegion = function (code) {
    if (!KC.regions[code]) return;
    KC.state.region = code; KC.savePrefs();
    if (KC.current) KC.render(KC.current.id);
  };
  KC.regionCoinSet = function () {
    var r = KC.region();
    return h('div', { class: 'kc-coin-set', 'data-component': 'region-coin-set', 'aria-label': r.name + ' coins' },
      r.denominations.map(function (d) {
        return h('figure', { class: 'kc-coin-set-item' },
          h('img', { src: ART + KC.coinSrc(d.id), alt: d.label, 'data-region': r.code, draggable: 'false' }),
          h('figcaption', { class: 'kc-caption' }, d.label));
      }));
  };

  function showNotes(def) {
    if (!def.notes) return;
    screenEl.appendChild(h('aside', { class: 'kc-note', 'data-component': 'reviewer-menu', 'data-reviewer': true }, h('strong', null, 'Screen notes: '), def.notes));
  }
  function markNotWired() {
    screenEl.querySelectorAll('[data-not-wired]').forEach(function (n) {
      n.addEventListener('click', function (e) {
        e.preventDefault();
        if (!KC.state.notes) return;
        var tip = h('span', { class: 'kc-note kc-note--tip', 'data-reviewer': true }, KC.t('review.not_wired'));
        n.appendChild(tip); setTimeout(function () { tip.remove(); }, 1500);
      });
    });
  }

  /* Long-press the logo for 2 s to open the reviewer menu (not reachable by an accidental tap). */
  function bindLongPress(el, ms, fn) {
    var timer = null;
    el.addEventListener('pointerdown', function () { el.classList.add('is-pressing'); timer = setTimeout(function () { el.classList.remove('is-pressing'); fn(); }, ms); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
      el.addEventListener(ev, function () { el.classList.remove('is-pressing'); clearTimeout(timer); });
    });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ------------------------------------------------------------ boot */
  KC.start = function () {
    phone = document.getElementById('kc-phone');
    screenEl = document.getElementById('kc-screen');
    backBtn = document.getElementById('kc-back');
    backSpacer = document.getElementById('kc-back-spacer');
    nav = document.getElementById('kc-bottom-nav');
    reviewer = document.getElementById('kc-reviewer');
    KC.resetState();
    backBtn.addEventListener('click', function () { history.back(); });
    nav.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-label', b.textContent.trim());
      b.addEventListener('click', function () { KC.say('nav.' + b.getAttribute('data-route')); KC.go(b.getAttribute('data-route')); });
    });
    bindLongPress(document.getElementById('kc-logo'), 2000, KC.openReviewer);
    window.addEventListener('hashchange', function () {
      var id = location.hash.replace('#/', '') || 'welcome';
      if (skipHash === id) { skipHash = null; return; }
      skipHash = null;
      KC.render(id);
    });
    if (/[?&]review=1/.test(location.search)) setTimeout(KC.openReviewer, 50);
    KC.render(location.hash.replace('#/', '') || 'welcome');
    if (/^http/.test(location.protocol) && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
    }
  };
})();
