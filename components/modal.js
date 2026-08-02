/* ==========================================================================
   FZ.modal — one reusable modal shell every "+ Add" form and detail view
   renders into. Callers supply a title and a body element/fragment; modal
   handles the overlay, escape-to-close, click-outside-to-close, and
   accessibility (focus trap, initial focus, focus restore on close).
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el, clear } = FZ.dom;

  let overlay = null;
  let onCloseCallback = null;
  let lastFocused = null;
  let titleId = 0;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = el('div', {
      class: 'modal-overlay',
      onclick: (e) => { if (e.target === overlay) close(); },
    });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('modal-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab') trapTab(e);
    });
    return overlay;
  }

  function trapTab(e) {
    const card = overlay.querySelector('.modal-card');
    if (!card) return;
    const focusable = Array.from(card.querySelectorAll(FOCUSABLE));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // open({ title, body, onClose }) — body is a DOM node (usually a <form>).
  function open(config) {
    const root = ensureOverlay();
    clear(root);
    onCloseCallback = config.onClose || null;
    lastFocused = document.activeElement;
    titleId += 1;
    const headingId = 'modalTitle' + titleId;

    const card = el('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': headingId }, [
      el('div', { class: 'modal-head' }, [
        el('h2', { id: headingId }, config.title),
        el('button', { class: 'modal-close', type: 'button', onclick: close, 'aria-label': 'Close dialog' }, '✕'),
      ]),
      config.body,
    ]);

    root.appendChild(card);
    root.classList.add('modal-open');

    const firstField = card.querySelector('input, textarea, select');
    (firstField || card.querySelector('.modal-close')).focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('modal-open');
    clear(overlay);
    if (onCloseCallback) onCloseCallback();
    onCloseCallback = null;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  FZ.modal = { open, close };
})(window.FZ = window.FZ || {});
