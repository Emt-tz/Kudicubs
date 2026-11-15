/* KudiCubs prototype — core: router, state, money, human-voice playback, sound effects, Kudi reactions,
   idle hints, reviewer menu. Classic script (no modules) so the prototype runs from file:// (002 research D1).
   No synthetic speech anywhere (003 FR-014): narration is pre-recorded human audio, played by line ID.
   No network requests, no localStorage; only preferences in sessionStorage (003 data-model §9). */
(function () {
  'use strict';
  var KC = window.KC = window.KC || {};
  var ART = 'assets/art/';
  var BRAND = 'assets/brand/';

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

  /* UI strings, with per-region overrides (003 FR-033): KC.data['strings_<region>'][key] wins. */
  KC.t = function (key, vars) {
    var region = KC.state && KC.state.region;
    var over = region && KC.data['strings_' + region];
    var s = over && over[key] !== undefined ? over[key] : (KC.data.strings[key] !== undefined ? KC.data.strings[key] : key);
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  };
  /* The words of a narration line (caption / bubble text) come from the audio manifest, i.e. lines.json. */
  KC.lineText = function (id) {
    return (KC.audioManifest && KC.audioManifest.text[id]) || KC.t(id);
  };
  /* Region-specific line id: e.g. KC.rline('decide.spend') → 'decide.spend.gh'. */
  KC.rline = function (base) { return base + '.' + KC.state.region; };

  KC.img = function (rel, alt, cls) {
    return h('img', { src: ART + rel, alt: alt || '', 'aria-hidden': alt ? null : 'true', class: cls || null, draggable: 'false' });
  };

  /* ------------------------------------------------------------ preferences + state */
  var PREF_KEY = 'kc-proto-prefs';
  function loadPrefs() {
    try { return JSON.parse(sessionStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; }
  }
  KC.savePrefs = function () {
    try {
      sessionStorage.setItem(PREF_KEY, JSON.stringify({ region: KC.state.region, sound: KC.state.sound, notes: KC.state.notes, voiceLang: KC.state.voiceLang }));
    } catch (e) { /* private mode */ }
  };

  KC.resetState = function () {
    var p = loadPrefs();
    var s = KC.data.start;
    KC.state = {
      region: p.region || KC.defaultRegion,
      sound: p.sound !== undefined ? p.sound : true,
      notes: !!p.notes,
      voiceLang: p.voiceLang || null,
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
  KC.hidden = function () { return KC.data.lostCoins.hidden; };

  KC.region = function () { return KC.regions[KC.state.region] || KC.regions[KC.defaultRegion]; };
  KC.coinSrc = function (id, region) { return 'coins/' + (region || KC.state.region) + '/' + id + '.svg'; };
  KC.denom = function (id) {
    var list = KC.region().denominations;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  };
  /* One coin/note image builder (003 FR-040): always via KC.coinSrc, always data-region. */
  KC.coinImg = function (denomId, opts) {
    opts = opts || {};
    var region = opts.region || KC.state.region;
    return h('img', { src: ART + KC.coinSrc(denomId, region), alt: opts.alt || '', 'aria-hidden': opts.alt ? null : 'true', 'data-region': region,
                      class: opts.class || null, style: opts.style || null, draggable: 'false' });
  };
  KC.coinLine = function (denomId) { return 'coin.' + KC.state.region + '.' + denomId.replace(/-/g, '_'); };

  /* Coins are region-neutral game units: the region's coin picture + a number, never a price (002 FR-022). */
  KC.money = function (amount, opts) {
    opts = opts || {};
    var r = KC.region();
    var sign = opts.sign && amount > 0 ? '+' : (opts.sign && amount < 0 ? '−' : '');
    var label = (sign === '−' ? KC.t('a11y.minus') + ' ' : '') + Math.abs(amount) + ' ' + KC.t(Math.abs(amount) === 1 ? 'coin.one' : 'coin.many');
    return h('span', { class: 'kc-money' + (opts.size ? ' kc-money--' + opts.size : ''), 'data-money': true, 'data-region': r.code,
                       'data-component': 'coin-counter', 'aria-label': label },
      KC.coinImg(r.coinIcon), h('span', { class: 'kc-money-n' }, sign + Math.abs(amount)));
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

  /* ------------------------------------------------------------ Kudi poses (003 FR-010, FR-025, research R2) */
  KC.poses = { wave: 'kudi-wave', celebrate: 'kudi-celebrate', fist: 'kudi-fist', 'thumbs-up': 'kudi-thumbs-up', headphones: 'kudi-headphones' };
  var REACT = { greet: 'wave', correct: 'thumbs-up', celebrate: 'celebrate', encourage: 'fist', playing: 'headphones' };
  var reactTimer = null;
  function kudiEl() { return document.querySelector('#kc-screen img[data-kudi-pose]'); }
  function setPose(pose) {
    var k = kudiEl();
    if (!k || !KC.poses[pose]) return;
    if (k.getAttribute('data-kudi-pose') !== pose) {
      k.src = BRAND + KC.poses[pose] + '.webp';
      k.setAttribute('data-kudi-pose', pose);
    }
  }
  KC.basePose = function () { return (KC.current && KC.current.pose) || 'wave'; };
  /* Pose order (interaction-moments §2): reaction ≈0.6 s → headphones while a line plays → base pose. */
  KC.kudiReact = function (state, opts) {
    opts = opts || {};
    var pose = REACT[state] || state;
    clearTimeout(reactTimer);
    setPose(pose);
    if (!opts.hold) reactTimer = setTimeout(function () { if (!KC.voice.playing) setPose(KC.basePose()); }, 1200);
  };

  /* ------------------------------------------------------------ human-voice playback (003 FR-014–FR-016, contracts/audio-manifest.md) */
  var audio = new Audio();
  audio.preload = 'auto';
  var captionEl = null, replayBtn = null;
  function caption(state, id) {
    if (!captionEl) return;
    captionEl.setAttribute('data-caption-state', state);
    captionEl.classList.remove('is-highlight');
    captionEl.innerHTML = '';
    if (state === 'hidden') return;
    captionEl.appendChild(h('span', { class: 'kc-caption-text' }, KC.lineText(id)));
    if (state === 'pending') captionEl.appendChild(h('span', { class: 'kc-caption-badge' }, KC.t('voice.pending')));
    if (state === 'ready') captionEl.appendChild(h('span', { class: 'kc-caption-badge' }, KC.t('voice.tap_replay')));
  }
  function pickFile(id) {
    var m = KC.audioManifest;
    if (!m) return null;
    var langs = [KC.state.voiceLang, m.regionLanguage[KC.state.region], m.defaultLanguage];
    for (var i = 0; i < langs.length; i++) {
      var l = langs[i];
      if (l && m.lines[l] && m.lines[l][id] && m.lines[l][id].status === 'recorded') return m.lines[l][id].file;
    }
    return null;
  }
  KC.voice = {
    last: null, playing: false,
    play: function (id, opts) {
      opts = opts || {};
      if (!id) return;
      KC.voice.stop(true);
      KC.voice.last = id;
      var file = pickFile(id);
      document.body.setAttribute('data-last-line', id);
      if (!file || !KC.state.sound) {
        caption(file ? 'playing' : 'pending', id); // sound off: caption only; never synthesised
        if (file && !KC.state.sound) captionEl && captionEl.setAttribute('data-caption-state', 'muted');
        if (!file && opts.highlight && captionEl) {  // a tapped word with no recording: highlight its caption, say nothing
          captionEl.classList.remove('is-highlight'); void captionEl.offsetWidth; captionEl.classList.add('is-highlight');
        }
        return;
      }
      audio.src = file;
      caption('playing', id);
      var start = function () {
        KC.voice.playing = true;
        setTimeout(function () { if (KC.voice.playing) setPose('headphones'); }, opts.reaction ? 600 : 0);
      };
      var p = audio.play();
      if (p && p.then) p.then(start, function (err) {
        KC.voice.playing = false;
        caption(err && err.name === 'NotAllowedError' ? 'ready' : 'pending', id);
      });
      else start();
    },
    replay: function () {
      var id = KC.voice.last || (KC.current && KC.current._narr && KC.current._narr[0]);
      if (id) KC.voice.play(id);
    },
    stop: function (keepCaption) {
      try { audio.pause(); audio.currentTime = 0; } catch (e) { /* not loaded */ }
      KC.voice.playing = false;
      if (!keepCaption) caption('hidden');
    }
  };
  audio.addEventListener('ended', function () { KC.voice.playing = false; setPose(KC.basePose()); captionEl && captionEl.setAttribute('data-caption-state', 'done'); });
  audio.addEventListener('error', function () {
    if (!KC.voice.last) return;
    KC.voice.playing = false; caption('pending', KC.voice.last); setPose(KC.basePose());
  });

  /* Tap-to-hear speaker inside Kudi's bubble (002 speaker-cue, now human recordings). */
  KC.speakerCue = function (key) {
    return h('button', { class: 'kc-speaker', 'data-component': 'speaker-cue', 'data-narration': key, 'aria-label': KC.t('a11y.listen'),
                         onclick: function (e) { e.stopPropagation(); KC.sfx('tap'); KC.voice.play(key); } },
      KC.img('icons/speaker.svg'));
  };

  /* ------------------------------------------------------------ sound effects: generated tones, never speech (003 FR-030, research R8) */
  var actx = null;
  function ctx() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    return actx;
  }
  var SFX = {
    pop: [['sine', 880, 440, 0.12, 0.25]],
    chime: [['triangle', 1047, 1047, 0.09, 0.22], ['triangle', 1319, 1319, 0.09, 0.22, 0.09]],
    tick: [['square', 1200, 1200, 0.03, 0.06]],
    boop: [['sine', 220, 180, 0.2, 0.2]],
    sparkle: [['sine', 1047, 1047, 0.07, 0.18], ['sine', 1319, 1319, 0.07, 0.18, 0.07], ['sine', 1568, 1568, 0.07, 0.18, 0.14], ['sine', 2093, 2093, 0.09, 0.18, 0.21]],
    tap: [['sine', 660, 660, 0.04, 0.08]]
  };
  KC.sfx = function (id) {
    var log = document.body.getAttribute('data-sfx-log');
    document.body.setAttribute('data-sfx-log', (log ? log + ' ' : '') + id);
    if (!KC.state.sound || !SFX[id]) return;
    var c = ctx();
    if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignore */ } }
    SFX[id].forEach(function (n) {
      var t0 = c.currentTime + (n[5] || 0);
      var o = c.createOscillator(), g = c.createGain();
      o.type = n[0];
      o.frequency.setValueAtTime(n[1], t0);
      o.frequency.exponentialRampToValueAtTime(n[2], t0 + n[3]);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(n[4], t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[3]);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + n[3] + 0.02);
    });
  };

  /* ------------------------------------------------------------ shared builders */
  KC.kudi = function (pose, opts) {
    opts = opts || {};
    pose = KC.poses[pose] ? pose : 'wave';
    var img = h('img', { src: BRAND + KC.poses[pose] + '.webp', alt: opts.alt === undefined ? KC.t('a11y.kudi') : opts.alt,
                         'data-kudi-pose': pose, class: 'kc-kudi-img', draggable: 'false' });
    if (opts.hear) KC.childAction(img, 'hear', function () { KC.voice.play(opts.hear); }, { say: opts.hear });
    if (!opts.say) {
      return h('div', { class: 'kc-illustration kc-kudi kc-kudi--' + (opts.size || 'md'), 'data-component': 'illustration' }, img);
    }
    return h('div', { class: 'kc-kudi-bubble kc-kudi--' + (opts.size || 'md'), 'data-component': 'kudi-bubble' },
      img,
      h('div', { class: 'kc-bubble' }, h('p', { class: 'kc-child-text' }, KC.lineText(opts.say)), KC.speakerCue(opts.say)));
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

  /* A child action (interaction-moments §1): never navigates, never data-primary, always enabled at render. */
  KC.childAction = function (el, kind, onAct, opts) {
    opts = opts || {};
    el.setAttribute('data-child-action', kind);
    if (opts.say) el.setAttribute('data-say', opts.say);
    /* opts.textOnly: words keep their heading/paragraph role; the speaker cue beside them is the keyboard path. */
    if (!opts.textOnly && !/^(BUTTON|A|INPUT)$/.test(el.tagName)) { el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); }
    var nativeButton = /^(BUTTON|A|INPUT)$/.test(el.tagName);
    var fire = function (e) {
      if (e && e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e) { e.stopPropagation(); if (e.type === 'keydown') e.preventDefault(); }
      KC.resetIdle();
      if (opts.sfx !== false) KC.sfx(opts.sfx || 'tap');
      onAct(e);
    };
    el.addEventListener('click', fire);
    /* Native buttons already turn Enter/Space into a click; only add keys for role="button" elements,
       so other click listeners (selection, drag-tap fallback) still run from the keyboard. */
    if (!nativeButton && !opts.textOnly) el.addEventListener('keydown', fire);
    return el;
  };
  /* Tap-to-hear shortcut (003 FR-026). */
  KC.hear = function (el, lineId, reaction) {
    return KC.childAction(el, 'hear', function () { if (reaction) KC.kudiReact(reaction); KC.voice.play(lineId, { reaction: !!reaction }); }, { say: lineId });
  };
  /* One single-select behaviour for card groups (003 FR-040): call from the card's child action. */
  KC.markSelected = function (cards, card) {
    cards.forEach(function (x) { x.classList.toggle('is-selected', x === card); x.setAttribute('aria-checked', String(x === card)); });
  };
  /* One number keypad for the parent gate and PIN (003 FR-039). */
  KC.keypad = function (component, onKey) {
    var pad = h('div', { 'data-component': component });
    var SPECIAL = { del: { label: '⌫', aria: 'a11y.delete' }, clear: { label: 'C', aria: 'a11y.clear' } };
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'clear'].forEach(function (k) {
      var sp = SPECIAL[k];
      pad.appendChild(h('button', { 'aria-label': sp ? KC.t(sp.aria) : k, 'data-key': k, onclick: function () { onKey(k); } }, sp ? sp.label : k));
    });
    return pad;
  };

  /* Replace a primary group with a single primary button (002 FR-013: one main action at a time). */
  KC.promote = function (group, button, host) {
    if (group) group.removeAttribute('data-primary-group');
    (host || document.querySelector('#kc-screen .kc-actions') || document.getElementById('kc-screen')).appendChild(button);
    KC.resetIdle();
  };
  /* Promote a main action the first time a group is answered; later answers keep the same button. */
  KC.promoteOnce = function (group, label, onGo, host) {
    if (group.kcPromoted) return;
    group.kcPromoted = true;
    KC.promote(group, KC.primary(label, onGo), host);
  };

  /* ------------------------------------------------------------ router */
  var screenEl, backBtn, backSpacer, nav, phone;
  KC.current = null;

  var skipHash = null;
  /* opts.say: a line spoken in place of the screen's own prompt (bottom-nav tab labels, 003 FR-036). */
  KC.go = function (id, opts) {
    if (location.hash !== '#/' + id) { skipHash = id; location.hash = '#/' + id; }
    KC.render(id, opts);
  };
  KC.render = function (id, opts) {
    opts = opts || {};
    var def = KC.screens[id];
    if (!def) { id = 'welcome'; def = KC.screens.welcome; }
    KC.voice.stop();
    KC.voice.last = null;
    clearIdle();
    if (KC.current && KC.current.id !== 'parent-gate') { var ov = document.getElementById('kc-overlay'); if (ov) ov.innerHTML = ''; }
    KC.current = def;
    def._narr = typeof def.narration === 'function' ? def.narration() : (def.narration || []);
    screenEl.innerHTML = '';
    screenEl.setAttribute('data-screen', def.id);
    screenEl.setAttribute('data-audience', def.audience);
    if (def.audience === 'child') screenEl.setAttribute('data-band', def.band || 'b4_6'); else screenEl.removeAttribute('data-band');
    screenEl.removeAttribute('data-hint-active');
    phone.setAttribute('data-audience', def.audience);
    var logoImg = document.querySelector('#kc-logo img');            // logo version matches its background (brand-assets)
    if (logoImg) logoImg.src = BRAND + (def.audience === 'parent' ? 'logo-on-brown.svg' : 'logo-on-white.svg');
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
    if (def.audience === 'child') wireWords(def);
    if (def.audience === 'child') {
      startIdle();
      if (opts.say) KC.voice.play(opts.say);                        // the tab label plays to the end; no prompt over it
      else if (def._narr.length) {
        setTimeout(function () { if (KC.current === def && !KC.voice.playing) KC.voice.play(def._narr[0]); }, 350);
      }
    } else if (opts.say) KC.voice.play(opts.say);
    if (KC.state.notes) showNotes(def);
  };

  /* ------------------------------------------------------------ idle hints (002 FR-013; 003 FR-035: spoken from the first hint) */
  var idleTimers = [];
  var HINTS = [6000, 12000, 20000];                               // the 20 s hint is the long-idle state (FR-038)
  function clearIdle() {
    idleTimers.forEach(clearTimeout); idleTimers = [];
    if (screenEl) {
      screenEl.removeAttribute('data-hint-active');
      screenEl.querySelectorAll('.kc-hint, .kc-hint--strong').forEach(function (n) { n.classList.remove('kc-hint', 'kc-hint--strong'); });
    }
  }
  function target() {
    return screenEl.querySelector('[data-primary]:not([hidden])') || screenEl.querySelector('[data-primary-group]');
  }
  function hintLine() {
    var n = KC.current && KC.current._narr;
    return n && n.length ? n[n.length > 1 ? 1 : 0] : null;
  }
  function startIdle() {
    HINTS.forEach(function (ms, level) {
      idleTimers.push(setTimeout(function () {
        var t = target();
        var longIdle = level === HINTS.length - 1;
        screenEl.setAttribute('data-hint-active', String(level + 1));
        if (t) { t.classList.add('kc-hint'); if (longIdle) t.classList.add('kc-hint--strong'); }
        if (longIdle) {                                           // long idle → wave, welcome the child back (FR-038)
          KC.kudiReact('greet', { hold: true });
          KC.voice.play('hint.welcome_back');
          return;
        }
        KC.kudiReact('encourage', { hold: true });                // fist: encourage (research R2)
        var line = level === 0 && KC.current._narr.length ? KC.current._narr[0] : hintLine();
        if (line) KC.voice.play(line);                             // first hint is spoken too (FR-035)
      }, ms));
    });
  }
  KC.resetIdle = function () {
    if (!KC.current || KC.current.audience !== 'child') return;
    if (screenEl.getAttribute('data-hint-active') && !KC.voice.playing) setPose(KC.basePose());
    clearIdle(); startIdle();
  };
  ['pointerdown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () { KC.resetIdle(); }, true);
  });

  /* ------------------------------------------------------------ reviewer menu (002 FR-021, research D10) */
  var reviewer;
  function seg(label, items, current, onPick, attr) {
    var row = h('div', { class: 'kc-seg', role: 'radiogroup', 'aria-label': label });
    items.forEach(function (it) {
      var b = h('button', { class: 'kc-seg-btn', role: 'radio', 'aria-checked': String(current === it.value), onclick: function () { onPick(it.value); } }, it.label);
      b.setAttribute(attr, it.value);
      row.appendChild(b);
    });
    return row;
  }
  KC.openReviewer = function () {
    reviewer.innerHTML = '';
    var m = KC.audioManifest;
    var regionRow = seg(KC.t('review.region'), Object.keys(KC.regions).map(function (c) { return { value: c, label: KC.regions[c].name }; }),
      KC.state.region, function (c) { KC.setRegion(c); KC.openReviewer(); }, 'data-region-choice');
    var langRow = seg(KC.t('review.voice'), [{ value: '', label: KC.t('review.voice_auto') }].concat(m.languages.map(function (l) { return { value: l, label: l }; })),
      KC.state.voiceLang || '', function (l) { KC.state.voiceLang = l || null; KC.savePrefs(); KC.openReviewer(); }, 'data-voice-choice');
    var recorded = m.languages.map(function (l) {
      var all = Object.keys(m.lines[l]); var done = all.filter(function (k) { return m.lines[l][k].status === 'recorded'; }).length;
      return l + ' ' + done + '/' + all.length;
    }).join(' · ');
    var jump = h('select', { class: 'kc-select', 'aria-label': KC.t('review.jump'), onchange: function (e) { KC.closeReviewer(); KC.go(e.target.value); } },
      h('option', { value: '' }, '— ' + KC.t('review.jump') + ' —'),
      KC.order.map(function (id) { return h('option', { value: id }, KC.screens[id].title + ' (' + id + ')'); }));
    reviewer.appendChild(h('div', { class: 'kc-reviewer-sheet' },
      h('div', { class: 'kc-row' },
        h('img', { class: 'kc-reviewer-logo', src: BRAND + 'logo-on-brown.svg', alt: KC.t('app.name') }),
        h('h2', { class: 'kc-title kc-grow' }, KC.t('review.title')),
        h('button', { class: 'kc-icon-btn kc-icon-btn--light', 'data-component': 'icon-button', 'aria-label': KC.t('review.close'), onclick: KC.closeReviewer }, KC.img('icons/close.svg'))),
      h('p', { class: 'kc-caption kc-muted' }, KC.t('review.intro')),
      h('h3', { class: 'kc-label' }, KC.t('review.region')), regionRow,
      h('p', { class: 'kc-caption', 'data-currency-label': true }, KC.currencyLabel()),
      KC.regionCoinSet(),
      h('h3', { class: 'kc-label' }, KC.t('review.voice')), langRow,
      h('p', { class: 'kc-caption kc-muted', 'data-recorded-count': true }, KC.t('review.recorded') + ': ' + recorded),
      h('h3', { class: 'kc-label' }, KC.t('review.jump')), jump,
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.sound, onchange: function (e) { KC.state.sound = e.target.checked; KC.savePrefs(); if (!e.target.checked) KC.voice.stop(); } }), KC.t('review.sound')),
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.notes, onchange: function (e) { KC.state.notes = e.target.checked; KC.savePrefs(); KC.render(KC.current.id); } }), KC.t('review.notes')),
      h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', onclick: function () { KC.resetState(); KC.closeReviewer(); KC.go('welcome'); } }, KC.t('review.restart')),
      h('p', { class: 'kc-caption kc-muted' }, KC.t('review.version', { p: KC.version.prototype, t: KC.version.tokens }))));
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
    return h('div', { class: 'kc-coin-set', 'data-component': 'region-coin-set', 'aria-label': KC.t('a11y.coins_of', { region: r.name }) },
      r.denominations.map(function (d) {
        return h('figure', { class: 'kc-coin-set-item' }, KC.coinImg(d.id, { alt: d.label }), h('figcaption', { class: 'kc-caption' }, d.label));
      }));
  };

  function showNotes(def) {
    if (!def.notes) return;
    screenEl.appendChild(h('aside', { class: 'kc-note', 'data-component': 'reviewer-menu', 'data-reviewer': true }, h('strong', null, KC.t('review.notes_label') + ' '), def.notes));
  }
  /* Tap any word on a child screen to hear it (003 FR-026): titles and Kudi's words play the line beside them
     (their speaker cue), or the screen's prompt when there is no cue. */
  function wireWords(def) {
    screenEl.querySelectorAll('.kc-title, .kc-child-text').forEach(function (el) {
      if (el.closest('[data-child-action], button, [data-primary-group] button')) return;
      var cue = el.parentElement && el.parentElement.querySelector('[data-narration]');
      var line = el.getAttribute('data-say') || (cue && cue.getAttribute('data-narration')) || def._narr[0];
      if (!line) return;
      KC.childAction(el, 'hear', function () { KC.voice.play(line, { highlight: true }); }, { say: line, textOnly: true });
    });
  }
  function markNotWired() {
    screenEl.querySelectorAll('[data-not-wired]').forEach(function (n) {
      n.addEventListener('click', function (e) {
        if (!KC.state.notes) return;
        e.preventDefault();
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
    captionEl = document.getElementById('kc-caption');
    replayBtn = document.getElementById('kc-replay');
    KC.resetState();
    backBtn.setAttribute('aria-label', KC.t('a11y.back'));
    nav.setAttribute('aria-label', KC.t('a11y.main_nav'));          // screen-reader text from the strings file (FR-046)
    reviewer.setAttribute('aria-label', KC.t('review.title'));
    backBtn.addEventListener('click', function () { history.back(); });
    replayBtn.setAttribute('aria-label', KC.t('a11y.replay'));
    replayBtn.addEventListener('click', function () { KC.sfx('tap'); KC.voice.replay(); });
    document.getElementById('kc-logo').setAttribute('aria-label', KC.t('app.name'));
    nav.querySelectorAll('button').forEach(function (b) {
      var route = b.getAttribute('data-route');
      b.querySelector('.kc-label').textContent = KC.t('nav.' + route + '_label');
      b.setAttribute('aria-label', KC.t('nav.' + route + '_label'));
      b.addEventListener('click', function () { KC.go(route, { say: 'nav.' + route }); });
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
