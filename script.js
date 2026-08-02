/* ==========================================================================
   script.js — app bootstrap and router. Reads the URL hash to decide which
   module renders into #pageRoot, keeps the sidebar's active state in sync,
   and re-renders the current page once a minute so "Today" stays accurate
   across midnight without a manual refresh.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const pageRoot = document.getElementById('pageRoot');
  const navList = document.getElementById('navList');

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
  };

  function currentPath() {
    return (window.location.hash || '#/').replace(/^#\/?/, '');
  }

  function navigate(path) {
    window.location.hash = '#/' + path;
  }

  function renderRoute() {
    const path = currentPath();
    const renderPage = PAGES[path] || PAGES[''];
    FZ.sidebar.render(navList, PAGES[path] ? path : '');
    renderPage(pageRoot);
  }

  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', renderRoute);

  // Keep "today"-based figures (dashboard greeting/clock, due-today counts)
  // fresh without requiring a manual reload.
  setInterval(() => {
    if (currentPath() === '') renderRoute();
  }, 60000);
})(window.FZ = window.FZ || {});
