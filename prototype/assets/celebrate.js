/* KudiCubs prototype — celebration burst (T037). Skipped under prefers-reduced-motion. */
(function () {
  'use strict';
  var KC = window.KC;
  var COLORS = ['gold-500', 'terracotta-600', 'hibiscus-600', 'green-700', 'teal-700'];

  KC.celebrate = function (message) {
    var overlay = document.getElementById('kc-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var layer = KC.h('div', { 'data-component': 'celebration-overlay', 'aria-hidden': 'true' });
    if (!reduce) {
      for (var i = 0; i < 36; i++) {
        var coin = i % 6 === 0;
        var style = 'left:' + Math.round(Math.random() * 96) + '%;animation-delay:' + Math.round(Math.random() * 500) + 'ms;';
        if (coin) {
          layer.appendChild(KC.h('img', { class: 'kc-confetti kc-confetti--coin', style: style, alt: '', src: 'assets/art/' + KC.coinSrc(KC.region().coinIcon), 'data-region': KC.state.region }));
        } else {
          layer.appendChild(KC.h('span', { class: 'kc-confetti', style: style + 'background:var(--kc-color-' + COLORS[i % COLORS.length] + ')' }));
        }
      }
    }
    overlay.appendChild(layer);
    if (message) overlay.appendChild(message);
    setTimeout(function () { overlay.innerHTML = ''; }, 2200);
  };
})();
