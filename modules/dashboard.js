/* ==========================================================================
   FZ.modules.dashboard — the home screen. A greeting, six summary cards
   (each one click away from its full module), and four quick-add actions.
   This is the only screen that must never feel overwhelming — it shows
   numbers, not lists.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { summaryCard } = FZ.card;
  const fmt = FZ.format;

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function renderHeader() {
    const now = new Date();
    const name = FZ.storage.get('settings').name;
    return el('div', { class: 'dashboard-header' }, [
      el('div', { class: 'dashboard-greeting' }, greeting() + (name ? ', ' + name : '')),
      el('div', { class: 'dashboard-datetime' }, now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })),
    ]);
  }

  function renderCards(navigate) {
    const cash = FZ.modules.finance.cashAvailable();
    const pending = FZ.modules.finance.pendingPaymentsTotal();

    return el('div', { class: 'summary-grid' }, [
      summaryCard({
        icon: '✓', label: 'Tasks Today', value: String(FZ.modules.tasks.dueToday().length),
        sublabel: FZ.modules.tasks.openCount() + ' open total', onClick: () => navigate('tasks'),
      }),
      summaryCard({
        icon: '$', label: 'Cash Available', value: fmt.currency(cash),
        sublabel: 'Across all transactions', onClick: () => navigate('finance'),
      }),
      summaryCard({
        icon: '⏳', label: 'Pending Payments', value: fmt.currency(pending),
        sublabel: 'Outstanding invoices', onClick: () => navigate('finance'),
      }),
      summaryCard({
        icon: '◐', label: 'Steps', value: FZ.modules.health.todaySteps().toLocaleString(),
        sublabel: 'Today', onClick: () => navigate('health'),
      }),
      summaryCard({
        icon: '◑', label: 'Calories', value: FZ.modules.health.todayCalories().toLocaleString(),
        sublabel: 'Today', onClick: () => navigate('health'),
      }),
      summaryCard({
        icon: '▦', label: 'Calendar Events', value: String(FZ.modules.calendar.todayEventCount()),
        sublabel: 'Today', onClick: () => navigate('calendar'),
      }),
    ]);
  }

  function renderQuickActions(rerenderDashboard) {
    return el('div', { class: 'quick-actions' }, [
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => FZ.modules.tasks.openForm(null, rerenderDashboard) }, '+ Task'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => FZ.modules.finance.openTransactionForm('expense', rerenderDashboard) }, '+ Expense'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => FZ.modules.clients.openForm(null, rerenderDashboard) }, '+ Client'),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => FZ.modules.knowledge.openForm(null, rerenderDashboard) }, '+ Note'),
    ]);
  }

  function render(container, navigate) {
    container.innerHTML = '';
    const rerender = () => render(container, navigate);
    container.appendChild(renderHeader());
    container.appendChild(renderCards(navigate));
    container.appendChild(renderQuickActions(rerender));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.dashboard = { render };
})(window.FZ = window.FZ || {});
