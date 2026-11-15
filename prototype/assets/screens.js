/* KudiCubs prototype — screen registry + renderers (002 contracts/screen-flow.md; 003 contracts/interaction-moments.md).
   One main action at a time: one [data-primary] button, or one [data-primary-group] of equal choices/targets.
   Child actions ([data-child-action]) never navigate, are never data-primary and are enabled at render (003 FR-022/023). */
(function () {
  'use strict';
  var KC = window.KC;
  var h = KC.h, t = KC.t;

  function actions() { return h('div', { class: 'kc-actions' }); }
  function titleRow(key, line) {
    return h('div', { class: 'kc-row' }, h('h1', { class: 'kc-title kc-grow' }, t(key)), KC.speakerCue(line));
  }
  function badgeById(id) { return KC.data.badges.filter(function (b) { return b.id === id; })[0]; }
  function badgeTile(b, opts) {
    opts = opts || {};
    var earned = KC.state.badges.indexOf(b.id) !== -1;
    var el = h('div', { class: 'kc-badge' + (earned ? '' : ' is-locked') + (opts.isNew ? ' is-new' : ''), 'data-component': 'badge-tile',
                        'aria-label': t(b.nameKey) + (earned ? '' : ' ' + t('a11y.not_earned')) },
      KC.img('icons/' + b.icon + '.svg'), h('span', { class: 'kc-caption' }, t(b.nameKey)));
    return KC.hear(el, b.id, 'correct');
  }

  var NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  /* One choice table for save/spend (003 FR-042): every screen reads it instead of branching. */
  KC.choices = {
    save: {
      id: 'save', icon: 'save', labelKey: 'decide.save_label', subKey: 'decide.save_sub', line: function () { return 'decide.save'; },
      resultArt: 'icons/save.svg', resultTitleKey: 'result.save.title', resultLine: function () { return 'result.save.say'; },
      tapLine: 'result.tap_jar', summaryKey: 'summary.saved_label', summaryLine: 'summary.saved',
      apply: function (s, n) { s.coins -= n; s.savings += n; KC.addEvent('save', n, 'savings', 'history.saved', 'save'); },
      undo: function (s, n) { s.coins += n; s.savings -= n; }
    },
    spend: {
      id: 'spend', icon: 'treat-sticker', labelKey: 'decide.spend_label', subKey: 'decide.spend_sub', line: function () { return KC.rline('decide.spend'); },
      resultArt: 'icons/treat-sticker.svg', resultTitleKey: 'result.spend.title', resultLine: function () { return KC.rline('result.spend.say'); },
      tapLine: 'result.tap_sticker', summaryKey: 'summary.spent_label', summaryLine: 'summary.spent',
      apply: function (s, n) { s.coins -= n; s.items.push('sticker.' + KC.state.region); KC.addEvent('spend', n, 'treats', 'history.sticker', 'treat-sticker'); },
      undo: function (s, n) { s.coins += n; s.items.pop(); }
    }
  };
  var OUT_KINDS = { save: true, spend: true };

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
        h('div', { class: 'kc-row', style: 'justify-content:center' }, h('p', { class: 'kc-child-text kc-muted' }, t('welcome.sub')), KC.speakerCue('welcome.say'))));
      a.appendChild(KC.primary(t('welcome.go'), function () { KC.go('age-select'); }));
      root.appendChild(a);
    }
  });

  /* 2 ---------------------------------------------------------------- Age selection */
  var BANDS = [
    { label: '4–6', band: 'b4_6', enabled: true },
    { label: '7–9', band: 'b7_9', enabled: false },
    { label: '10–12', band: 'b10_12', enabled: false },
    { label: '13–15', band: 'b13_15', enabled: false }
  ];
  screen({
    id: 'age-select', title: 'Age selection', audience: 'child', band: 'b4_6', pose: 'wave', next: 'avatar',
    narration: ['age.say'], notes: 'Ages 7–9, 10–12 and 13–15 are "Coming soon" (spec 001 FR-015b).',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('wave', { say: 'age.say', size: 'sm' }));
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('age.title') });
      var cards = [];
      BANDS.forEach(function (b) {
        var card = h('button', { class: b.enabled ? '' : 'is-locked', 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false',
                                 'aria-label': b.enabled ? t('a11y.age', { age: b.label }) : t('a11y.age_soon', { age: b.label }) },
          b.enabled ? KC.img('avatars/cub-friend-1.svg') : KC.img('icons/lock.svg'),
          h('span', { class: 'kc-age-n' }, b.label),
          b.enabled ? null : h('span', { class: 'kc-choice-sub' }, t('age.soon')));
        KC.childAction(card, 'answer', function () {
          if (!b.enabled) { card.classList.remove('is-wiggle'); void card.offsetWidth; card.classList.add('is-wiggle'); KC.kudiReact('encourage'); KC.voice.play('age.soon', { reaction: true }); return; }
          KC.markSelected(cards, card);
          KC.state.band = b.band;
          KC.kudiReact('correct'); KC.voice.play('age.b4_6', { reaction: true });
          KC.promoteOnce(grid, t('next'), function () { KC.go('avatar'); }, a);
        }, { say: b.enabled ? 'age.b4_6' : 'age.soon' });
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
          KC.state.avatarId = id;
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
          KC.state.nickname = n;
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
    notes: 'Hold 3 s → multiplication in words → 4-digit PIN → region → email. Prototype only: nothing typed is stored or sent.',
    render: function (root) {
      var pin = '';
      var steps = h('div', { class: 'kc-steps', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4].map(function () { return h('span'); }));
      var body = h('div', { class: 'kc-stack kc-grow' });
      root.appendChild(h('div', { class: 'kc-illustration', 'data-component': 'illustration' }, h('img', { class: 'kc-gate-logo', src: 'assets/brand/logo-on-brown.svg', alt: t('app.name') })));
      root.appendChild(h('h1', { class: 'kc-title kc-center' }, t('gate.title')));
      root.appendChild(steps);
      root.appendChild(body);
      root.appendChild(h('p', { class: 'kc-caption kc-muted kc-center' }, t('gate.note')));
      function show(n) {
        body.innerHTML = '';
        steps.querySelectorAll('span').forEach(function (s, i) { s.classList.toggle('is-on', i <= n); });
        [hold, maths, pinStep, region, email][n]();
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
          if (Number(answer) === x * y) show(2);
          else { answer = ''; display.textContent = '?'; m.textContent = t('gate.retry'); setTimeout(function () { show(1); }, 900); }
        });
        var pad = KC.keypad('parent-gate-pad', function (k) {
          if (k === 'del') answer = answer.slice(0, -1); else if (k === 'clear') answer = ''; else if (answer.length < 3) answer += k;
          display.textContent = answer || '?';
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center', 'data-question': x + 'x' + y }, t('gate.maths', { a: NUM[x], b: NUM[y] })));
        body.appendChild(display); body.appendChild(pad); body.appendChild(m); body.appendChild(check);
      }
      function pinStep() {
        pin = '';
        var m = msg();
        var dots = h('div', { class: 'kc-pin-dots', 'aria-label': t('a11y.pin_of', { n: 0 }) }, [0, 1, 2, 3].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
        var next = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, disabled: true }, t('next'));
        function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < pin.length); }); dots.setAttribute('aria-label', t('a11y.pin_of', { n: pin.length })); next.disabled = pin.length !== 4; }
        next.addEventListener('click', function () {
          if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') { m.textContent = t('gate.pin_weak'); pin = ''; paint(); return; }
          pin = ''; show(3);
        });
        var pad = KC.keypad('pin-pad', function (k) {
          if (k === 'del') pin = pin.slice(0, -1); else if (k === 'clear') pin = ''; else if (pin.length < 4) pin += k;
          m.textContent = ''; paint();
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center' }, t('gate.pin')));
        body.appendChild(dots); body.appendChild(pad); body.appendChild(m); body.appendChild(next);
      }
      function region() {
        var pick = h('div', { class: 'kc-region-pick', role: 'radiogroup', 'aria-label': t('gate.region') });
        Object.keys(KC.regions).forEach(function (code) {
          var r = KC.regions[code];
          pick.appendChild(h('button', { role: 'radio', 'aria-checked': String(KC.state.region === code), 'data-region-choice': code, onclick: function () {
            KC.state.region = code; KC.savePrefs();
            pick.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-region-choice') === code)); });
          } }, KC.coinImg(r.coinIcon, { region: code }), h('span', null, r.name)));
        });
        body.appendChild(h('p', { class: 'kc-child-text kc-center' }, t('gate.region')));
        body.appendChild(pick);
        body.appendChild(h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, onclick: function () { show(4); } }, t('next')));
      }
      function email() {
        var m = msg();
        var input = h('input', { class: 'kc-input', type: 'email', inputmode: 'email', autocomplete: 'off', placeholder: t('gate.email_placeholder'), 'aria-label': t('gate.email') });
        var join = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true }, t('gate.join'));
        join.addEventListener('click', function () {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) { m.textContent = t('gate.email_bad'); return; }
          input.value = ''; /* discarded: never stored or sent */
          var card = h('div', { class: 'kc-joined', role: 'status' }, KC.kudi('celebrate', { size: 'md' }), h('p', { class: 'kc-title' }, t('joined.title')));
          KC.celebrate(card);
          KC.sfx('sparkle');
          KC.voice.play('joined.say');
          setTimeout(function () { KC.go('home'); }, 1600);
        });
        body.appendChild(h('label', { class: 'kc-field' }, h('span', { class: 'kc-label' }, t('gate.email')), input));
        body.appendChild(m); body.appendChild(join);
      }
      show(0);
    }
  });

  /* 5 ---------------------------------------------------------------- Home */
  screen({
    id: 'home', title: 'Home', audience: 'child', band: 'b4_6', pose: 'wave', next: 'mission-intro',
    narration: ['home.say'], notes: 'Continue always goes to the next unfinished activity. Tap the coins, badges or the daily sun to hear them.',
    render: function (root) {
      var s = KC.state, lv = KC.levelFor(s.xp), nx = KC.nextLevel(s.xp);
      var pct = nx ? Math.round(100 * (s.xp - lv.xpFrom) / (nx.xpFrom - lv.xpFrom)) : 100;
      var pill = KC.hear(h('span', { class: 'kc-stat-pill', 'data-component': 'coin-counter' }, KC.money(s.coins, { size: 'md' })), 'home.coins', 'correct');
      root.appendChild(h('div', { class: 'kc-row' },
        h('div', { class: 'kc-illustration', 'data-component': 'illustration', style: 'width:var(--kc-space-16)' }, KC.img('avatars/' + s.avatarId + '.svg', t('a11y.your_friend'))),
        h('div', { class: 'kc-stack kc-grow', style: 'gap:var(--kc-space-1)' },
          h('p', { class: 'kc-title' }, t('home.hi', { name: s.nickname })),
          KC.hear(h('span', { 'data-component': 'level-badge' }, h('span', { class: 'kc-level-n' }, String(lv.n)), t(lv.nameKey)), 'level.' + lv.nameKey.split('.')[1])),
        pill));
      root.appendChild(h('div', { 'data-component': 'xp-bar', 'aria-label': t('a11y.xp', { xp: s.xp }) },
        h('div', { class: 'kc-row' }, h('span', { class: 'kc-label kc-grow' }, s.xp + ' XP'), nx ? h('span', { class: 'kc-label kc-muted' }, t('home.next', { level: t(nx.nameKey) })) : null),
        h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + pct + '%' }))));
      root.appendChild(KC.kudi('wave', { say: 'home.say', size: 'sm' }));
      root.appendChild(KC.primary(t('home.continue') + ' · ' + t('home.mission'), function () { KC.go('mission-intro'); }));
      var d = KC.data.daily;
      root.appendChild(KC.hear(h('div', { 'data-component': 'streak-daily', 'aria-label': t('a11y.daily', { n: d.progress, goal: d.goal }) },
        KC.img('icons/sun-daily.svg'),
        h('div', { class: 'kc-stack kc-grow', style: 'gap:var(--kc-space-1)' }, h('span', { class: 'kc-label' }, t('daily.title')),
          h('div', { class: 'kc-dots' }, [0, 1, 2].map(function (i) { return h('span', { class: 'kc-dot' + (i < d.progress ? ' is-on' : '') }); }))),
        KC.money(d.rewardCoins, { sign: true })), 'daily.say'));
      var earned = KC.data.badges.filter(function (b) { return s.badges.indexOf(b.id) !== -1; }).slice(-3);
      root.appendChild(h('div', { class: 'kc-badge-row' }, earned.map(function (b) { return badgeTile(b); })));
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
        KC.promote(row, KC.primary(t('intro.start'), function () { KC.resetRun(); KC.go('activity-find'); }), a);
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
      root.appendChild(KC.hear(h('div', { class: 'kc-row kc-panel kc-explainer', 'data-component': 'kudi-bubble', style: 'justify-content:flex-start' },
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

  /* Apply (or re-apply) the save/spend choice exactly once per run, even if the child goes back and changes it.
     Replays change nothing in the wallet (002 data-model §8). */
  KC.applyChoice = function (choice) {
    var lc = KC.state.lostCoins, s = KC.state, n = lc.found || KC.hidden();
    if (lc.applied === choice) return;
    if (lc.completedOnce) { lc.applied = choice; lc.choice = choice; return; }
    if (lc.applied) {
      KC.choices[lc.applied].undo(s, n);
      s.events = s.events.filter(function (e) { return !(e.runChoice && e.run === s.runId); });
    }
    KC.choices[choice].apply(s, n);
    s.events[0].runChoice = true;
    lc.applied = choice; lc.choice = choice;
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
        var amount = KC.state.lostCoins.completedOnce ? null : KC.hear(h('div', { class: 'kc-row', style: 'justify-content:center' },
          kind === 'save' ? h('span', { class: 'kc-label' }, t('wallet.savings')) : null,
          KC.money(kind === 'save' ? n : -n, { sign: true, size: 'md' })), 'result.amount');
        root.appendChild(h('div', { 'data-component': 'action-result' }, stage, h('h1', { class: 'kc-title kc-positive' }, t(ch.resultTitleKey)), amount));
        root.appendChild(KC.kudi('celebrate', { say: ch.tapLine, size: 'sm' }));
        a.appendChild(KC.primary(t('next'), function () { KC.go('summary'); }));
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
  screen({
    id: 'reward', title: 'Reward', audience: 'child', band: 'b4_6', pose: 'celebrate', next: 'home',
    narration: function () { return [KC.state.lastReward && KC.state.lastReward.replay ? 'reward.replay' : 'reward.say']; },
    notes: 'First run: 30 coins + 40 XP + Hard Worker (+10 coins, 10 XP and Smart Sorter for a perfect sort). Replay: 5 XP only. Tap the burst to pop it again.',
    render: function (root) {
      var s = KC.state, lc = s.lostCoins, cfg = KC.data.lostCoins;
      if (!lc.rewarded) {
        var before = KC.levelFor(s.xp);
        var r = { coins: 0, xp: 0, badges: [], replay: lc.completedOnce };
        if (!lc.completedOnce) {
          r.coins += cfg.firstReward.coins; r.xp += cfg.firstReward.xp; r.badges.push(cfg.firstReward.badge);
          KC.addEvent('earn', cfg.firstReward.coins, 'missions', 'history.lost_coins', 'goal-coins');
          if (lc.sortedCorrectFirstTry) {
            r.coins += cfg.perfectSortBonus.coins; r.xp += cfg.perfectSortBonus.xp; r.badges.push(cfg.perfectSortBonus.badge);
            KC.addEvent('bonus', cfg.perfectSortBonus.coins, 'bonus', 'history.lost_coins_bonus', 'badge-smart-sorter');
          }
          Object.keys(KC.data.pillarGain).forEach(function (p) { s.pillars[p] = Math.min(1, s.pillars[p] + KC.data.pillarGain[p]); });
        } else {
          r.xp += cfg.replay.xp;
        }
        s.coins += r.coins; s.xp += r.xp;
        r.badges.forEach(function (b) { if (s.badges.indexOf(b) === -1) s.badges.push(b); });
        var after = KC.levelFor(s.xp);
        r.levelUp = after.n > before.n ? after : null;
        lc.rewarded = true; lc.completedOnce = true;
        s.lastReward = r;
        setTimeout(function () { KC.celebrate(); KC.sfx('sparkle'); }, 150);
      }
      var rw = s.lastReward;
      var a = actions();
      var burst = KC.childAction(h('div', { class: 'kc-row kc-reward-burst', 'data-component': 'action-result', style: 'justify-content:center;gap:var(--kc-space-6)' },
        rw.coins ? KC.money(rw.coins, { sign: true, size: 'lg' }) : null,
        h('span', { class: 'kc-big kc-positive', 'aria-label': t('a11y.xp', { xp: rw.xp }) }, '+' + rw.xp + ' XP')),
        'tap', function () { KC.celebrate(); KC.sfx('sparkle'); KC.kudiReact('celebrate'); KC.voice.play('reward.pop', { reaction: true }); }, { sfx: false, say: 'reward.pop' });
      root.appendChild(h('div', { class: 'kc-stack kc-center' },
        KC.kudi('celebrate', { size: 'md' }),
        h('div', { class: 'kc-row', style: 'justify-content:center' }, h('h1', { class: 'kc-title' }, t(rw.replay ? 'reward.replay_title' : 'reward.title')), KC.speakerCue(rw.replay ? 'reward.replay' : 'reward.say')),
        burst,
        rw.badges.length ? h('div', { class: 'kc-badge-row' }, rw.badges.map(function (id) { return badgeTile(badgeById(id), { isNew: true }); })) : null,
        rw.levelUp ? KC.hear(h('div', { class: 'kc-levelup', 'data-component': 'action-result', role: 'status' }, t('reward.levelup', { level: t(rw.levelUp.nameKey) })), 'reward.levelup.' + rw.levelUp.nameKey.split('.')[1], 'celebrate') : null));
      a.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home'); }));
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
    id: 'wallet', title: 'Wallet', audience: 'child', band: 'b4_6', pose: 'wave', next: 'home',
    narration: function () { return ['wallet.say', KC.rline('wallet.currency')]; },
    notes: 'Coins shown as the region\'s coin picture + a number (never a price). Tap bars and history lines to hear them; tap the currency line to hear the money name.',
    render: function (root) {
      var s = KC.state;
      root.appendChild(titleRow('wallet.title', 'wallet.say'));
      root.appendChild(KC.hear(h('p', { class: 'kc-caption kc-muted', 'data-component': 'region-coin-set', 'data-currency-label': true }, KC.currencyLabel()), KC.rline('wallet.currency')));
      root.appendChild(h('div', { class: 'kc-panel' },
        KC.hear(h('div', { class: 'kc-panel-item', 'data-component': 'illustration' }, KC.img('icons/wallet-jar.svg'), h('span', { class: 'kc-label' }, t('wallet.coins')), KC.money(s.coins, { size: 'md' })), 'home.coins'),
        KC.hear(h('div', { class: 'kc-panel-item', 'data-component': 'illustration' }, KC.img('icons/save.svg'), h('span', { class: 'kc-label kc-positive' }, t('wallet.savings')), KC.money(s.savings, { size: 'md' })), 'cat.savings')));
      var all = s.events.concat(KC.data.walletHistory);
      var sums = {}; all.forEach(function (e) { sums[e.category] = (sums[e.category] || 0) + e.amount; });
      var max = Math.max.apply(null, CATS.map(function (c) { return sums[c.category] || 0; }).concat([1]));
      root.appendChild(h('div', { 'data-component': 'bar-chart', role: 'img', 'aria-label': t('wallet.chart') },
        h('p', { class: 'kc-label' }, t('wallet.chart')),
        CATS.map(function (c) {
          var v = sums[c.category] || 0;
          return KC.hear(h('div', { class: 'kc-bar' }, KC.img('icons/' + c.icon + '.svg', t('cat.' + c.category)),
            h('div', { class: 'kc-bar-track' }, h('div', { class: 'kc-bar-fill ' + c.fill, style: 'width:' + Math.round(100 * v / max) + '%' })),
            KC.money(v)), 'cat.' + c.category);
        })));
      root.appendChild(h('ul', { class: 'kc-history', 'aria-label': t('a11y.history') }, all.slice(0, 8).map(function (e) {
        var when = e.daysAgo === 0 ? t('today') : (e.daysAgo === 1 ? t('yesterday') : t('days_ago', { n: e.daysAgo }));
        return KC.hear(h('li', { 'data-component': 'illustration' }, KC.img('icons/' + e.icon + '.svg'),
          h('div', { class: 'kc-grow' }, h('div', { class: 'kc-label' }, t(e.labelKey)), h('div', { class: 'kc-caption kc-muted' }, when)),
          KC.money(OUT_KINDS[e.kind] ? -e.amount : e.amount, { sign: true })), historyLine(e.labelKey));
      })));
      root.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home'); }));
    }
  });

  /* 13 --------------------------------------------------------------- Progress */
  screen({
    id: 'progress', title: 'Progress', audience: 'child', band: 'b4_6', pose: 'wave', next: 'mission-intro',
    narration: ['progress.say'], notes: 'Tap a level, badge or pillar to hear it. The level path is a market road (a pattern, not a copy of any reference layout).',
    render: function (root) {
      var s = KC.state, cur = KC.levelFor(s.xp);
      root.appendChild(titleRow('progress.title', 'progress.say'));
      root.appendChild(h('div', { class: 'kc-path', 'aria-label': t('a11y.level_path') }, KC.data.levels.map(function (l) {
        var state = l.n < cur.n ? 'is-done' : (l.n === cur.n ? 'is-current' : 'is-locked');
        return KC.hear(h('div', { 'data-component': 'level-path-node', class: state, 'aria-label': t('a11y.level', { n: l.n, name: t(l.nameKey) }) + (state === 'is-locked' ? ' ' + t('a11y.locked') : '') },
          h('span', { class: 'kc-node' }, state === 'is-locked' ? KC.img('icons/lock.svg') : String(l.n)),
          h('span', { class: 'kc-label' }, t(l.nameKey))), 'level.' + l.nameKey.split('.')[1]);
      })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.badges')));
      root.appendChild(h('div', { class: 'kc-badge-grid' }, KC.data.badges.map(function (b) { return badgeTile(b); })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.pillars')));
      root.appendChild(h('div', { class: 'kc-stack', style: 'gap:var(--kc-space-2)' }, ['know', 'understand', 'decide', 'invest', 'share'].map(function (p) {
        var v = Math.round(100 * s.pillars[p]);
        return KC.hear(h('div', { class: 'kc-pillar', 'data-component': 'xp-bar', 'aria-label': t('pillar.' + p) + ' ' + v + '%' },
          h('span', { class: 'kc-label' }, t('pillar.' + p)),
          h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + v + '%' }))), 'pillar.' + p);
      })));
      root.appendChild(KC.primary(t('home.continue'), function () { KC.go('mission-intro'); }));
    }
  });

  KC.start();
})();
