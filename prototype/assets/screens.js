/* KudiCubs prototype — screen registry + renderers (contracts/screen-flow.md, data-model §5).
   Every child screen shows exactly one main action at a time: one [data-primary] button, or one
   [data-primary-group] of equal choices / activity targets while a choice or activity is in progress. */
(function () {
  'use strict';
  var KC = window.KC;
  var h = KC.h, t = KC.t;

  function actions() { return h('div', { class: 'kc-actions' }); }
  function titleRow(key, sayKey) {
    return h('div', { class: 'kc-row' }, h('h1', { class: 'kc-title kc-grow' }, t(key)), KC.speakerCue(sayKey || key));
  }
  function badgeTile(b, opts) {
    opts = opts || {};
    var earned = KC.state.badges.indexOf(b.id) !== -1;
    return h('div', { class: 'kc-badge' + (earned ? '' : ' is-locked') + (opts.isNew ? ' is-new' : ''), 'data-component': 'badge-tile',
                      'data-not-wired': opts.notWired ? true : null, 'aria-label': t(b.nameKey) + (earned ? '' : ' (not yet earned)') },
      KC.img('icons/' + b.icon + '.svg'), h('span', { class: 'kc-caption' }, t(b.nameKey)));
  }
  function badgeById(id) { return KC.data.badges.filter(function (b) { return b.id === id; })[0]; }

  var NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  KC.screens = {};
  KC.order = [];
  function screen(def) { KC.screens[def.id] = def; KC.order.push(def.id); }

  /* 1 ---------------------------------------------------------------- Welcome */
  screen({
    id: 'welcome', title: 'Welcome', audience: 'child', band: 'b4_6', next: 'age-select',
    narration: ['welcome.say'], components: ['illustration', 'speaker-cue', 'primary-button'],
    notes: 'Kudi the Cub greets the child. One big gold button. Narration starts after the first tap (browser rule).',
    render: function (root) {
      var a = actions();
      root.appendChild(h('div', { class: 'kc-stack kc-center kc-grow' },
        h('div', { style: 'height:var(--kc-space-4)' }),
        KC.kudi('welcome', { size: 'lg' }),
        h('h1', { class: 'kc-display' }, t('welcome.title')),
        h('div', { class: 'kc-row', style: 'justify-content:center' }, h('p', { class: 'kc-child-text kc-muted' }, t('welcome.sub')), KC.speakerCue('welcome.say'))));
      a.appendChild(KC.primary(t('welcome.go'), function () { KC.say('welcome.say'); KC.go('age-select'); }));
      root.appendChild(a);
    }
  });

  /* 2 ---------------------------------------------------------------- Age selection */
  screen({
    id: 'age-select', title: 'Age selection', audience: 'child', band: 'b4_6', next: 'avatar',
    narration: ['age.say'], components: ['kudi-bubble', 'choice-card', 'primary-button'],
    notes: 'Ages 7–9, 10–12 and 13–15 are shown as "Coming soon" (spec 001 FR-015b: those worlds ship in later stages).',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('explain', { say: 'age.say', size: 'sm' }));
      var bands = [['4–6', 'b4_6', true], ['7–9', 'b7_9', false], ['10–12', 'b10_12', false], ['13–15', 'b13_15', false]];
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('age.title') });
      var promoted = false;
      bands.forEach(function (b) {
        var card = h('button', { class: b[2] ? '' : 'is-locked', 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false',
                                 'aria-label': b[2] ? 'Age ' + b[0] : 'Age ' + b[0] + ', coming soon' },
          b[2] ? KC.img('avatars/cub-friend-1.svg') : KC.img('icons/lock.svg'),
          h('span', { class: 'kc-age-n' }, b[0]),
          b[2] ? null : h('span', { class: 'kc-choice-sub' }, t('age.soon')));
        card.addEventListener('click', function () {
          if (!b[2]) { card.classList.remove('is-wiggle'); void card.offsetWidth; card.classList.add('is-wiggle'); KC.say('age.soon'); return; }
          card.classList.add('is-selected'); card.setAttribute('aria-checked', 'true');
          KC.state.band = b[1];
          if (!promoted) { promoted = true; KC.promote(grid, KC.primary(t('age.next'), function () { KC.go('avatar'); }), a); }
        });
        grid.appendChild(card);
      });
      root.appendChild(grid);
      root.appendChild(a);
    }
  });

  /* 3 ---------------------------------------------------------------- Avatar */
  screen({
    id: 'avatar', title: 'Avatar', audience: 'child', band: 'b4_6', next: 'parent-gate',
    narration: ['avatar.say'], components: ['kudi-bubble', 'choice-card', 'primary-button'],
    notes: 'Nickname is picked from suggestion chips (2–16 characters). No free text, no real names, no photos.',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('explain', { say: 'avatar.say', size: 'sm' }));
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('avatar.title') });
      var promoted = false;
      var cards = KC.data.avatars.map(function (id, i) {
        var c = h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false', 'aria-label': 'Friend ' + (i + 1) }, KC.img('avatars/' + id + '.svg'));
        c.addEventListener('click', function () {
          cards.forEach(function (x) { x.classList.remove('is-selected'); x.setAttribute('aria-checked', 'false'); });
          c.classList.add('is-selected'); c.setAttribute('aria-checked', 'true');
          KC.state.avatarId = id;
          if (!promoted) { promoted = true; KC.promote(grid, KC.primary(t('avatar.done'), function () { KC.go('parent-gate'); }), a); }
        });
        grid.appendChild(c);
        return c;
      });
      var chips = h('div', { class: 'kc-chips', role: 'radiogroup', 'aria-label': 'Name' });
      KC.data.nicknames.forEach(function (n) {
        var chip = h('button', { class: 'kc-chip' + (n === KC.state.nickname ? ' is-selected' : ''), 'data-component': 'choice-card', role: 'radio', 'aria-checked': String(n === KC.state.nickname) }, n);
        chip.addEventListener('click', function () {
          chips.querySelectorAll('.kc-chip').forEach(function (x) { x.classList.remove('is-selected'); x.setAttribute('aria-checked', 'false'); });
          chip.classList.add('is-selected'); chip.setAttribute('aria-checked', 'true'); KC.state.nickname = n; KC.say(n);
        });
        chips.appendChild(chip);
      });
      root.appendChild(grid);
      root.appendChild(chips);
      root.appendChild(a);
    }
  });

  /* 4 ---------------------------------------------------------------- Parent gate (one screen, 5 steps) */
  screen({
    id: 'parent-gate', title: 'Parent gate', audience: 'parent', next: 'home',
    narration: [], components: ['parent-gate-pad', 'pin-pad', 'primary-button'],
    notes: 'Hold 3 s → multiplication in words → 4-digit PIN → region → email. Prototype only: nothing typed is stored or sent.',
    render: function (root) {
      var step = 0;
      /* Values live only in this closure and are discarded on leaving (FR-012, research D11). */
      var pin = '';
      var steps = h('div', { class: 'kc-steps', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4].map(function () { return h('span'); }));
      var body = h('div', { class: 'kc-stack kc-grow' });
      root.appendChild(h('h1', { class: 'kc-title', style: 'text-align:center' }, t('gate.title')));
      root.appendChild(steps);
      root.appendChild(body);
      root.appendChild(h('p', { class: 'kc-caption kc-muted', style: 'text-align:center' }, t('gate.note')));

      function show(n) {
        step = n; body.innerHTML = '';
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
        body.appendChild(h('p', { class: 'kc-child-text', style: 'text-align:center' }, t('gate.hold')));
        body.appendChild(btn);
      }
      function maths() {
        var a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
        var answer = '';
        var m = msg();
        var display = h('div', { class: 'kc-answer', 'aria-live': 'polite', 'data-answer': true }, '?');
        var check = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true }, t('gate.check'));
        check.addEventListener('click', function () {
          if (Number(answer) === a * b) show(2);
          else { answer = ''; display.textContent = '?'; m.textContent = t('gate.retry'); setTimeout(function () { show(1); }, 900); }
        });
        var pad = h('div', { 'data-component': 'parent-gate-pad' });
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'].forEach(function (k) {
          pad.appendChild(h('button', { 'aria-label': k === '⌫' ? 'Delete' : (k === 'C' ? 'Clear' : k), onclick: function () {
            if (k === '⌫') answer = answer.slice(0, -1); else if (k === 'C') answer = ''; else if (answer.length < 3) answer += k;
            display.textContent = answer || '?';
          } }, k));
        });
        body.appendChild(h('p', { class: 'kc-child-text', style: 'text-align:center', 'data-question': a + 'x' + b }, t('gate.maths', { a: NUM[a], b: NUM[b] })));
        body.appendChild(display); body.appendChild(pad); body.appendChild(m); body.appendChild(check);
      }
      function pinStep() {
        pin = '';
        var m = msg();
        var dots = h('div', { class: 'kc-pin-dots', 'aria-label': '0 of 4 digits' }, [0, 1, 2, 3].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
        var next = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, disabled: true }, t('next'));
        function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < pin.length); }); dots.setAttribute('aria-label', pin.length + ' of 4 digits'); next.disabled = pin.length !== 4; }
        next.addEventListener('click', function () {
          if (/^(\d)\1{3}$/.test(pin) || pin === '1234' || pin === '4321') { m.textContent = t('gate.pin_weak'); pin = ''; paint(); return; }
          pin = ''; show(3);
        });
        var pad = h('div', { 'data-component': 'pin-pad' });
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'C'].forEach(function (k) {
          pad.appendChild(h('button', { 'aria-label': k === '⌫' ? 'Delete' : (k === 'C' ? 'Clear' : k), onclick: function () {
            if (k === '⌫') pin = pin.slice(0, -1); else if (k === 'C') pin = ''; else if (pin.length < 4) pin += k;
            m.textContent = ''; paint();
          } }, k));
        });
        body.appendChild(h('p', { class: 'kc-child-text', style: 'text-align:center' }, t('gate.pin')));
        body.appendChild(dots); body.appendChild(pad); body.appendChild(m); body.appendChild(next);
      }
      function region() {
        var pick = h('div', { class: 'kc-region-pick', role: 'radiogroup', 'aria-label': t('gate.region') });
        Object.keys(KC.regions).forEach(function (code) {
          var r = KC.regions[code];
          pick.appendChild(h('button', { role: 'radio', 'aria-checked': String(KC.state.region === code), 'data-region-choice': code, onclick: function () {
            KC.state.region = code; KC.savePrefs();
            pick.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-region-choice') === code)); });
          } }, h('img', { src: 'assets/art/coins/' + code + '/' + r.coinIcon + '.svg', alt: '', 'aria-hidden': 'true' }), h('span', null, r.name)));
        });
        body.appendChild(h('p', { class: 'kc-child-text', style: 'text-align:center' }, t('gate.region')));
        body.appendChild(pick);
        body.appendChild(h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, onclick: function () { show(4); } }, t('next')));
      }
      function email() {
        var m = msg();
        var input = h('input', { class: 'kc-input', type: 'email', inputmode: 'email', autocomplete: 'off', placeholder: 'parent@example.com', 'aria-label': t('gate.email') });
        var join = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true }, t('gate.join'));
        join.addEventListener('click', function () {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) { m.textContent = t('gate.email_bad'); return; }
          input.value = ''; /* discarded: never stored or sent */
          var card = h('div', { class: 'kc-joined', role: 'status' }, KC.kudi('cheer', { size: 'md' }), h('p', { class: 'kc-title' }, t('joined.title')));
          KC.celebrate(card);
          KC.say('joined.say');
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
    id: 'home', title: 'Home', audience: 'child', band: 'b4_6', next: 'mission-intro',
    narration: ['home.say'], components: ['illustration', 'level-badge', 'coin-counter', 'xp-bar', 'kudi-bubble', 'primary-button', 'streak-daily', 'badge-tile', 'bottom-nav'],
    notes: 'Continue always goes to the next unfinished activity. The daily sun never shows a penalty for ages 4–6.',
    render: function (root) {
      var s = KC.state, lv = KC.levelFor(s.xp), nx = KC.nextLevel(s.xp);
      var pct = nx ? Math.round(100 * (s.xp - lv.xpFrom) / (nx.xpFrom - lv.xpFrom)) : 100;
      root.appendChild(h('div', { class: 'kc-row' },
        h('div', { class: 'kc-illustration', 'data-component': 'illustration', style: 'width:var(--kc-space-16)' }, KC.img('avatars/' + s.avatarId + '.svg', 'Your friend')),
        h('div', { class: 'kc-stack kc-grow', style: 'gap:var(--kc-space-1)' },
          h('p', { class: 'kc-title' }, t('home.hi', { name: s.nickname })),
          h('span', { 'data-component': 'level-badge' }, h('span', { class: 'kc-level-n' }, String(lv.n)), t(lv.nameKey))),
        h('span', { class: 'kc-stat-pill' }, KC.money(s.coins, { size: 'md' }))));
      root.appendChild(h('div', { 'data-component': 'xp-bar', 'aria-label': 'XP ' + s.xp + (nx ? ' of ' + nx.xpFrom : '') },
        h('div', { class: 'kc-row' }, h('span', { class: 'kc-label kc-grow' }, s.xp + ' XP'), nx ? h('span', { class: 'kc-label kc-muted' }, t('home.next', { level: t(nx.nameKey) })) : null),
        h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + pct + '%' }))));
      root.appendChild(KC.kudi('explain', { say: 'home.say', size: 'sm' }));
      var cont = KC.primary(t('home.continue') + ' · ' + t('home.mission'), function () { KC.go('mission-intro'); });
      root.appendChild(cont);
      var d = KC.data.daily;
      root.appendChild(h('div', { 'data-component': 'streak-daily', 'data-not-wired': true, 'aria-label': t('daily.title') + ', ' + d.progress + ' of ' + d.goal },
        KC.img('icons/sun-daily.svg'),
        h('div', { class: 'kc-stack kc-grow', style: 'gap:var(--kc-space-1)' }, h('span', { class: 'kc-label' }, t('daily.title')),
          h('div', { class: 'kc-dots' }, [0, 1, 2].map(function (i) { return h('span', { class: 'kc-dot' + (i < d.progress ? ' is-on' : '') }); }))),
        KC.money(d.rewardCoins, { sign: true }), KC.speakerCue('daily.say')));
      var earned = KC.data.badges.filter(function (b) { return s.badges.indexOf(b.id) !== -1; }).slice(-3);
      root.appendChild(h('div', { class: 'kc-badge-row' }, earned.map(function (b) { return badgeTile(b, { notWired: true }); })));
    }
  });

  /* 6 ---------------------------------------------------------------- Mission intro */
  screen({
    id: 'mission-intro', title: 'Mission intro', audience: 'child', band: 'b4_6', next: 'activity-find',
    narration: ['intro.say'], components: ['illustration', 'kudi-bubble', 'primary-button'],
    notes: 'The Lost Coins (spec 001 FR-019). Pillars: Know, Understand.',
    render: function (root) {
      var a = actions();
      root.appendChild(h('h1', { class: 'kc-title', style: 'text-align:center' }, t('intro.title')));
      root.appendChild(KC.illustration('scenes/stall.svg', 'A market stall', 'kc-scene'));
      root.appendChild(KC.kudi('explain', { say: 'intro.say', size: 'sm' }));
      root.appendChild(h('div', { class: 'kc-row', style: 'justify-content:center' },
        h('div', { class: 'kc-illustration', 'data-component': 'illustration', style: 'width:var(--kc-space-12)' }, KC.img('icons/goal-coins.svg')),
        h('span', { class: 'kc-big' }, '× 8')));
      a.appendChild(KC.primary(t('intro.start'), function () { KC.resetRun(); KC.go('activity-find'); }));
      root.appendChild(a);
    }
  });

  /* 7a-c -------------------------------------------------------------- Activities */
  screen({
    id: 'activity-find', title: 'Find the coins', audience: 'child', band: 'b4_6', next: 'activity-sort',
    narration: ['find.say'], components: ['kudi-bubble', 'progress-dots', 'illustration', 'coin-token', 'primary-button'],
    notes: 'Tap the 8 coins hiding in the market. No timer. Coins use the active region\'s designs.',
    render: function (root) {
      root.appendChild(KC.kudi('point', { say: 'find.say', size: 'sm' }));
      KC.activityFind(root);
      root.appendChild(actions());
    }
  });
  screen({
    id: 'activity-sort', title: 'Sort into jars', audience: 'child', band: 'b4_6', next: 'activity-count',
    narration: ['sort.say', 'sort.hint'], components: ['kudi-bubble', 'jar', 'coin-token', 'primary-button'],
    notes: 'Drag a coin to a jar, or tap a coin then tap a jar. Wrong jar: gentle bounce + Kudi encourages; after 2 tries the right jar glows.',
    render: function (root) {
      root.appendChild(KC.kudi('explain', { say: 'sort.say', size: 'sm' }));
      KC.activitySort(root);
      root.appendChild(actions());
    }
  });
  screen({
    id: 'activity-count', title: 'Count the coins', audience: 'child', band: 'b4_6', next: 'decision',
    narration: ['count.say'], components: ['kudi-bubble', 'jar', 'coin-token', 'primary-button'],
    notes: 'Counts how many coins are in each jar (ages 4–6 count to 20) — no money totals.',
    render: function (root) {
      root.appendChild(KC.kudi('explain', { say: 'count.say', size: 'sm' }));
      KC.activityCount(root);
      root.appendChild(actions());
    }
  });

  /* 8 ---------------------------------------------------------------- Decision */
  screen({
    id: 'decision', title: 'Save or spend', audience: 'child', band: 'b4_6', next: 'result-save',
    narration: ['decide.say', 'decide.explain'], components: ['kudi-bubble', 'speaker-cue', 'choice-card', 'primary-button'],
    notes: 'Both choices are good choices. The explainer is short, spoken and never blocks.',
    render: function (root) {
      var a = actions();
      root.appendChild(KC.kudi('think', { say: 'decide.say', size: 'sm' }));
      root.appendChild(h('div', { class: 'kc-row kc-panel', style: 'justify-content:flex-start' },
        h('p', { class: 'kc-child-text kc-grow' }, t('decide.explain')), KC.speakerCue('decide.explain')));
      var treat = KC.region().marketExamples.treat.label;
      var grid = h('div', { class: 'kc-choice-grid', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t('decide.title') });
      var promoted = false, ok = null;
      var opts = [['save', 'save', t('decide.save'), t('decide.save_sub')], ['spend', 'treat-sticker', t('decide.spend'), t('decide.spend_sub', { treat: treat })]];
      var cards = opts.map(function (o) {
        var c = h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false', 'data-choice': o[0] },
          KC.img('icons/' + o[1] + '.svg'), h('span', null, o[2]), h('span', { class: 'kc-choice-sub' }, o[3]));
        c.addEventListener('click', function () {
          cards.forEach(function (x) { x.classList.remove('is-selected'); x.setAttribute('aria-checked', 'false'); });
          c.classList.add('is-selected'); c.setAttribute('aria-checked', 'true');
          KC.state.lostCoins.choice = o[0];
          KC.say(o[0] === 'save' ? 'decide.save' : 'decide.spend');
          if (!promoted) {
            promoted = true;
            ok = KC.primary(t('decide.ok'), function () { KC.go('result-' + KC.state.lostCoins.choice); });
            KC.promote(grid, ok, a);
          }
        });
        grid.appendChild(c);
        return c;
      });
      root.appendChild(grid);
      root.appendChild(a);
    }
  });

  /* Apply (or re-apply) the save/spend choice exactly once per run, even if the child goes back and changes it.
     Replays change nothing in the wallet (data-model §8: replay gives replay XP only). */
  KC.applyChoice = function (choice) {
    var lc = KC.state.lostCoins, s = KC.state, n = lc.found || 8;
    if (lc.applied === choice) return;
    if (lc.completedOnce) { lc.applied = choice; lc.choice = choice; return; }
    var notThisRunChoice = function (e) { return !(e.runChoice && e.run === s.runId); };
    if (lc.applied === 'save') { s.savings -= n; s.coins += n; s.events = s.events.filter(notThisRunChoice); }
    if (lc.applied === 'spend') { s.coins += n; s.items.pop(); s.events = s.events.filter(notThisRunChoice); }
    if (choice === 'save') { s.coins -= n; s.savings += n; KC.addEvent('save', n, 'savings', 'history.saved', 'save'); }
    if (choice === 'spend') { s.coins -= n; s.items.push('sticker.' + KC.region().marketExamples.treat.label); KC.addEvent('spend', n, 'treats', 'history.sticker', 'treat-sticker'); }
    s.events[0].runChoice = true;
    lc.applied = choice; lc.choice = choice;
  };

  /* 9 ---------------------------------------------------------------- Result (save | spend) */
  function resultScreen(kind) {
    screen({
      id: 'result-' + kind, title: 'Result: ' + kind, audience: 'child', band: 'b4_6', next: 'summary',
      narration: ['result.' + kind + '.say'], components: ['action-result', 'illustration', 'coin-counter', 'primary-button'],
      notes: kind === 'save' ? 'Coins fly into the savings jar.' : 'A treat sticker is unwrapped. Spending is never framed as a mistake.',
      render: function (root) {
        KC.applyChoice(kind);
        var a = actions();
        var n = KC.state.lostCoins.found || 8;
        var stage = h('div', { class: 'kc-result-stage' });
        if (kind === 'save') {
          stage.appendChild(h('img', { class: 'kc-result-icon', src: 'assets/art/icons/save.svg', alt: 'Savings jar' }));
          for (var i = 0; i < 5; i++) stage.appendChild(h('img', { class: 'kc-flyer', src: 'assets/art/' + KC.coinSrc(KC.region().coinIcon), alt: '', 'data-region': KC.state.region, style: 'animation-delay:' + (i * 140) + 'ms' }));
        } else {
          stage.appendChild(h('img', { class: 'kc-result-icon kc-unwrap', src: 'assets/art/icons/treat-sticker.svg', alt: 'Treat sticker' }));
        }
        root.appendChild(h('div', { 'data-component': 'action-result' },
          stage,
          h('h1', { class: 'kc-title kc-positive' }, t('result.' + kind + '.title')),
          KC.state.lostCoins.completedOnce ? null : h('div', { class: 'kc-row', style: 'justify-content:center' },
            kind === 'save' ? h('span', { class: 'kc-label' }, t('wallet.savings')) : null,
            KC.money(kind === 'save' ? n : -n, { sign: true, size: 'md' }))));
        root.appendChild(KC.kudi('cheer', { say: 'result.' + kind + '.say', size: 'sm' }));
        a.appendChild(KC.primary(t('next'), function () { KC.go('summary'); }));
        root.appendChild(a);
      }
    });
  }
  resultScreen('save');
  resultScreen('spend');

  /* 10 --------------------------------------------------------------- Summary */
  screen({
    id: 'summary', title: 'Summary', audience: 'child', band: 'b4_6', next: 'reward',
    narration: ['summary.say'], components: ['kudi-bubble', 'illustration', 'primary-button'],
    notes: 'Celebrates what the child did. Never "right/wrong" wording for ages 4–6.',
    render: function (root) {
      var a = actions(), lc = KC.state.lostCoins, n = lc.found || 8;
      root.appendChild(KC.kudi('cheer', { say: 'summary.say', size: 'sm' }));
      function tile(img, text, isCoin) {
        var pic = KC.img(img);
        if (isCoin) pic.setAttribute('data-region', KC.state.region);
        return h('div', { class: 'kc-recap-tile', 'data-component': 'illustration' }, pic, h('p', { class: 'kc-label' }, text));
      }
      root.appendChild(h('div', { class: 'kc-recap' },
        tile(KC.coinSrc(KC.region().coinIcon), t('summary.found', { n: n }), true),
        tile('scenes/jars.svg', t('summary.sorted')),
        tile('icons/goal-coins.svg', t('summary.counted')),
        tile(lc.choice === 'spend' ? 'icons/treat-sticker.svg' : 'icons/save.svg', t(lc.choice === 'spend' ? 'summary.spent' : 'summary.saved'))));
      a.appendChild(KC.primary(t('next'), function () { KC.go('reward'); }));
      root.appendChild(a);
    }
  });

  /* 11 --------------------------------------------------------------- Reward */
  screen({
    id: 'reward', title: 'Reward', audience: 'child', band: 'b4_6', next: 'home',
    narration: ['reward.say'], components: ['illustration', 'coin-counter', 'badge-tile', 'celebration-overlay', 'primary-button'],
    notes: 'First run: 30 coins + 40 XP + Hard Worker (+10 coins, 10 XP and Smart Sorter for a perfect sort). Replay: 5 XP only.',
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
        setTimeout(function () { KC.celebrate(); }, 150);
      }
      var rw = s.lastReward;
      var a = actions();
      root.appendChild(h('div', { class: 'kc-stack kc-center' },
        KC.kudi('cheer', { size: 'md' }),
        h('div', { class: 'kc-row', style: 'justify-content:center' }, h('h1', { class: 'kc-title' }, t(rw.replay ? 'reward.replay' : 'reward.title')), KC.speakerCue('reward.say')),
        h('div', { class: 'kc-row', style: 'justify-content:center;gap:var(--kc-space-6)' },
          rw.coins ? KC.money(rw.coins, { sign: true, size: 'lg' }) : null,
          h('span', { class: 'kc-big kc-positive', 'aria-label': rw.xp + ' XP' }, '+' + rw.xp + ' XP')),
        rw.badges.length ? h('div', { class: 'kc-badge-row' }, rw.badges.map(function (id) { return badgeTile(badgeById(id), { isNew: true }); })) : null,
        rw.levelUp ? h('div', { class: 'kc-levelup', role: 'status' }, t('reward.levelup', { level: t(rw.levelUp.nameKey) })) : null));
      a.appendChild(KC.primary(t('reward.home'), function () { KC.go('home'); }));
      root.appendChild(a);
    }
  });

  /* 12 --------------------------------------------------------------- Wallet */
  screen({
    id: 'wallet', title: 'Wallet', audience: 'child', band: 'b4_6', next: 'home',
    narration: ['wallet.say'], components: ['coin-counter', 'illustration', 'bar-chart', 'primary-button', 'bottom-nav'],
    notes: 'Coins are shown as the region\'s coin picture + a number (never a price). History mixes example data with this session.',
    render: function (root) {
      var s = KC.state;
      root.appendChild(titleRow('wallet.title', 'wallet.say'));
      root.appendChild(h('p', { class: 'kc-caption kc-muted', 'data-currency-label': true }, KC.currencyLabel()));
      root.appendChild(h('div', { class: 'kc-panel' },
        h('div', { class: 'kc-panel-item', 'data-component': 'illustration' }, KC.img('icons/wallet-jar.svg'), h('span', { class: 'kc-label' }, t('wallet.coins')), KC.money(s.coins, { size: 'md' })),
        h('div', { class: 'kc-panel-item', 'data-component': 'illustration' }, KC.img('icons/save.svg'), h('span', { class: 'kc-label kc-positive' }, t('wallet.savings')), KC.money(s.savings, { size: 'md' }))));
      var all = s.events.concat(KC.data.walletHistory);
      var cats = [['missions', 'goal-coins', ''], ['daily', 'sun-daily', ''], ['bonus', 'badge-first-coins', ''], ['treats', 'treat-sticker', 'is-out'], ['savings', 'save', 'is-saved']];
      var sums = {}; all.forEach(function (e) { sums[e.category] = (sums[e.category] || 0) + e.amount; });
      var max = Math.max.apply(null, cats.map(function (c) { return sums[c[0]] || 0; }).concat([1]));
      root.appendChild(h('div', { 'data-component': 'bar-chart', role: 'img', 'aria-label': t('wallet.chart') },
        h('p', { class: 'kc-label' }, t('wallet.chart')),
        cats.map(function (c) {
          var v = sums[c[0]] || 0;
          return h('div', { class: 'kc-bar' }, KC.img('icons/' + c[1] + '.svg', t('cat.' + c[0])),
            h('div', { class: 'kc-bar-track' }, h('div', { class: 'kc-bar-fill ' + c[2], style: 'width:' + Math.round(100 * v / max) + '%' })),
            KC.money(v));
        })));
      root.appendChild(h('ul', { class: 'kc-history', 'aria-label': 'History' }, all.slice(0, 8).map(function (e) {
        var when = e.daysAgo === 0 ? t('today') : (e.daysAgo === 1 ? t('yesterday') : t('days_ago', { n: e.daysAgo }));
        var out = e.kind === 'spend' || e.kind === 'save';
        return h('li', { 'data-component': 'illustration' }, KC.img('icons/' + e.icon + '.svg'),
          h('div', { class: 'kc-grow' }, h('div', { class: 'kc-label' }, t(e.labelKey)), h('div', { class: 'kc-caption kc-muted' }, when)),
          KC.money(out ? -e.amount : e.amount, { sign: true }));
      })));
      root.appendChild(KC.primary(t('reward.home'), function () { KC.go('home'); }));
    }
  });

  /* 13 --------------------------------------------------------------- Progress */
  screen({
    id: 'progress', title: 'Progress', audience: 'child', band: 'b4_6', next: 'mission-intro',
    narration: ['progress.say'], components: ['level-path-node', 'badge-tile', 'xp-bar', 'primary-button', 'bottom-nav'],
    notes: 'The level path is a market road with stalls (a pattern, not a copy of any reference layout).',
    render: function (root) {
      var s = KC.state, cur = KC.levelFor(s.xp);
      root.appendChild(titleRow('progress.title', 'progress.say'));
      root.appendChild(h('div', { class: 'kc-path', 'aria-label': 'Level path' }, KC.data.levels.map(function (l) {
        var state = l.n < cur.n ? 'is-done' : (l.n === cur.n ? 'is-current' : 'is-locked');
        return h('div', { 'data-component': 'level-path-node', class: state, 'aria-label': 'Level ' + l.n + ': ' + t(l.nameKey) + (state === 'is-locked' ? ' (locked)' : '') },
          h('span', { class: 'kc-node' }, state === 'is-locked' ? KC.img('icons/lock.svg') : String(l.n)),
          h('span', { class: 'kc-label' }, t(l.nameKey)));
      })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.badges')));
      root.appendChild(h('div', { class: 'kc-badge-grid' }, KC.data.badges.map(function (b) { return badgeTile(b); })));
      root.appendChild(h('h2', { class: 'kc-label' }, t('progress.pillars')));
      root.appendChild(h('div', { class: 'kc-stack', style: 'gap:var(--kc-space-2)' }, ['know', 'understand', 'decide', 'invest', 'share'].map(function (p) {
        var v = Math.round(100 * s.pillars[p]);
        return h('div', { class: 'kc-pillar', 'data-component': 'xp-bar', 'aria-label': t('pillar.' + p) + ' ' + v + '%' },
          h('span', { class: 'kc-label' }, t('pillar.' + p)),
          h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + v + '%' })));
      })));
      root.appendChild(KC.primary(t('home.continue'), function () { KC.go('mission-intro'); }));
    }
  });

  KC.start();
})();
