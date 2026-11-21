/* Parent Dashboard views (spec 005 T069-T071, FR-015, FR-016). Every number comes from KCDerive over the sample family's events.
   Routes: #/<id>?c=<nickname>&state=<state>. The sign-in is a scripted demo (research R10): no network, no real email. */
(function () {
  'use strict';
  var KCD = window.KCD, D = window.KCDerive, esc = KCD.esc, S = KCD.session;
  var F = KCD.family(), cur = null;
  var FAM = window.KC_FAMILY.family;
  var SYMBOL_NOTE = 'In this demo one coin is worth one unit of the child’s own currency.';

  function kid(ctx) {
    var n = ctx.params.c || cur;
    var k = F.children.filter(function (c) { return c.nickname === n; })[0] || F.children[0];
    cur = k.nickname;
    return k;
  }
  function empty(ctx) { return ctx.state === 'empty' || ctx.state === 'no-play-yet'; }
  function evs(k, ctx) { return empty(ctx) ? [] : k.events; }
  function plays(k, ctx) { return empty(ctx) ? [] : k.play; }
  function m(n, k) { return D.money(n, k.region); }
  function band(k) { return D.BANDS[k.ageBand]; }
  function region(k) { var r = D.REGIONS[k.region]; return r.name + ' (' + r.symbol + ')'; }
  function pct(x) { return Math.round(x * 100); }
  function strongest(v) {
    var best = null;
    D.PILLARS.forEach(function (p) { if (v.pillars[p.id] > 0 && (!best || v.pillars[p.id] > v.pillars[best.id])) best = p; });
    return best;
  }
  function L(id, k, extra) { var p = { c: k && k.nickname }; for (var x in extra || {}) p[x] = extra[x]; return KCD.href(id, p); }
  function switcher(view, k) {
    return '<nav class="kd-switch" aria-label="Choose a child">' + F.children.map(function (c) {
      return '<a href="' + L(view, c) + '"' + (c === k ? ' aria-current="true"' : '') + '>' + esc(c.nickname) + '</a>';
    }).join('') + '</nav>';
  }
  function meta(k, v) {
    return '<ul class="kd-meta" aria-label="About ' + esc(k.nickname) + '"><li>Age band: ' + band(k) + '</li><li>Region: ' + esc(region(k)) + '</li>' +
      (v ? '<li>Level ' + v.level.n + ': ' + v.level.name + '</li>' : '') + '</ul>';
  }
  function stats(k, v) {
    return '<div class="kd-stats">' +
      '<div class="kc-stat"><span class="kc-stat-n" data-k="coins">' + m(v.coins, k) + '</span><span class="kc-stat-l">Wallet (' + v.coins + ' coins)</span></div>' +
      '<div class="kc-stat"><span class="kc-stat-n" data-k="savings">' + m(v.savings, k) + '</span><span class="kc-stat-l">Saved in the jar (' + v.savings + ' coins)</span></div>' +
      '<div class="kc-stat"><span class="kc-stat-n" data-k="level">Level ' + v.level.n + '</span><span class="kc-stat-l">' + v.level.name + ' &middot; <span data-k="xp">' + v.xp + '</span> XP</span></div>' +
      '<div class="kc-stat"><span class="kc-stat-n" data-k="badges">' + v.badges.length + '</span><span class="kc-stat-l">Badges earned</span></div></div>';
  }
  function ring(v) {
    var C = 2 * Math.PI * 48, len = Math.max(0, Math.min(1, v.levelProgress)) * C;
    var text = v.nextLevel ? 'Level ' + v.level.n + ', ' + v.level.name + ': ' + (v.nextLevel.xpFrom - v.xp) + ' XP to level ' + v.nextLevel.n + ', ' + v.nextLevel.name + ' (starts at ' + v.nextLevel.xpFrom + ' XP).'
      : 'Level ' + v.level.n + ', ' + v.level.name + ': the top level.';
    return '<svg class="kd-ring" viewBox="0 0 120 120" role="img" aria-label="' + esc(text + ' ' + pct(v.levelProgress) + ' percent of the way.') + '">' +
      '<circle class="trk" cx="60" cy="60" r="48" stroke-width="12"/><circle class="val" cx="60" cy="60" r="48" stroke-width="12" stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
      '<text x="60" y="68" font-size="22">Lv ' + v.level.n + '</text></svg><p class="kc-muted kd-center">' + esc(text) + '</p>';
  }
  function playList(k, list) {
    if (!list.length) return '<div class="kc-empty" data-empty="no-play"><img src="../../shared/brand/kudi-wave.webp" alt=""><h3>No play yet</h3><p>' + esc(k.nickname) + ' has not finished a mission. It will show here after the first one.</p></div>';
    return '<ul class="kd-list" aria-label="Recent play">' + list.map(function (p) {
      return '<li><span><b>' + esc(p.title) + '</b><br><span class="kc-muted">' + esc(p.outcome) + '</span></span><span class="kc-muted">' + D.agoText(p.ago) + '</span></li>';
    }).join('') + '</ul>';
  }
  function emptyCard(img, title, text) { return '<div class="kc-empty" data-empty="1"><img src="../../shared/brand/' + img + '" alt=""><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p></div>'; }

  /* ---- sign-in and code ---- */
  function signIn(ctx) {
    var st = ctx.state, email = S.get('email') || '';
    var alert = st === 'error' ? '<div class="kd-alert" role="alert">We could not send a code to that email. Check it and try again.</div>' :
      st === 'expired' ? '<div class="kd-alert" role="alert">That code has expired. Send yourself a new one to carry on.</div>' : '';
    var html = '<div class="kd-stage"><img src="../../shared/brand/kudi-wave.webp" alt=""></div><p class="kd-lead">We email a one-time code. There is no password to remember.</p>' + alert +
      '<form id="signin-form" class="kc-card" novalidate' + (st === 'loading' ? ' aria-busy="true"' : '') + '>' +
      '<div class="kc-field' + (st === 'error' ? ' is-error' : '') + '"><label for="email">Parent email</label>' +
      '<input id="email" name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(email) + '" placeholder="parent@example.com"' + (st === 'loading' ? ' disabled' : '') + ' required>' +
      '<div class="kc-hint">Use the email you gave when you set up the app.</div><div class="kc-error">Enter an email address like name@example.com.</div></div>' +
      '<button class="kc-btn' + (st === 'loading' ? ' is-loading' : '') + '" type="submit"' + (st === 'loading' ? ' disabled aria-disabled="true"' : '') + '>' + (st === 'loading' ? 'Sending code…' : 'Send me a code') + '</button></form>' +
      '<p class="kd-note kd-mt"><b>Reviewer note.</b> This sign-in is a scripted demo. No email is sent and nothing is checked on a server. Use ' + esc(FAM.demoEmail) + ' and the code ' + esc(FAM.demoCode) + '.</p>';
    return { title: 'Sign in to your family dashboard', html: html, chrome: 'bare', after: function (main) {
      var f = main.querySelector('#signin-form');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = f.email.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { KCD.go('sign-in', { state: 'error' }); return; }
        S.set('email', v); KCD.go('code');
      });
    } };
  }
  function code(ctx) {
    var st = ctx.state, email = S.get('email') || FAM.demoEmail;
    var alert = st === 'error' ? '<div class="kd-alert" role="alert">That code is not right. Check the six digits and try again.</div>' : '';
    var ok = st === 'resent' ? '<div class="kd-ok" role="status">A new code was sent to ' + esc(email) + '. In this demo no email leaves the page.</div>' : '';
    var html = '<p class="kd-lead">We sent a six-digit code to <b>' + esc(email) + '</b>. It works for ten minutes.</p>' + alert + ok +
      '<form id="code-form" class="kc-card" novalidate><div class="kc-field' + (st === 'error' ? ' is-error' : '') + '"><label for="code">Six-digit code</label>' +
      '<input id="code" name="code" class="kd-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" required>' +
      '<div class="kc-error">Enter the six digits from the email.</div></div>' +
      '<div class="kd-actions"><button class="kc-btn" type="submit">Sign in</button><button class="kc-btn kc-quiet" type="button" id="resend">Send a new code</button></div></form>' +
      '<p class="kd-mt"><a class="kd-linkbtn" href="#/sign-in">Use a different email</a></p>' +
      '<p class="kd-note"><b>Reviewer note.</b> The demo code is ' + esc(FAM.demoCode) + '. Any other code shows the error state.</p>';
    return { title: 'Enter your code', html: html, chrome: 'bare', after: function (main) {
      main.querySelector('#code-form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (this.code.value.trim() === FAM.demoCode) { S.set('signed', '1'); KCD.go('overview'); } else KCD.go('code', { state: 'error' });
      });
      main.querySelector('#resend').addEventListener('click', function () { KCD.go('code', { state: 'resent' }); });
    } };
  }

  /* ---- overview ---- */
  function overview(ctx) {
    var k = kid(ctx), st = ctx.state;
    if (st === 'loading') return { title: 'Your family', html: '<p class="kd-lead" role="status">Loading your family…</p><div class="kd-skel"></div><div class="kd-skel"></div><div class="kd-skel"></div>' };
    if (st === 'error') return { title: 'Your family', html: '<div class="kd-alert" role="alert">We could not load your family just now. Nothing was lost. Try again.</div><a class="kc-btn" href="#/overview">Try again</a>' };
    if (st === 'empty') return { title: 'Your family', html: '<div class="kc-empty" data-empty="new-family"><img src="../../shared/brand/kudi-wave.webp" alt=""><h2>No children yet</h2>' +
      '<p>Your family is set up. Add a child by opening KudiCubs on their device and choosing a friend and a nickname.</p>' +
      '<ol class="kd-steps"><li>Get the app on your child’s phone or a family tablet.</li><li>Open it and let your child pick a friend and a nickname.</li><li>Their first mission shows up here.</li></ol>' +
      '<a class="kc-btn" href="../../website/get-the-app.html">Get the app</a></div>' };
    var v = D.derive(k.events);
    var cards = F.children.map(function (c) {
      var cv = D.derive(c.events);
      return '<article class="kc-card" data-child="' + esc(c.nickname) + '"><h2>' + esc(c.nickname) + '</h2>' + meta(c, cv) +
        '<p>Wallet <b>' + m(cv.coins, c) + '</b> &middot; Saved <b>' + m(cv.savings, c) + '</b> &middot; Badges <b>' + cv.badges.length + '</b></p>' +
        '<p class="kc-muted">Last played ' + D.agoText(D.lastActive(c)).toLowerCase() + '</p><a class="kd-linkbtn" href="' + L('child', c) + '">Open ' + esc(c.nickname) + '<span class="kc-sr-only">’s page</span></a></article>';
    }).join('');
    return { title: 'Your family', html: '<p class="kd-lead">' + esc(FAM.label) + '. Money is shown in each child’s own currency.</p>' + switcher('overview', k) +
      '<section aria-labelledby="glance"><h2 id="glance">' + esc(k.nickname) + ' at a glance</h2>' + meta(k, v) + stats(k, v) + '</section>' +
      '<section aria-labelledby="all"><h2 id="all">All children</h2><div class="kd-kids">' + cards + '</div></section>' +
      '<p class="kd-note">' + SYMBOL_NOTE + '</p>' };
  }

  /* ---- child, skills, badges, activity ---- */
  function child(ctx) {
    var k = kid(ctx), v = D.derive(evs(k, ctx)), pl = plays(k, ctx), best = strongest(v);
    return { title: k.nickname + '’s progress', html: switcher('child', k) + meta(k, v) + stats(k, v) +
      '<div class="kd-two"><section class="kc-card" aria-labelledby="lv"><h2 id="lv">Level</h2>' + ring(v) + '</section>' +
      '<section class="kc-card" aria-labelledby="rp"><h2 id="rp">Recent play</h2>' + playList(k, pl) + '</section></div>' +
      '<section class="kc-card kd-mt" aria-labelledby="ss"><h2 id="ss">Strongest skill</h2><p>' +
      (best ? esc(k.nickname) + ' is strongest at <b>' + best.name + '</b> (' + pct(v.pillars[best.id]) + ' percent).' : 'No skills yet. They appear after the first mission.') + '</p>' +
      '<div class="kd-actions"><a class="kc-btn kc-quiet" href="' + L('skills', k) + '">See all skills</a><a class="kc-btn kc-quiet" href="' + L('activity', k) + '">See activity</a><a class="kc-btn kc-quiet" href="' + L('badges', k) + '">See badges</a></div></section>' };
  }
  function skills(ctx) {
    var k = kid(ctx), v = D.derive(evs(k, ctx));
    if (empty(ctx) || v.empty) return { title: 'Skills', html: switcher('skills', k) + emptyCard('kudi-wave.webp', 'No skills yet', k.nickname + ' has not played yet. Skill bars fill as missions are finished.') };
    var alt = 'Skills by pillar for ' + k.nickname + ': ' + D.PILLARS.map(function (p) { return p.name + ' ' + pct(v.pillars[p.id]) + ' percent'; }).join(', ') + '.';
    var rows = D.PILLARS.map(function (p) {
      return '<div class="kd-skill"><span>' + p.name + '</span><div class="kc-bar"><span style="width:' + pct(v.pillars[p.id]) + '%"></span></div><b>' + pct(v.pillars[p.id]) + '%</b></div>';
    }).join('');
    var table = '<div class="kc-table-wrap"><table class="kc-table" aria-label="Skills table"><thead><tr><th scope="col">Pillar</th><th scope="col">Progress</th></tr></thead><tbody>' +
      D.PILLARS.map(function (p) { return '<tr><th scope="row">' + p.name + '</th><td>' + pct(v.pillars[p.id]) + ' percent</td></tr>'; }).join('') + '</tbody></table></div>';
    return { title: 'Skills', html: switcher('skills', k) + '<p class="kd-lead">Five money skills: Know, Understand, Decide, Invest and Share.</p>' +
      '<section class="kc-chart" aria-labelledby="sk"><h2 id="sk">' + esc(k.nickname) + '’s skills by pillar</h2><div role="img" aria-label="' + esc(alt) + '">' + rows + '</div></section>' +
      '<section aria-labelledby="skt"><h2 id="skt">As a table</h2>' + table + '</section>' };
  }
  function badges(ctx) {
    var k = kid(ctx), v = D.derive(evs(k, ctx)), got = {};
    evs(k, ctx).forEach(function (e) { if (e.t === 'badge' && !(e.badge in got)) got[e.badge] = e.ago; });
    if (!v.badges.length) return { title: 'Badges', html: switcher('badges', k) + emptyCard('kudi-wave.webp', 'No badges yet', k.nickname + ' earns the first badge with the first coins.') };
    var all = Object.keys(D.BADGES).map(function (id) {
      var has = id in got;
      return '<li class="kc-card ' + (has ? 'got' : 'not') + '" data-badge="' + id + '" data-earned="' + has + '"><h3>' + D.BADGES[id] + '</h3><p>' + (has ? '<b>Earned</b> ' + D.agoText(got[id]).toLowerCase() : 'Not yet') + '</p></li>';
    }).join('');
    return { title: 'Badges', html: switcher('badges', k) + '<p class="kd-lead">' + esc(k.nickname) + ' has earned <b>' + v.badges.length + '</b> of ' + Object.keys(D.BADGES).length + ' badges.</p><ul class="kd-badges">' + all + '</ul>' };
  }
  function activity(ctx) {
    var k = kid(ctx), v = D.derive(evs(k, ctx));
    if (empty(ctx) || (!k.play.length && v.empty)) return { title: 'Activity', html: switcher('activity', k) + emptyCard('kudi-wave.webp', 'No activity yet', 'The last seven days show here once ' + k.nickname + ' plays.') };
    var days = D.week({ events: evs(k, ctx), play: plays(k, ctx) }), max = Math.max.apply(null, days.map(function (d) { return d.earned; }).concat([1]));
    var lbl = function (d) { return d.ago === 0 ? 'Today' : d.ago + 'd'; };
    var alt = 'Coins earned in the last 7 days for ' + k.nickname + ': ' + days.map(function (d) { return (d.ago === 0 ? 'today' : d.ago + ' days ago') + ' ' + m(d.earned, k); }).join(', ') + '.';
    var strip = '<div class="kd-strip" role="img" aria-label="' + esc(alt) + '">' + days.map(function (d) {
      return '<div class="' + (d.earned ? '' : 'is-off') + '"><i style="height:' + Math.max(4, Math.round(d.earned / max * 100)) + '%"></i></div>';
    }).join('') + '</div><div class="kd-days" aria-hidden="true">' + days.map(function (d) { return '<span>' + lbl(d) + '</span>'; }).join('') + '</div>';
    var dayTable = '<div class="kc-table-wrap"><table class="kc-table" aria-label="Last 7 days"><thead><tr><th scope="col">Day</th><th scope="col">Coins earned</th><th scope="col">Missions played</th></tr></thead><tbody>' +
      days.slice().reverse().map(function (d) { return '<tr><th scope="row">' + (d.ago === 0 ? 'Today' : d.ago === 1 ? 'Yesterday' : d.ago + ' days ago') + '</th><td>' + m(d.earned, k) + '</td><td>' + d.plays + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var hist = '<div class="kc-table-wrap"><table class="kc-table" aria-label="Money history"><thead><tr><th scope="col">When</th><th scope="col">What</th><th scope="col">Amount</th></tr></thead><tbody>' +
      v.history.map(function (h) { return '<tr><td>' + D.agoText(h.daysAgo) + '</td><td>' + esc(h.label) + '</td><td>' + (h.out ? '−' : '+') + m(h.amount, k) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return { title: 'Activity', html: switcher('activity', k) + '<section class="kc-chart" aria-labelledby="w"><h2 id="w">Last 7 days</h2><p class="kc-muted">Coins earned each day (' + esc(D.REGIONS[k.region].iso) + ').</p>' + strip + '</section>' +
      '<section aria-labelledby="dt"><h2 id="dt">Day by day</h2>' + dayTable + '</section><section aria-labelledby="pl"><h2 id="pl">Recent play</h2>' + playList(k, plays(k, ctx)) + '</section>' +
      '<section aria-labelledby="mh"><h2 id="mh">Money history</h2>' + hist + '</section>' };
  }

  /* ---- settings ---- */
  function settingsChild(ctx) {
    var k = kid(ctx), st = ctx.state, shown = k.ageBand;
    if (st === 'confirm-band') shown = Object.keys(D.BANDS).filter(function (b) { return b !== k.ageBand; })[0];
    var opt = function (obj, sel, fmt) { return Object.keys(obj).map(function (id) { return '<option value="' + id + '"' + (id === sel ? ' selected' : '') + '>' + esc(fmt(id)) + '</option>'; }).join(''); };
    var html = switcher('settings-child', k) + (st === 'saved' ? '<div class="kd-ok" role="status">Saved. ' + esc(k.nickname) + '’s settings are updated.</div>' : '') +
      (st === 'error' ? '<div class="kd-alert" role="alert">The nickname needs a change. Use a nickname, not a real name or an email.</div>' : '') +
      '<form id="child-form" class="kc-card" novalidate><div class="kc-field' + (st === 'error' ? ' is-error' : '') + '"><label for="nick">Nickname</label>' +
      '<input id="nick" name="nick" maxlength="20" value="' + esc(st === 'error' ? 'ama@example.com' : k.nickname) + '" required><div class="kc-hint">A nickname only. Never a full name.</div><div class="kc-error">Use a nickname, not a real name or an email.</div></div>' +
      '<div class="kc-field"><label for="band">Age band</label><select id="band" name="band">' + opt(D.BANDS, shown, function (b) { return D.BANDS[b]; }) + '</select><div class="kc-hint">Changing it changes the missions and reading level. Coins and badges are kept.</div></div>' +
      '<div class="kc-field"><label for="reg">Region</label><select id="reg" name="reg">' + opt(D.REGIONS, k.region, function (r) { return D.REGIONS[r].name + ' (' + D.REGIONS[r].symbol + ')'; }) + '</select><div class="kc-hint">Money for this child is shown in this region’s currency.</div></div>' +
      '<button class="kc-btn" type="submit">Save changes</button></form>';
    return { title: 'Child settings', html: html, current: 'settings-child', after: function (main) {
      var f = main.querySelector('#child-form');
      function apply() {
        k.nickname = f.nick.value.trim(); k.ageBand = f.band.value; k.region = f.reg.value; cur = k.nickname;
        KCD.go('settings-child', { c: k.nickname, state: 'saved' }); KCD.toast('Saved');
      }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var n = f.nick.value.trim();
        if (!n || /[@\s]/.test(n)) { KCD.go('settings-child', { c: k.nickname, state: 'error' }); return; }
        if (f.band.value !== k.ageBand) askBand(); else apply();
      });
      function askBand() {
        KCD.modal({ title: 'Change the age band?', body: '<p>' + esc(k.nickname) + ' will move from ages ' + band(k) + ' to ages ' + D.BANDS[f.band.value] + '. Missions, reading level and rewards change with the band. Coins, savings and badges stay.</p>',
          confirm: 'Yes, change it', cancel: 'Keep ' + band(k), onConfirm: apply, onCancel: function () { f.band.value = k.ageBand; } });
      }
      if (st === 'confirm-band') askBand();
    } };
  }
  function settingsFamily(ctx) {
    var st = ctx.state, email = S.get('email') || FAM.demoEmail;
    var html = (st === 'saved' ? '<div class="kd-ok" role="status">Saved. Your family settings are updated.</div>' : '') +
      (st === 'error' ? '<div class="kd-alert" role="alert">The PIN must be exactly four digits.</div>' : '') +
      '<form id="fam-form" class="kc-card" novalidate><div class="kc-field"><label for="femail">Parent email</label><input id="femail" name="email" type="email" value="' + esc(email) + '" required><div class="kc-hint">We send sign-in codes here.</div></div>' +
      '<div class="kc-field' + (st === 'error' ? ' is-error' : '') + '"><label for="pin">New parent PIN</label><input id="pin" name="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 digits"><div class="kc-hint">The PIN opens the parent area in the app. Leave blank to keep the current one. It is never stored on this page.</div><div class="kc-error">Enter exactly four digits.</div></div>' +
      '<div class="kc-field"><label for="freg">Default region</label><select id="freg" name="reg">' + Object.keys(D.REGIONS).map(function (r) { return '<option value="' + r + '"' + (r === FAM.region ? ' selected' : '') + '>' + esc(D.REGIONS[r].name) + '</option>'; }).join('') + '</select><div class="kc-hint">Used for new children. Each child keeps their own region.</div></div>' +
      '<button class="kc-btn" type="submit">Save changes</button></form>';
    return { title: 'Family settings', html: html, after: function (main) {
      var f = main.querySelector('#fam-form');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (f.pin.value && !/^\d{4}$/.test(f.pin.value)) { f.pin.value = ''; KCD.go('settings-family', { state: 'error' }); return; }
        f.pin.value = '';
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) S.set('email', f.email.value.trim());
        KCD.go('settings-family', { state: 'saved' }); KCD.toast('Saved');
      });
    } };
  }

  /* ---- devices, data, summary, signed-out ---- */
  function devices(ctx) {
    var list = F.family.devices, st = ctx.state, idx = ctx.params.d === undefined ? 0 : +ctx.params.d;
    if (!list.length || st === 'empty') return { title: 'Devices', html: emptyCard('kudi-wave.webp', 'No devices signed in', 'Devices appear here after you sign in to KudiCubs on them.') };
    var rows = list.map(function (d, i) {
      return '<tr data-device="' + i + '"><th scope="row">' + esc(d.label) + '</th><td>' + (d.mode === 'family' ? 'Family device' : 'My phone') + '</td><td>' + esc(d.lastSeen) + '</td><td><button type="button" class="kc-btn kc-quiet" data-out="' + i + '">Sign out<span class="kc-sr-only"> ' + esc(d.label) + '</span></button></td></tr>';
    }).join('');
    return { title: 'Devices', html: '<p class="kd-lead">Phones and tablets signed in to your family. Sign one out if it is lost or no longer used.</p>' +
      '<div class="kc-table-wrap"><table class="kc-table" aria-label="Signed-in devices"><thead><tr><th scope="col">Device</th><th scope="col">Mode</th><th scope="col">Last seen</th><th scope="col">Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
      after: function (main) {
        function ask(i) {
          var d = list[i];
          KCD.modal({ title: 'Sign out ' + d.label + '?', body: '<p>It will need your code again to open KudiCubs. Nothing is deleted from the device.</p>', confirm: 'Sign out device', cancel: 'Keep it signed in',
            onConfirm: function () { list.splice(i, 1); var same = window.location.hash === '#/devices'; KCD.go('devices'); if (same) window.dispatchEvent(new HashChangeEvent('hashchange')); KCD.toast(d.label + ' was signed out'); }, onCancel: function () { KCD.go('devices'); } });
        }
        main.querySelectorAll('[data-out]').forEach(function (b) { b.addEventListener('click', function () { ask(+b.getAttribute('data-out')); }); });
        if (st === 'confirm-signout' && list[idx]) ask(idx);
      } };
  }
  function data(ctx) {
    var st = ctx.state;
    if (st === 'deleted') { S.del('signed'); return { title: 'Your data was deleted', html: '<div class="kd-ok" role="status">Your family data was deleted. In this demo nothing was really removed.</div><p>You are signed out. Children’s progress on their devices would be cleared the next time they open the app.</p><a class="kc-btn" href="#/sign-in">Back to sign in</a>', chrome: 'bare' }; }
    var html = '<p class="kd-lead">Your data is yours. Download a copy, or delete it all.</p>' +
      (st === 'export-ready' ? '<div class="kd-ok" role="status" id="export-ready">Your export is ready. It holds nicknames, age bands, regions and each child’s progress.</div>' : '') +
      '<div class="kd-two"><section class="kc-card" aria-labelledby="ex"><h2 id="ex">Export your data</h2><p>One file with everything we hold for your family. No email addresses of children, because we never ask for them.</p>' +
      (st === 'export-ready' ? '<a class="kc-btn" id="dl" download="kudicubs-sample-export.json" href="#">Download the file</a>' : '<a class="kc-btn" id="prep" href="' + KCD.href('data', { state: 'export-ready' }) + '">Prepare my export</a>') + '</section>' +
      '<section class="kc-card" aria-labelledby="de"><h2 id="de">Delete your data</h2><p>This removes your family and every child’s progress. It cannot be undone.</p><a class="kc-btn kc-quiet" id="del" href="' + KCD.href('data', { state: 'delete-confirm' }) + '">Delete my data</a></section></div>';
    return { title: 'Your data', html: html, after: function (main) {
      var dl = main.querySelector('#dl');
      if (dl) {
        var out = { exportOf: FAM.label, children: F.children.map(function (c) { return { nickname: c.nickname, ageBand: c.ageBand, region: c.region, events: c.events, play: c.play }; }) };
        dl.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
      }
      if (st === 'delete-confirm') KCD.modal({ title: 'Delete all family data?', body: '<p>Every child’s progress and your sign-in will be removed. This cannot be undone.</p>', needsTick: 'I understand this cannot be undone', confirm: 'Delete everything', cancel: 'Keep my data',
        onConfirm: function () { KCD.go('data', { state: 'deleted' }); }, onCancel: function () { KCD.go('data'); } });
    } };
  }
  function monthly(ctx) {
    var k = kid(ctx);
    if (empty(ctx)) return { title: 'Monthly summary', html: switcher('monthly-summary', k) + emptyCard('kudi-wave.webp', 'No summary yet', 'Your first monthly summary arrives after a month of play.') };
    var rows = F.children.map(function (c) {
      var v = D.derive(c.events), b = strongest(v);
      return '<tr data-child="' + esc(c.nickname) + '"><th scope="row">' + esc(c.nickname) + '</th><td>' + m(v.chart.missions + v.chart.bonus + v.chart.daily, c) + '</td><td>' + m(v.chart.savings, c) + '</td><td>' + m(v.chart.treats, c) + '</td><td>' + c.play.length + '</td><td>' + v.badges.length + '</td><td>' + (b ? b.name : 'None yet') + '</td></tr>';
    }).join('');
    return { title: 'Monthly summary', html: '<p class="kd-lead">A calm look at the month so far. No scores, no ranking between children.</p>' +
      '<div class="kc-table-wrap"><table class="kc-table" aria-label="Monthly summary by child"><thead><tr><th scope="col">Child</th><th scope="col">Earned</th><th scope="col">Saved</th><th scope="col">Spent</th><th scope="col">Missions</th><th scope="col">Badges</th><th scope="col">Strongest skill</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="kd-note kd-mt">Sample data covers the last eight days. ' + SYMBOL_NOTE + '</p>' };
  }
  function signedOut() {
    S.del('signed');
    return { title: 'You are signed out', chrome: 'bare', html: '<div class="kd-stage"><img src="../../shared/brand/kudi-wave.webp" alt=""></div><p class="kd-lead">See you soon. Nothing about your family stays on this page.</p><a class="kc-btn" href="#/sign-in">Sign in again</a>' };
  }

  var ROUTES = { 'sign-in': signIn, code: code, overview: overview, child: child, skills: skills, badges: badges, activity: activity, 'settings-child': settingsChild,
    'settings-family': settingsFamily, devices: devices, data: data, 'monthly-summary': monthly, 'signed-out': signedOut };

  KCD.start({
    brand: 'KudiCubs Parent Dashboard', fallback: 'sign-in', routes: ROUTES,
    nav: function (ctx) {
      var c = cur || F.children[0].nickname, l = function (id, label, primary) { return { id: id, label: label, href: KCD.href(id, { c: c }), primary: !!primary }; };
      return [l('overview', 'Overview', 1), l('child', 'Child', 1), l('skills', 'Skills', 1), l('activity', 'Activity', 1), l('badges', 'Badges'), l('settings-child', 'Child settings'), l('settings-family', 'Family settings'),
        l('devices', 'Devices'), l('data', 'Your data'), l('monthly-summary', 'Monthly summary'), { id: 'signed-out', label: 'Sign out', href: '#/signed-out' }];
    },
    reviewer: function () {
      var h = KCD.href, c = cur || F.children[0].nickname;
      return { note: '<b>Demo only.</b> Sample email ' + esc(FAM.demoEmail) + ', code ' + esc(FAM.demoCode) + '. No network, no real email. Jump straight to a state:', items: [
        { label: 'Sign-in: expired code', href: h('sign-in', { state: 'expired' }) }, { label: 'Sign-in: email error', href: h('sign-in', { state: 'error' }) }, { label: 'Sign-in: loading', href: h('sign-in', { state: 'loading' }) },
        { label: 'Code: wrong code', href: h('code', { state: 'error' }) }, { label: 'Code: resend sent', href: h('code', { state: 'resent' }) },
        { label: 'Overview: new family (empty)', href: h('overview', { state: 'empty' }) }, { label: 'Overview: loading', href: h('overview', { state: 'loading' }) }, { label: 'Overview: error', href: h('overview', { state: 'error' }) },
        { label: 'Child: no play yet', href: h('child', { c: c, state: 'no-play-yet' }) }, { label: 'Settings: age band change', href: h('settings-child', { c: c, state: 'confirm-band' }) },
        { label: 'Devices: sign-out confirm', href: h('devices', { state: 'confirm-signout' }) }, { label: 'Data: export ready', href: h('data', { state: 'export-ready' }) },
        { label: 'Data: delete confirm', href: h('data', { state: 'delete-confirm' }) }, { label: 'Start over (sign in)', href: h('sign-in') }] };
    },
    guard: function (ctx) { return null; }
  });

  /* a reviewer who opens a view without signing in sees the sample family, with a plain note */
  window.addEventListener('hashchange', note); note();
  function note() {
    var id = KCD.parse(window.location.hash).id;
    if (['sign-in', 'code', 'signed-out', ''].indexOf(id) > -1 || S.get('signed') === '1') return;
    window.setTimeout(function () {
      var main = document.getElementById('main');
      if (main && !main.querySelector('[data-unsigned]') && document.body.getAttribute('data-chrome') === 'app') main.insertAdjacentHTML('afterbegin', '<p class="kd-note" data-unsigned>Reviewer shortcut: you opened this page without signing in, so the sample family is shown. <a href="#/sign-in">Sign in with the demo code</a>.</p>');
    }, 0);
  }
})();
