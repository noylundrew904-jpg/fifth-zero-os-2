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

  function emptyState(message) {
    return el('div', { class: 'empty-state' }, message);
  }

  FZ.card = { summaryCard, section, emptyState };
})(window.FZ = window.FZ || {});
