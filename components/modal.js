/* ==========================================================================
   FZ.modal — one reusable modal shell every "+ Add" form renders into.
   Callers supply a title and a body element/fragment; modal handles the
   overlay, escape-to-close, and click-outside-to-close behavior.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el, clear } = FZ.dom;

  let overlay = null;
  let onCloseCallback = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = el('div', {
      class: 'modal-overlay',
      onclick: (e) => { if (e.target === overlay) close(); },
    });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('modal-open')) close();
    });
    return overlay;
  }

  // open({ title, body, onClose }) — body is a DOM node (usually a <form>).
  function open(config) {
    const root = ensureOverlay();
    clear(root);
    onCloseCallback = config.onClose || null;

    const card = el('div', { class: 'modal-card' }, [
      el('div', { class: 'modal-head' }, [
        el('h2', {}, config.title),
        el('button', { class: 'modal-close', type: 'button', onclick: close, 'aria-label': 'Close' }, '✕'),
      ]),
      config.body,
    ]);

    root.appendChild(card);
    root.classList.add('modal-open');
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('modal-open');
    clear(overlay);
    if (onCloseCallback) onCloseCallback();
    onCloseCallback = null;
  }

  FZ.modal = { open, close };
})(window.FZ = window.FZ || {});
