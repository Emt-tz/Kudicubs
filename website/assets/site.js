/* KudiCubs website behaviour (spec 005 US4). Classic script, no framework, no network, no storage, no cookies.
   Forms here are demonstrations: nothing is sent and nothing is kept. */
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('js');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var DELAY = 900;   /* how long the "sending" state shows */

  function $(s, c) { return (c || d).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function hashState() { var m = /^#state-([a-z-]+)$/.exec(location.hash); return m ? m[1] : null; }

  function start() {
    /* ---- field helpers ---- */
    function fieldOf(input) { return input.closest('.kc-field'); }
    function setError(input, msg) {
      var f = fieldOf(input);
      f.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      $('.kc-error', f).textContent = msg;
    }
    function clearError(input) {
      var f = fieldOf(input);
      f.classList.remove('is-error');
      input.removeAttribute('aria-invalid');
      $('.kc-error', f).textContent = '';
    }
    function checkEmail(input) {
      var v = input.value.trim();
      if (!v) { setError(input, 'Please enter your email address.'); return false; }
      if (!EMAIL.test(v)) { setError(input, 'That does not look like an email address. It should look like name@example.com.'); return false; }
      clearError(input); return true;
    }
    function checkFilled(input, msg) {
      if (!input.value.trim()) { setError(input, msg); return false; }
      clearError(input); return true;
    }
    function setBusy(form, busy) {
      var b = $('[type="submit"]', form);
      if (busy) {
        b.dataset.label = b.textContent; b.textContent = b.dataset.loading || 'Please wait';
        b.classList.add('is-loading'); b.setAttribute('aria-busy', 'true'); b.setAttribute('aria-disabled', 'true');
        form.dataset.state = 'loading';
      } else {
        if (b.dataset.label) b.textContent = b.dataset.label;
        b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); b.removeAttribute('aria-disabled');
      }
    }
    function status(form, msg) { var s = $('.site-status', form); if (s) s.textContent = msg; }
    function showSuccess(form, panel) {
      form.dataset.state = 'success';
      form.hidden = true; panel.hidden = false; panel.focus();
    }
    function resetForm(form, panel) {
      form.reset(); form.hidden = false; panel.hidden = true; form.dataset.state = 'default';
      $all('input, textarea, select', form).forEach(function (i) { clearError(i); });
      status(form, '');
      var first = $('input, textarea, select', form); if (first) first.focus();
    }

    /* ---- menu (small screens) ---- */
    var btn = $('.site-menu-btn'), nav = $('.site-nav');
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      });
    }

    /* ---- generic demo form wiring ---- */
    function wire(form, opts) {
      var panel = opts.panel ? $(opts.panel) : null;
      form.dataset.state = 'default';
      $all('input, textarea, select', form).forEach(function (i) {
        i.addEventListener('input', function () { if (fieldOf(i).classList.contains('is-error')) opts.validate(i); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.dataset.state === 'loading') return;
        if (!opts.validateAll(form)) {
          form.dataset.state = 'error';
          status(form, opts.errorMessage);
          var bad = $('.is-error input, .is-error textarea, .is-error select', form); if (bad) bad.focus();
          return;
        }
        setBusy(form, true); status(form, opts.loadingMessage);
        window.setTimeout(function () { setBusy(form, false); status(form, ''); opts.done(form, panel); }, DELAY);
      });
      var again = panel && $('[data-again]', panel);
      if (again) again.addEventListener('click', function () { resetForm(form, panel); });
      return panel;
    }

    /* ---- contact ---- */
    var contact = $('form[data-form="contact"]');
    if (contact) {
      var cm = $('#c-message'), ce = $('#c-email'), cn = $('#c-name');
      var panelC = wire(contact, {
        panel: '#contact-sent',
        errorMessage: 'Please fix the highlighted fields and try again.',
        loadingMessage: 'Sending your message...',
        validate: function (i) { return i === ce ? checkEmail(i) : i === cm ? checkFilled(i, 'Please write a message.') : i === cn ? checkFilled(i, 'Please tell us your name.') : true; },
        validateAll: function () { var a = checkFilled(cn, 'Please tell us your name.'), b = checkEmail(ce), c = checkFilled(cm, 'Please write a message.'); return a && b && c; },
        done: showSuccess
      });
      var hs = hashState();
      if (hs === 'error') contact.dispatchEvent(new Event('submit', { cancelable: true }));
      else if (hs === 'loading') { setBusy(contact, true); status(contact, 'Sending your message...'); }
      else if (hs === 'success') showSuccess(contact, panelC);
    }

    /* ---- sign-in ---- */
    var signin = $('form[data-form="sign-in"]');
    if (signin) {
      var se = $('#s-email');
      wire(signin, {
        errorMessage: 'Please enter a valid email address.',
        loadingMessage: 'Sending your code...',
        validate: checkEmail,
        validateAll: function () { return checkEmail(se); },
        done: function () { location.href = '../dashboard/parent/index.html#/code'; }   /* no email is passed on: nothing personal in a URL */
      });
      var hs2 = hashState();
      if (hs2 === 'error') signin.dispatchEvent(new Event('submit', { cancelable: true }));
      else if (hs2 === 'loading') { setBusy(signin, true); status(signin, 'Sending your code...'); }
    }

    /* ---- get the app ---- */
    var stores = $('[data-stores]');
    if (stores) {
      var ua = navigator.userAgent || '';
      var platform = /Android/i.test(ua) ? 'android' : /iPhone|iPad|iPod/i.test(ua) ? 'ios' : 'desktop';
      d.body.setAttribute('data-platform', platform);
      var rec = $('[data-store-card="' + platform + '"] .site-badge');
      if (rec) rec.classList.add('is-on');
      $all('[data-store]', stores).forEach(function (b) {
        b.addEventListener('click', function () {
          var note = d.getElementById(b.getAttribute('aria-controls'));
          var open = b.getAttribute('aria-expanded') !== 'true';
          b.setAttribute('aria-expanded', String(open)); note.hidden = !open;
        });
      });
      var send = $('form[data-form="send-link"]'), sl = $('#l-email');
      var panelL = wire(send, {
        panel: '#link-sent',
        errorMessage: 'Please enter a valid email address.',
        loadingMessage: 'Sending the link...',
        validate: checkEmail,
        validateAll: function () { return checkEmail(sl); },
        done: showSuccess
      });
      var hs3 = hashState();
      if (hs3 === 'success') showSuccess(send, panelL);
      else if (hs3 === 'error') send.dispatchEvent(new Event('submit', { cancelable: true }));
    }

    /* ---- FAQ ---- */
    var faq = $('[data-faq]');
    if (faq) {
      var q = $('#faq-search'), items = $all('details', faq), empty = $('#faq-empty'), count = $('#faq-count');
      var filter = function () {
        var t = q.value.trim().toLowerCase(), n = 0;
        items.forEach(function (it) {
          var hit = !t || it.textContent.toLowerCase().indexOf(t) > -1;
          it.hidden = !hit; if (hit) n += 1;
        });
        empty.hidden = n > 0;
        count.textContent = t ? (n + (n === 1 ? ' question matches' : ' questions match') + ' "' + q.value.trim() + '"') : '';
      };
      q.addEventListener('input', filter);
      $('#faq-clear').addEventListener('click', function () { q.value = ''; filter(); q.focus(); });
      if (hashState() === 'empty') { q.value = 'zzzz'; filter(); }
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
