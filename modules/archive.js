/* ==========================================================================
   FZ.modules.archive — everything soft-deleted across the app, grouped by
   type, for 30 days: Tasks, Clients, Projects, Notes, Habits, Health
   entries, Calendar events, Transactions, Invoices, Subscriptions, Loans.
   Restore brings a record back exactly where it was; "Delete permanently"
   is itself a confirmed, unrecoverable action.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function daysLabel(record) {
    const days = FZ.archive.daysRemaining(record);
    return days + (days === 1 ? ' day' : ' days') + ' left';
  }

  function buildRow(record, title, meta, onRestore, onPurge) {
    return el('div', { class: 'list-row', 'data-id': record.id }, [
      el('div', { class: 'row-left' }, [
        el('div', { class: 'row-text' }, [
          el('div', { class: 'row-title' }, title),
          el('div', { class: 'row-meta' }, [meta, daysLabel(record)].filter(Boolean).join(' · ')),
        ]),
      ]),
      el('div', { class: 'row-right' }, [
        el('button', { class: 'icon-btn', type: 'button', title: 'Restore', 'aria-label': 'Restore ' + title, onclick: onRestore }, '↺'),
        el('button', {
          class: 'icon-btn icon-btn-danger', type: 'button', title: 'Delete permanently', 'aria-label': 'Delete ' + title + ' permanently',
          onclick: () => FZ.deleteFlow.runHard({ label: 'Item', onDelete: onPurge, onDone: onPurge.rerender }),
        }, '✕'),
      ]),
    ]);
  }

  // Top-level array collections (data/storage.js owns these directly).
  const COLLECTIONS = [
    { key: 'tasks', label: 'Tasks', title: (r) => r.title, meta: () => '' },
    { key: 'clients', label: 'Clients', title: (r) => r.name, meta: (r) => r.company || '' },
    { key: 'projects', label: 'Projects', title: (r) => r.name, meta: () => '' },
    { key: 'notes', label: 'Notes', title: (r) => r.title, meta: () => '' },
    { key: 'habits', label: 'Habits', title: (r) => r.name, meta: () => '' },
    { key: 'health', label: 'Health entries', title: (r) => fmt.friendlyDate(r.date), meta: () => '' },
    { key: 'calendar', label: 'Calendar events', title: (r) => r.title, meta: (r) => fmt.friendlyDate(r.date) },
  ];

  // Collections nested inside the single 'finance' record rather than
  // owning a top-level storage key — same FZ.archive primitives, applied
  // to financeData[arrayField] and saved back through FZ.storage.set.
  const FINANCE_COLLECTIONS = [
    { field: 'transactions', label: 'Transactions', title: (tx) => (tx.category || tx.type) + ' — ' + fmt.currency(tx.amount), meta: (tx) => fmt.friendlyDate(tx.date) },
    { field: 'invoices', label: 'Invoices', title: (inv) => {
        const client = FZ.storage.list('clients').find((c) => c.id === inv.clientId);
        return (client ? client.name : 'Unassigned') + ' — ' + fmt.currency(inv.amount);
      }, meta: (inv) => 'Due ' + fmt.friendlyDate(inv.dueDate) },
    { field: 'subscriptions', label: 'Subscriptions', title: (s) => s.name + ' — ' + fmt.currency(s.amount) + ' / ' + s.cycle, meta: () => '' },
    { field: 'loans', label: 'Loans', title: (l) => l.name + ' — ' + fmt.currency(l.remaining) + ' remaining', meta: () => '' },
  ];

  function countTrashed() {
    const financeData = FZ.storage.get('finance');
    const collectionCount = COLLECTIONS.reduce((sum, c) => sum + FZ.storage.trashed(c.key).length, 0);
    const financeCount = FINANCE_COLLECTIONS.reduce((sum, c) => sum + FZ.archive.trashed(financeData[c.field]).length, 0);
    return collectionCount + financeCount;
  }

  function renderCollectionSection(container, config, rerender) {
    const trashed = FZ.storage.trashed(config.key);
    if (!trashed.length) return;
    const list = el('div', { class: 'list' }, trashed.map((record) => {
      const purge = () => FZ.storage.remove(config.key, record.id);
      purge.rerender = rerender;
      return buildRow(
        record, config.title(record), config.meta(record),
        () => { FZ.storage.restore(config.key, record.id); FZ.toast.show(config.label.replace(/s$/, '') + ' restored'); rerender(); },
        purge
      );
    }));
    container.appendChild(section({ title: config.label, children: list }));
  }

  function renderFinanceSection(container, config, rerender) {
    const financeData = FZ.storage.get('finance');
    const trashed = FZ.archive.trashed(financeData[config.field]);
    if (!trashed.length) return;
    const list = el('div', { class: 'list' }, trashed.map((record) => {
      const purge = () => {
        const d = FZ.storage.get('finance');
        d[config.field] = FZ.archive.removeById(d[config.field], record.id);
        FZ.storage.set('finance', d);
      };
      purge.rerender = rerender;
      return buildRow(
        record, config.title(record), config.meta(record),
        () => {
          const d = FZ.storage.get('finance');
          d[config.field] = FZ.archive.restoreById(d[config.field], record.id);
          FZ.storage.set('finance', d);
          FZ.toast.show(config.label.replace(/s$/, '') + ' restored');
          rerender();
        },
        purge
      );
    }));
    container.appendChild(section({ title: config.label, children: list }));
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    if (countTrashed() === 0) {
      container.appendChild(section({
        title: 'Archive',
        children: emptyState({
          icon: '🗑',
          title: 'Archive is empty',
          message: 'Anything you delete — tasks, clients, projects, notes, habits, health entries, calendar events, transactions, invoices, subscriptions, loans — stays here for 30 days before it’s gone for good.',
        }),
      }));
      return;
    }

    COLLECTIONS.forEach((config) => renderCollectionSection(container, config, rerender));
    FINANCE_COLLECTIONS.forEach((config) => renderFinanceSection(container, config, rerender));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.archive = { render };
})(window.FZ = window.FZ || {});
