/* ==========================================================================
   FZ.confirm — the one confirmation dialog every destructive action goes
   through. Built on the existing modal shell rather than native confirm()
   so it matches the app's look and stays keyboard/click-outside dismissible.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;

  // ask({ title, message, confirmLabel, cancelLabel, danger, onConfirm })
  function ask(config) {
    const body = el('div', { class: 'confirm-body' }, [
      el('p', { class: 'confirm-message' }, config.message),
      el('div', { class: 'confirm-actions' }, [
        el('button', {
          class: 'btn btn-ghost', type: 'button', onclick: () => FZ.modal.close(),
        }, config.cancelLabel || 'Cancel'),
        el('button', {
          class: 'btn ' + (config.danger ? 'btn-danger' : 'btn-primary'),
          type: 'button',
          onclick: () => { FZ.modal.close(); config.onConfirm(); },
        }, config.confirmLabel || 'Confirm'),
      ]),
    ]);
    FZ.modal.open({ title: config.title, body });
  }

  FZ.confirm = { ask };
})(window.FZ = window.FZ || {});
