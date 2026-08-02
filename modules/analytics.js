/* ==========================================================================
   FZ.modules.analytics — trends pulled from real data across every module:
   tasks completed per week, 6-month cash flow (same figures as Finance),
   habit consistency over the last 30 days, and a 14-day step trend. No
   dashboard card (the spec caps that at six) — reachable from the sidebar.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  // Completions are read from the raw (unfiltered-by-deletedAt) task list:
  // "what you got done" shouldn't disappear from your history just because
  // you later archived the task record itself.
  function tasksCompletedPerWeek(weeks) {
    const completed = FZ.storage.get('tasks').filter((t) => t.completedAt);
    const labels = [];
    const values = [];
    const now = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(now); end.setDate(now.getDate() - i * 7);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      const startISO = fmt.toISODate(start);
      const endISO = fmt.toISODate(end);
      const count = completed.filter((t) => {
        const d = t.completedAt.slice(0, 10);
        return d >= startISO && d <= endISO;
      }).length;
      labels.push(end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values.push(count);
    }
    return { labels, values };
  }

  function stepsLastNDays(days) {
    const byDate = {};
    FZ.storage.list('health').forEach((e) => { byDate[e.date] = Number(e.steps) || 0; });
    const labels = [];
    const values = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      labels.push(String(d.getDate()));
      values.push(byDate[fmt.toISODate(d)] || 0);
    }
    return { labels, values };
  }

  function habitConsistency() {
    return FZ.storage.list('habits').map((h) => {
      const completions = new Set(h.completions || []);
      let doneCount = 0;
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        if (completions.has(fmt.toISODate(d))) doneCount += 1;
      }
      return { name: h.name, pct: Math.round((doneCount / 30) * 100) };
    });
  }

  function thisMonthKey() {
    return fmt.todayISO().slice(0, 7);
  }

  function tasksCompletedThisMonth() {
    return FZ.storage.get('tasks').filter((t) => (t.completedAt || '').startsWith(thisMonthKey())).length;
  }

  function revenueThisMonth() {
    return FZ.archive.active(FZ.storage.get('finance').transactions)
      .filter((t) => t.type === 'income' && (t.date || '').startsWith(thisMonthKey()))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  function longestActiveStreak() {
    return FZ.storage.list('habits').reduce((max, h) => Math.max(max, FZ.modules.habits.streak(h)), 0);
  }

  function avgStepsLast7() {
    const { values } = stepsLastNDays(7);
    return Math.round(values.reduce((a, b) => a + b, 0) / 7);
  }

  function render(container) {
    container.innerHTML = '';

    // Top-line stats for the current month.
    container.appendChild(section({
      title: 'This month',
      children: el('div', { class: 'stat-row' }, [
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Tasks completed'), el('div', { class: 'stat-value' }, String(tasksCompletedThisMonth()))]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Revenue'), el('div', { class: 'stat-value' }, fmt.currency(revenueThisMonth()))]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Avg steps / day'), el('div', { class: 'stat-value' }, avgStepsLast7().toLocaleString())]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Longest active streak'), el('div', { class: 'stat-value' }, longestActiveStreak() + 'd')]),
      ]),
    }));

    // Tasks completed per week
    const taskCanvas = el('canvas', { class: 'chart-canvas' });
    container.appendChild(section({ title: 'Tasks completed (last 6 weeks)', children: taskCanvas }));
    const taskWeekly = tasksCompletedPerWeek(6);
    requestAnimationFrame(() => FZ.chart.drawBarChart(taskCanvas, { labels: taskWeekly.labels, values: taskWeekly.values, singleColor: '#7c8cff' }));

    // Cash flow — same underlying numbers as Finance's overview chart.
    const financeData = FZ.storage.get('finance');
    if (FZ.archive.active(financeData.transactions).length) {
      const cashCanvas = el('canvas', { class: 'chart-canvas' });
      container.appendChild(section({ title: 'Cash flow (last 6 months)', children: cashCanvas }));
      const monthly = FZ.modules.finance.monthlyNetTotals(FZ.archive.active(financeData.transactions), 6);
      requestAnimationFrame(() => FZ.chart.drawBarChart(cashCanvas, { labels: monthly.labels, values: monthly.totals }));
    } else {
      container.appendChild(section({
        title: 'Cash flow',
        children: emptyState({ icon: '$', title: 'No transactions yet', message: 'Cash flow trends will show up once you log income or expenses in Finance.' }),
      }));
    }

    // Habit consistency
    const habits = habitConsistency();
    container.appendChild(section({
      title: 'Habit consistency (last 30 days)',
      children: habits.length
        ? el('div', { class: 'consistency-list' }, habits.map((h) => el('div', { class: 'consistency-row' }, [
            el('div', { class: 'consistency-label' }, h.name),
            el('div', { class: 'consistency-track' }, [el('div', { class: 'consistency-fill', style: `width:${h.pct}%` })]),
            el('div', { class: 'consistency-pct' }, h.pct + '%'),
          ])))
        : emptyState({ icon: '↻', title: 'No habits yet', message: 'Add a habit to see your consistency here.' }),
    }));

    // Steps trend
    if (FZ.storage.list('health').length) {
      const stepsCanvas = el('canvas', { class: 'chart-canvas' });
      container.appendChild(section({ title: 'Steps (last 14 days)', children: stepsCanvas }));
      const steps = stepsLastNDays(14);
      requestAnimationFrame(() => FZ.chart.drawBarChart(stepsCanvas, { labels: steps.labels, values: steps.values, singleColor: '#facc15' }));
    } else {
      container.appendChild(section({
        title: 'Steps',
        children: emptyState({ icon: '♥', title: 'No health entries yet', message: 'Log steps in Health to see your trend here.' }),
      }));
    }
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.analytics = { render };
})(window.FZ = window.FZ || {});
