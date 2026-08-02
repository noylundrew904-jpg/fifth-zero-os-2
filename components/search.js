/* ==========================================================================
   FZ.search — global search across Tasks, Projects, Clients, Finance
   (transactions/invoices/subscriptions/loans), Notes, Habits, and Health.
   Renders one input in the sidebar; results navigate to the owning module
   and flash the matching row (see script.js's hash "?highlight=" handling).
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el, clear } = FZ.dom;
  const fmt = FZ.format;

  function matches(query, ...fields) {
    const q = query.toLowerCase();
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
  }

  function query(text) {
    if (!text || !text.trim()) return [];
    const q = text.trim();
    const results = [];

    FZ.storage.list('tasks').forEach((t) => {
      if (matches(q, t.title, t.notes)) results.push({ type: 'Task', title: t.title, path: 'tasks', id: t.id });
    });
    FZ.storage.list('projects').forEach((p) => {
      if (matches(q, p.name, p.notes)) results.push({ type: 'Project', title: p.name, path: 'projects', id: p.id });
    });
    FZ.storage.list('clients').forEach((c) => {
      if (matches(q, c.name, c.company, c.email)) results.push({ type: 'Client', title: c.name, path: 'clients', id: c.id });
    });
    FZ.storage.list('notes').forEach((n) => {
      if (matches(q, n.title, n.tags, n.body)) results.push({ type: 'Note', title: n.title, path: 'knowledge', id: n.id });
    });
    FZ.storage.list('habits').forEach((h) => {
      if (matches(q, h.name)) results.push({ type: 'Habit', title: h.name, path: 'habits', id: h.id });
    });
    FZ.storage.list('health').forEach((h) => {
      if (matches(q, h.workout, h.date)) results.push({ type: 'Health', title: fmt.friendlyDate(h.date), path: 'health', id: h.id });
    });

    const financeData = FZ.storage.get('finance');
    FZ.archive.active(financeData.transactions).forEach((t) => {
      if (matches(q, t.category, t.note, t.type)) {
        results.push({ type: 'Transaction', title: (t.category || t.type) + ' — ' + fmt.currency(t.amount), path: 'finance', id: t.id });
      }
    });
    FZ.archive.active(financeData.invoices).forEach((inv) => {
      const client = FZ.storage.list('clients').find((c) => c.id === inv.clientId);
      if (matches(q, client && client.name, inv.status)) {
        results.push({ type: 'Invoice', title: fmt.currency(inv.amount) + (client ? ' — ' + client.name : ''), path: 'finance', id: inv.id });
      }
    });
    financeData.subscriptions.forEach((s) => {
      if (matches(q, s.name)) results.push({ type: 'Subscription', title: s.name, path: 'finance', id: s.id });
    });
    financeData.loans.forEach((l) => {
      if (matches(q, l.name)) results.push({ type: 'Loan', title: l.name, path: 'finance', id: l.id });
    });

    return results.slice(0, 30);
  }

  // Mounts a search input + results dropdown into `host`. `navigate(path, id)`
  // is called on a result click to route there and highlight the record.
  function mount(host, navigate) {
    const input = el('input', { type: 'search', class: 'sidebar-search', placeholder: 'Search…' });
    const dropdown = el('div', { class: 'search-dropdown' });

    function close() {
      clear(dropdown);
      dropdown.classList.remove('search-dropdown-open');
    }

    function runQuery() {
      const results = query(input.value);
      clear(dropdown);
      if (!results.length) {
        dropdown.classList.remove('search-dropdown-open');
        return;
      }
      results.forEach((r) => {
        dropdown.appendChild(el('button', {
          class: 'search-result', type: 'button',
          onclick: () => { close(); input.value = ''; navigate(r.path, r.id); },
        }, [
          el('span', { class: 'search-result-type' }, r.type),
          el('span', { class: 'search-result-title' }, r.title),
        ]));
      });
      dropdown.classList.add('search-dropdown-open');
    }

    input.addEventListener('input', runQuery);
    input.addEventListener('focus', runQuery);
    document.addEventListener('click', (e) => {
      if (!host.contains(e.target)) close();
    });

    host.appendChild(input);
    host.appendChild(dropdown);
  }

  FZ.search = { query, mount };
})(window.FZ = window.FZ || {});
