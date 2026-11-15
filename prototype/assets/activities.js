/* KudiCubs prototype — The Lost Coins activities: find, sort (drag-first), count + call-and-response
   (003 FR-022–FR-028, contracts/interaction-moments.md). Gentle feedback only: a wrong jar floats the coin back,
   Kudi shows "fist" (encourage), a soft boop plays. No red, no X, no buzzer, never data-failure. */
(function () {
  'use strict';
  var KC = window.KC;
  var h = KC.h;

  /* How many coins go in each of the 3 jars, from the configured total (003 FR-043). The middle jar always has
     the most, so "Which jar has the most coins?" has exactly one right answer: 8 → 3 / 4 / 1. */
  KC.jarCounts = function () {
    var n = KC.hidden();
    var c3 = Math.max(1, Math.floor(n / 8));
    var c2 = Math.floor((n - c3) / 2) + 1;
    return [n - c3 - c2, c2, c3];
  };
  KC.lostCoinSet = function () {
    var ids = KC.region().lostCoinsSet, counts = KC.jarCounts(), out = [], k = 0;
    counts.forEach(function (c, jar) { for (var i = 0; i < c; i++) out.push({ uid: 'c' + (k++), denom: ids[jar] }); });
    // interleave so the find scene isn't grouped by coin type
    return out.sort(function (a, b) { return (parseInt(a.uid.slice(1), 10) * 5) % out.length - (parseInt(b.uid.slice(1), 10) * 5) % out.length; });
  };

  function coinToken(c, extra) {
    var d = KC.denom(c.denom);
    var attrs = { class: 'kc-coin', 'data-component': 'coin-token', 'data-coin': c.uid, 'data-denom': c.denom, 'data-region': KC.state.region, 'aria-label': d.label };
    Object.keys(extra || {}).forEach(function (k) { attrs[k] = extra[k]; });
    return h('button', attrs, KC.coinImg(c.denom));
  }

  /* ------------------------------------------------------------ FIND: every coin speaks its name when found */
  var SPOTS = [[17, 60], [43, 47], [72, 54], [88, 72], [11, 79], [56, 70], [30, 90], [80, 91], [64, 38], [24, 44]];
  KC.activityFind = function (root) {
    var coins = KC.lostCoinSet(), total = coins.length, found = 0;
    var dots = h('div', { 'data-component': 'progress-dots', role: 'status', 'aria-label': KC.t('a11y.found_of', { n: 0, total: total }) },
      coins.map(function (c) { return KC.coinImg(c.denom); }));
    var scene = h('div', { class: 'kc-scene', 'data-primary-group': true, 'aria-label': KC.t('a11y.find_scene', { total: total }) },
      KC.illustration('scenes/market-park.svg', KC.t('a11y.market_scene')));
    coins.forEach(function (c, i) {
      var spot = SPOTS[i % SPOTS.length];
      var t = coinToken(c, { style: 'left:' + spot[0] + '%;top:' + spot[1] + '%' });
      KC.childAction(t, 'find', function () {
        if (t.classList.contains('is-found')) return;
        t.classList.add('is-found');
        t.setAttribute('aria-disabled', 'true');
        setTimeout(function () { t.remove(); }, 620);
        var sp = h('span', { class: 'kc-sparkle', style: 'left:' + spot[0] + '%;top:' + spot[1] + '%' });
        scene.appendChild(sp); setTimeout(function () { sp.remove(); }, 700);
        dots.children[found].classList.add('is-on');
        found += 1;
        dots.setAttribute('aria-label', KC.t('a11y.found_of', { n: found, total: total }));
        if (found === total) {
          KC.state.lostCoins.found = found;
          KC.sfx('sparkle');
          KC.kudiReact('celebrate');
          KC.voice.play('find.all', { reaction: true });
          KC.promote(scene, KC.primary(KC.t('next'), function () { KC.go('activity-sort'); }), root.querySelector('.kc-actions'));
        } else {
          KC.kudiReact('correct');
          KC.voice.play(KC.coinLine(c.denom), { reaction: true });   // "Fifty pesewas!"
        }
      }, { sfx: 'pop', say: KC.coinLine(c.denom) });
      scene.appendChild(t);
    });
    root.appendChild(dots);
    root.appendChild(scene);
  };

  /* ------------------------------------------------------------ SORT: drag first, tap fallback, count badge per coin */
  KC.activitySort = function (root) {
    var coins = KC.lostCoinSet();
    var ids = KC.region().lostCoinsSet;
    var tries = {}, picked = null, remaining = coins.length, dragging = null;
    KC.state.lostCoins.sortedCorrectFirstTry = true;

    var jars = ids.map(function (id) {
      var d = KC.denom(id);
      var badge = h('span', { 'data-component': 'count-badge', 'data-count': '0', 'aria-live': 'polite' }, '0');
      var jar = h('button', { 'data-component': 'jar', 'data-jar': id, 'aria-label': KC.t('a11y.jar_for', { coin: d.label }) },
        badge, KC.coinImg(id, { class: 'kc-jar-label' }), h('div', { class: 'kc-jar-glass', 'aria-hidden': 'true' }));
      jar.addEventListener('click', function () { if (picked) place(picked, jar); });
      return jar;
    });
    var tray = h('div', { class: 'kc-tray', 'data-primary-group': true, 'aria-label': KC.t('a11y.coins_to_sort') });

    function pick(t) {
      if (picked) picked.classList.remove('is-picked');
      picked = (picked === t) ? null : t;
      if (picked) { picked.classList.add('is-picked'); KC.voice.play(KC.coinLine(t.getAttribute('data-denom'))); }
      jars.forEach(function (j) { j.classList.toggle('is-target', !!picked); });
    }
    function place(t, jar) {
      var denom = t.getAttribute('data-denom');
      jars.forEach(function (j) { j.classList.remove('is-target'); });
      if (jar.getAttribute('data-jar') === denom) {
        jar.querySelector('.kc-jar-glass').appendChild(KC.coinImg(denom));
        var b = jar.querySelector('[data-component="count-badge"]');
        var n = parseInt(b.getAttribute('data-count'), 10) + 1;          // rises by exactly one per coin (FR-024)
        b.setAttribute('data-count', String(n)); b.textContent = String(n);
        b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
        jar.classList.remove('kc-hint');
        t.remove(); picked = null; remaining -= 1;
        KC.sfx('chime');
        if (remaining === 0) {
          KC.sfx('sparkle'); KC.kudiReact('celebrate'); KC.voice.play('sort.all', { reaction: true });
          KC.promote(tray, KC.primary(KC.t('next'), function () { KC.go('activity-count'); }), root.querySelector('.kc-actions'));
        } else {
          KC.kudiReact('correct');
          if (remaining % 3 === 0) KC.voice.play('sort.good', { reaction: true });
        }
      } else {
        var uid = t.getAttribute('data-coin');
        tries[uid] = (tries[uid] || 0) + 1;
        KC.state.lostCoins.sortedCorrectFirstTry = false;
        t.classList.remove('is-picked', 'is-gentle'); void t.offsetWidth; t.classList.add('is-gentle');
        picked = null;
        KC.sfx('boop');
        KC.kudiReact('encourage');
        KC.voice.play('sort.try_again', { reaction: true });
        if (tries[uid] >= 2) jars.forEach(function (j) { if (j.getAttribute('data-jar') === denom) j.classList.add('kc-hint'); });
      }
    }

    coins.forEach(function (c) {
      var t = coinToken(c, { 'data-child-action': 'drag', 'data-say': KC.coinLine(c.denom) });
      var start = null, moved = false;
      t.addEventListener('pointerdown', function (e) {
        if (dragging && dragging !== t) return;                 // only one coin at a time (edge case)
        dragging = t;
        start = { x: e.clientX, y: e.clientY, id: e.pointerId }; moved = false;
        try { t.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      t.addEventListener('pointermove', function (e) {
        if (!start || e.pointerId !== start.id) return;
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 8) return;
        moved = true; t.classList.add('is-dragging');
        t.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.15)';
      });
      t.addEventListener('pointerup', function (e) {
        if (!start || e.pointerId !== start.id) return;
        var wasMoved = moved; start = null; moved = false; dragging = null;
        t.classList.remove('is-dragging'); t.style.transform = '';
        KC.resetIdle();
        if (!wasMoved) { KC.sfx('tap'); pick(t); return; }      // tap fallback
        t.style.visibility = 'hidden';
        var under = document.elementFromPoint(e.clientX, e.clientY);
        t.style.visibility = '';
        var jar = under && under.closest ? under.closest('[data-component="jar"]') : null;
        if (jar) place(t, jar);                                  // outside any jar: floats back silently
      });
      t.addEventListener('pointercancel', function () { start = null; dragging = null; t.classList.remove('is-dragging'); t.style.transform = ''; });
      /* Keyboard and switch access: Enter/Space make a click with detail 0 (pointer taps are handled on pointerup). */
      t.addEventListener('click', function (e) { if (e.detail === 0) { KC.resetIdle(); KC.sfx('tap'); pick(t); } });
      tray.appendChild(t);
    });

    root.appendChild(h('div', { class: 'kc-jar-row' }, jars));
    root.appendChild(tray);
  };

  /* ------------------------------------------------------------ COUNT: tap to count, then "Which jar has the most coins?" */
  KC.activityCount = function (root) {
    var ids = KC.region().lostCoinsSet;
    var counts = KC.jarCounts();
    var most = counts.indexOf(Math.max.apply(null, counts));
    var jarIndex = 0, n = 0;
    var counter = h('div', { class: 'kc-counter', role: 'status', 'aria-live': 'polite' }, '0');
    var ask = h('div', { class: 'kc-ask', hidden: true },
      h('p', { class: 'kc-child-text' }, KC.lineText('count.which_most')), KC.speakerCue('count.which_most'));
    var jarRow = h('div', { class: 'kc-jar-row' });
    var jars = ids.map(function (id, i) {
      var d = KC.denom(id);
      var glass = h('div', { class: 'kc-jar-glass' });
      for (var k = 0; k < counts[i]; k++) glass.appendChild(coinToken({ uid: id + k, denom: id }));
      var jar = h('div', { 'data-component': 'jar', 'data-jar': id, 'aria-label': KC.t('a11y.jar_for', { coin: d.label }) },
        KC.coinImg(id, { class: 'kc-jar-label' }), h('span', { class: 'kc-jar-count', 'data-jar-count': true }, ''), glass);
      jarRow.appendChild(jar);
      return jar;
    });
    function activate() {
      jars.forEach(function (j, i) {
        var g = j.querySelector('.kc-jar-glass');
        if (i === jarIndex) { g.setAttribute('data-primary-group', ''); j.classList.add('is-target'); } else { g.removeAttribute('data-primary-group'); j.classList.remove('is-target'); }
      });
    }
    function startQuestion() {                                   // call and response (FR-027)
      ask.hidden = false;
      jarRow.setAttribute('data-primary-group', '');
      jarRow.classList.add('is-asking');            // the jars (not the counted coins) are the answers now
      jars.forEach(function (j, i) {
        j.classList.remove('is-target');
        KC.childAction(j, 'answer', function () {
          if (j.classList.contains('is-answered')) return;
          if (i === most) {
            j.classList.add('is-answered', 'is-target');
            KC.sfx('sparkle'); KC.kudiReact('correct'); KC.voice.play('count.most_yes', { reaction: true });
            var found = KC.state.lostCoins.found || KC.hidden();
            if (!KC.state.lostCoins.earned && !KC.state.lostCoins.completedOnce) {
              KC.state.coins += found;
              KC.addEvent('earn', found, 'missions', 'history.lost_coins', 'goal-coins');
              KC.state.lostCoins.earned = true;
            }
            KC.promote(jarRow, KC.primary(KC.t('next'), function () { KC.go('decision'); }), root.querySelector('.kc-actions'));
          } else {
            KC.sfx('boop'); KC.kudiReact('encourage'); KC.voice.play('count.most_try', { reaction: true });
          }
        }, { sfx: false });
      });
      KC.voice.play('count.which_most');
      KC.resetIdle();
    }
    jars.forEach(function (j, i) {
      j.querySelectorAll('[data-component="coin-token"]').forEach(function (t) {
        KC.childAction(t, 'count', function () {
          if (i !== jarIndex || t.classList.contains('is-counted')) { if (i !== jarIndex) KC.voice.play('count.say'); return; }
          t.classList.add('is-counted'); t.setAttribute('aria-disabled', 'true');
          n += 1; counter.textContent = String(n);
          counter.classList.remove('is-tick'); void counter.offsetWidth; counter.classList.add('is-tick');
          KC.voice.play('num.' + n);
          if (n === counts[i]) {
            j.classList.remove('is-target'); j.classList.add('is-done');
            j.querySelector('[data-jar-count]').textContent = String(n);   // how many coins — never a money total (4–6)
            j.querySelector('.kc-jar-glass').removeAttribute('data-primary-group');
            KC.kudiReact('correct');
            jarIndex += 1; n = 0;
            if (jarIndex < jars.length) setTimeout(function () { counter.textContent = '0'; activate(); KC.resetIdle(); }, 500);
            else { KC.kudiReact('celebrate'); startQuestion(); }
          }
        }, { sfx: 'tick' });
      });
    });
    activate();
    root.appendChild(counter);
    root.appendChild(jarRow);
    root.appendChild(ask);
  };
})();
