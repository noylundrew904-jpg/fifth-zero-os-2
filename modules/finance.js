/* ==========================================================================
   FZ.modules.finance — income, expenses, subscriptions, loans, invoices,
   and a small canvas chart of the last 6 months. Also exposes the cash
   and pending-payments figures the dashboard cards show.
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
    const { transactions } = data();
    return transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  }

  function pendingPaymentsTotal() {
    const { invoices } = data();
    return invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);
  }

  // ---- Transactions -----------------------------------------------------------

  function openTransactionForm(type, onSaved) {
    const clients = FZ.storage.get('clients');
    const projects = FZ.storage.get('projects');
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
    const clients = FZ.storage.get('clients');
    const projects = FZ.storage.get('projects');
    const fields = [
      { name: 'clientId', label: 'Client', type: 'select',
        options: [{ value: '', label: 'None' }].concat(clients.map((c) => ({ value: c.id, label: c.name }))) },
      { name: 'projectId', label: 'Project', type: 'select',
        options: [{ value: '', label: 'None' }].concat(projects.map((p) => ({ value: p.id, label: p.name }))) },
      { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
      { name: 'status', label: 'Status', type: 'select', value: 'pending',
        options: [{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }] },
      { name: 'dueDate', label: 'Due date', type: 'date', value: fmt.todayISO() },
    ];
    const { form } = FZ.form.build(fields, 'Add invoice', (values) => {
      const d = data();
      d.invoices.push(Object.assign({ id: FZ.id(), issuedDate: fmt.todayISO() }, values));
      save(d);
      FZ.modal.close();
      if (onSaved) onSaved();
    });
    FZ.modal.open({ title: 'New invoice', body: form });
  }

  // ---- Chart: last 6 months net (income - expense) ---------------------------

  function drawMonthlyChart(canvas, transactions) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth * 2;
    const height = canvas.height = canvas.clientHeight * 2;
    ctx.clearRect(0, 0, width, height);

    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-US', { month: 'short' }) });
    }

    const totals = months.map((m) => {
      return transactions
        .filter((t) => (t.date || '').startsWith(m.key))
        .reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
    });

    const maxAbs = Math.max(1, ...totals.map((v) => Math.abs(v)));
    const barWidth = width / months.length;
    const zeroY = height / 2;

    totals.forEach((value, i) => {
      const barHeight = (Math.abs(value) / maxAbs) * (height / 2 - 24);
      const x = i * barWidth + barWidth * 0.25;
      const w = barWidth * 0.5;
      ctx.fillStyle = value >= 0 ? '#4ade80' : '#f87171';
      if (value >= 0) ctx.fillRect(x, zeroY - barHeight, w, barHeight);
      else ctx.fillRect(x, zeroY, w, barHeight);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(months[i].label, x + w / 2, height - 6);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();
  }

  // ---- Render -----------------------------------------------------------------

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';
    const d = data();

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
    requestAnimationFrame(() => drawMonthlyChart(chartCanvas, d.transactions));

    // Transactions
    const txList = el('div', { class: 'list' },
      d.transactions.length ? d.transactions
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 25)
        .map((t) => FZ.listRow.build({
          title: (t.category || (t.type === 'income' ? 'Income' : 'Expense')) + ' — ' + fmt.currency(t.amount),
          meta: fmt.friendlyDate(t.date),
          tag: t.type,
          tagClass: t.type === 'income' ? 'success' : 'danger',
          onDelete: () => { const nd = data(); nd.transactions = nd.transactions.filter((x) => x.id !== t.id); save(nd); rerender(); },
        })) : [emptyState('No transactions yet.')]
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
    const subList = el('div', { class: 'list' },
      d.subscriptions.length ? d.subscriptions.map((s) => FZ.listRow.build({
        title: s.name + ' — ' + fmt.currency(s.amount) + ' / ' + s.cycle,
        meta: 'Next charge ' + fmt.friendlyDate(s.nextDate),
        onDelete: () => { const nd = data(); nd.subscriptions = nd.subscriptions.filter((x) => x.id !== s.id); save(nd); rerender(); },
      })) : [emptyState('No subscriptions tracked.')]
    );
    container.appendChild(section({
      title: 'Subscriptions',
      actions: el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openSubscriptionForm(rerender) }, '+ Subscription'),
      children: subList,
    }));

    // Loans
    const loanList = el('div', { class: 'list' },
      d.loans.length ? d.loans.map((l) => FZ.listRow.build({
        title: l.name + ' — ' + fmt.currency(l.remaining) + ' remaining',
        meta: (l.rate ? l.rate + '% · ' : '') + (l.dueDate ? 'Next due ' + fmt.friendlyDate(l.dueDate) : ''),
        onDelete: () => { const nd = data(); nd.loans = nd.loans.filter((x) => x.id !== l.id); save(nd); rerender(); },
      })) : [emptyState('No loans tracked.')]
    );
    container.appendChild(section({
      title: 'Loans',
      actions: el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openLoanForm(rerender) }, '+ Loan'),
      children: loanList,
    }));

    // Invoices
    const invoiceList = el('div', { class: 'list' },
      d.invoices.length ? d.invoices.map((inv) => {
        const client = FZ.storage.get('clients').find((c) => c.id === inv.clientId);
        return FZ.listRow.build({
          title: (client ? client.name : 'Unassigned') + ' — ' + fmt.currency(inv.amount),
          meta: 'Due ' + fmt.friendlyDate(inv.dueDate),
          tag: inv.status,
          tagClass: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'default',
          onToggle: inv.status === 'paid' ? null : () => {
            const nd = data();
            const target = nd.invoices.find((x) => x.id === inv.id);
            target.status = 'paid';
            save(nd);
            rerender();
          },
          onDelete: () => { const nd = data(); nd.invoices = nd.invoices.filter((x) => x.id !== inv.id); save(nd); rerender(); },
        });
      }) : [emptyState('No invoices yet.')]
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
    cashAvailable, pendingPaymentsTotal,
  };
})(window.FZ = window.FZ || {});
