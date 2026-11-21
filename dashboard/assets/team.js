/* Team Console views (spec 005 US9, FR-017, FR-018, research R11). Role is chosen on the sign-in page or in the reviewer menu (demo only).
   Support sees NICKNAME, age band, region and last active: no email, no full name, no devices, no event detail. */
(function () {
  'use strict';
  var KCD = window.KCD, D = window.KCDerive, esc = KCD.esc, S = KCD.session;
  var FAMILY = window.KC_FAMILY;
  var ROLES = { support: { label: 'Support', home: 'families', pages: ['families', 'family'] }, content: { label: 'Content editor', home: 'content', pages: ['content', 'mission'] } };
  var MISSIONS = [
    { id: 'lost-coins', title: 'The Lost Coins', band: 'b4_6' }, { id: 'snack-stall', title: 'The Snack Stall', band: 'b7_9' },
    { id: 'lemonade-stand', title: 'The Lemonade Stand', band: 'b10_12' }, { id: 'side-hustle', title: 'Side Hustle: first sale', band: 'b13_15' }
  ];
  var COVERAGE = ['gh', 'ng', 'uk'];
  var AM = window.KC && window.KC.audioManifest;      // the app's audio manifest, when it could be read (4 to 6 voice lines)

  function role() { var r = S.get('role'); return ROLES[r] ? r : null; }
  /* Recorded / Scratch voice / Pending. Only the 4 to 6 missions have narration lines in the app; the others are sample values. */
  function voice(mission, region) {
    if (mission.id !== 'lost-coins' || !AM) return { status: 'Pending', source: 'sample', detail: 'No narration lines yet (sample value)' };
    var lang = AM.regionLanguage[region], c = AM.counts[lang];
    var total = c.recorded + c.scratch + c.pending, status = c.recorded === total ? 'Recorded' : (c.recorded + c.scratch > 0 ? 'Scratch voice' : 'Pending');
    return { status: status, source: 'audio manifest', lang: lang, counts: c, detail: c.recorded + ' recorded, ' + c.scratch + ' scratch, ' + c.pending + ' pending of ' + total + ' lines (' + lang + ')' };
  }
  function tag(s) { return '<span class="kd-tag ' + (s === 'Recorded' ? 'rec' : s === 'Pending' ? 'pend' : '') + '" data-voice="' + esc(s) + '">' + esc(s) + '</span>'; }
  function roleChip() { var r = role(); return r ? '<ul class="kd-meta" aria-label="Your role"><li>Signed in as ' + ROLES[r].label + ' (demo)</li></ul>' : ''; }

  function signIn() {
    var btns = FAMILY.staff.map(function (s) {
      var r = ROLES[s.role];
      return '<div class="kc-card"><h2>' + esc(s.label) + '</h2><p>' + (s.role === 'support' ? 'Look up a family by nickname. Sees nicknames, age bands, regions and last active only.' : 'See missions, age bands, regions and voice-recording status.') +
        '</p><a class="kc-btn" href="' + KCD.href('sign-in', { as: s.role }) + '" data-role="' + s.role + '">Continue as ' + esc(r.label) + '</a></div>';
    }).join('');
    return { title: 'Team Console sign-in', chrome: 'bare', html: '<div class="kd-stage"><img src="../../shared/brand/kudi-headphones.webp" alt=""></div><p class="kd-lead">Choose your role. The role decides which pages open.</p><div class="kd-choose">' + btns + '</div>' +
      '<p class="kd-note kd-mt"><b>Reviewer note.</b> This is a scripted demo: there is no real staff sign-in. In the real console the role comes from your account.</p>' };
  }
  function noAccess(ctx) {
    var r = role(), from = ctx.params.from || 'that page';
    return { title: 'You do not have access to this page', chrome: r ? 'app' : 'bare', html: '<div class="kd-stage"><img src="../../shared/brand/kudi-fist.webp" alt=""></div>' + roleChip() +
      '<p class="kd-lead">' + (r ? 'The ' + ROLES[r].label + ' role cannot open <b>' + esc(from) + '</b>. This keeps children’s information limited to what each job needs.' : 'Choose a role first.') + '</p>' +
      '<div class="kd-actions"><a class="kc-btn" id="back" href="' + (r ? KCD.href(ROLES[r].home) : '#/sign-in') + '">' + (r ? 'Back to ' + (ROLES[r].home === 'families' ? 'Families' : 'Content') : 'Choose a role') + '</a><a class="kc-btn kc-quiet" href="#/sign-in">Switch role</a></div>', current: 'no-access' };
  }

  function lastOf(c) { return D.agoText(D.lastActive(c)); }
  function families(ctx) {
    if (ctx.state === 'loading') return { title: 'Families', html: roleChip() + '<p class="kd-lead" role="status">Loading families…</p><div class="kd-skel"></div><div class="kd-skel"></div>' };
    var rows = [{ id: FAMILY.family.id, label: FAMILY.family.label, region: FAMILY.family.region, kids: FAMILY.children }];
    var html = roleChip() + '<p class="kd-lead">Find a family by its code or a child’s nickname. Support never sees emails, full names or devices.</p>' +
      '<div class="kd-search"><div class="kc-field"><label for="q">Search by nickname or family</label><input id="q" type="search" autocomplete="off" value="' + esc(ctx.params.q || (ctx.state === 'empty-search' ? 'zzz' : '')) + '"></div></div>' +
      '<div id="fam-results" aria-live="polite"></div>';
    return { title: 'Families', html: html, after: function (main) {
      var q = main.querySelector('#q'), out = main.querySelector('#fam-results');
      function draw() {
        var t = q.value.trim().toLowerCase();
        var list = rows.filter(function (f) { return !t || (f.id + ' ' + f.label + ' ' + f.kids.map(function (c) { return c.nickname; }).join(' ')).toLowerCase().indexOf(t) > -1; });
        if (!list.length) { out.innerHTML = '<div class="kc-empty" data-empty="search"><img src="../../shared/brand/kudi-wave.webp" alt=""><h2>No families match</h2><p>Nothing matches “' + esc(q.value.trim()) + '”. Try a nickname or clear the search.</p></div>'; return; }
        out.innerHTML = '<div class="kc-table-wrap"><table class="kc-table" aria-label="Families"><thead><tr><th scope="col">Family</th><th scope="col">Children (nicknames)</th><th scope="col">Default region</th><th scope="col">Last active</th><th scope="col">Open</th></tr></thead><tbody>' +
          list.map(function (f) {
            var la = Math.min.apply(null, f.kids.map(function (c) { return D.lastActive(c); }));
            return '<tr><th scope="row">' + esc(f.id) + '</th><td>' + f.kids.map(function (c) { return esc(c.nickname); }).join(', ') + '</td><td>' + D.REGIONS[f.region].name + '</td><td>' + D.agoText(la) + '</td><td class="kd-table-links"><a href="' + KCD.href('family', { f: f.id }) + '">Open<span class="kc-sr-only"> ' + esc(f.id) + '</span></a></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      q.addEventListener('input', draw); draw();
    } };
  }
  function family() {
    var rows = FAMILY.children.map(function (c) { return '<tr data-child="' + esc(c.nickname) + '"><th scope="row">' + esc(c.nickname) + '</th><td>' + D.BANDS[c.ageBand] + '</td><td>' + D.REGIONS[c.region].name + '</td><td>' + lastOf(c) + '</td></tr>'; }).join('');
    return { title: 'Family ' + FAMILY.family.id, current: 'families', html: roleChip() + '<p><a class="kd-linkbtn" href="#/families">Back to families</a></p>' +
      '<div class="kc-table-wrap"><table class="kc-table" aria-label="Children in this family"><thead><tr><th scope="col">Nickname</th><th scope="col">Age band</th><th scope="col">Region</th><th scope="col">Last active</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="kd-note kd-mt">Support sees only these four things. Emails, full names, devices and play detail are not available to this role.</p>' };
  }

  function content(ctx) {
    var html = roleChip() + '<p class="kd-lead">One mission for each age band. Voice status for The Lost Coins is read from the app’s audio manifest. ' + (AM ? '' : 'The manifest could not be read here, so every status shown is a sample value. ') + 'The other missions have no narration yet; their status is a sample value.</p>' +
      '<div class="kd-search"><div class="kc-field"><label for="mq">Search missions</label><input id="mq" type="search" autocomplete="off" value="' + esc(ctx.params.q || (ctx.state === 'filtered-empty' ? 'zzz' : '')) + '"></div>' +
      '<div class="kc-field"><label for="mb">Age band</label><select id="mb"><option value="">All age bands</option>' + Object.keys(D.BANDS).map(function (b) { return '<option value="' + b + '">' + D.BANDS[b] + '</option>'; }).join('') + '</select></div></div>' +
      '<div id="mission-results" aria-live="polite"></div>';
    return { title: 'Content', html: html, after: function (main) {
      var q = main.querySelector('#mq'), b = main.querySelector('#mb'), out = main.querySelector('#mission-results');
      function draw() {
        var t = q.value.trim().toLowerCase();
        var list = MISSIONS.filter(function (m) { return (!t || m.title.toLowerCase().indexOf(t) > -1) && (!b.value || m.band === b.value); });
        if (!list.length) { out.innerHTML = '<div class="kc-empty" data-empty="filter"><img src="../../shared/brand/kudi-wave.webp" alt=""><h2>No missions match</h2><p>Clear the search or choose all age bands.</p></div>'; return; }
        out.innerHTML = '<div class="kc-table-wrap"><table class="kc-table" aria-label="Missions"><thead><tr><th scope="col">Mission</th><th scope="col">Age band</th><th scope="col">Regions</th><th scope="col">Voice recording</th><th scope="col">Open</th></tr></thead><tbody>' +
          list.map(function (m) {
            return '<tr data-mission="' + m.id + '"><th scope="row">' + esc(m.title) + '</th><td>' + D.BANDS[m.band] + '</td><td>' + COVERAGE.join(', ') + '</td><td>' + COVERAGE.map(function (r) { return r + ' ' + tag(voice(m, r).status); }).join(' ') + '</td>' +
              '<td class="kd-table-links"><a href="' + KCD.href('mission', { m: m.id }) + '">Open<span class="kc-sr-only"> ' + esc(m.title) + '</span></a></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      q.addEventListener('input', draw); b.addEventListener('change', draw); draw();
    } };
  }
  function mission(ctx) {
    var m = MISSIONS.filter(function (x) { return x.id === ctx.params.m; })[0] || MISSIONS[0];
    var rows = COVERAGE.map(function (r) { var v = voice(m, r); return '<tr data-region="' + r + '"><th scope="row">' + D.REGIONS[r].name + ' (' + r + ')</th><td>' + tag(v.status) + '</td><td>' + esc(v.detail) + '</td></tr>'; }).join('');
    return { title: m.title, current: 'content', html: roleChip() + '<p><a class="kd-linkbtn" href="#/content">Back to missions</a></p>' +
      '<ul class="kd-meta"><li>Age band: ' + D.BANDS[m.band] + '</li><li>Regions: ' + COVERAGE.join(', ') + '</li></ul>' +
      '<h2>Voice recording status</h2><div class="kc-table-wrap"><table class="kc-table" aria-label="Voice status by region"><thead><tr><th scope="col">Region</th><th scope="col">Status</th><th scope="col">Detail</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="kd-note kd-mt">' + (m.id === 'lost-coins' && AM ? 'Read from the app’s audio manifest.' : 'Sample values: this mission has no narration in the app yet.') + ' Recorded means a human voice, Scratch voice is the temporary placeholder, Pending means nothing yet.</p>' };
  }

  var ROUTES = { 'sign-in': signIn, families: families, family: family, content: content, mission: mission, 'no-access': noAccess };
  function start() {
    KCD.start({
      brand: 'KudiCubs Team Console', fallback: 'sign-in', routes: ROUTES,
      nav: function () {
        var r = role(); if (!r) return [];
        var home = ROLES[r].home;
        return [{ id: home, label: home === 'families' ? 'Families' : 'Content', href: KCD.href(home), primary: true }, { id: 'sign-in', label: 'Switch role', href: '#/sign-in', primary: true }];
      },
      reviewer: function () {
        return { note: '<b>Demo only.</b> Pick the staff role here or on the sign-in page. Then try a page that role may not open.', items: [
          { label: 'Sign in as Support', href: KCD.href('sign-in', { as: 'support' }) }, { label: 'Sign in as Content editor', href: KCD.href('sign-in', { as: 'content' }) },
          { label: 'Families (Support only)', href: '#/families' }, { label: 'Families: loading', href: KCD.href('families', { state: 'loading' }) }, { label: 'Families: no matches', href: KCD.href('families', { state: 'empty-search' }) },
          { label: 'Content (Content editor only)', href: '#/content' }, { label: 'Content: no matches', href: KCD.href('content', { state: 'filtered-empty' }) }, { label: 'Role chooser', href: '#/sign-in' }] };
      },
      guard: function (ctx) {
        var r = role();
        if (ctx.id === 'sign-in') {
          if (ROLES[ctx.params.as]) { S.set('role', ctx.params.as); return { id: ROLES[ctx.params.as].home }; }
          S.del('role');   // showing the chooser clears any earlier role
          return null;
        }
        if (ctx.id === 'no-access') return null;
        if (!r) return { id: 'sign-in' };
        if (ROLES[r].pages.indexOf(ctx.id) === -1) return { id: 'no-access', params: { from: ctx.id } };
        return null;
      }
    });
  }
  KCD.loadScript(['../../app/assets/data/audio-manifest.js', '../../prototype/assets/data/audio-manifest.js'], function () { AM = window.KC && window.KC.audioManifest; start(); });
})();
