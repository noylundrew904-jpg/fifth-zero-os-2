/* ==========================================================================
   FZ.toast — a single quiet confirmation toast ("Task added", "Saved").
   Keeps feedback out of the way instead of stacking multiple banners.
   ========================================================================== */

(function (FZ) {
  'use strict';

  let hideTimer = null;

  function show(message) {
    let host = document.getElementById('fzToast');
    if (!host) {
      host = FZ.dom.el('div', { id: 'fzToast', class: 'toast' });
      document.body.appendChild(host);
    }
    host.textContent = message;
    host.classList.add('toast-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => host.classList.remove('toast-visible'), 2200);
  }

  FZ.toast = { show };
})(window.FZ = window.FZ || {});
