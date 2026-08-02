/* ==========================================================================
   FZ.card — building blocks shared by every module screen: the dashboard
   summary card, a section card, and an empty-state placeholder.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;

  // Dashboard home card: icon, label, big value, small sublabel, click-through.
  function summaryCard({ icon, label, value, sublabel, onClick }) {
    return el('button', { class: 'summary-card', type: 'button', onclick: onClick }, [
      el('div', { class: 'summary-icon' }, icon),
      el('div', { class: 'summary-body' }, [
        el('div', { class: 'summary-label' }, label),
        el('div', { class: 'summary-value' }, value),
        sublabel ? el('div', { class: 'summary-sub' }, sublabel) : null,
      ]),
    ]);
  }

  // Generic rounded content section used inside module pages.
  function section({ title, actions, children }) {
    return el('section', { class: 'panel' }, [
      el('div', { class: 'panel-head' }, [
        el('h2', {}, title),
        actions ? el('div', { class: 'panel-actions' }, actions) : null,
      ]),
      el('div', { class: 'panel-body' }, children),
    ]);
  }

  // Every empty module explains what it's for and how to add the first
  // item — never just a blank panel. actionLabel/onAction are optional.
  function emptyState({ icon, title, message, actionLabel, onAction }) {
    return el('div', { class: 'empty-state' }, [
      icon ? el('div', { class: 'empty-icon' }, icon) : null,
      el('div', { class: 'empty-title' }, title),
      el('div', { class: 'empty-message' }, message),
      actionLabel && onAction
        ? el('button', { class: 'btn btn-primary empty-action', type: 'button', onclick: onAction }, actionLabel)
        : null,
    ]);
  }

  FZ.card = { summaryCard, section, emptyState };
})(window.FZ = window.FZ || {});
