/* KudiCubs prototype — The Lost Coins activities: find, sort, count (T031–T033, research D9).
   Gentle feedback only: a wrong jar bounces the coin back and Kudi encourages. No red, no X, no buzzer. */
(function () {
  'use strict';
  var KC = window.KC;
  var h = KC.h;

  /* 8 coins drawn from the region's 3 Lost Coins denominations (3 + 3 + 2). */
  var SPOTS = [[17, 60], [43, 47], [72, 54], [88, 72], [11, 79], [56, 70], [30, 90], [80, 91]];
  var PATTERN = [0, 1, 2, 0, 1, 2, 0, 1];
  KC.lostCoinSet = function () {
    var ids = KC.region().lostCoinsSet;
    return PATTERN.map(function (k, i) { return { uid: 'c' + i, denom: ids[k] }; });
  };

  KC.kudiPose = function (pose, ms) {
    var k = document.querySelector('#kc-screen img[data-kudi]');
    if (!k) return;
    var was = k.getAttribute('data-kudi');
    k.src = 'assets/art/kudi/' + pose + '.svg';
    if (ms) setTimeout(function () { if (k.isConnected) k.src = 'assets/art/kudi/' + was + '.svg'; }, ms);
  };

  function coinToken(c, extra) {
    var d = KC.denom(c.denom);
    var attrs = { class: 'kc-coin', 'data-component': 'coin-token', 'data-coin': c.uid, 'data-denom': c.denom, 'data-region': KC.state.region, 'aria-label': d.label };
    Object.keys(extra || {}).forEach(function (k) { attrs[k] = extra[k]; });
    return h('button', attrs, h('img', { src: 'assets/art/' + KC.coinSrc(c.denom), alt: '', 'aria-hidden': 'true', 'data-region': KC.state.region, draggable: 'false' }));
  }

  /* ------------------------------------------------------------ FIND */
  KC.activityFind = function (root) {
    var coins = KC.lostCoinSet();
    var found = 0;
    var dots = h('div', { 'data-component': 'progress-dots', role: 'status', 'aria-label': '0 of 8 coins found' },
      coins.map(function (c) { return h('img', { src: 'assets/art/' + KC.coinSrc(c.denom), alt: '', 'aria-hidden': 'true', 'data-region': KC.state.region }); }));
    var scene = h('div', { class: 'kc-scene', 'data-primary-group': true, 'aria-label': 'Market scene. Find 8 coins.' },
      KC.illustration('scenes/market-park.svg', 'A market-day park with stalls'));
    coins.forEach(function (c, i) {
      var t = coinToken(c, { style: 'left:' + SPOTS[i][0] + '%;top:' + SPOTS[i][1] + '%' });
      t.addEventListener('click', function () {
        if (t.classList.contains('is-found')) return;
        t.classList.add('is-found');
        t.setAttribute('aria-disabled', 'true');
        setTimeout(function () { t.remove(); }, 620);
        var sp = h('span', { class: 'kc-sparkle', style: 'left:' + SPOTS[i][0] + '%;top:' + SPOTS[i][1] + '%' });
        scene.appendChild(sp); setTimeout(function () { sp.remove(); }, 700);
        dots.children[found].classList.add('is-on');
        found += 1;
        dots.setAttribute('aria-label', found + ' of 8 coins found');
        KC.kudiPose('cheer', 700);
        KC.say(found === coins.length ? 'find.all' : String(found), { n: found });
        if (found === coins.length) {
          KC.state.lostCoins.found = found;
          KC.promote(scene, KC.primary(KC.t('next'), function () { KC.go('activity-sort'); }), root.querySelector('.kc-actions'));
        }
      });
      scene.appendChild(t);
    });
    root.appendChild(dots);
    root.appendChild(scene);
  };

  /* ------------------------------------------------------------ SORT (drag or tap-coin-then-tap-jar) */
  KC.activitySort = function (root) {
    var coins = KC.lostCoinSet();
    var ids = KC.region().lostCoinsSet;
    var tries = {};
    var picked = null;
    var remaining = coins.length;
    KC.state.lostCoins.sortedCorrectFirstTry = true;

    var jars = ids.map(function (id) {
      var d = KC.denom(id);
      var glass = h('div', { class: 'kc-jar-glass', 'aria-hidden': 'true' });
      var jar = h('button', { 'data-component': 'jar', 'data-jar': id, 'aria-label': 'Jar for ' + d.label },
        h('img', { class: 'kc-jar-label', src: 'assets/art/' + KC.coinSrc(id), alt: '', 'aria-hidden': 'true', 'data-region': KC.state.region }),
        glass);
      jar.addEventListener('click', function () { if (picked) place(picked, jar); });
      return jar;
    });
    var jarRow = h('div', { class: 'kc-jar-row' }, jars);
    var tray = h('div', { class: 'kc-tray', 'data-primary-group': true, 'aria-label': 'Coins to sort' });

    function pick(t) {
      if (picked) picked.classList.remove('is-picked');
      picked = (picked === t) ? null : t;
      if (picked) picked.classList.add('is-picked');
      jars.forEach(function (j) { j.classList.toggle('is-target', !!picked); });
    }
    function place(t, jar) {
      var denom = t.getAttribute('data-denom');
      jars.forEach(function (j) { j.classList.remove('is-target'); });
      if (jar.getAttribute('data-jar') === denom) {
        jar.querySelector('.kc-jar-glass').appendChild(h('img', { src: 'assets/art/' + KC.coinSrc(denom), alt: '', 'data-region': KC.state.region }));
        jar.classList.remove('kc-hint');
        t.remove(); picked = null; remaining -= 1;
        KC.kudiPose('cheer', 600);
        if (remaining === 0) {
          KC.say('sort.all');
          KC.promote(tray, KC.primary(KC.t('next'), function () { KC.go('activity-count'); }), root.querySelector('.kc-actions'));
        } else if (remaining % 3 === 0) KC.say('sort.good');
      } else {
        /* Gentle redirect (FR-011, FR-016): bounce back, encourage, then glow the right jar after 2 tries. */
        var uid = t.getAttribute('data-coin');
        tries[uid] = (tries[uid] || 0) + 1;
        KC.state.lostCoins.sortedCorrectFirstTry = false;
        t.classList.remove('is-picked', 'is-gentle'); void t.offsetWidth; t.classList.add('is-gentle');
        picked = null;
        KC.kudiPose('gentle', 1400);
        KC.say('sort.hint');
        if (tries[uid] >= 2) jars.forEach(function (j) { if (j.getAttribute('data-jar') === denom) j.classList.add('kc-hint'); });
      }
    }

    coins.forEach(function (c) {
      var t = coinToken(c);
      var start = null, moved = false;
      t.addEventListener('pointerdown', function (e) {
        start = { x: e.clientX, y: e.clientY }; moved = false;
        try { t.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      t.addEventListener('pointermove', function (e) {
        if (!start) return;
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return;
        moved = true; t.classList.add('is-dragging');
        t.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.15)';
      });
      t.addEventListener('pointerup', function (e) {
        if (!start) return;
        var wasMoved = moved; start = null; moved = false;
        t.classList.remove('is-dragging'); t.style.transform = '';
        if (!wasMoved) { pick(t); return; }
        t.style.visibility = 'hidden';
        var under = document.elementFromPoint(e.clientX, e.clientY);
        t.style.visibility = '';
        var jar = under && under.closest ? under.closest('[data-component="jar"]') : null;
        if (jar) place(t, jar);
      });
      t.addEventListener('pointercancel', function () { start = null; t.classList.remove('is-dragging'); t.style.transform = ''; });
      tray.appendChild(t);
    });

    root.appendChild(jarRow);
    root.appendChild(tray);
  };

  /* ------------------------------------------------------------ COUNT (counts coins, never sums money: 4–6 "count to 20") */
  KC.activityCount = function (root) {
    var ids = KC.region().lostCoinsSet;
    var counts = ids.map(function (id) { return PATTERN.filter(function (k) { return ids[k] === id; }).length; });
    var jarIndex = 0, n = 0;
    var counter = h('div', { class: 'kc-counter', role: 'status', 'aria-live': 'polite' }, '0');
    var jars = ids.map(function (id, i) {
      var d = KC.denom(id);
      var glass = h('div', { class: 'kc-jar-glass' });
      for (var k = 0; k < counts[i]; k++) {
        glass.appendChild(coinToken({ uid: id + k, denom: id }));
      }
      return h('div', { 'data-component': 'jar', 'data-jar': id, 'aria-label': 'Jar for ' + d.label },
        h('img', { class: 'kc-jar-label', src: 'assets/art/' + KC.coinSrc(id), alt: '', 'aria-hidden': 'true', 'data-region': KC.state.region }),
        h('span', { class: 'kc-jar-count', 'data-jar-count': true }, ''),
        glass);
    });
    function activate() {
      jars.forEach(function (j, i) {
        var g = j.querySelector('.kc-jar-glass');
        if (i === jarIndex) { g.setAttribute('data-primary-group', ''); j.classList.add('is-target'); } else { g.removeAttribute('data-primary-group'); j.classList.remove('is-target'); }
      });
    }
    jars.forEach(function (j, i) {
      j.querySelectorAll('[data-component="coin-token"]').forEach(function (t) {
        t.addEventListener('click', function () {
          if (i !== jarIndex || t.classList.contains('is-counted')) { if (i !== jarIndex) KC.say('count.say'); return; }
          t.classList.add('is-counted'); t.setAttribute('aria-disabled', 'true');
          n += 1; counter.textContent = String(n);
          counter.classList.remove('is-tick'); void counter.offsetWidth; counter.classList.add('is-tick');
          KC.say(String(n));
          if (n === counts[i]) {
            j.classList.remove('is-target'); j.classList.add('is-done');
            j.querySelector('[data-jar-count]').textContent = String(n);
            j.querySelector('.kc-jar-glass').removeAttribute('data-primary-group');
            jarIndex += 1; n = 0;
            if (jarIndex < jars.length) {
              setTimeout(function () { counter.textContent = '0'; activate(); KC.resetIdle(); }, 500);
            } else {
              var found = KC.state.lostCoins.found || 8;
              /* Replays give practice XP only (data-model §8): no coins for counting on a replay. */
              if (!KC.state.lostCoins.earned && !KC.state.lostCoins.completedOnce) {
                KC.state.coins += found;
                KC.addEvent('earn', found, 'missions', 'history.lost_coins', 'goal-coins');
                KC.state.lostCoins.earned = true;
              }
              KC.kudiPose('cheer', 900);
              setTimeout(function () { KC.say('count.all', { n: found }); }, 400);
              KC.promote(null, KC.primary(KC.t('next'), function () { KC.go('decision'); }), root.querySelector('.kc-actions'));
            }
          }
        });
      });
    });
    activate();
    root.appendChild(counter);
    root.appendChild(h('div', { class: 'kc-jar-row' }, jars));
  };
})();
