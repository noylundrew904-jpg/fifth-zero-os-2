/* ==========================================================================
   FZ.modules.archive — everything soft-deleted across the app, grouped by
   type, for 30 days: Tasks, Clients, Projects, Notes, Habits, Health
   entries, Transactions, Invoices. Restore brings a record back exactly
   where it was; "Delete permanently" is itself a confirmed, unrecoverable
   action.
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
        el('button', { class: 'icon-btn', type: 'button', title: 'Restore', onclick: onRestore }, '↺'),
        el('button', {
          class: 'icon-btn icon-btn-danger', type: 'button', title: 'Delete permanently',
          onclick: () => FZ.deleteFlow.runHard({ label: 'Item', onDelete: onPurge, onDone: onPurge.rerender }),
        }, '✕'),
      ]),
    ]);
  }

  // Top-level array collections (data/storage.js owns these directly).
  const COLLECTIONS = [
    { key: 'tasks', label: 'Tasks', icon: '✓', title: (r) => r.title, meta: () => '' },
    { key: 'clients', label: 'Clients', icon: '☺', title: (r) => r.name, meta: (r) => r.company || '' },
    { key: 'projects', label: 'Projects', icon: '◆', title: (r) => r.name, meta: () => '' },
    { key: 'notes', label: 'Notes', icon: '✎', title: (r) => r.title, meta: () => '' },
    { key: 'habits', label: 'Habits', icon: '↻', title: (r) => r.name, meta: () => '' },
    { key: 'health', label: 'Health entries', icon: '♥', title: (r) => fmt.friendlyDate(r.date), meta: () => '' },
  ];

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

  // Finance transactions/invoices live nested inside the single 'finance'
  // key rather than their own top-level collection, so they're handled
  // separately with the same FZ.archive primitives.
  function renderFinanceSections(container, rerender) {
    const financeData = FZ.storage.get('finance');

    const trashedTx = FZ.archive.trashed(financeData.transactions);
    if (trashedTx.length) {
      const list = el('div', { class: 'list' }, trashedTx.map((tx) => {
        const purge = () => {
          const d = FZ.storage.get('finance');
          d.transactions = FZ.archive.removeById(d.transactions, tx.id);
          FZ.storage.set('finance', d);
        };
        purge.rerender = rerender;
        return buildRow(
          tx, (tx.category || tx.type) + ' — ' + fmt.currency(tx.amount), fmt.friendlyDate(tx.date),
          () => {
            const d = FZ.storage.get('finance');
            d.transactions = FZ.archive.restoreById(d.transactions, tx.id);
            FZ.storage.set('finance', d);
            FZ.toast.show('Transaction restored');
            rerender();
          },
          purge
        );
      }));
      container.appendChild(section({ title: 'Transactions', children: list }));
    }

    const trashedInv = FZ.archive.trashed(financeData.invoices);
    if (trashedInv.length) {
      const list = el('div', { class: 'list' }, trashedInv.map((inv) => {
        const client = FZ.storage.list('clients').find((c) => c.id === inv.clientId);
        const purge = () => {
          const d = FZ.storage.get('finance');
          d.invoices = FZ.archive.removeById(d.invoices, inv.id);
          FZ.storage.set('finance', d);
        };
        purge.rerender = rerender;
        return buildRow(
          inv, (client ? client.name : 'Unassigned') + ' — ' + fmt.currency(inv.amount), 'Due ' + fmt.friendlyDate(inv.dueDate),
          () => {
            const d = FZ.storage.get('finance');
            d.invoices = FZ.archive.restoreById(d.invoices, inv.id);
            FZ.storage.set('finance', d);
            FZ.toast.show('Invoice restored');
            rerender();
          },
          purge
        );
      }));
      container.appendChild(section({ title: 'Invoices', children: list }));
    }
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const financeData = FZ.storage.get('finance');
    const total = COLLECTIONS.reduce((sum, c) => sum + FZ.storage.trashed(c.key).length, 0)
      + FZ.archive.trashed(financeData.transactions).length
      + FZ.archive.trashed(financeData.invoices).length;

    if (total === 0) {
      container.appendChild(section({
        title: 'Archive',
        children: emptyState({
          icon: '🗑',
          title: 'Archive is empty',
          message: 'Deleted tasks, clients, projects, notes, habits, health entries, transactions, and invoices stay here for 30 days before they’re gone for good.',
        }),
      }));
      return;
    }

    COLLECTIONS.forEach((config) => renderCollectionSection(container, config, rerender));
    renderFinanceSections(container, rerender);
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.archive = { render };
})(window.FZ = window.FZ || {});
