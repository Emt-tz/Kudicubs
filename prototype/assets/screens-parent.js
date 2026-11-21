/* KudiCubs prototype — 005 parent area on the phone (spec 005 FR-010; grown-up space, text allowed). Classic script, loaded
   after screens.js. Everything here sits behind the parent gate (hold, maths, PIN): the guard in app.js (G8) sends any
   child route or typed id back to Home. Visit state only (KC.parent): the PIN, the one-time code and anything typed are
   dropped at once and never stored or sent (004 FR-028). Fictional family data only; no real email or name.
   Demo values (PIN 2580, code 123456, the masked email) live in KC.data.demo. */
(function () {
  'use strict';
  var KC = window.KC;
  if (!KC || !KC.h || !KC.screens || !KC.data.demo) return;
  var h = KC.h, t = KC.t, D = KC.data.demo;

  function actions() { return h('div', { class: 'kc-actions' }); }
  function screen(def) { def.audience = 'parent'; def.narration = []; KC.screens[def.id] = def; KC.order.push(def.id); }
  function title(key, vars) { return h('h1', { class: 'kc-title' }, t(key, vars)); }
  function para(key, vars) { return h('p', { class: 'kc-child-text' }, t(key, vars)); }
  function note(key, vars) { return h('p', { class: 'kc-caption kc-muted' }, t(key, vars)); }
  function msg() { return h('p', { class: 'kc-parent-msg', role: 'status', 'aria-live': 'polite' }); }
  function listButton(icon, labelKey, onClick, attr) {
    var b = h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-go': attr, onclick: onClick },
      icon ? KC.img('icons/' + icon + '.svg') : null, h('span', null, t(labelKey)));
    return b;
  }
  /* A radio group of text cards (choices for a grown-up). */
  function radios(label, items, current, onPick, attr) {
    var wrap = h('div', { class: 'kc-region-pick', 'data-component': 'illustration', role: 'radiogroup', 'aria-label': label });
    items.forEach(function (it) {
      var b = h('button', { role: 'radio', 'aria-checked': String(it.value === current), onclick: function () {
        wrap.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        onPick(it.value);
      } }, it.pic || null, h('span', { class: 'kc-grow' }, h('strong', null, it.label), it.sub ? h('span', { class: 'kc-caption kc-muted kc-block' }, it.sub) : null));
      b.setAttribute('data-' + attr, it.value);
      wrap.appendChild(b);
    });
    return wrap;
  }
  function parentSwitch(labelKey, on, onChange, attr) {
    var b = h('button', { class: 'kc-switch kc-btn kc-btn--secondary', role: 'switch', 'aria-checked': String(!!on), 'data-component': 'secondary-button', 'data-switch': attr },
      h('span', { class: 'kc-grow' }, t(labelKey)), h('span', { 'data-switch-state': true }, t(on ? 'profile.on' : 'profile.off')));
    b.addEventListener('click', function () {
      var now = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', String(now));
      b.querySelector('[data-switch-state]').textContent = t(now ? 'profile.on' : 'profile.off');
      onChange(now);
    });
    return b;
  }
  function stillHere(id) { return KC.current && KC.current.id === id; }

  /* ---- the family: the real player first, then two fictional children (shared/sample-family.json), then any added here */
  KC.parentChildren = function () {
    var v = KC.view(), s = KC.state;
    var me = { live: true, nickname: s.nickname || t('parent.your_child'), band: s.band || 'b4_6', region: s.region, avatarId: s.avatarId,
               coins: v.coins, savings: v.savings, xp: v.xp, levelKey: v.level.nameKey, levelN: v.level.n, badges: v.badges.length,
               play: v.history.slice(0, 3).map(function (e) { return { when: e.daysAgo, text: t(e.labelKey) }; }) };
    var fam = KC.data.family.children.map(function (c) { return { live: false, nickname: c.nickname, band: c.band, region: c.region, avatarId: c.avatarId,
      coins: c.coins, savings: c.savings, xp: c.xp, levelKey: c.levelKey, levelN: c.levelN, badges: c.badges, play: c.play }; });
    return [me].concat(fam, KC.parent.added);
  };
  function childAvatar(c) { return KC.img('avatars/' + c.avatarId + '.svg'); }

  /* 1 ---- parent-home */
  screen({
    id: 'parent-home', title: 'Parent: your family', next: 'home',
    notes: 'Behind the gate and PIN. Children list first; settings, region, device mode, sign-out and delete below. Back to play re-locks the area.',
    render: function (root) {
      var a = actions();
      root.appendChild(title('parent.home_title'));
      root.appendChild(note('parent.home_sub'));
      var list = h('div', { class: 'kc-plist', role: 'list', 'aria-label': t('parent.children') });
      KC.parentChildren().forEach(function (c, i) {
        list.appendChild(h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-child-row': c.nickname, role: 'listitem',
          onclick: function () { KC.parent.childIdx = i; KC.go('parent-child'); } },
          childAvatar(c), h('span', { class: 'kc-grow' }, h('strong', null, c.nickname), h('span', { class: 'kc-caption kc-muted kc-block' }, t('band.' + c.band) + ' · ' + KC.regions[c.region].name))));
      });
      root.appendChild(list);
      root.appendChild(h('div', { class: 'kc-plist' },
        listButton('check', 'parent.add_child', function () { KC.go('parent-add-child'); }, 'add-child'),
        listButton('path', 'parent.settings', function () { KC.go('parent-settings'); }, 'settings'),
        listButton('wallet-jar', 'parent.region', function () { KC.go('parent-region'); }, 'region'),
        listButton('lock', 'parent.device_mode', function () { KC.go('parent-device-mode'); }, 'device-mode'),
        listButton('back', 'parent.sign_out', function () {
          KC.parent.signedIn = false; KC.parent.unlocked = false; KC.parent.gated = true;
          KC.go('parent-signed-out', { replace: true });
        }, 'sign-out'),
        listButton('close', 'parent.delete', function () { KC.go('parent-delete'); }, 'delete')));
      a.appendChild(KC.primary(t('parent.back_play'), function () { KC.go('home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 2 ---- parent-child (one child's progress) */
  screen({
    id: 'parent-child', title: 'Parent: one child', next: 'parent-home',
    notes: 'One child\'s progress in numbers and words: coins, savings, level, badges and recent play. Only nicknames are shown.',
    render: function (root) {
      var kids = KC.parentChildren(), c = kids[KC.parent.childIdx] || kids[0], a = actions();
      root.appendChild(h('div', { class: 'kc-row' }, h('div', { class: 'kc-illustration kc-avatar-sm', 'data-component': 'illustration' }, childAvatar(c)),
        h('div', { class: 'kc-stack kc-grow kc-tight' }, h('h1', { class: 'kc-title', 'data-child-name': true }, c.nickname),
          h('span', { class: 'kc-caption kc-muted' }, t('band.' + c.band) + ' · ' + KC.regions[c.region].name))));
      var stat = function (labelKey, valueNode) { return h('div', { class: 'kc-stat-line' }, h('span', { class: 'kc-label' }, t(labelKey)), valueNode); };
      root.appendChild(h('div', { class: 'kc-pcard', 'data-component': 'illustration', 'data-child-stats': true },
        stat('wallet.coins', KC.money(c.coins, { region: c.region })),
        stat('wallet.savings', KC.money(c.savings)),
        stat('parent.level', h('span', { class: 'kc-label' }, c.levelN + ' · ' + t(c.levelKey) + ' · ' + c.xp + ' XP')),
        stat('progress.badges', h('span', { class: 'kc-label' }, String(c.badges)))));
      root.appendChild(h('h2', { class: 'kc-label' }, t('parent.recent')));
      var recent = c.play.length ? c.play.map(function (p) {
        var when = p.when === undefined ? p.ago : p.when;
        return h('li', { 'data-component': 'illustration' }, h('span', { class: 'kc-grow' }, h('strong', null, p.text || p.title), p.outcome ? h('span', { class: 'kc-caption kc-muted kc-block' }, p.outcome) : null),
          h('span', { class: 'kc-caption kc-muted' }, when === 0 ? t('today') : (when === 1 ? t('yesterday') : t('days_ago', { n: when }))));
      }) : [h('li', { 'data-component': 'illustration' }, h('span', { class: 'kc-caption kc-muted' }, t('parent.no_play')))];
      root.appendChild(h('ul', { class: 'kc-rows' }, recent));
      if (c.live) root.appendChild(listButton('path', 'parent.settings', function () { KC.go('parent-settings'); }, 'settings'));
      a.appendChild(KC.primary(t('parent.back_family'), function () { KC.go('parent-home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 3 ---- parent-add-child (preset nicknames only: no free text, no real names) */
  screen({
    id: 'parent-add-child', title: 'Parent: add a child', next: 'parent-home',
    notes: 'Pick a nickname from the list (the prototype never takes a real name), an age band and a region. The child appears in the family list for this visit.',
    render: function (root) {
      var a = actions(), used = KC.parentChildren().map(function (c) { return c.nickname; });
      var free = KC.data.nicknames.filter(function (n) { return used.indexOf(n) === -1; });
      var pick = { nickname: free[0] || null, band: 'b7_9', region: KC.state.region }, m = msg();
      root.appendChild(title('parent.add_title'));
      root.appendChild(note('parent.add_sub'));
      if (!free.length) { root.appendChild(para('parent.add_full')); }
      else {
        root.appendChild(h('h2', { class: 'kc-label' }, t('parent.nickname')));
        root.appendChild(radios(t('parent.nickname'), free.map(function (n) { return { value: n, label: n }; }), pick.nickname, function (v) { pick.nickname = v; }, 'nick'));
      }
      root.appendChild(h('h2', { class: 'kc-label' }, t('parent.band')));
      root.appendChild(radios(t('parent.band'), KC.BANDS.map(function (b) { return { value: b, label: t('band.' + b) }; }), pick.band, function (v) { pick.band = v; }, 'band'));
      root.appendChild(h('h2', { class: 'kc-label' }, t('parent.region')));
      root.appendChild(radios(t('parent.region'), Object.keys(KC.regions).map(function (c) { return { value: c, label: KC.regions[c].name, pic: KC.coinImg(KC.regions[c].coinIcon, { region: c }) }; }),
        pick.region, function (v) { pick.region = v; }, 'region-choice'));
      root.appendChild(m);
      var add = KC.primary(t('parent.add_go'), function () {
        if (!pick.nickname) { m.textContent = t('parent.add_full'); return; }
        KC.parent.added.push({ live: false, nickname: pick.nickname, band: pick.band, region: pick.region, avatarId: KC.data.avatars[KC.parent.added.length % 4],
          coins: 0, savings: 0, xp: 0, levelKey: KC.data.levels[0].nameKey, levelN: 1, badges: 0, play: [] });
        KC.go('parent-home', { replace: true });
      });
      a.appendChild(add);
      root.appendChild(a);
    }
  });

  /* 4 ---- parent-settings (age band, sound, narration for the child playing on this phone) */
  screen({
    id: 'parent-settings', title: 'Parent: settings', next: 'parent-home',
    notes: 'Age band, sound and narration. Changing the age band changes the missions only: coins, XP and badges already earned stay.',
    render: function (root) {
      var s = KC.state, a = actions(), m = msg();
      root.appendChild(title('parent.settings'));
      root.appendChild(note('parent.settings_for', { name: s.nickname || t('parent.your_child') }));
      root.appendChild(h('h2', { class: 'kc-label' }, t('parent.band')));
      root.appendChild(radios(t('parent.band'), KC.BANDS.map(function (b) { return { value: b, label: t('band.' + b), sub: t('band_desc.' + b) }; }), s.band || 'b4_6', function (v) {
        s.band = v; KC.store.save(); m.textContent = t('parent.band_saved');
      }, 'band'));
      root.appendChild(note('parent.band_keep'));
      root.appendChild(m);
      root.appendChild(h('div', { class: 'kc-stack kc-tight', 'data-component': 'illustration' },
        parentSwitch('profile.sound', s.sound, function (on) { s.sound = on; KC.savePrefs(); if (!on) KC.voice.stop(); }, 'sound'),
        parentSwitch('profile.narration', s.narration !== false, function (on) { s.narration = on; KC.savePrefs(); if (!on) KC.voice.stop(); }, 'narration')));
      root.appendChild(note('profile.captions'));
      root.appendChild(listButton('wallet-jar', 'parent.region', function () { KC.go('parent-region'); }, 'region'));
      a.appendChild(KC.primary(t('parent.back_family'), function () { KC.go('parent-home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 5 ---- parent-region (local coins and market examples) */
  screen({
    id: 'parent-region', title: 'Parent: region', next: 'parent-home',
    notes: 'Switching region changes the coin pictures and market examples everywhere. Coins are game coins, never real money.',
    render: function (root) {
      var a = actions(), s = KC.state;
      root.appendChild(title('parent.region'));
      root.appendChild(note('parent.region_sub'));
      root.appendChild(radios(t('gate.region'), Object.keys(KC.regions).map(function (c) {
        return { value: c, label: KC.regions[c].name, sub: KC.regions[c].currency.majorPlural, pic: KC.coinImg(KC.regions[c].coinIcon, { region: c }) };
      }), s.region, function (v) { KC.setRegion(v); }, 'region-choice'));
      var r = KC.region(), ex = r.marketExamples;
      root.appendChild(h('div', { class: 'kc-pcard', 'data-component': 'illustration', 'data-region-examples': r.code },
        h('span', { class: 'kc-label' }, t('parent.region_examples')),
        h('span', { class: 'kc-child-text' }, t('parent.region_line', { drink: ex.drink.label, snack: ex.snack.label, treat: ex.treat.label })),
        h('span', { class: 'kc-caption kc-muted', 'data-currency-label': true }, KC.currencyLabel())));
      root.appendChild(KC.regionCoinSet());
      a.appendChild(KC.primary(t('parent.back_family'), function () { KC.go('parent-home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* ---- a one-time-code block (sign-in on a new device and PIN recovery share it). The code is typed on a keypad,
     compared once and dropped. States: default · wrong · expired · resent · ok (data-otp-state). */
  function otpBlock(host, onOk) {
    var code = '', tries = 0, expiresAt = Date.now() + D.otpMs, m = msg(), left = h('p', { class: 'kc-caption kc-muted', 'data-otp-left': true });
    var box = h('div', { class: 'kc-stack', 'data-otp-state': 'default' });
    var dots = h('div', { class: 'kc-pin-dots', 'aria-label': t('a11y.code_of', { n: 0 }) }, [0, 1, 2, 3, 4, 5].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
    var check = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, disabled: true }, t('parent.check_code'));
    var resend = h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-go': 'resend' }, t('parent.resend'));
    function state(s) { box.setAttribute('data-otp-state', s); }
    function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < code.length); }); dots.setAttribute('aria-label', t('a11y.code_of', { n: code.length })); check.disabled = code.length !== 6; }
    function clock() {
      var ms = Math.max(0, expiresAt - Date.now()), sec = Math.ceil(ms / 1000);
      left.textContent = ms ? t('parent.code_valid', { m: Math.floor(sec / 60), s: String(sec % 60).padStart(2, '0') }) : t('parent.code_expired_short');
    }
    var timer = setInterval(function () { if (!box.isConnected) { clearInterval(timer); return; } clock(); }, 1000);
    clock();
    check.addEventListener('click', function () {
      var typed = code; code = ''; paint();                                // dropped at once
      if (Date.now() > expiresAt || tries >= D.maxTries) { state('expired'); m.textContent = t('parent.code_expired'); return; }
      if (typed === D.code) { state('ok'); clearInterval(timer); onOk(); return; }
      tries += 1;
      if (tries >= D.maxTries) { state('expired'); m.textContent = t('parent.code_toomany'); return; }
      state('wrong'); m.textContent = t('parent.code_wrong', { left: D.maxTries - tries });
    });
    resend.addEventListener('click', function () {
      code = ''; paint(); tries = 0; expiresAt = Date.now() + D.otpMs; clock();
      state('resent'); m.textContent = t('parent.code_resent');
    });
    var pad = KC.keypad('pin-pad', function (k) {
      if (k === 'del') code = code.slice(0, -1); else if (k === 'clear') code = ''; else if (code.length < 6) code += k;
      paint();
    });
    box.appendChild(para('parent.code_prompt', { email: D.email }));
    box.appendChild(left); box.appendChild(dots); box.appendChild(pad); box.appendChild(m); box.appendChild(check); box.appendChild(resend);
    host.appendChild(box);
    return box;
  }

  /* 6 ---- parent-signin (new device, one-time code) */
  screen({
    id: 'parent-signin', title: 'Parent: sign in', next: 'parent-device-mode',
    notes: 'New device: a one-time code goes to the family email (shown masked). Demo code 123456. States: default, wrong, expired, resent.',
    render: function (root) {
      var body = h('div', { class: 'kc-stack kc-grow' });
      root.appendChild(title('parent.signin_title'));
      root.appendChild(note('parent.signin_sub'));
      root.appendChild(body);
      var a = actions();
      var send = KC.primary(t('parent.send_code'), function () {
        body.innerHTML = '';
        otpBlock(body, function () {
          KC.parent.signedIn = true; KC.parent.unlocked = true; KC.parent.gated = true;
          KC.go('parent-device-mode', { replace: true });
        });
      });
      body.appendChild(h('p', { class: 'kc-child-text', 'data-email-masked': true }, D.email));
      body.appendChild(send);
      a.appendChild(KC.secondary(t('parent.back_play'), function () { KC.go('home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 7 ---- parent-pin-recover (reset a forgotten PIN with the same code) */
  screen({
    id: 'parent-pin-recover', title: 'Parent: reset PIN', next: 'parent-home',
    notes: 'Forgotten PIN: the same one-time code, then a new PIN (entered twice, then dropped). Demo code 123456.',
    render: function (root) {
      var body = h('div', { class: 'kc-stack kc-grow' }), a = actions();
      root.appendChild(title('parent.recover_title'));
      root.appendChild(note('parent.recover_sub'));
      root.appendChild(body);
      a.appendChild(KC.secondary(t('parent.back_play'), function () { KC.go('home', { replace: true }); }));
      function step1() {
        body.innerHTML = '';
        body.appendChild(h('p', { class: 'kc-child-text', 'data-email-masked': true }, D.email));
        body.appendChild(KC.primary(t('parent.send_code'), function () { body.innerHTML = ''; otpBlock(body, newPin); }));
      }
      function newPin() {
        body.innerHTML = '';
        var first = '', pin = '', stage = 0, m = msg();
        var dots = h('div', { class: 'kc-pin-dots' }, [0, 1, 2, 3].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
        var prompt = para('parent.newpin_prompt');
        var go = h('button', { class: 'kc-btn kc-btn--primary', 'data-component': 'primary-button', 'data-primary': true, disabled: true }, t('next'));
        function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < pin.length); }); go.disabled = pin.length !== 4; }
        go.addEventListener('click', function () {
          if (stage === 0) { first = pin; pin = ''; stage = 1; prompt.textContent = t('parent.newpin_again'); paint(); return; }
          var same = pin === first; pin = ''; first = ''; paint();
          if (!same) { stage = 0; prompt.textContent = t('parent.newpin_prompt'); m.textContent = t('gate.pin_mismatch'); return; }
          done();
        });
        var pad = KC.keypad('pin-pad', function (k) { m.textContent = ''; if (k === 'del') pin = pin.slice(0, -1); else if (k === 'clear') pin = ''; else if (pin.length < 4) pin += k; paint(); });
        body.appendChild(prompt); body.appendChild(dots); body.appendChild(pad); body.appendChild(m); body.appendChild(go);
      }
      function done() {
        KC.parent.locked = false; KC.parent.wrong = 0; KC.parent.lockUntil = 0; KC.parent.unlocked = true; KC.parent.gated = true;
        body.innerHTML = '';
        body.appendChild(h('div', { class: 'kc-pcard', 'data-component': 'illustration', 'data-recover-done': true }, h('strong', null, t('parent.recover_done')), note('parent.recover_demo')));
        body.appendChild(KC.primary(t('parent.open_family'), function () { KC.go('parent-home', { replace: true }); }));
      }
      step1();
      root.appendChild(a);
    }
  });

  /* 8 ---- parent-lockout (calm, with a way to recover and a way back to play) */
  screen({
    id: 'parent-lockout', title: 'Parent: PIN resting', next: 'parent-pin-recover',
    notes: 'After 3 wrong PINs. Calm wording, no alarm colours. The child can go back to play with nothing lost. The pause ends after 5 minutes.',
    render: function (root) {
      var P = KC.parent, a = actions();
      if (!P.lockUntil) P.lockUntil = Date.now() + D.lockMs;
      var wait = h('p', { class: 'kc-title', 'data-lock-left': true });
      var primary = h('div', { class: 'kc-stack' });
      root.appendChild(h('div', { class: 'kc-illustration', 'data-component': 'illustration' }, KC.img('icons/lock.svg')));
      root.appendChild(title('parent.lock_title'));
      root.appendChild(para('parent.lock_text'));
      root.appendChild(wait);
      root.appendChild(note('parent.lock_safe'));
      function paint() {
        var ms = P.lockUntil - Date.now();
        if (ms <= 0) { wait.textContent = t('parent.lock_over'); P.locked = false; P.wrong = 0; P.lockUntil = 0; offer(true); return false; }
        var sec = Math.ceil(ms / 1000); wait.textContent = t('parent.lock_left', { m: Math.floor(sec / 60), s: String(sec % 60).padStart(2, '0') });
        return true;
      }
      function offer(over) {
        primary.innerHTML = '';
        a.innerHTML = '';
        if (over) a.appendChild(KC.primary(t('parent.try_pin'), function () { KC.parent.intent = true; KC.go('parent-gate', { replace: true }); }));
        else a.appendChild(KC.primary(t('parent.reset_pin'), function () { KC.go('parent-pin-recover'); }));
        a.appendChild(KC.secondary(t('parent.back_play'), function () { KC.go('home', { replace: true }); }));
        if (over) a.appendChild(KC.secondary(t('parent.reset_pin'), function () { KC.go('parent-pin-recover'); }));
      }
      var running = paint();
      offer(!running);
      var timer = setInterval(function () { if (!stillHere('parent-lockout')) { clearInterval(timer); return; } if (!paint()) { clearInterval(timer); offer(true); } }, 1000);
      root.appendChild(a);
    }
  });

  /* 9 ---- parent-device-mode */
  screen({
    id: 'parent-device-mode', title: 'Parent: this device', next: 'parent-home',
    notes: '"This is my phone" or "Family device". A family device asks for the PIN every time and signs out when the area closes.',
    render: function (root) {
      var a = actions(), s = KC.state;
      root.appendChild(title('parent.device_title'));
      root.appendChild(note('parent.device_sub'));
      root.appendChild(radios(t('parent.device_title'), [
        { value: 'my-phone', label: t('device.my_phone'), sub: t('device.my_phone_sub'), pic: KC.img('icons/lock.svg') },
        { value: 'family', label: t('device.family'), sub: t('device.family_sub'), pic: KC.img('icons/home.svg') }
      ], s.deviceMode || 'my-phone', function (v) { s.deviceMode = v; KC.savePrefs(); }, 'device'));
      a.appendChild(KC.primary(t('parent.continue'), function () { KC.go('parent-home', { replace: true }); }));
      root.appendChild(a);
    }
  });

  /* 10 ---- parent-delete (names what is erased; needs the gate AND the PIN again, so a child cannot finish it) */
  screen({
    id: 'parent-delete', title: 'Parent: delete the family account', next: 'parent-home',
    notes: 'Reached only through the gate. "Erase everything" asks for the PIN again. There is a clear way back. Inactive accounts are deleted after 12 months.',
    render: function (root) {
      var a = actions(), body = h('div', { class: 'kc-stack' });
      root.appendChild(title('parent.delete_title'));
      root.appendChild(body);
      function warn() {
        body.innerHTML = '';
        body.appendChild(para('parent.delete_lead'));
        body.appendChild(h('ul', { class: 'kc-rows', 'data-erases': true }, ['parent.erase_1', 'parent.erase_2', 'parent.erase_3', 'parent.erase_4'].map(function (k) {
          return h('li', { 'data-component': 'illustration' }, h('span', { class: 'kc-grow' }, t(k)));
        })));
        body.appendChild(note('parent.delete_inactive'));
        body.appendChild(note('parent.delete_child'));
        a.innerHTML = '';
        a.appendChild(KC.primary(t('parent.keep_family'), function () { KC.go('parent-home', { replace: true }); }));
        a.appendChild(KC.secondary(t('parent.erase_go'), confirm));
      }
      function confirm() {
        body.innerHTML = ''; a.innerHTML = '';
        var pin = '', m = msg(), dots = h('div', { class: 'kc-pin-dots' }, [0, 1, 2, 3].map(function () { return h('span', { class: 'kc-pin-dot' }); }));
        var go = h('button', { class: 'kc-btn kc-btn--secondary', 'data-component': 'secondary-button', 'data-go': 'erase-confirm', disabled: true }, t('parent.erase_confirm'));
        function paint() { dots.querySelectorAll('.kc-pin-dot').forEach(function (d, i) { d.classList.toggle('is-on', i < pin.length); }); go.disabled = pin.length !== 4; }
        go.addEventListener('click', function () {
          var ok = pin === D.pin; pin = ''; paint();
          if (!ok) { m.textContent = t('parent.erase_badpin'); return; }
          erase();
        });
        var pad = KC.keypad('pin-pad', function (k) { m.textContent = ''; if (k === 'del') pin = pin.slice(0, -1); else if (k === 'clear') pin = ''; else if (pin.length < 4) pin += k; paint(); });
        body.appendChild(para('parent.erase_pin'));
        body.appendChild(dots); body.appendChild(pad); body.appendChild(m); body.appendChild(go);
        a.appendChild(KC.primary(t('parent.keep_family'), function () { KC.go('parent-home', { replace: true }); }));
      }
      function erase() {
        KC.store.clear(); KC.resetState();                              // everything on this device, in one step
        body.innerHTML = ''; a.innerHTML = '';
        body.appendChild(h('div', { class: 'kc-pcard', 'data-component': 'illustration', 'data-erased': true }, h('strong', null, t('parent.erased_title')), note('parent.erased_text')));
        a.appendChild(KC.primary(t('parent.start_again'), function () { KC.go('welcome', { replace: true }); }));
      }
      warn();
      root.appendChild(a);
    }
  });

  /* 11 ---- parent-signed-out */
  screen({
    id: 'parent-signed-out', title: 'Parent: signed out', next: 'home',
    notes: 'Signed out of the grown-up area. The child can keep playing; nothing is lost. Sign in needs the one-time code.',
    render: function (root) {
      var a = actions();
      root.appendChild(h('div', { class: 'kc-illustration', 'data-component': 'illustration' }, KC.img('icons/check.svg')));
      root.appendChild(title('parent.out_title'));
      root.appendChild(para('parent.out_text'));
      a.appendChild(KC.primary(t('parent.back_play'), function () { KC.go('home', { replace: true }); }));
      a.appendChild(KC.secondary(t('parent.signin_again'), function () { KC.go('parent-signin'); }));
      root.appendChild(a);
    }
  });
})();
