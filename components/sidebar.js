/* ==========================================================================
   FZ.sidebar — left navigation plus the global search box. Renders once;
   the nav portion re-highlights the active route whenever it changes.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;

  const ROUTES = [
    { path: '', icon: '⌂', label: 'Home' },
    { path: 'tasks', icon: '✓', label: 'Tasks' },
    { path: 'calendar', icon: '▦', label: 'Calendar' },
    { path: 'projects', icon: '◆', label: 'Projects' },
    { path: 'clients', icon: '☺', label: 'Clients' },
    { path: 'finance', icon: '$', label: 'Finance' },
    { path: 'health', icon: '♥', label: 'Health' },
    { path: 'habits', icon: '↻', label: 'Habits' },
    { path: 'knowledge', icon: '✎', label: 'Knowledge' },
    { path: 'analytics', icon: '▲', label: 'Analytics' },
    { path: 'archive', icon: '🗑', label: 'Archive' },
    { path: 'settings', icon: '⚙', label: 'Settings' },
  ];

  function render(container, currentPath) {
    container.innerHTML = '';
    ROUTES.forEach((route) => {
      const isActive = route.path === currentPath;
      container.appendChild(
        el('a', {
          href: '#/' + route.path,
          class: 'nav-item' + (isActive ? ' nav-item-active' : ''),
        }, [
          el('span', { class: 'nav-icon' }, route.icon),
          el('span', { class: 'nav-label' }, route.label),
        ])
      );
    });
  }

  // Mounts the search box once (separate from render(), which re-runs on
  // every route change — the search input shouldn't be rebuilt each time).
  function mountSearch(container, navigate) {
    FZ.search.mount(container, navigate);
  }

  FZ.sidebar = { render, mountSearch, ROUTES };
})(window.FZ = window.FZ || {});
