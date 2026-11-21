/* KudiCubs prototype — 005 child screens beyond The Lost Coins (loaded after screens.js, classic script):
   the band-mission engine (7–9 m7-*, 10–12 m10-*, 13–15 m13-*), daily challenge, level-up, badge detail and profile.
   Mission numbers and steps come from assets/missions/band-*.js; words from mock-data.js; spoken lines from lines.json.
   Same rules as every child screen: one main action, no dead end, ≥ 48 px targets, nothing earned is ever taken away.
   Band rules (docs/design/age-band-rules.md): 7–9 plays its prompt by itself, 10–15 plays on tap; a poor result is
   explained without judging and offers Try again first; Reward alone grants anything (a retry loses nothing). */
(function () {
  'use strict';
  var KC = window.KC;
  if (!KC || !KC.h || !KC.screens || !KC.missions) return;          // a file before this one failed to load: the boot guard shows the panel
  var h = KC.h, t = KC.t;

  function actions() { return h('div', { class: 'kc-actions' }); }
  function screen(def) { KC.screens[def.id] = def; KC.order.push(def.id); }
  function M(id) { return KC.missions[id]; }
  function extend(a, b) { Object.keys(b).forEach(function (k) { a[k] = b[k]; }); return a; }

  /* The choices made so far in this run. A reviewer jump or a deep link into a later screen falls back to the mission's demo choices. */
  function runSel(mid) { return KC.run.active && KC.run.mission === mid ? KC.run.sel : {}; }
  function fullSel(m, variant) {
    var s = runSel(m.id);
    return m.steps.every(function (st) { return s[st.key]; }) ? s : extend({}, m.demo[variant || 'poor']);
  }
  KC.seedRun = function (mid, id) {
    var m = M(mid), s = extend({}, m.demo[/-result$/.test(id) ? 'poor' : 'good']);
    KC.run.sel = s; KC.run.score = m.evaluate(s);
  };
  function evalNow(m) {
    if (KC.run.active && KC.run.mission === m.id && KC.run.score) return KC.run.score;
    return m.evaluate(fullSel(m, 'poor'));
  }

  function factRow(list, sel) {
    return h('div', { class: 'kc-panel kc-facts', 'data-component': 'illustration' }, list.map(function (f) {
      return h('div', { class: 'kc-panel-item', 'data-fact': f.labelKey },
        KC.img('icons/' + f.icon + '.svg'), h('span', { class: 'kc-label' }, t(f.labelKey, f.vars)),
        f.money !== undefined ? KC.money(f.money) : h('span', { class: 'kc-label' }, f.textFn ? f.textFn(sel) : f.text));
    }));
  }
  function optionCard(o) {
    var main = o.money !== undefined ? KC.money(o.money) : h('span', null, t(o.labelKey, o.vars));
    return h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': 'false', 'data-choice': o.id,
                         'aria-label': o.money !== undefined ? o.money + ' ' + t(o.money === 1 ? 'coin.one' : 'coin.many') : null },
      KC.img('icons/' + o.icon + '.svg'),
      h('span', { class: 'kc-opt-text' }, h('span', { class: 'kc-opt-head' }, main, o.cost !== undefined ? KC.money(o.cost) : null),
        o.subKey ? h('span', { class: 'kc-choice-sub' }, t(o.subKey, o.vars)) : null));
  }
  function rowItem(r) {
    return h('li', { 'data-component': 'illustration', 'data-row': r.labelKey },
      KC.img('icons/' + r.icon + '.svg'),
      h('div', { class: 'kc-grow' }, h('div', { class: 'kc-label' }, t(r.labelKey)), r.sub ? h('div', { class: 'kc-caption kc-muted' }, t(r.sub.key, r.sub.vars)) : null),
      r.text !== undefined ? h('span', { class: 'kc-label' }, r.text) : KC.money(r.n, { sign: true }));
  }

  /* ---- one mission = intro, its steps, result, summary (then Reward) */
  function buildMission(m) {
    var routes = KC.MISSIONS[m.id], resultId = m.id + '-result', summaryId = m.id + '-summary';
    var last = m.steps[m.steps.length - 1];

    screen({
      id: m.id + '-intro', title: t(m.titleKey) + ': intro', audience: 'child', band: m.band, pose: 'wave', next: m.steps[0].route,
      narration: [m.intro.line], notes: 'Start of the ' + m.band.replace('_', '–').replace('b', 'ages ') + ' mission. Mission data: assets/missions/. Nothing is granted until Reward.',
      render: function (root) {
        var a = actions();
        root.appendChild(h('h1', { class: 'kc-title kc-center' }, t(m.titleKey)));
        root.appendChild(KC.illustration(m.scene, t(/stall/.test(m.scene) ? 'a11y.market_stall' : 'a11y.market_scene'), 'kc-scene'));
        root.appendChild(KC.kudi('wave', { say: m.intro.line, size: 'sm' }));
        root.appendChild(factRow(m.intro.facts, {}));
        a.appendChild(KC.primary(t('intro.start'), function () { KC.resetRun(m.id); KC.go(m.steps[0].route); }));
        root.appendChild(a);
      }
    });

    m.steps.forEach(function (st, i) {
      var nextRoute = i === m.steps.length - 1 ? resultId : m.steps[i + 1].route;
      screen({
        id: st.route, title: t(m.titleKey) + ': ' + st.key, audience: 'child', band: m.band, pose: 'wave', next: nextRoute,
        narration: [st.line, st.hint],
        notes: 'Pick one of three. Every choice is playable; the result explains what happened. Prompt ' + (m.band === 'b7_9' ? 'plays by itself.' : 'plays when tapped.'),
        render: function (root) {
          var a = actions(), s = KC.run.mission === m.id ? KC.run.sel : {};
          if (st.kudi) root.appendChild(KC.kudi('wave', { say: st.line, size: 'sm' }));
          else root.appendChild(h('div', { class: 'kc-ask' }, h('p', { class: 'kc-child-text' }, KC.lineText(st.line)), KC.speakerCue(st.line)));
          var weeks = null;
          if (st.weeks) {                                               // light time cue (10–12): weeks 1 to 4; it never ends or fails the round
            weeks = h('div', { class: 'kc-weeks', 'data-component': 'progress-dots', 'data-weeks': '0', role: 'img', 'aria-label': t('m10.weeks') },
              [1, 2, 3, 4].map(function (n) { return h('span', { class: 'kc-week kc-caption' }, t('m10.week', { n: n })); }));
            root.appendChild(weeks);
          }
          root.appendChild(factRow(st.factsFn(s), s));
          var grid = h('div', { class: 'kc-choice-list', 'data-primary-group': true, role: 'radiogroup', 'aria-label': t(st.promptKey) });
          var opts = st.options(), cards = [];
          function go() {
            var chosen = KC.run.sel;
            if (st === last) {
              KC.run.score = m.evaluate(extend(extend({}, fullSel(m, 'good')), chosen));
              KC.go(resultId);
            } else KC.go(nextRoute);
          }
          function promote() {
            KC.promoteOnce(grid, t(st.goKey || 'next'), go, a);
          }
          opts.forEach(function (o) {
            var c = optionCard(o);
            KC.childAction(c, 'answer', function () {
              if (KC.run.mission !== m.id || !KC.run.active) { KC.resetRun(m.id); KC.run.reached = routes.indexOf(st.route); }
              KC.markSelected(cards, c);
              KC.run.sel[st.key] = o.id;
              KC.kudiReact('correct');
              if (weeks) {
                var spans = weeks.querySelectorAll('.kc-week');
                spans.forEach(function (sp) { sp.classList.remove('is-on'); });
                [0, 1, 2, 3].forEach(function (k) { setTimeout(function () { if (spans[k]) spans[k].classList.add('is-on'); weeks.setAttribute('data-weeks', String(k + 1)); }, 180 * (k + 1)); });
              }
              promote();
            });
            cards.push(c);
            grid.appendChild(c);
          });
          root.appendChild(grid);
          root.appendChild(a);
          if (s[st.key]) {                                              // coming back with a choice already made
            var back = cards[opts.map(function (o) { return o.id; }).indexOf(s[st.key])];
            if (back) { KC.markSelected(cards, back); promote(); }
          }
        }
      });
    });

    screen({
      id: resultId, title: t(m.titleKey) + ': result', audience: 'child', band: m.band, pose: 'celebrate', next: summaryId,
      narration: function () { return [evalNow(m).line]; },
      notes: 'A poor outcome is explained, not judged, and Try again comes first; nothing earned is removed (Reward alone grants anything).',
      render: function (root) {
        var e = evalNow(m), poor = e.score === 'poor', a = actions();
        root.appendChild(KC.kudi(poor ? 'wave' : 'celebrate', { say: e.line, size: 'sm' }));
        root.appendChild(h('h1', { class: 'kc-title', 'data-result': e.score }, t(e.titleKey)));
        root.appendChild(h('ul', { class: 'kc-rows', 'aria-label': t('a11y.result_rows') }, e.rows.map(rowItem)));
        root.appendChild(h('div', { class: 'kc-meter', 'data-component': 'xp-bar', 'data-value': e.meter.value, 'aria-label': t(e.meter.labelKey) + ' ' + e.meter.value + '/' + e.meter.max },
          h('span', { class: 'kc-label' }, t(e.meter.labelKey)),
          h('div', { class: 'kc-xp-track' }, h('div', { class: 'kc-xp-fill', style: 'width:' + Math.min(100, Math.round(100 * e.meter.value / e.meter.max)) + '%' }))));
        root.appendChild(h('p', { class: 'kc-child-text' }, t(e.explainKey)));
        function retry() { KC.run.sel = {}; KC.run.score = null; KC.go(m.retryTo, { replace: true }); }
        function onward() { KC.go(summaryId, { replace: true }); }                // Back skips the result, like Result 4–6 (FR-004)
        if (poor) {
          a.appendChild(KC.primary(t('m.try_again'), retry, { icon: 'replay' }));
          a.appendChild(KC.secondary(t('m.keep_result'), onward));
        } else {
          a.appendChild(KC.primary(t('next'), onward));
          a.appendChild(KC.secondary(t('m.try_other'), retry));
        }
        root.appendChild(a);
      }
    });

    screen({
      id: summaryId, title: t(m.titleKey) + ': summary', audience: 'child', band: m.band, pose: 'celebrate', next: 'reward',
      narration: [m.summary.line],
      notes: 'What the child learned, in three short lines. Next goes to Reward, which is the only place anything is granted.',
      render: function (root) {
        var e = evalNow(m), a = actions();
        root.appendChild(KC.kudi('celebrate', { say: m.summary.line, size: 'sm' }));
        root.appendChild(h('h1', { class: 'kc-title' }, t(e.titleKey)));
        root.appendChild(h('ul', { class: 'kc-rows', 'aria-label': t('a11y.learned') }, m.summary.tiles.map(function (tile) {
          return h('li', { 'data-component': 'illustration' }, KC.img('icons/' + tile.icon + '.svg'), h('p', { class: 'kc-child-text kc-grow' }, t(tile.textKey)));
        })));
        a.appendChild(KC.primary(t('next'), function () { KC.run.pendingReward = true; KC.go('reward'); }));
        root.appendChild(a);
      }
    });
  }
  ['m7', 'm10', 'm13'].forEach(function (id) { buildMission(M(id)); });

  /* ---- Reward for the band missions (called by the Reward screen in screens.js).
     First completion: coins, XP, badge, pillars, plus a small bonus for a strong result. Replay: XP only. A poor result
     still earns the first-completion reward: nothing is judged and nothing is removed (Constitution III). */
  KC.bandReward = function (mid) {
    var m = M(mid), cfg = m.reward, replay = KC.completedOnce(mid), list = [], r = { coins: 0, xp: 0, badges: [], replay: replay };
    var mk = function (e) { e.mission = mid; return e; };
    if (!replay) {
      r.coins += cfg.coins; r.xp += cfg.xp; r.badges.push(cfg.badge);
      list.push(mk({ t: 'earn', n: cfg.coins, label: 'history.' + mid }), mk({ t: 'xp', n: cfg.xp, label: 'xp' }), mk({ t: 'badge', label: 'badge', badge: cfg.badge }));
      if (KC.run.score && KC.run.score.score === 'great') {
        r.coins += cfg.bonusCoins; list.push(mk({ t: 'bonus', n: cfg.bonusCoins, label: 'history.band_bonus' }));
      }
      Object.keys(cfg.pillars).forEach(function (p) { list.push(mk({ t: 'pillar', n: cfg.pillars[p], label: 'pillar', pillar: p })); });
      list.push(mk({ t: 'mission_done', label: 'mission' }));
    } else {
      r.xp += cfg.replayXp;
      list.push(mk({ t: 'xp', n: cfg.replayXp, label: 'xp' }), mk({ t: 'mission_replay', label: 'mission' }));
    }
    return { list: list, reward: r };
  };

  /* ---- daily challenge ------------------------------------------------------------------------------------ */
  screen({
    id: 'daily-challenge', title: 'Daily challenge', audience: 'child', band: 'auto', pose: 'wave', next: 'home',
    narration: function () { return [KC.view().daily.progress >= KC.view().daily.goal ? 'dailych.done' : 'dailych.say']; },
    notes: 'Today\'s market day: play missions to light three suns. The bonus is paid once a day. Missing a day costs nothing.',
    render: function (root) {
      var d = KC.view().daily, done = d.progress >= d.goal, a = actions();
      root.appendChild(KC.kudi(done ? 'celebrate' : 'wave', { say: done ? 'dailych.done' : 'dailych.say', size: 'sm' }));
      root.appendChild(KC.hear(h('div', { 'data-component': 'streak-daily', 'data-daily': d.progress, 'aria-label': t('a11y.daily', { n: d.progress, goal: d.goal }) },
        KC.img('icons/sun-daily.svg'),
        h('div', { class: 'kc-stack kc-grow kc-tight' }, h('span', { class: 'kc-title' }, t('daily.title')),
          h('div', { class: 'kc-dots' }, [0, 1, 2].map(function (i) { return h('span', { class: 'kc-dot' + (i < d.progress ? ' is-on' : '') }); })),
          h('span', { class: 'kc-caption kc-muted' }, t('dailych.count', { n: d.progress, goal: d.goal }))),
        KC.money(d.rewardCoins, { sign: true })), done ? 'dailych.done' : 'dailych.say'));
      root.appendChild(h('div', { class: 'kc-panel', 'data-component': 'illustration', 'data-daily-task': true },
        KC.img('icons/' + M(KC.bandMission() === 'lost-coins' ? 'm7' : KC.bandMission()).icon + '.svg'),
        h('p', { class: 'kc-child-text kc-grow' }, t(done ? 'dailych.done_text' : 'dailych.task', { mission: t(KC.missionTitleKey()) }))));
      a.appendChild(done ? KC.primary(t('nav.back_home'), function () { KC.go('home'); })
                         : KC.primary(t('home.continue') + ' · ' + t(KC.missionTitleKey()), function () { KC.go(KC.introRoute()); }));
      root.appendChild(a);
    }
  });
  KC.missionTitleKey = function () { var b = KC.bandMission(); return b === 'lost-coins' ? 'home.mission' : M(b).titleKey; };

  /* ---- level-up ----------------------------------------------------------------------------------------- */
  screen({
    id: 'level-up', title: 'Level up', audience: 'child', band: 'auto', pose: 'celebrate', next: 'home',
    narration: function () { return ['levelup.say']; },
    notes: 'Shown after a Reward that crosses a level. Opened without one, it simply shows the current level.',
    render: function (root) {
      var v = KC.view(), lv = v.level, nx = KC.nextLevel(v.xp), a = actions();
      var line = lv.n > 1 ? 'reward.levelup.' + lv.nameKey.split('.')[1] : 'levelup.say';
      root.appendChild(KC.kudi('celebrate', { say: 'levelup.say', size: 'md' }));
      root.appendChild(KC.hear(h('div', { class: 'kc-level-hero', 'data-component': 'action-result', role: 'status' },
        h('div', { class: 'kc-level-big', 'aria-hidden': 'true' }, String(lv.n)),
        h('h1', { class: 'kc-title', 'data-level-name': true }, t(lv.nameKey)),
        h('span', { class: 'kc-label' }, v.xp + ' XP'),
        nx ? h('span', { class: 'kc-caption kc-muted' }, t('home.next', { level: t(nx.nameKey) })) : h('span', { class: 'kc-caption kc-muted' }, t('levelup.top'))), line, 'celebrate'));
      setTimeout(function () { if (KC.current && KC.current.id === 'level-up') { KC.celebrate(); KC.sfx('sparkle'); } }, 150);
      a.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* ---- badge detail ------------------------------------------------------------------------------------- */
  var BADGE_HOW = { 'badge.first_coins': 'how.first_coins', 'badge.kind_friend': 'how.kind_friend', 'badge.early_bird': 'how.early_bird', 'badge.hard_worker': 'how.hard_worker',
    'badge.smart_sorter': 'how.smart_sorter', 'badge.smart_saver': 'how.smart_saver', 'badge.market_explorer': 'how.market_explorer', 'badge.pride_star': 'how.pride_star' };
  screen({
    id: 'badge-detail', title: 'Badge detail', audience: 'child', band: 'auto', pose: 'wave', next: 'progress',
    narration: function () { return ['badgedet.say']; },
    notes: 'One badge at a time: earned, or how to earn it. Tap another badge below to see it. A locked badge is never a penalty.',
    render: function (root) {
      var v = KC.view(), a = actions();
      var id = KC.state.viewBadge || v.badges[v.badges.length - 1] || KC.data.badges[0].id;
      var b = KC.data.badges.filter(function (x) { return x.id === id; })[0] || KC.data.badges[0], earned = v.badges.indexOf(b.id) !== -1;
      root.appendChild(KC.kudi(earned ? 'celebrate' : 'wave', { say: 'badgedet.say', size: 'sm' }));
      root.appendChild(h('div', { class: 'kc-level-hero', 'data-component': 'action-result', 'data-badge-state': earned ? 'earned' : 'locked' },
        h('div', { class: 'kc-badge-row' }, h('div', { class: 'kc-badge' + (earned ? '' : ' is-locked'), 'data-component': 'badge-tile', 'aria-label': t(b.nameKey) + (earned ? '' : ' ' + t('a11y.not_earned')) }, KC.img('icons/' + b.icon + '.svg'))),
        h('h1', { class: 'kc-title', 'data-badge-name': b.id }, t(b.nameKey)),
        KC.hear(h('p', { class: 'kc-child-text' }, t(earned ? 'badgedet.earned' : 'badgedet.locked')), earned ? 'badgedet.earned' : 'badgedet.locked'),
        h('p', { class: 'kc-child-text', 'data-badge-how': true }, t(BADGE_HOW[b.id]))));
      var pick = h('div', { class: 'kc-badge-pick', role: 'radiogroup', 'aria-label': t('progress.badges') });
      KC.data.badges.forEach(function (x) {
        var tile = h('button', { 'data-component': 'choice-card', role: 'radio', 'aria-checked': String(x.id === b.id), 'data-badge': x.id, 'aria-label': t(x.nameKey) + (v.badges.indexOf(x.id) === -1 ? ' ' + t('a11y.not_earned') : ''),
                                 class: v.badges.indexOf(x.id) === -1 ? 'is-locked' : '' }, KC.img('icons/' + x.icon + '.svg'));
        KC.childAction(tile, 'answer', function () { KC.state.viewBadge = x.id; KC.render('badge-detail'); }, { say: x.id });
        pick.appendChild(tile);
      });
      root.appendChild(pick);
      a.appendChild(KC.primary(t('progress.title'), function () { KC.go('progress', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* ---- profile ------------------------------------------------------------------------------------------ */
  function switchButton(icon, labelKey, on, onChange, attr) {
    var b = h('button', { class: 'kc-switch', role: 'switch', 'aria-checked': String(!!on), 'data-component': 'choice-card', 'data-switch': attr },
      KC.img('icons/' + icon + '.svg'), h('span', { class: 'kc-label kc-grow' }, t(labelKey)), h('span', { class: 'kc-label', 'data-switch-state': true }, t(on ? 'profile.on' : 'profile.off')));
    KC.childAction(b, 'answer', function () {
      var now = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(now));
      b.querySelector('[data-switch-state]').textContent = t(now ? 'profile.on' : 'profile.off');
      onChange(now);
    }, { sfx: false });
    return b;
  }
  screen({
    id: 'profile', title: 'Profile', audience: 'child', band: 'auto', pose: 'wave', next: 'home',
    narration: ['profile.say'],
    notes: 'The child\'s own page: friend, nickname, level, and the sound and narration switches. Captions stay on whatever the switches say. "For grown-ups" leads to the gate.',
    render: function (root) {
      var s = KC.state, v = KC.view(), lv = v.level, a = actions();
      root.appendChild(h('div', { class: 'kc-profile-row' },
        h('div', { class: 'kc-illustration kc-avatar-sm', 'data-component': 'illustration' }, KC.img('avatars/' + s.avatarId + '.svg', t('a11y.your_friend'))),
        h('div', { class: 'kc-stack kc-grow kc-tight' },
          h('h1', { class: 'kc-title', 'data-nickname': true }, s.nickname ? t('home.hi', { name: s.nickname }) : t('home.hi_friend')),
          KC.hear(h('span', { 'data-component': 'level-badge', 'data-stat': 'level' }, h('span', { class: 'kc-level-n' }, String(lv.n)), t(lv.nameKey)), lv.n > 0 ? 'level.' + lv.nameKey.split('.')[1] : 'profile.say'),
          h('span', { class: 'kc-caption kc-muted', 'data-band-label': s.band || 'b4_6' }, t('band.' + (s.band || 'b4_6'))))));
      root.appendChild(KC.kudi('wave', { say: 'profile.say', size: 'sm' }));
      root.appendChild(h('div', { class: 'kc-stack kc-tight', 'data-component': 'illustration' },
        switchButton('speaker', 'profile.sound', s.sound, function (on) { s.sound = on; KC.savePrefs(); if (!on) KC.voice.stop(); }, 'sound'),
        switchButton('thumbs-answer', 'profile.narration', s.narration !== false, function (on) { s.narration = on; KC.savePrefs(); if (!on) KC.voice.stop(); }, 'narration')));
      root.appendChild(h('p', { class: 'kc-caption kc-muted' }, t('profile.captions')));
      root.appendChild(KC.secondary(t('profile.grownups'), function () { KC.parent.intent = true; KC.go('parent-gate'); }));
      a.appendChild(KC.primary(t('nav.back_home'), function () { KC.go('home'); }));
      root.appendChild(a);
    }
  });
})();
