/* KudiCubs prototype — core: router, state, money, human-voice playback, sound effects, Kudi reactions,
   idle hints, reviewer menu. Classic script (no modules) so the prototype runs from file:// (002 research D1).
   No synthetic speech anywhere (003 FR-014): narration is pre-recorded human audio, played by line ID.
   No network requests. Preferences in sessionStorage; progress (preset profile + event log) in localStorage
   (004 FR-027). Never any parent-gate input (FR-028). */
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

  /* ------------------------------------------------------------ preferences + state
     Preferences (region, sound, notes, voiceLang) stay in sessionStorage (003). Progress is saved on the device
     (004 FR-027, amends 002 D11): a fixed profile from preset choices + an append-only event log. Every number on
     every screen is derived from the log (KC.derive). The parent gate's input is never part of either (FR-028). */
  var PREF_KEY = 'kc-proto-prefs';
  function loadPrefs() {
    try { return JSON.parse(sessionStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; }
  }
  KC.savePrefs = function () {
    try {
      sessionStorage.setItem(PREF_KEY, JSON.stringify({ region: KC.state.region, sound: KC.state.sound, notes: KC.state.notes, voiceLang: KC.state.voiceLang }));
    } catch (e) { /* private mode */ }
    if (KC.state.onboarded) KC.store.save();                       // the region is part of the saved profile
  };

  /* ---- device store (004 T006, contracts/saved-progress.schema.json) */
  var STORE_KEY = 'kudicubs.proto.progress';
  var MAX_EVENTS = 500;
  /* Every event kind in one table (data-model §2): its effect on the coins, where it goes in the wallet chart and
     history (money kinds only), and its history icon. KC.derive and the store's validation both read it. */
  var KINDS = {
    earn:   { coins: +1, chart: 'missions', icon: 'goal-coins' },
    bonus:  { coins: +1, chart: 'bonus', icon: 'badge-smart-sorter' },
    daily:  { coins: +1, chart: 'daily', icon: 'sun-daily' },
    save:   { coins: -1, chart: 'savings', icon: 'save', out: true },
    spend:  { coins: -1, chart: 'treats', icon: 'treat-sticker', out: true },
    xp: {}, badge: {}, pillar: {}, mission_done: {}, mission_replay: {}
  };
  /* One event builder for play, sample data and compaction (optional badge / pillar fields only when set). */
  function makeEvent(e, date, run, mission) {
    var ev = { t: e.t, n: e.n || 0, date: date, run: run, mission: mission, label: e.label || e.t };
    if (e.badge) ev.badge = e.badge;
    if (e.pillar) ev.pillar = e.pillar;
    return ev;
  }
  var PILLARS = ['know', 'understand', 'decide', 'invest', 'share'];
  function validEvent(e) {
    return e && typeof e === 'object' && KINDS.hasOwnProperty(e.t) && typeof e.n === 'number' && e.n >= 0 && e.n === Math.floor(e.n) &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date) && typeof e.run === 'number' && (e.mission === 'lost-coins' || e.mission === 'sample') &&
      /^[a-z_]+(\.[a-z0-9_]+)*$/.test(e.label) && (e.badge === undefined || /^badge\.[a-z_]+$/.test(e.badge)) &&
      (e.pillar === undefined || PILLARS.indexOf(e.pillar) !== -1);
  }
  function validProgress(d) {
    if (!d || d.schema !== 1 || !d.profile || !Array.isArray(d.events) || typeof d.sample !== 'boolean') return false;
    var p = d.profile;
    if ((p.nickname !== null && KC.data.nicknames.indexOf(p.nickname) === -1) || KC.data.avatars.indexOf(p.avatarId) === -1) return false;
    if (p.band !== 'b4_6' || !KC.regions[p.region] || typeof p.onboarded !== 'boolean') return false;
    return d.events.length <= MAX_EVENTS && d.events.every(validEvent);
  }
  /* Over the cap, the oldest events are folded into a few summary events with the same totals, so coins, savings,
     XP, badges, pillars and "played before" never change (data-model §1). Their history shows as one "Earlier" row. */
  function compact(events) {
    var keep = events.slice(events.length - (MAX_EVENTS - 40)), old = events.slice(0, events.length - keep.length);
    var last = old[old.length - 1], v = KC.derive(old, last.date), out = [], put = function (e) { out.push(makeEvent(e, last.date, 0, 'lost-coins')); };
    var earned = v.chart.missions + v.chart.bonus + v.chart.daily;
    if (earned) put({ t: 'earn', n: earned, label: 'history.earlier' });
    if (v.chart.savings) put({ t: 'save', n: v.chart.savings, label: 'history.earlier' });
    if (v.chart.treats) put({ t: 'spend', n: v.chart.treats, label: 'history.earlier' });
    if (v.xp) put({ t: 'xp', n: v.xp, label: 'xp' });
    v.badges.forEach(function (b) { put({ t: 'badge', label: 'badge', badge: b }); });
    PILLARS.forEach(function (p) { if (v.pillars[p]) put({ t: 'pillar', n: Math.round(100 * v.pillars[p]), label: 'pillar', pillar: p }); });
    if (old.some(function (e) { return e.t === 'mission_done' && e.mission === 'lost-coins'; })) put({ t: 'mission_done', label: 'mission' });
    return out.concat(keep);
  }
  KC.compactEvents = compact;
  KC.storeMemoryOnly = false;
  KC.store = {
    /* Never throws. Damaged, foreign or older data is discarded and the player starts fresh (FR-031). */
    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(STORE_KEY); } catch (e) { KC.storeMemoryOnly = true; return null; }
      if (!raw) return null;
      try { var d = JSON.parse(raw); if (validProgress(d)) return d; } catch (e) { /* damaged */ }
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      return null;
    },
    /* Only these fields are ever written: no email, PIN, answers or typed text exist in KC.state (FR-028). */
    save: function () {
      var s = KC.state;
      if (s.events.length > MAX_EVENTS) s.events = compact(s.events);
      var d = { schema: 1, profile: { nickname: s.nickname, avatarId: s.avatarId, band: 'b4_6', region: s.region, onboarded: !!s.onboarded },
                events: s.events, sample: !!s.sample };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); KC.storeMemoryOnly = false; } catch (e) { KC.storeMemoryOnly = true; }
    },
    clear: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
      try { sessionStorage.removeItem(PREF_KEY); } catch (e) { /* ignore */ }
    }
  };

  KC.resetState = function () {
    var p = loadPrefs();
    var saved = KC.store.load();
    var prof = saved ? saved.profile : null;
    KC.state = {
      region: p.region || (prof && prof.region) || KC.defaultRegion,
      sound: p.sound !== undefined ? p.sound : true,
      notes: !!p.notes,
      voiceLang: p.voiceLang || null,
      nickname: prof ? prof.nickname : null,                       // only ever a name the child picked (FR-024)
      avatarId: prof ? prof.avatarId : KC.data.avatars[0],
      band: prof ? prof.band : null,
      onboarded: prof ? prof.onboarded : false,
      events: saved ? saved.events : [],
      sample: saved ? saved.sample : false,
      runId: 0,
      lostCoins: { found: 0, sortedCorrectFirstTry: true, choice: null },
      lastReward: null
    };
    KC.run = { active: false, reached: -1, pendingReward: false, atReward: false };
  };
  /* A new mission run (visit state only; never saved, so a refresh never resumes an unfinished run). */
  KC.resetRun = function () {
    KC.state.runId = KC.state.events.reduce(function (m, e) { return Math.max(m, e.run); }, KC.state.runId) + 1;
    KC.state.lostCoins = { found: 0, sortedCorrectFirstTry: true, choice: null };
    KC.run = { active: true, reached: KC.MISSION.indexOf('mission-intro'), pendingReward: false, atReward: false };
  };
  KC.hidden = function () { return KC.data.lostCoins.hidden; };
  KC.completedOnce = function (mission) {
    return KC.state.events.some(function (e) { return e.t === 'mission_done' && e.mission === (mission || 'lost-coins'); });
  };

  /* ---- dates (the device's local day, for the daily challenge and history labels) */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  KC.dateOf = function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  KC.today = function () { return KC.dateOf(new Date()); };
  KC.daysAgo = function (date, today) {
    var a = date.split('-').map(Number), b = (today || KC.today()).split('-').map(Number);
    return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
  };

  /* ---- derived state (004 T007, data-model §3). Pure: the same log always gives the same numbers. */
  KC.derive = function (events, today) {
    today = today || KC.today();
    var v = { coins: 0, savings: 0, xp: 0, badges: [], pillars: {}, history: [], chart: { missions: 0, bonus: 0, daily: 0, savings: 0, treats: 0 },
              daily: { progress: 0, goal: KC.data.daily.goal, rewardCoins: KC.data.daily.rewardCoins }, items: 0 };
    PILLARS.forEach(function (p) { v.pillars[p] = 0; });
    events.forEach(function (e) {
      var k = KINDS[e.t];
      if (k.chart) {                                                  // money: coins, chart and a history row
        v.coins += k.coins * e.n;
        v.chart[k.chart] += e.n;
        v.history.unshift({ kind: e.t, amount: e.n, labelKey: e.label, icon: k.icon, daysAgo: KC.daysAgo(e.date, today), out: !!k.out });
      }
      if (e.t === 'save') v.savings += e.n;
      if (e.t === 'spend') v.items += 1;
      if (e.t === 'xp') v.xp += e.n;
      if (e.t === 'badge' && v.badges.indexOf(e.badge) === -1) v.badges.push(e.badge);
      if (e.t === 'pillar') v.pillars[e.pillar] = Math.min(1, v.pillars[e.pillar] + e.n / 100);
      if ((e.t === 'mission_done' || e.t === 'mission_replay') && e.date === today) v.daily.progress += 1;
    });
    v.daily.progress = Math.min(v.daily.progress, v.daily.goal);
    v.level = KC.levelFor(v.xp);
    v.empty = !events.length;
    return v;
  };
  KC.view = function () { return KC.derive(KC.state.events); };

  /* Append events the child just caused (dated today), add the daily reward once per day, then save. */
  KC.addEvents = function (list) {
    var today = KC.today(), s = KC.state;
    list.forEach(function (e) { s.events.push(makeEvent(e, today, s.runId, e.mission || 'lost-coins')); });
    var v = KC.view();
    var paidToday = s.events.some(function (e) { return e.t === 'daily' && e.date === today; });
    if (v.daily.progress >= v.daily.goal && !paidToday) {
      s.events.push({ t: 'daily', n: KC.data.daily.rewardCoins, date: today, run: s.runId, mission: 'lost-coins', label: 'history.daily' });
    }
    KC.store.save();
  };
  /* Replace this run's save/spend event (a change of mind before Summary never duplicates it, 003 rule). */
  KC.replaceRunEvent = function (kinds, ev) {
    var s = KC.state;
    s.events = s.events.filter(function (e) { return !(e.run === s.runId && kinds.indexOf(e.t) !== -1); });
    KC.addEvents([ev]);
  };
  KC.hasBadge = function (id) { return KC.view().badges.indexOf(id) !== -1; };

  /* ---- reviewer sample data (FR-029, data-model §5): a fixed fictional log, dated relative to today */
  KC.loadSample = function () {
    var today = new Date();
    KC.state.events = KC.sample.events.map(function (e) {
      return makeEvent(e, KC.dateOf(new Date(today.getFullYear(), today.getMonth(), today.getDate() - e.ago)), 0, 'sample');
    });
    KC.state.sample = true;
    if (!KC.state.onboarded) { KC.state.onboarded = true; KC.state.band = 'b4_6'; KC.state.avatarId = KC.sample.profile.avatarId; }
    if (!KC.state.nickname) KC.state.nickname = KC.sample.profile.nickname;
    KC.store.save();
  };

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
  /* The caption bar shows a line only when it isn't already on screen in Kudi's words (004 FR-008). */
  function norm(t) { return String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function onScreen(id) {
    if (!screenEl) return false;
    var want = norm(KC.lineText(id));
    if (!want) return false;
    var els = screenEl.querySelectorAll('.kc-bubble p, .kc-ask p, .kc-title, .kc-child-text');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('[hidden]') || !el.getClientRects().length) continue;
      if (norm(el.textContent) === want) return true;
    }
    return false;
  }
  /* status: 'recorded' | 'scratch' | 'pending'. The voice badge is a production note: reviewer notes only (FR-019). */
  function caption(state, id, status) {
    if (!captionEl) return;
    if (state !== 'hidden' && onScreen(id)) state = 'hidden';
    captionEl.setAttribute('data-caption-state', state);
    captionEl.setAttribute('data-voice-status', status || '');
    captionEl.classList.remove('is-highlight');
    captionEl.innerHTML = '';
    if (state === 'hidden') return;
    captionEl.appendChild(h('span', { class: 'kc-caption-text' }, KC.lineText(id)));
    if (state === 'ready') captionEl.appendChild(h('span', { class: 'kc-caption-badge' }, KC.t('voice.tap_replay')));
    else if (KC.state.notes && (status === 'pending' || status === 'scratch')) {
      captionEl.appendChild(h('span', { class: 'kc-caption-badge', 'data-voice-badge': status }, KC.t('voice.' + status)));
    }
  }
  /* Recorded (human) in voiceLang → region language → default; then scratch in the same order; else nothing. */
  function pickFile(id) {
    var m = KC.audioManifest;
    if (!m) return null;
    var langs = [KC.state.voiceLang, m.regionLanguage[KC.state.region], m.defaultLanguage];
    var kinds = ['recorded', 'scratch'];
    for (var k = 0; k < kinds.length; k++) {
      for (var i = 0; i < langs.length; i++) {
        var e = langs[i] && m.lines[langs[i]] && m.lines[langs[i]][id];
        if (!e) continue;
        if (kinds[k] === 'recorded' && e.status === 'recorded') return { file: e.file, status: 'recorded' };
        if (kinds[k] === 'scratch' && e.scratchFile) return { file: e.scratchFile, status: 'scratch' };
      }
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
      var pick = pickFile(id);
      KC.voice.status = pick ? pick.status : 'pending';
      document.body.setAttribute('data-last-line', id);
      document.body.setAttribute('data-last-voice', KC.voice.status);
      if (!pick || !KC.state.sound) {
        caption(pick ? 'muted' : 'pending', id, KC.voice.status);   // sound off or no audio: caption only; never synthesised
        if (!pick && opts.highlight && captionEl) {   // a tapped word with no audio: highlight its caption, say nothing
          captionEl.classList.remove('is-highlight'); void captionEl.offsetWidth; captionEl.classList.add('is-highlight');
        }
        return;
      }
      audio.src = pick.file;
      caption('playing', id, pick.status);
      var token = KC.voice.token = (KC.voice.token || 0) + 1;     // a newer line makes this one's late results irrelevant
      var start = function () {
        if (token !== KC.voice.token) return;
        KC.voice.playing = true;
        setTimeout(function () { if (KC.voice.playing) setPose('headphones'); }, opts.reaction ? 600 : 0);
      };
      var p = audio.play();
      if (p && p.then) p.then(start, function (err) {
        if (token !== KC.voice.token) return;                       // superseded (AbortError when the next line starts)
        KC.voice.playing = false;
        caption(err && err.name === 'NotAllowedError' ? 'ready' : 'pending', id, KC.voice.status);
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
  audio.addEventListener('ended', function () {
    KC.voice.playing = false; setPose(KC.basePose());
    if (captionEl && captionEl.getAttribute('data-caption-state') !== 'hidden') captionEl.setAttribute('data-caption-state', 'done');
  });
  audio.addEventListener('error', function () {                       // an unplayable file falls back to its caption
    if (!KC.voice.last || !audio.getAttribute('src')) return;
    KC.voice.playing = false; caption('pending', KC.voice.last, 'pending'); setPose(KC.basePose());
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
  /* The Lost Coins screens in order (the guard and the run's "reached" mark use it). */
  KC.MISSION = ['mission-intro', 'activity-find', 'activity-sort', 'activity-count', 'decision', 'result-save', 'result-spend', 'summary', 'reward'];
  var ONBOARDING = ['age-select', 'avatar', 'parent-gate'];
  var HUBS = ['home', 'wallet', 'progress'];                       // bottom-nav screens: no Back button (FR-003)
  /* Route guard (004 T008, contracts/navigation.md §2): runs on every navigation, including Back, refresh and
     deep links. Returns the screen to show instead, or null. Nothing is granted by a redirect. */
  KC.guard = function (id, opts) {
    opts = opts || {};
    var r = KC.run || {}, onboarded = KC.state.onboarded;
    if (!KC.screens[id]) return onboarded ? 'home' : 'welcome';                                   // G6
    if (id === 'reward' && !r.pendingReward && !(r.atReward && KC.current && KC.current.id === 'reward')) return 'home';   // G1
    if (/^result-/.test(id) && !(r.active && r.reached >= KC.MISSION.indexOf('decision'))) return 'home';          // G2
    var m = KC.MISSION.indexOf(id);
    if (m > 0 && id !== 'reward' && !/^result-/.test(id) && !r.active) return 'mission-intro';                    // G3
    if (!opts.force && onboarded && ONBOARDING.indexOf(id) !== -1) return 'home';                                 // G4 (G5 follows from it)
    return null;
  };
  /* opts.say: a line spoken in place of the screen's own prompt (bottom-nav tab labels, 003 FR-036).
     opts.replace: leave no history entry for the screen we are leaving (Reward, Result, the gate: FR-004). */
  KC.go = function (id, opts) {
    opts = opts || {};
    if (location.hash !== '#/' + id) {
      skipHash = id;
      if (opts.replace) location.replace('#/' + id); else location.hash = '#/' + id;
    }
    KC.render(id, opts);
  };
  KC.render = function (id, opts) {
    opts = opts || {};
    var to = KC.guard(id, opts);
    if (to) { id = to; try { history.replaceState(null, '', '#/' + id); } catch (e) { /* file:// in some browsers */ } }
    var def = KC.screens[id];
    if (!def) { id = 'welcome'; def = KC.screens.welcome; }
    var m = KC.MISSION.indexOf(id);
    if (KC.run.active && m > KC.run.reached) KC.run.reached = m;
    if (id !== 'reward') KC.run.atReward = false;
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
    var showBack = def.id !== 'welcome' && HUBS.indexOf(def.id) === -1;
    backBtn.hidden = !showBack; backSpacer.hidden = showBack;
    var showNav = HUBS.indexOf(def.id) !== -1;
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
        setTimeout(function () {                                    // the screen's prompt, unless the child already made Kudi speak
          if (KC.current === def && !KC.voice.playing && !KC.voice.last) KC.voice.play(def._narr[0]);
        }, 350);
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
    var counts = m.languages.map(function (l) {                      // recorded / scratch / pending per language (FR-020)
      var c = m.counts[l];
      return h('li', { 'data-voice-count': l }, KC.t('review.voice_counts', { lang: l, r: c.recorded, s: c.scratch, p: c.pending }));
    });
    var b = KC.build || { version: KC.version.prototype, builtAt: 'local', commit: null };
    var jump = h('select', { class: 'kc-select', 'aria-label': KC.t('review.jump'), onchange: function (e) {
        var id = e.target.value, m = KC.MISSION.indexOf(id);
        if (m > 0 && id !== 'reward') {                               // jumping into the mission starts a demo run there
          if (!KC.run.active) KC.resetRun();
          KC.run.reached = Math.max(KC.run.reached, m);
          if (/^result-/.test(id)) KC.state.lostCoins.choice = id.slice(7);
        }
        KC.closeReviewer(); KC.go(id, { force: true });
      } },
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
      h('p', { class: 'kc-caption kc-muted' }, KC.t('review.recorded')),
      h('ul', { class: 'kc-caption kc-muted kc-voice-counts', 'data-recorded-count': true }, counts),
      h('h3', { class: 'kc-label' }, KC.t('review.jump')), jump,
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.sound, onchange: function (e) { KC.state.sound = e.target.checked; KC.savePrefs(); if (!e.target.checked) KC.voice.stop(); } }), KC.t('review.sound')),
      h('label', { class: 'kc-toggle' }, h('input', { type: 'checkbox', checked: KC.state.notes, onchange: function (e) { KC.state.notes = e.target.checked; KC.savePrefs(); KC.render(KC.current.id); } }), KC.t('review.notes')),
      KC.storeMemoryOnly ? h('p', { class: 'kc-note', 'data-memory-only': true }, KC.t('review.memory_only')) : null,
      h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-reviewer-action': 'sample',
                    onclick: function () { KC.loadSample(); KC.closeReviewer(); KC.go('home'); } }, KC.t('review.sample')),
      h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-reviewer-action': 'restart',
                    onclick: function () { KC.store.clear(); KC.resetState(); KC.closeReviewer(); KC.go('welcome'); } }, KC.t('review.restart')),
      h('p', { class: 'kc-caption kc-muted', 'data-build': true },
        KC.t('review.build', { v: b.version, d: b.builtAt, c: b.commit ? ' · ' + b.commit : '', t: KC.version.tokens }))));
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
  /* Tap any word on a child screen to hear it (003 FR-026). The tappable unit is the row that holds the words and
     their speaker cue (≥ 48 px tall, 004 FR-009, research R12); a word on its own gets a 48 px tap box itself.
     Words keep their heading/paragraph role: the speaker cue beside them is the keyboard path. */
  function wireWords(def) {
    screenEl.querySelectorAll('.kc-title, .kc-child-text').forEach(function (el) {
      if (el.closest('[data-child-action], button, [data-primary-group]')) return;
      var row = el.closest('.kc-row, .kc-bubble, .kc-ask');
      if (row && (!screenEl.contains(row) || row.closest('[data-child-action]') ||
          row.querySelector('[data-child-action], button:not([data-component="speaker-cue"])'))) row = null;
      var unit = row || el;
      if (unit.hasAttribute('data-child-action')) return;
      var cue = unit.querySelector('[data-narration]') || (el.parentElement && el.parentElement.querySelector('[data-narration]'));
      var line = el.getAttribute('data-say') || (cue && cue.getAttribute('data-narration')) || def._narr[0];
      if (!line) return;
      unit.classList.add(row ? 'kc-tap-row' : 'kc-tap-word');
      KC.childAction(unit, 'hear', function () { KC.voice.play(line, { highlight: true }); }, { say: line, textOnly: true });
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
      var pending = skipHash; skipHash = null;
      if (pending && (id === pending || (KC.current && id === KC.current.id))) return;   // our own navigation (or its redirect)
      KC.render(id);
    });
    if (/[?&]review=1/.test(location.search)) setTimeout(KC.openReviewer, 50);
    KC.render(location.hash.replace('#/', '') || 'welcome');
    if (/^http/.test(location.protocol) && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
    }
  };
})();
