/* ==========================================================================
   script.js — app bootstrap and router. Reads the URL hash to decide which
   module renders into #pageRoot, keeps the sidebar's active state in sync,
   purges expired archive records on boot, and supports a "?highlight=id"
   hash param so global search results can jump to and flash a record.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const pageRoot = document.getElementById('pageRoot');
  const navList = document.getElementById('navList');
  const searchHost = document.getElementById('searchHost');

  const PAGES = {
    '': (root) => FZ.modules.dashboard.render(root, navigate),
    tasks: (root) => FZ.modules.tasks.render(root),
    calendar: (root) => FZ.modules.calendar.render(root),
    projects: (root) => FZ.modules.projects.render(root),
    clients: (root) => FZ.modules.clients.render(root),
    finance: (root) => FZ.modules.finance.render(root),
    health: (root) => FZ.modules.health.render(root),
    habits: (root) => FZ.modules.habits.render(root),
    knowledge: (root) => FZ.modules.knowledge.render(root),
    analytics: (root) => FZ.modules.analytics.render(root),
    archive: (root) => FZ.modules.archive.render(root),
    settings: (root) => FZ.modules.settings.render(root),
  };

  // Soft-deleted records past their 30-day window are purged once per
  // load — cheap, and keeps localStorage from growing forever.
  const SOFT_DELETE_KEYS = ['tasks', 'clients', 'projects', 'notes', 'habits', 'health', 'calendar'];
  const SOFT_DELETE_FINANCE_FIELDS = ['transactions', 'invoices', 'subscriptions', 'loans'];
  function purgeExpiredArchive() {
    SOFT_DELETE_KEYS.forEach((key) => FZ.storage.purgeExpired(key));
    const financeData = FZ.storage.get('finance');
    SOFT_DELETE_FINANCE_FIELDS.forEach((field) => {
      financeData[field] = FZ.archive.purgeExpired(financeData[field]);
    });
    FZ.storage.set('finance', financeData);
  }

  // Hash format: #/<path>?highlight=<id> — the highlight param is how a
  // global search result points the router at one specific record.
  function parseHash() {
    const raw = (window.location.hash || '#/').replace(/^#\/?/, '');
    const [path, queryStr] = raw.split('?');
    const params = new URLSearchParams(queryStr || '');
    return { path, highlight: params.get('highlight') };
  }

  function navigate(path, highlightId) {
    window.location.hash = '#/' + path + (highlightId ? '?highlight=' + encodeURIComponent(highlightId) : '');
  }

  function flashHighlight(id) {
    if (!id) return;
    requestAnimationFrame(() => {
      const row = pageRoot.querySelector('[data-id="' + CSS.escape(id) + '"]');
      if (!row) return;
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('row-highlight');
      setTimeout(() => row.classList.remove('row-highlight'), 1600);
    });
  }

  function renderRoute() {
    const { path, highlight } = parseHash();
    const renderPage = PAGES[path] || PAGES[''];
    FZ.sidebar.render(navList, PAGES[path] ? path : '');
    renderPage(pageRoot);
    flashHighlight(highlight);
  }

  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', () => {
    purgeExpiredArchive();
    FZ.sidebar.mountSearch(searchHost, navigate);
    renderRoute();
  });

  // Registering the service worker is what makes the app installable and
  // fully offline — safe to skip silently where unsupported (e.g. very old
  // browsers), the app already works offline via localStorage regardless.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Keep "today"-based figures (dashboard greeting/clock, due-today counts)
  // fresh without requiring a manual reload.
  setInterval(() => {
    if (parseHash().path === '') renderRoute();
  }, 60000);
})(window.FZ = window.FZ || {});
