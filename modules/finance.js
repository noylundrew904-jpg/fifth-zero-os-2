/* ==========================================================================
   FZ.modules.finance — income, expenses, subscriptions, loans, invoices,
   and a small canvas chart of the last 6 months. Also exposes the cash
   and pending-payments figures the dashboard cards show.

   Invoices are the one source of truth for money: marking an invoice paid
   auto-creates its income transaction (see markInvoicePaid) instead of
   asking the user to log the income separately, per product decision.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  // ---- Data access ----------------------------------------------------------

  function data() {
    return FZ.storage.get('finance');
  }

  function save(next) {
    FZ.storage.set('finance', next);
  }

  function cashAvailable() {
    const transactions = FZ.archive.active(data().transactions);
    return transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  }

  function pendingPaymentsTotal() {
    const invoices = FZ.archive.active(data().invoices);
    return invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  // Total paid-invoice + logged income for one client — shown on the
  // client detail view.
  function revenueByClient(clientId) {
    return FZ.archive.active(data().transactions)
      .filter((t) => t.type === 'income' && t.clientId === clientId)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  // ---- Invoice -> transaction (single source of truth for money) ------------

  function markInvoicePaid(invoiceId, onDone) {
    const d = data();
    const invoice = d.invoices.find((inv) => inv.id === invoiceId);
    if (!invoice || invoice.status === 'paid') return;

    invoice.status = 'paid';
    const transaction = {
      id: FZ.id(),
      type: 'income',
      amount: invoice.amount,
      category: 'Invoice payment',
      date: fmt.todayISO(),
      clientId: invoice.clientId || '',
      projectId: invoice.projectId || '',
      note: 'Auto-generated from invoice payment',
      invoiceId: invoice.id,
      createdAt: new Date().toISOString(),
    };
    d.transactions.push(transaction);
    invoice.transactionId = transaction.id;

    save(d);
    FZ.toast.show('Invoice paid — income transaction added automatically');
    if (onDone) onDone();
  }

  // ---- Transactions -----------------------------------------------------------

  function openTransactionForm(type, onSaved) {
    const clients = FZ.storage.list('clients');
    const projects = FZ.storage.list('projects');
    const fields = [
      { name: 'type', label: 'Type', type: 'select', value: type || 'expense',
        options: [{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }] },
      { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
      { name: 'category', label: 'Category', value: '', placeholder: 'e.g. Software, Client payment' },
      { name: 'date', label: 'Date', type: 'date', value: fmt.todayISO() },
      { name: 'clientId', label: 'Client', type: 'select', value: '',
        options: [{ value: '', label: 'None' }].concat(clients.map((c) => ({ value: c.id, label: c.name }))) },
      { name: 'projectId', label: 'Project', type: 'select', value: '',
        options: [{ value: '', label: 'None' }].concat(projects.map((p) => ({ value: p.id, label: p.name }))) },
      { name: 'note', label: 'Note', type: 'textarea' },
    ];

    const { form } = FZ.form.build(fields, 'Add transaction', (values) => {
      const d = data();
      d.transactions.push(Object.assign({ id: FZ.id(), createdAt: new Date().toISOString() }, values));
      save(d);
      FZ.toast.show('Transaction added');
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: type === 'income' ? 'New income' : 'New expense', body: form });
  }

  function openSubscriptionForm(onSaved) {
    const fields = [
      { name: 'name', label: 'Name', required: true },
      { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
      { name: 'cycle', label: 'Billing cycle', type: 'select', value: 'monthly',
        options: [{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly' }] },
      { name: 'nextDate', label: 'Next charge', type: 'date', value: fmt.todayISO() },
    ];
    const { form } = FZ.form.build(fields, 'Add subscription', (values) => {
      const d = data();
      d.subscriptions.push(Object.assign({ id: FZ.id() }, values));
      save(d);
      FZ.modal.close();
      if (onSaved) onSaved();
    });
    FZ.modal.open({ title: 'New subscription', body: form });
  }

  function openLoanForm(onSaved) {
    const fields = [
      { name: 'name', label: 'Name', required: true },
      { name: 'principal', label: 'Original amount', type: 'number', step: '0.01', required: true },
      { name: 'remaining', label: 'Remaining balance', type: 'number', step: '0.01', required: true },
      { name: 'rate', label: 'Interest rate %', type: 'number', step: '0.01' },
      { name: 'dueDate', label: 'Next payment due', type: 'date' },
    ];
    const { form } = FZ.form.build(fields, 'Add loan', (values) => {
      const d = data();
      d.loans.push(Object.assign({ id: FZ.id() }, values));
      save(d);
      FZ.modal.close();
      if (onSaved) onSaved();
    });
    FZ.modal.open({ title: 'New loan', body: form });
  }

  function openInvoiceForm(onSaved) {
    const clients = FZ.storage.list('clients');
    const projects = FZ.storage.list('projects');
    const fields = [
      { name: 'clientId', label: 'Client', type: 'select',
        options: [{ value: '', label: 'None' }].concat(clients.map((c) => ({ value: c.id, label: c.name }))) },
      { name: 'projectId', label: 'Project', type: 'select',
        options: [{ value: '', label: 'None' }].concat(projects.map((p) => ({ value: p.id, label: p.name }))) },
      { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
      { name: 'status', label: 'Status', type: 'select', value: 'pending',
        options: [{ value: 'pending', label: 'Pending' }, { value: 'overdue', label: 'Overdue' }] },
      { name: 'dueDate', label: 'Due date', type: 'date', value: fmt.todayISO() },
    ];
    const { form } = FZ.form.build(fields, 'Add invoice', (values) => {
      const d = data();
      d.invoices.push(Object.assign({ id: FZ.id(), issuedDate: fmt.todayISO() }, values));
      save(d);
      FZ.toast.show('Invoice added');
      FZ.modal.close();
      if (onSaved) onSaved();
    });
    FZ.modal.open({ title: 'New invoice', body: form });
  }

  // ---- Chart: last 6 months net (income - expense) ---------------------------
  // Monthly net totals are also used by the Analytics module — exposed as
  // monthlyNetTotals() below rather than recomputed there.

  function monthlyNetTotals(transactions, monthCount) {
    const months = [];
    const now = new Date();
    for (let i = (monthCount || 6) - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }) });
    }
    const totals = months.map((m) => transactions
      .filter((t) => (t.date || '').startsWith(m.key))
      .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0));
    return { labels: months.map((m) => m.label), totals };
  }

  function drawMonthlyChart(canvas, transactions) {
    const { labels, totals } = monthlyNetTotals(transactions, 6);
    FZ.chart.drawBarChart(canvas, { labels, values: totals });
  }

  // ---- Render -----------------------------------------------------------------

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';
    const d = data();
    const activeTransactions = FZ.archive.active(d.transactions);
    const activeInvoices = FZ.archive.active(d.invoices);

    // Overview + chart
    const chartCanvas = el('canvas', { class: 'chart-canvas' });
    const overview = section({
      title: 'Overview',
      children: el('div', {}, [
        el('div', { class: 'stat-row' }, [
          el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Cash available'), el('div', { class: 'stat-value' }, fmt.currency(cashAvailable()))]),
          el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Pending payments'), el('div', { class: 'stat-value' }, fmt.currency(pendingPaymentsTotal()))]),
        ]),
        chartCanvas,
      ]),
    });
    container.appendChild(overview);
    requestAnimationFrame(() => drawMonthlyChart(chartCanvas, activeTransactions));

    // Transactions
    const txList = el('div', { class: 'list' },
      activeTransactions.length ? activeTransactions
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 25)
        .map((t) => FZ.listRow.build({
          id: t.id,
          title: (t.category || (t.type === 'income' ? 'Income' : 'Expense')) + ' — ' + fmt.currency(t.amount),
          meta: fmt.friendlyDate(t.date) + (t.invoiceId ? ' · from invoice' : ''),
          tag: t.type,
          tagClass: t.type === 'income' ? 'success' : 'danger',
          onDelete: () => FZ.deleteFlow.run({
            label: 'Transaction',
            onDelete: () => { const nd = data(); nd.transactions = FZ.archive.softDeleteById(nd.transactions, t.id); save(nd); },
            onUndo: () => { const nd = data(); nd.transactions = FZ.archive.restoreById(nd.transactions, t.id); save(nd); },
            onDone: rerender,
          }),
        })) : [emptyState({
          icon: '$',
          title: 'No transactions yet',
          message: 'Log income and expenses to see cash available and the 6-month trend.',
          actionLabel: '+ Add expense',
          onAction: () => openTransactionForm('expense', rerender),
        })]
    );
    container.appendChild(section({
      title: 'Transactions',
      actions: [
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openTransactionForm('income', rerender) }, '+ Income'),
        el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openTransactionForm('expense', rerender) }, '+ Expense'),
      ],
      children: txList,
    }));

    // Subscriptions
    const activeSubscriptions = FZ.archive.active(d.subscriptions);
    const subList = el('div', { class: 'list' },
      activeSubscriptions.length ? activeSubscriptions.map((s) => FZ.listRow.build({
        id: s.id,
        title: s.name + ' — ' + fmt.currency(s.amount) + ' / ' + s.cycle,
        meta: 'Next charge ' + fmt.friendlyDate(s.nextDate),
        onDelete: () => FZ.deleteFlow.run({
          label: 'Subscription',
          onDelete: () => { const nd = data(); nd.subscriptions = FZ.archive.softDeleteById(nd.subscriptions, s.id); save(nd); },
          onUndo: () => { const nd = data(); nd.subscriptions = FZ.archive.restoreById(nd.subscriptions, s.id); save(nd); },
          onDone: rerender,
        }),
      })) : [emptyState({
        icon: '↻',
        title: 'No subscriptions tracked',
        message: 'Track recurring charges like software or hosting so they don’t catch you off guard.',
        actionLabel: '+ Add subscription',
        onAction: () => openSubscriptionForm(rerender),
      })]
    );
    container.appendChild(section({
      title: 'Subscriptions',
      actions: el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openSubscriptionForm(rerender) }, '+ Subscription'),
      children: subList,
    }));

    // Loans
    const activeLoans = FZ.archive.active(d.loans);
    const loanList = el('div', { class: 'list' },
      activeLoans.length ? activeLoans.map((l) => FZ.listRow.build({
        id: l.id,
        title: l.name + ' — ' + fmt.currency(l.remaining) + ' remaining',
        meta: (l.rate ? l.rate + '% · ' : '') + (l.dueDate ? 'Next due ' + fmt.friendlyDate(l.dueDate) : ''),
        onDelete: () => FZ.deleteFlow.run({
          label: 'Loan',
          onDelete: () => { const nd = data(); nd.loans = FZ.archive.softDeleteById(nd.loans, l.id); save(nd); },
          onUndo: () => { const nd = data(); nd.loans = FZ.archive.restoreById(nd.loans, l.id); save(nd); },
          onDone: rerender,
        }),
      })) : [emptyState({
        icon: '$',
        title: 'No loans tracked',
        message: 'Track balances and due dates for anything you’re paying down.',
        actionLabel: '+ Add loan',
        onAction: () => openLoanForm(rerender),
      })]
    );
    container.appendChild(section({
      title: 'Loans',
      actions: el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openLoanForm(rerender) }, '+ Loan'),
      children: loanList,
    }));

    // Invoices
    const invoiceList = el('div', { class: 'list' },
      activeInvoices.length ? activeInvoices.map((inv) => {
        const client = FZ.storage.list('clients').find((c) => c.id === inv.clientId);
        return FZ.listRow.build({
          id: inv.id,
          title: (client ? client.name : 'Unassigned') + ' — ' + fmt.currency(inv.amount),
          meta: 'Due ' + fmt.friendlyDate(inv.dueDate),
          tag: inv.status,
          tagClass: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'default',
          onToggle: inv.status === 'paid' ? null : () => markInvoicePaid(inv.id, rerender),
          onDelete: () => FZ.deleteFlow.run({
            label: 'Invoice',
            onDelete: () => { const nd = data(); nd.invoices = FZ.archive.softDeleteById(nd.invoices, inv.id); save(nd); },
            onUndo: () => { const nd = data(); nd.invoices = FZ.archive.restoreById(nd.invoices, inv.id); save(nd); },
            onDone: rerender,
          }),
        });
      }) : [emptyState({
        icon: '⏳',
        title: 'No invoices yet',
        message: 'Bill a client, then check it off — paid invoices automatically add the income transaction for you.',
        actionLabel: '+ Add invoice',
        onAction: () => openInvoiceForm(rerender),
      })]
    );
    container.appendChild(section({
      title: 'Invoices',
      actions: el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openInvoiceForm(rerender) }, '+ Invoice'),
      children: invoiceList,
    }));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.finance = {
    render, openTransactionForm, openSubscriptionForm, openLoanForm, openInvoiceForm,
    cashAvailable, pendingPaymentsTotal, revenueByClient, markInvoicePaid, monthlyNetTotals,
  };
})(window.FZ = window.FZ || {});
