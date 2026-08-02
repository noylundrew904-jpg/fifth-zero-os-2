/* ==========================================================================
   FZ.toast — a single quiet notification ("Task added", "Saved"). Never
   blocks the workflow — no buttons that must be dismissed, auto-hides.
   Optionally carries one action button (used for "Undo" after a delete).
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el, clear } = FZ.dom;

  let hideTimer = null;

  function host() {
    let node = document.getElementById('fzToast');
    if (!node) {
      node = el('div', { id: 'fzToast', class: 'toast' });
      document.body.appendChild(node);
    }
    return node;
  }

  // show(message) or show(message, { actionLabel, onAction, duration })
  function show(message, options) {
    options = options || {};
    const node = host();
    clear(node);
    node.appendChild(el('span', {}, message));
    if (options.actionLabel && options.onAction) {
      node.appendChild(el('button', {
        class: 'toast-action', type: 'button',
        onclick: () => { options.onAction(); hide(); },
      }, options.actionLabel));
    }
    node.classList.add('toast-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, options.duration || 2400);
  }

  function hide() {
    const node = document.getElementById('fzToast');
    if (node) node.classList.remove('toast-visible');
  }

  FZ.toast = { show, hide };
})(window.FZ = window.FZ || {});
