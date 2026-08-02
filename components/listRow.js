/* ==========================================================================
   FZ.listRow — one row inside a panel list: title, meta line, optional
   checkbox/tag, edit + delete buttons. Shared by tasks/clients/projects/
   finance/habits/notes so the interaction pattern stays identical.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;

  // opts: { id, title, meta, tag, checked, onToggle, onEdit, onDelete }
  // id (optional) is stamped as data-id so global search can scroll a
  // result into view and flash it after navigating to its module.
  function build(opts) {
    const left = [];
    if (opts.onToggle) {
      left.push(el('input', {
        type: 'checkbox',
        class: 'row-check',
        checked: !!opts.checked,
        onchange: opts.onToggle,
      }));
    }
    left.push(el('div', { class: 'row-text' }, [
      el('div', { class: 'row-title' + (opts.checked ? ' row-title-done' : '') }, opts.title),
      opts.meta ? el('div', { class: 'row-meta' }, opts.meta) : null,
    ]));

    const right = [];
    if (opts.tag) right.push(el('span', { class: 'tag tag-' + (opts.tagClass || 'default') }, opts.tag));
    if (opts.onEdit) right.push(el('button', { class: 'icon-btn', type: 'button', title: 'Edit', onclick: opts.onEdit }, '✎'));
    if (opts.onDelete) right.push(el('button', { class: 'icon-btn icon-btn-danger', type: 'button', title: 'Delete', onclick: opts.onDelete }, '✕'));

    return el('div', { class: 'list-row', 'data-id': opts.id }, [
      el('div', { class: 'row-left' }, left),
      el('div', { class: 'row-right' }, right),
    ]);
  }

  FZ.listRow = { build };
})(window.FZ = window.FZ || {});
