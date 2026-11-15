/* KudiCubs prototype — celebration burst (T037). Skipped under prefers-reduced-motion. */
(function () {
  'use strict';
  var KC = window.KC;
  var COLORS = ['var(--kc-color-brand-sunshine-yellow)', 'var(--kc-color-brand-adventure-orange)', 'var(--kc-color-brand-golden-orange)',
                'var(--kc-color-brand-soft-gold)', 'var(--kc-color-brand-mane-brown)'];

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
          layer.appendChild(KC.coinImg(KC.region().coinIcon, { class: 'kc-confetti kc-confetti--coin', style: style }));
        } else {
          layer.appendChild(KC.h('span', { class: 'kc-confetti', style: style + 'background:' + COLORS[i % COLORS.length] }));
        }
      }
    }
    overlay.appendChild(layer);
    if (message) overlay.appendChild(message);
    setTimeout(function () { overlay.innerHTML = ''; }, 2200);
  };
})();
