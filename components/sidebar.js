/* ==========================================================================
   FZ.sidebar — left navigation. Renders once, re-highlights the active
   route whenever the router changes.
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

  FZ.sidebar = { render, ROUTES };
})(window.FZ = window.FZ || {});
