/* KudiCubs prototype — screen registry + renderers (002 contracts/screen-flow.md; 003 contracts/interaction-moments.md).
   One main action at a time: one [data-primary] button, or one [data-primary-group] of equal choices/targets.
   Child actions ([data-child-action]) never navigate, are never data-primary and are enabled at render (003 FR-022/023). */
(function () {
  'use strict';
  var KC = window.KC;
  if (!KC || !KC.h) return;                 // a file before this one failed to load: the boot guard shows the panel (004 FR-051)
  var h = KC.h, t = KC.t;

  function actions() { return h('div', { class: 'kc-actions' }); }
  function titleRow(key, line) {
    return h('div', { class: 'kc-row' }, h('h1', { class: 'kc-title kc-grow' }, t(key)), KC.speakerCue(line));
  }
  function badgeById(id) { return KC.data.badges.filter(function (b) { return b.id === id; })[0]; }
  function badgeTile(b, opts) {
    opts = opts || {};
    var earned = (opts.owned || KC.view().badges).indexOf(b.id) !== -1;
    var el = h('div', { class: 'kc-badge' + (earned ? '' : ' is-locked') + (opts.isNew ? ' is-new' : ''), 'data-component': 'badge-tile',
                        'aria-label': t(b.nameKey) + (earned ? '' : ' ' + t('a11y.not_earned')) },
      KC.img('icons/' + b.icon + '.svg'), h('span', { class: 'kc-caption' }, t(b.nameKey)));
    el.addEventListener('click', function () { KC.state.viewBadge = b.id; });
    return KC.hear(el, b.id, 'correct');
  }

  var NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  /* One choice table for save/spend (003 FR-042): every screen reads it instead of branching. */
  KC.choices = {
    save: {
      id: 'save', icon: 'save', labelKey: 'decide.save_label', subKey: 'decide.save_sub', line: function () { return 'decide.save'; },
      resultArt: 'icons/save.svg', resultTitleKey: 'result.save.title', resultLine: function () { return 'result.save.say'; },
      tapLine: 'result.tap_jar', summaryKey: 'summary.saved_label', summaryLine: 'summary.saved',
      event: { t: 'save', label: 'history.saved' }
    },
    spend: {
      id: 'spend', icon: 'treat-sticker', labelKey: 'decide.spend_label', subKey: 'decide.spend_sub', line: function () { return KC.rline('decide.spend'); },
      resultArt: 'icons/treat-sticker.svg', resultTitleKey: 'result.spend.title', resultLine: function () { return KC.rline('result.spend.say'); },
      tapLine: 'result.tap_sticker', summaryKey: 'summary.spent_label', summaryLine: 'summary.spent',
      event: { t: 'spend', label: 'history.sticker' }
    }
  };

  KC.screens = {};
  KC.order = [];
  function screen(def) { KC.screens[def.id] = def; KC.order.push(def.id); }

  /* 1 ---------------------------------------------------------------- Welcome */
  screen({
    id: 'welcome', title: 'Welcome', audience: 'child', band: 'b4_6', pose: 'wave', next: 'age-select',
    narration: ['welcome.say'], notes: 'Official logo + Kudi (wave). Tap Kudi or the logo to hear them. Recordings pending until the voice actor delivers.',
    render: function (root) {
      var a = actions();
      var logo = h('img', { class: 'kc-hero-logo', src: 'assets/brand/logo-on-white.svg', alt: t('app.name') });
      root.appendChild(h('div', { class: 'kc-stack kc-center kc-grow' },
        KC.hear(h('div', { class: 'kc-illustration kc-hero', 'data-component': 'illustration' }, logo), 'welcome.tagline', 'celebrate'),
        KC.kudi('wave', { size: 'md', hear: 'welcome.hello' }),
        h('h1', { class: 'kc-display' }, t('welcome.title')),
        h('div', { class: 'kc-row kc-justify-center' }, h('p', { class: 'kc-child-text kc-muted' }, t('welcome.sub')), KC.speakerCue('welcome.say'))));
      a.appendChild(KC.primary(t('welcome.go'), function () { KC.go(KC.state.onboarded ? 'home' : 'age-select'); }));   // returning players skip onboarding
      root.appendChild(a);
    }
  });

  /* 2 ---------------------------------------------------------------- Age selection */
  var BANDS = [
    { label: '4–6', band: 'b4_6', enabled: true },
    { label: '7–9', band: 'b7_9', enabled: true },
    { label: '10–12', band: 'b10_12', enabled: true },
    { label: '13–15', band: 'b13_15', enabled: true }
  ];
  screen({
    id: 'age-select', title: 'Age selection', audience: 'child', band: 'b4_6', pose: 'wave', next: 'avatar',
    narration: ['age.say'], notes: 'All four age bands are playable in 005 (one mission each). The band decides the home mission and the screen rules.',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('wave', { say: 'age.say', size: 'sm' }));
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('age.title') });
      var cards = [];
      BANDS.forEach(function (b) {
        var card = h('button', { class: b.enabled ? '' : 'is-locked', 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false',
                                 'aria-label': b.enabled ? t('a11y.age', { age: b.label }) : t('a11y.age_soon', { age: b.label }) },
          b.enabled ? KC.img('avatars/cub-friend-' + (BANDS.indexOf(b) + 1) + '.svg') : KC.img('icons/lock.svg'),
          h('span', { class: 'kc-age-n' }, b.label),
          b.enabled ? null : h('span', { class: 'kc-choice-sub' }, t('age.soon')));
        KC.childAction(card, 'answer', function () {
          if (!b.enabled) { card.classList.remove('is-wiggle'); void card.offsetWidth; card.classList.add('is-wiggle'); KC.kudiReact('encourage'); KC.voice.play('age.soon', { reaction: true }); return; }
          KC.markSelected(cards, card);
          KC.state.band = b.band; KC.store.save();
          KC.kudiReact('correct'); KC.voice.play('age.' + b.band, { reaction: true });
          KC.promoteOnce(grid, t('next'), function () { KC.go('avatar'); }, a);
        }, { say: b.enabled ? 'age.' + b.band : 'age.soon' });
        cards.push(card);
        grid.appendChild(card);
      });
      root.appendChild(grid);
      root.appendChild(a);
    }
  });

  /* 3 ---------------------------------------------------------------- Avatar */
  screen({
    id: 'avatar', title: 'Avatar', audience: 'child', band: 'b4_6', pose: 'wave', next: 'parent-gate',
    narration: ['avatar.say'], notes: 'Tap a friend to hear them. Nickname from chips (2–16 characters); no free text, no real names, no photos.',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('wave', { say: 'avatar.say', size: 'sm' }));
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('avatar.title') });
      var cards = KC.data.avatars.map(function (id, i) {
        var line = 'avatar.friend_' + (i + 1);
        var c = h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false', 'aria-label': t('a11y.friend', { n: i + 1 }) }, KC.img('avatars/' + id + '.svg'));
        KC.childAction(c, 'answer', function () {
          KC.markSelected(cards, c);
          KC.state.avatarId = id; KC.store.save();             // the friend the child picked is the one shown (FR-024)
          KC.kudiReact('correct'); KC.voice.play(line, { reaction: true });
          KC.promoteOnce(grid, t('avatar.done'), function () { KC.go('parent-gate'); }, a);
        }, { say: line });
        grid.appendChild(c);
        return c;
      });
      var chips = h('div', { class: 'kc-chips', role: 'radiogroup', 'aria-label': t('a11y.name') });
      var chipEls = KC.data.nicknames.map(function (n) {
        var chip = h('button', { class: 'kc-chip' + (n === KC.state.nickname ? ' is-selected' : ''), 'data-component': 'choice-card', role: 'radio', 'aria-checked': String(n === KC.state.nickname) }, n);
        var line = 'name.' + n.toLowerCase();
        KC.childAction(chip, 'hear', function () {
          KC.markSelected(chipEls, chip);
          KC.state.nickname = n; KC.store.save();
          KC.voice.play(line);
        }, { say: line });
        chips.appendChild(chip);
        return chip;
      });
      root.appendChild(grid);
      root.appendChild(chips);
      root.appendChild(a);
    }
  });

  /* 4 ---------------------------------------------------------------- Parent gate (one screen, 5 steps; grown-up space) */
  screen({
    id: 'parent-gate', title: 'Parent gate', audience: 'parent', next: 'home', narration: [],
    notes: 'Hold 3 s → multiplication in words → 4-digit PIN → confirm PIN → region → email. Prototype only: nothing typed is stored or sent.',
    render: function (root) {
      /* Everything typed here lives only in these local variables and is dropped when the gate closes (FR-011, FR-028). */
      var pin = '', firstPin = '';
      /* 005: once a family has joined, the same gate is the way back into the parent area: hold, maths, then the PIN
         (checked against the fixed demo PIN; the PIN typed is dropped at once and never stored or sent). */
      var entry = !!(KC.state.onboarded && KC.parent.intent);
      var steps = h('div', { class: 'kc-steps', 'aria-hidden': 'true' }, (entry ? [0, 1, 2] : [0, 1, 2, 3, 4, 5]).map(function () { return h('span'); }));
      var body = h('div', { class: 'kc-stack kc-grow' });
      root.appendChild(h('div', { class: 'kc-illustration', 'data-component': 'illustration' }, h('img', { class: 'kc-gate-logo', src: 'assets/brand/logo-on-brown.svg', alt: t('app.name') })));
      root.appendChild(h('h1', { class: 'kc-title kc-center' }, t('gate.title')));
      root.appendChild(steps);
      root.appendChild(body);
      root.appendChild(h('p', { class: 'kc-caption kc-muted kc-center' }, t(entry ? 'gate.note_entry' : 'gate.note')));
      function show(n) {
        body.innerHTML = '';
        steps.querySelectorAll('span').forEach(function (s, i) { s.classList.toggle('is-on', i <= n); });
        (entry ? [hold, maths, pinEnter] : [hold, maths, pinStep, pinConfirm, region, email])[n]();
      }
      function msg() { return h('p', { class: 'kc-parent-msg', role: 'status' }); }
      function hold() {
        var timer = null;
        var btn = h('button', { class: 'kc-hold', 'data-component': 'primary-button', 'data-primary': true, 'aria-label': t('gate.hold') });
        btn.innerHTML = '<svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="60"/></svg>';
        btn.appendChild(h('span', null, t('gate.hold_btn')));
        function cancel() { clearTimeout(timer); btn.classList.remove('is-holding'); }
        btn.addEventListener('pointerdown', function () { btn.classList.add('is-holding'); timer = setTimeout(function () { show(1); }, 3000); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, cancel); });
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        body.appendChild(h('p', { class: 'kc-child-text kc-center' }, t('gate.hold')));
        body.appendChild(btn);
      }
      function maths() {
        var x = 6 + Math.floor(Math.random() * 4), y = 6 + Math.floor(Math.random() * 4);
        var answer = '';
        var m = msg();
        var display = h('div', { class: 'kc-answer', 'aria-live': 'polite', 'data-answer': true }, '?');
        var check = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true }, t('gate.check'));
        check.addEventListener('click', function () {
          if (Number(answer) === x * y) { if (entry) KC.parent.gated = true; show(2); }
          else { answer = ''; display.textContent = '?'; m.textContent = t('gate.retry'); setTimeout(function () { show(1); }, 900); }
        });
        var pad = KC.keypad('parent-gate-pad', function (k) {
          if (k === 'del') answer = answer.slice(0, -1); else if (k === 'clear') answer = ''; else if (answer.length < 3) answer += k;
          display.textContent = answer || '?';
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center', 'data-question': x + 'x' + y }, t('gate.maths', { a: NUM[x], b: NUM[y] })));
        body.appendChild(display); body.appendChild(pad); body.appendChild(m); body.appendChild(check);
      }
      function pinPad(promptKey, onFull, note) {
        pin = '';
        var m = msg();
        if (note) m.textContent = note;
        var dots = h('div', { class: 'kc-pin-dots', 'aria-label': t('a11y.pin_of', { n: 0 }) }, [0, 1, 2, 3].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
        var next = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, disabled: true }, t('next'));
        function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < pin.length); }); dots.setAttribute('aria-label', t('a11y.pin_of', { n: pin.length })); next.disabled = pin.length !== 4; }
        next.addEventListener('click', function () { onFull(m, paint); });
        var pad = KC.keypad('pin-pad', function (k) {
          if (k === 'del') pin = pin.slice(0, -1); else if (k === 'clear') pin = ''; else if (pin.length < 4) pin += k;
          m.textContent = ''; paint();
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center' }, t(promptKey)));
        body.appendChild(dots); body.appendChild(pad); body.appendChild(m); body.appendChild(next);
      }
      function pinStep(note) {
        pinPad('gate.pin', function (m, paint) {
          if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') { m.textContent = t('gate.pin_weak'); pin = ''; paint(); return; }
          firstPin = pin; pin = ''; show(3);
        }, note);
      }
      function pinEnter() {
        pinPad('gate.pin_enter', function (m, paint) {
          var ok = pin === KC.data.demo.pin;
          pin = '';                                                    // dropped at once, right or wrong
          if (ok) {
            KC.parent.wrong = 0; KC.parent.unlocked = true; KC.parent.intent = false;
            KC.go('parent-home', { replace: true });                   // Back never returns to the gate (FR-004)
            return;
          }
          KC.parent.wrong += 1; paint();
          if (KC.parent.wrong >= KC.data.demo.maxTries) { KC.parent.locked = true; KC.go('parent-lockout', { replace: true }); return; }
          m.textContent = t('gate.pin_wrong', { left: KC.data.demo.maxTries - KC.parent.wrong });
        });
        body.appendChild(KC.secondary(t('gate.forgot'), function () { KC.go('parent-pin-recover'); }));
        body.appendChild(KC.secondary(t('gate.new_device'), function () { KC.go('parent-signin'); }));
      }
      function pinConfirm() {                                        // FR-010: the grown-up enters the PIN twice
        pinPad('gate.pin_confirm', function () {
          var same = pin === firstPin;
          pin = ''; firstPin = '';
          if (!same) { body.innerHTML = ''; steps.querySelectorAll('span').forEach(function (s, i) { s.classList.toggle('is-on', i <= 2); }); pinStep(t('gate.pin_mismatch')); return; }
          show(4);
        });
      }
      function region() {
        var pick = h('div', { class: 'kc-region-pick', role: 'radiogroup', 'aria-label': t('gate.region') });
        Object.keys(KC.regions).forEach(function (code) {
          var r = KC.regions[code];
          pick.appendChild(h('button', { role: 'radio', 'aria-checked': String(KC.state.region === code), 'data-region-choice': code, onclick: function () {
            KC.state.region = code; KC.savePrefs(); KC.store.save();
            pick.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-region-choice') === code)); });
          } }, KC.coinImg(r.coinIcon, { region: code }), h('span', null, r.name)));
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center' }, t('gate.region')));
        body.appendChild(pick);
        body.appendChild(h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, onclick: function () { show(5); } }, t('next')));
      }
      function email() {
        var m = msg();
        var input = h('input', { class: 'kc-input', type: 'email', inputmode: 'email', autocomplete: 'off', placeholder: t('gate.email_placeholder'), 'aria-label': t('gate.email') });
        var join = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true }, t('gate.join'));
        join.addEventListener('click', function () {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) { m.textContent = t('gate.email_bad'); return; }
          input.value = ''; /* discarded: never stored or sent */
          KC.state.onboarded = true; KC.state.band = KC.state.band || 'b4_6'; KC.store.save();
          var card = h('div', { class: 'kc-joined', role: 'status' }, KC.kudi('celebrate', { size: 'md' }), h('p', { class: 'kc-title' }, t('joined.title')));
          KC.celebrate(card);
          KC.sfx('sparkle');
          KC.voice.play('joined.say');
          setTimeout(function () { KC.go('home', { replace: true }); }, 1600);   // Back never returns to the gate (FR-004)
        });
        body.appendChild(h('label', { class: 'kc-field' }, h('span', { class: 'kc-label' }, t('gate.email')), input));
        body.appendChild(m); body.appendChild(join);
      }
      show(0);
    }
  });

  /* The home prompt: 4–6 keeps its Lost Coins words; the other bands point at their own mission (005). */
  function homeLine() {
    var first = KC.view().empty;
    return KC.bandMission() === 'lost-coins' ? (first ? 'empty.home' : 'home.say') : (first ? 'empty.home.band' : 'home.go');
  }
  function emptyWallet() { return KC.bandMission() === 'lost-coins' ? 'empty.wallet' : 'empty.wallet.band'; }
  /* 5 ---------------------------------------------------------------- Home */
  screen({
    id: 'home', title: 'Home', audience: 'child', band: 'auto', pose: 'wave', next: 'mission-intro',
    narration: function () { return [homeLine()]; },
    notes: 'Every number comes from the child\'s own play (004 FR-025). First visit: Kudi invites the child to play. Tap the coins, badges or the daily sun to hear them.',
    render: function (root) {
      var s = KC.state, v = KC.view(), lv = v.level, nx = KC.nextLevel(v.xp);
      var pct = nx ? Math.round(100 * (v.xp - lv.xpFrom) / (nx.xpFrom - lv.xpFrom)) : 100;
      var pill = KC.hear(h('span', { class: 'kc-stat-pill', 'data-component': 'coin-counter', 'data-stat': 'coins' }, KC.money(v.coins, { size: 'md' })), 'home.coins', 'correct');
      root.appendChild(h('div', { class: 'kc-row' },
        h('button', { class: 'kc-avatar-sm', 'data-component': 'icon-button', 'data-profile-entry': true, 'aria-label': t('a11y.profile'), onclick: function () { KC.go('profile'); } },
          KC.img('avatars/' + s.avatarId + '.svg')),
        h('div', { class: 'kc-stack kc-grow kc-tight' },
          h('p', { class: 'kc-title', 'data-nickname': true }, s.nickname ? t('home.hi', { name: s.nickname }) : t('home.hi_friend')),
          KC.hear(h('span', { 'data-component': 'level-badge', 'data-stat': 'level' }, h('span', { class: 'kc-level-n' }, String(lv.n)), t(lv.nameKey)), 'level.' + lv.nameKey.split('.')[1])),
        pill));
      root.appendChild(h('div', { 'data-component': 'xp-bar', 'data-stat': 'xp', 'data-value': v.xp, 'aria-label': t('a11y.xp', { xp: v.xp }) },
        h('div', { class: 'kc-row' }, h('span', { class: 'kc-label kc-grow' }, v.xp + ' XP'), nx ? h('span', { class: 'kc-label kc-muted' }, t('home.next', { level: t(nx.nameKey) })) : null),
        h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + pct + '%' }))));
      root.appendChild(KC.kudi('wave', { say: homeLine(), size: 'sm' }));     // first visit: an invitation (FR-030)
      root.appendChild(KC.primary(t('home.continue') + ' · ' + t(KC.missionTitleKey()), function () { KC.go(KC.introRoute()); }));
      var d = v.daily;
      root.appendChild(KC.hear(h('div', { 'data-component': 'streak-daily', 'data-daily': d.progress, 'aria-label': t('a11y.daily', { n: d.progress, goal: d.goal }) },
        KC.img('icons/sun-daily.svg'),
        h('div', { class: 'kc-stack kc-grow kc-tight' }, h('span', { class: 'kc-label' }, t('daily.title')),
          h('div', { class: 'kc-dots' }, [0, 1, 2].map(function (i) { return h('span', { class: 'kc-dot' + (i < d.progress ? ' is-on' : '') }); })),
          d.progress ? null : h('span', { class: 'kc-caption kc-muted', 'data-empty': 'daily' }, t('empty.daily'))),
        KC.money(d.rewardCoins, { sign: true })), d.progress ? 'daily.say' : 'empty.daily'));
      root.appendChild(KC.secondary(t('dailych.open'), function () { KC.go('daily-challenge'); }));
      var earned = KC.data.badges.filter(function (b) { return v.badges.indexOf(b.id) !== -1; }).slice(-3);
      if (earned.length) root.appendChild(h('div', { class: 'kc-badge-row' }, earned.map(function (b) { return badgeTile(b, { owned: v.badges }); })));
    }
  });

  /* 6 ---------------------------------------------------------------- Mission intro (call and response) */
  screen({
    id: 'mission-intro', title: 'Mission intro', audience: 'child', band: 'b4_6', pose: 'wave', next: 'activity-find',
    narration: ['intro.say', 'intro.help'], notes: 'Kudi asks "Can you help me find them?"; the child taps 👍 to reveal Start. Tap the stall to hear it.',
    render: function (root) {
      var a = actions();
      root.appendChild(h('h1', { class: 'kc-title kc-center' }, t('intro.title')));
      root.appendChild(KC.hear(KC.illustration('scenes/stall.svg', t('a11y.market_stall'), 'kc-scene'), 'intro.stall'));
      root.appendChild(KC.kudi('wave', { say: 'intro.say', size: 'sm' }));
      var answer = h('button', { class: 'kc-answer-card', 'data-component': 'choice-card', 'aria-label': t('a11y.yes_help') }, KC.img('icons/thumbs-answer.svg'), h('span', null, t('intro.yes_label')));
      var row = h('div', { class: 'kc-answer-row', 'data-primary-group': true }, answer);
      var asked = h('div', { class: 'kc-ask' }, h('p', { class: 'kc-child-text' }, KC.lineText('intro.help')), KC.speakerCue('intro.help'));
      KC.childAction(answer, 'answer', function () {
        if (answer.classList.contains('is-selected')) return;
        answer.classList.add('is-selected');
        KC.sfx('sparkle'); KC.kudiReact('celebrate'); KC.voice.play('intro.yes', { reaction: true });
        KC.promote(row, KC.primary(t('intro.start'), function () { KC.resetRun(); KC.go('activity-find'); }), a);   // starts the run (visit state)
      }, { sfx: false });
      root.appendChild(asked);
      root.appendChild(row);
      root.appendChild(a);
    }
  });

  /* 7a-c -------------------------------------------------------------- Activities */
  screen({
    id: 'activity-find', title: 'Find the coins', audience: 'child', band: 'b4_6', pose: 'wave', next: 'activity-sort',
    narration: ['find.say'], notes: 'Tap the coins hiding in the market; each one says its name. No timer. Coins use the active region.',
    render: function (root) { root.appendChild(KC.kudi('wave', { say: 'find.say', size: 'sm' })); KC.activityFind(root); root.appendChild(actions()); }
  });
  screen({
    id: 'activity-sort', title: 'Sort into jars', audience: 'child', band: 'b4_6', pose: 'wave', next: 'activity-count',
    narration: ['sort.say'], notes: 'Drag each coin into its jar (or tap coin, then jar). Each jar\'s count badge goes up per coin. Wrong jar: gentle float back, Kudi "fist", soft boop.',
    render: function (root) { root.appendChild(KC.kudi('wave', { say: 'sort.say', size: 'sm' })); KC.activitySort(root); root.appendChild(actions()); }
  });
  screen({
    id: 'activity-count', title: 'Count the coins', audience: 'child', band: 'b4_6', pose: 'wave', next: 'decision',
    narration: ['count.say'], notes: 'Tap to count each jar (numbers spoken). Then Kudi asks "Which jar has the most coins?" — tap a jar.',
    render: function (root) { root.appendChild(KC.kudi('wave', { say: 'count.say', size: 'sm' })); KC.activityCount(root); root.appendChild(actions()); }
  });

  /* 8 ---------------------------------------------------------------- Decision */
  screen({
    id: 'decision', title: 'Save or spend', audience: 'child', band: 'b4_6', pose: 'wave', next: 'result-save',
    narration: ['decide.say', 'decide.explain'], notes: 'Both choices are good choices. Tap a card to hear it; the explainer never blocks.',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('wave', { say: 'decide.say', size: 'sm' }));
      root.appendChild(KC.hear(h('div', { class: 'kc-row kc-panel kc-explainer', 'data-component': 'kudi-bubble' },
        h('p', { class: 'kc-child-text kc-grow' }, KC.lineText('decide.explain'))), 'decide.explain'));
      var treat = KC.region().marketExamples.treat.label;
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('decide.title') });
      var cards = ['save', 'spend'].map(function (id) {
        var ch = KC.choices[id];
        var c = h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false', 'data-choice': id },
          KC.img('icons/' + ch.icon + '.svg'), h('span', null, t(ch.labelKey)), h('span', { class: 'kc-choice-sub' }, t(ch.subKey, { treat: treat })));
        KC.childAction(c, 'answer', function () {
          KC.markSelected(cards, c);
          KC.state.lostCoins.choice = id;
          KC.kudiReact('correct'); KC.voice.play(ch.line(), { reaction: true });
          KC.promoteOnce(grid, t('decide.ok'), function () { KC.go('result-' + KC.state.lostCoins.choice); }, a);
        }, { say: ch.line() });
        grid.appendChild(c);
        return c;
      });
      root.appendChild(grid);
      root.appendChild(a);
    }
  });

  /* Record the choice exactly once per run, even if the child goes back and changes it (data-model §3).
     First the coins found are earned (so a zero start never goes negative), then saved or spent.
     Replays change nothing in the wallet (002 data-model §8, 004 FR-033). */
  KC.applyChoice = function (choice) {
    var lc = KC.state.lostCoins, n = lc.found || KC.hidden();
    lc.choice = choice;
    if (KC.completedOnce()) return;
    var mine = function (e) { return e.run === KC.state.runId; };
    var earned = KC.state.events.some(function (e) { return mine(e) && e.t === 'earn' && e.label === 'history.found'; });
    if (!earned) {
      var list = [{ t: 'earn', n: n, label: 'history.found' }];
      if (!KC.hasBadge('badge.first_coins')) list.push({ t: 'badge', label: 'badge', badge: 'badge.first_coins' });
      KC.addEvents(list);
    }
    var ev = KC.choices[choice].event;
    var already = KC.state.events.some(function (e) { return mine(e) && e.t === ev.t; });
    if (!already) KC.replaceRunEvent(['save', 'spend'], { t: ev.t, n: n, label: ev.label });
  };

  /* 9 ---------------------------------------------------------------- Result (save | spend) */
  function resultScreen(kind) {
    var ch = KC.choices[kind];
    screen({
      id: 'result-' + kind, title: 'Result: ' + kind, audience: 'child', band: 'b4_6', pose: 'celebrate', next: 'summary',
      narration: function () { return [ch.resultLine(), ch.tapLine]; },
      notes: kind === 'save' ? 'Tap the jar to drop in the last coin.' : 'Tap the sticker to stick it on. Spending is never framed as a mistake.',
      render: function (root) {
        KC.applyChoice(kind);
        var a = actions();
        var n = KC.state.lostCoins.found || KC.hidden();
        var stage = h('div', { class: 'kc-result-stage' });
        var art = h('img', { class: 'kc-result-icon' + (kind === 'spend' ? ' kc-unwrap' : ''), src: 'assets/art/' + ch.resultArt, alt: t(kind === 'save' ? 'a11y.savings_jar' : 'a11y.treat_sticker') });
        stage.appendChild(art);
        if (kind === 'save') for (var i = 0; i < 4; i++) stage.appendChild(KC.coinImg(KC.region().coinIcon, { class: 'kc-flyer', style: 'animation-delay:' + (i * 140) + 'ms' }));
        KC.childAction(stage, 'tap', function () {                    // finish the animation by hand (interaction-moments §4)
          if (stage.classList.contains('is-finished')) return;
          stage.classList.add('is-finished');
          if (kind === 'save') stage.appendChild(KC.coinImg(KC.region().coinIcon, { class: 'kc-flyer' }));
          else { art.classList.remove('kc-unwrap'); void art.offsetWidth; art.classList.add('kc-unwrap'); }
          KC.sfx('sparkle'); KC.kudiReact('celebrate'); KC.voice.play(ch.resultLine(), { reaction: true });
        }, { sfx: false, say: ch.tapLine });
        var amount = KC.completedOnce() ? null : KC.hear(h('div', { class: 'kc-row kc-justify-center' },
          kind === 'save' ? h('span', { class: 'kc-label' }, t('wallet.savings')) : null,
          KC.money(kind === 'save' ? n : -n, { sign: true, size: 'md' })), 'result.amount');
        root.appendChild(h('div', { 'data-component': 'action-result' }, stage, h('h1', { class: 'kc-title kc-positive' }, t(ch.resultTitleKey)), amount));
        root.appendChild(KC.kudi('celebrate', { say: ch.tapLine, size: 'sm' }));
        a.appendChild(KC.primary(t('next'), function () { KC.go('summary', { replace: true }); }));   // Back skips the result (FR-004)
        root.appendChild(a);
      }
    });
  }
  resultScreen('save');
  resultScreen('spend');

  /* 10 --------------------------------------------------------------- Summary (call and response) */
  screen({
    id: 'summary', title: 'Summary', audience: 'child', band: 'b4_6', pose: 'celebrate', next: 'reward',
    narration: ['summary.say', 'summary.what'], notes: 'Kudi asks "What did you do with your coins?" — tap the save or spend picture. Never right/wrong wording.',
    render: function (root) {
      var a = actions(), lc = KC.state.lostCoins, n = lc.found || KC.hidden();
      var chosen = lc.choice || 'save';
      root.appendChild(KC.kudi('celebrate', { say: 'summary.say', size: 'sm' }));
      function tile(pic, labelKey, line) {
        return KC.hear(h('div', { class: 'kc-recap-tile', 'data-component': 'illustration' }, pic, h('p', { class: 'kc-label' }, t(labelKey, { n: n }))), line, 'correct');
      }
      root.appendChild(h('div', { class: 'kc-recap' },
        tile(KC.coinImg(KC.region().coinIcon), 'summary.found_label', 'summary.found'),
        tile(KC.img('scenes/jars.svg'), 'summary.sorted_label', 'summary.sorted'),
        tile(KC.img('icons/goal-coins.svg'), 'summary.counted_label', 'summary.counted')));
      root.appendChild(h('div', { class: 'kc-ask' }, h('p', { class: 'kc-child-text' }, KC.lineText('summary.what')), KC.speakerCue('summary.what')));
      var row = h('div', { class: 'kc-answer-row', 'data-primary-group': true });
      var answered = false;
      ['save', 'spend'].forEach(function (id) {
        var ch = KC.choices[id];
        var card = h('button', { class: 'kc-answer-card', 'data-component': 'choice-card', 'data-answer': id, 'aria-label': t(ch.summaryKey) }, KC.img('icons/' + ch.icon + '.svg'));
        KC.childAction(card, 'answer', function () {
          if (answered) return;
          if (id === chosen) {
            answered = true; card.classList.add('is-selected');
            KC.sfx('sparkle'); KC.kudiReact('correct'); KC.voice.play('summary.right', { reaction: true });
            KC.run.pendingReward = true;                               // the only way Reward can grant anything (FR-005)
            KC.promote(row, KC.primary(t('next'), function () { KC.go('reward'); }), a);
          } else {
            KC.sfx('boop'); KC.kudiReact('encourage'); KC.voice.play('summary.hint', { reaction: true });
          }
        }, { sfx: false });
        row.appendChild(card);
      });
      root.appendChild(row);
      root.appendChild(a);
    }
  });

  /* 11 --------------------------------------------------------------- Reward */
  /* Replay or first completion is decided before anything renders, so the title, the spoken line and the caption
     always agree (004 FR-006; the 003 bug read last run's value). */
  function rewardIsReplay() {
    return KC.run.pendingReward ? KC.completedOnce(KC.run.mission || 'lost-coins') : !!(KC.state.lastReward && KC.state.lastReward.replay);
  }
  screen({
    id: 'reward', title: 'Reward', audience: 'child', band: 'auto', pose: 'celebrate', next: 'home',
    narration: function () { return [rewardIsReplay() ? 'reward.replay' : 'reward.say']; },
    notes: 'Only reachable by finishing a run (004 FR-005). First run: 30 coins + 40 XP + Hard Worker (+10 coins, 10 XP and Smart Sorter for a perfect sort). Replay: 5 XP only. Tap the burst to pop it again.',
    render: function (root) {
      var s = KC.state, lc = s.lostCoins, cfg = KC.data.lostCoins;
      if (KC.run.pendingReward) {
        var mid = KC.run.mission || 'lost-coins';
        var replay = KC.completedOnce(mid);
        var before = KC.view();
        var r = { coins: 0, xp: 0, badges: [], replay: replay };
        var list = [];
        if (mid !== 'lost-coins') {                                  // 005: a band mission (rules in screens-bands.js)
          var br = KC.bandReward(mid); r = br.reward; list = br.list;
        } else if (!replay) {
          r.coins += cfg.firstReward.coins; r.xp += cfg.firstReward.xp; r.badges.push(cfg.firstReward.badge);
          list.push({ t: 'earn', n: cfg.firstReward.coins, label: 'history.lost_coins' }, { t: 'xp', n: cfg.firstReward.xp, label: 'xp' },
                    { t: 'badge', label: 'badge', badge: cfg.firstReward.badge });
          if (lc.sortedCorrectFirstTry) {
            r.coins += cfg.perfectSortBonus.coins; r.xp += cfg.perfectSortBonus.xp; r.badges.push(cfg.perfectSortBonus.badge);
            list.push({ t: 'bonus', n: cfg.perfectSortBonus.coins, label: 'history.lost_coins_bonus' }, { t: 'xp', n: cfg.perfectSortBonus.xp, label: 'xp' },
                      { t: 'badge', label: 'badge', badge: cfg.perfectSortBonus.badge });
          }
          Object.keys(KC.data.pillarGain).forEach(function (p) { list.push({ t: 'pillar', n: KC.data.pillarGain[p], label: 'pillar', pillar: p }); });
          list.push({ t: 'mission_done', label: 'mission' });
        } else {
          r.xp += cfg.replay.xp;
          list.push({ t: 'xp', n: cfg.replay.xp, label: 'xp' }, { t: 'mission_replay', label: 'mission' });
        }
        r.badges = r.badges.filter(function (b) { return before.badges.indexOf(b) === -1; });
        KC.addEvents(list);
        var after = KC.view();
        r.levelUp = after.level.n > before.level.n ? after.level : null;
        s.lastReward = r;
        KC.run.pendingReward = false; KC.run.atReward = true; KC.run.active = false;   // consumed: a refresh or Back can't grant it again
        setTimeout(function () { KC.celebrate(); KC.sfx('sparkle'); }, 150);
      }
      var rw = s.lastReward;
      var a = actions();
      var burst = KC.childAction(h('div', { class: 'kc-row kc-reward-burst', 'data-component': 'action-result' },
        rw.coins ? KC.money(rw.coins, { sign: true, size: 'lg' }) : null,
        h('span', { class: 'kc-big kc-positive', 'aria-label': t('a11y.xp', { xp: rw.xp }) }, '+' + rw.xp + ' XP')),
        'tap', function () { KC.celebrate(); KC.sfx('sparkle'); KC.kudiReact('celebrate'); KC.voice.play('reward.pop', { reaction: true }); }, { sfx: false, say: 'reward.pop' });
      root.appendChild(h('div', { class: 'kc-stack kc-center kc-reward' },
        KC.kudi('celebrate', { size: 'md' }),
        h('div', { class: 'kc-row kc-justify-center' }, h('h1', { class: 'kc-title', 'data-reward-title': rw.replay ? 'replay' : 'first' }, t(rw.replay ? 'reward.replay_title' : 'reward.title')), KC.speakerCue(rw.replay ? 'reward.replay' : 'reward.say')),
        burst,
        rw.badges.length ? h('div', { class: 'kc-badge-row' }, rw.badges.map(function (id) { return badgeTile(badgeById(id), { isNew: true }); })) : null,
        rw.levelUp ? KC.hear(h('div', { class: 'kc-levelup', 'data-component': 'action-result', role: 'status' }, t('reward.levelup', { level: t(rw.levelUp.nameKey) })), 'reward.levelup.' + rw.levelUp.nameKey.split('.')[1], 'celebrate') : null));
      a.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home', { replace: true }); }));   // Back never returns to Reward
      if (rw.levelUp) a.appendChild(KC.secondary(t('levelup.open'), function () { KC.go('level-up', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 12 --------------------------------------------------------------- Wallet */
  var CATS = [
    { category: 'missions', icon: 'goal-coins', fill: '' },
    { category: 'daily', icon: 'sun-daily', fill: '' },
    { category: 'bonus', icon: 'badge-first-coins', fill: '' },
    { category: 'treats', icon: 'treat-sticker', fill: 'is-out' },
    { category: 'savings', icon: 'save', fill: 'is-saved' }
  ];
  function historyLine(labelKey) { return labelKey === 'history.sticker' ? KC.rline('history.sticker') : labelKey; }
  screen({
    id: 'wallet', title: 'Wallet', audience: 'child', band: 'auto', pose: 'wave', next: 'home',
    narration: function () { return [KC.view().history.length ? 'wallet.say' : emptyWallet(), KC.rline('wallet.currency')]; },
    notes: 'Built only from what the child did (004 FR-025). Coins shown as the region\'s coin picture + a number (never a price). Empty: Kudi invites the child to play — no blank chart or list.',
    render: function (root) {
      var v = KC.view();
      root.appendChild(titleRow('wallet.title', v.history.length ? 'wallet.say' : emptyWallet()));
      if (!v.history.length) root.appendChild(KC.kudi('wave', { say: emptyWallet(), size: 'sm' }));   // first visit: an invitation, up top (FR-030)
      root.appendChild(KC.hear(h('p', { class: 'kc-caption kc-muted', 'data-component': 'region-coin-set', 'data-currency-label': true }, KC.currencyLabel()), KC.rline('wallet.currency')));
      root.appendChild(h('div', { class: 'kc-panel' },
        KC.hear(h('div', { class: 'kc-panel-item', 'data-component': 'illustration', 'data-stat': 'coins' }, KC.img('icons/wallet-jar.svg'), h('span', { class: 'kc-label' }, t('wallet.coins')), KC.money(v.coins, { size: 'md' })), 'home.coins'),
        KC.hear(h('div', { class: 'kc-panel-item', 'data-component': 'illustration', 'data-stat': 'savings' }, KC.img('icons/save.svg'), h('span', { class: 'kc-label kc-positive' }, t('wallet.savings')), KC.money(v.savings, { size: 'md' })), 'cat.savings')));
      if (!v.history.length) {                                      // first time: no empty chart or list (FR-030)
        var e = actions(); e.appendChild(KC.primary(t('empty.play'), function () { KC.go(KC.introRoute()); })); root.appendChild(e);
        return;
      }
      var max = Math.max.apply(null, CATS.map(function (c) { return v.chart[c.category]; }).concat([1]));
      root.appendChild(h('div', { 'data-component': 'bar-chart', role: 'img', 'aria-label': t('wallet.chart') },
        h('p', { class: 'kc-label' }, t('wallet.chart')),
        CATS.map(function (c) {
          var n = v.chart[c.category];
          return KC.hear(h('div', { class: 'kc-bar', 'data-category': c.category, 'data-value': n }, KC.img('icons/' + c.icon + '.svg', t('cat.' + c.category)),
            h('div', { class: 'kc-bar-track' }, h('div', { class: 'kc-bar-fill ' + c.fill, style: 'width:' + Math.round(100 * n / max) + '%' })),
            KC.money(n)), 'cat.' + c.category);
        })));
      root.appendChild(h('ul', { class: 'kc-history', 'aria-label': t('a11y.history') }, v.history.slice(0, 8).map(function (e) {
        var when = e.daysAgo === 0 ? t('today') : (e.daysAgo === 1 ? t('yesterday') : t('days_ago', { n: e.daysAgo }));
        return KC.hear(h('li', { 'data-component': 'illustration', 'data-history': e.kind }, KC.img('icons/' + e.icon + '.svg'),
          h('div', { class: 'kc-grow' }, h('div', { class: 'kc-label' }, t(e.labelKey)), h('div', { class: 'kc-caption kc-muted' }, when)),
          KC.money(e.out ? -e.amount : e.amount, { sign: true })), historyLine(e.labelKey));
      })));
      var a = actions(); a.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home'); })); root.appendChild(a);
    }
  });

  /* 13 --------------------------------------------------------------- Progress */
  screen({
    id: 'progress', title: 'Progress', audience: 'child', band: 'auto', pose: 'wave', next: 'mission-intro',
    narration: function () { return [KC.view().badges.length ? 'progress.say' : 'empty.progress']; },
    notes: 'Level, badges and pillars come only from the child\'s play (004 FR-025). Tap a level, badge or pillar to hear it.',
    render: function (root) {
      var v = KC.view(), cur = v.level;
      root.appendChild(titleRow('progress.title', v.badges.length ? 'progress.say' : 'empty.progress'));
      if (!v.badges.length) root.appendChild(KC.kudi('wave', { say: 'empty.progress', size: 'sm' }));   // first visit: an invitation, up top (FR-030)
      root.appendChild(h('div', { class: 'kc-path', 'aria-label': t('a11y.level_path') }, KC.data.levels.map(function (l) {
        var state = l.n < cur.n ? 'is-done' : (l.n === cur.n ? 'is-current' : 'is-locked');
        return KC.hear(h('div', { 'data-component': 'level-path-node', class: state, 'aria-label': t('a11y.level', { n: l.n, name: t(l.nameKey) }) + (state === 'is-locked' ? ' ' + t('a11y.locked') : '') },
          h('span', { class: 'kc-node' }, state === 'is-locked' ? KC.img('icons/lock.svg') : String(l.n)),
          h('span', { class: 'kc-label' }, t(l.nameKey))), 'level.' + l.nameKey.split('.')[1]);
      })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.badges')));
      root.appendChild(h('div', { class: 'kc-badge-grid', 'data-badges-earned': v.badges.length }, KC.data.badges.map(function (b) { return badgeTile(b, { owned: v.badges }); })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.pillars')));
      var any = Object.keys(v.pillars).some(function (p) { return v.pillars[p] > 0; });
      if (!any) root.appendChild(h('p', { class: 'kc-child-text kc-muted', 'data-empty': 'pillars' }, t('empty.pillars')));
      else root.appendChild(h('div', { class: 'kc-stack kc-gap-2' }, ['know', 'understand', 'decide', 'invest', 'share'].map(function (p) {
        var n = Math.round(100 * v.pillars[p]);
        return KC.hear(h('div', { class: 'kc-pillar', 'data-component': 'xp-bar', 'data-pillar': p, 'data-value': n, 'aria-label': t('pillar.' + p) + ' ' + n + '%' },
          h('span', { class: 'kc-label' }, t('pillar.' + p)),
          h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + n + '%' }))), 'pillar.' + p);
      })));
      root.appendChild(KC.secondary(t('badgedet.open'), function () { KC.go('badge-detail'); }));
      var a = actions(); a.appendChild(KC.primary(t('home.continue'), function () { KC.go(KC.introRoute()); })); root.appendChild(a);
    }
  });

  /* KC.start() is called by the boot guard in index.html once every file has loaded (004 FR-051). */
})();
