/* KudiCubs hub (005 US8). Reads window.KC_HUB (hub-data.js, generated into dist/ by tools/design/build-site.mjs).
   Classic script, no network. Also forwards old 004 links (/#/home) to the app (/app/#/home). */
(function () {
  'use strict';
  if (/^#\/[a-z0-9-]+$/.test(location.hash)) { location.replace('app/' + location.hash); return; }
  var data = window.KC_HUB;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  if (!data) { $('hub-version').textContent = 'Version unknown'; $('hub-date').textContent = 'build data missing'; $('hub-coverage').textContent = 'Coverage is shown on the published set.'; }
  else {
    var r = data.release;
    $('hub-version').textContent = 'Version ' + r.version;
    $('hub-date').textContent = r.date;
    if (r.commit) { var c = $('hub-commit'); c.textContent = 'Build ' + r.commit; c.hidden = false; }
    var cv = r.coverage;
    $('hub-coverage').textContent = cv
      ? 'Coverage: ' + cv.designed + ' of ' + (cv.designed + cv.gap) + ' in-scope journeys have a designed screen' + (cv.gap ? ' (' + cv.gap + ' still open)' : '') + '; ' + cv.outOfScope + ' left out on purpose.'
      : 'Coverage is not available in this build.';
    var ch = $('hub-changes'); ch.textContent = '';
    (r.changes && r.changes.length ? r.changes : ['No change list recorded for this build.']).forEach(function (t) { ch.appendChild(el('li', {}, [t])); });
    $('hub-nojs').hidden = true;
  }

  var ROLE_ACTORS = {
    child: ['child-4-6', 'child-7-9', 'child-10-12', 'child-13-15'],
    parent: ['parent'], visitor: ['visitor'], staff: ['support', 'content-editor'], reviewer: ['reviewer']
  };
  function href(link) {
    var p = link.platform, s = link.screen;
    if (p === 'app') return 'app/#/' + s;
    if (p === 'website') return 'website/' + s + '.html';
    if (p === 'parent-dashboard') return 'dashboard/parent/index.html#/' + s;
    if (p === 'team-console') return 'dashboard/team/index.html#/' + s;
    return 'index.html';
  }
  function show(role) {
    var box = $('hub-journeys'); box.textContent = '';
    var tabs = document.querySelectorAll('#hub-roles [role=tab]');
    Array.prototype.forEach.call(tabs, function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-role') === role)); });
    box.setAttribute('aria-labelledby', 'tab-' + role);
    if (!data) { box.appendChild(el('p', { 'class': 'kc-muted' }, ['The journey list is part of the published build.'])); return; }
    var rows = data.rows.filter(function (x) { return ROLE_ACTORS[role].indexOf(x.actor) !== -1 && x.status !== 'out-of-scope'; });
    if (!rows.length) { box.appendChild(el('p', { 'class': 'kc-muted' }, ['No journeys for this role yet.'])); return; }
    var ul = el('ul');
    rows.forEach(function (x) {
      var li = el('li', {}, [el('strong', {}, [x.title]), el('div', { 'class': 'hub-status' }, [x.id + ' · ' + x.platform + ' · ' + (x.status === 'designed' ? 'designed' : 'not designed yet')])]);
      if (x.status === 'designed' && x.screens && x.screens.length) {
        var links = el('div', { 'class': 'hub-links' });
        x.screens.slice(0, 6).forEach(function (s) { links.appendChild(el('a', { href: href(s) }, [s.screen])); });
        li.appendChild(links);
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }
  var tabs = document.querySelectorAll('#hub-roles [role=tab]');
  Array.prototype.forEach.call(tabs, function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('data-role')); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
      if (n >= 0 && tabs[n % tabs.length]) { var nt = tabs[(n + tabs.length) % tabs.length]; nt.focus(); show(nt.getAttribute('data-role')); }
    });
  });
  show('child');
}());
