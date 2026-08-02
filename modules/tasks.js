/* ==========================================================================
   FZ.modules.tasks — Tasks module: today's tasks, priorities, deadlines,
   recurring tasks. Also exposes query helpers the dashboard uses.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  const PRIORITIES = ['high', 'medium', 'low'];

  // ---- Queries used by other modules / the dashboard ----------------------

  function all() {
    return FZ.storage.list('tasks');
  }

  function dueToday() {
    const today = fmt.todayISO();
    return all().filter((t) => !t.done && t.dueDate === today);
  }

  function openCount() {
    return all().filter((t) => !t.done).length;
  }

  // ---- Recurring task handling -----------------------------------------------
  // A task recurs when recurUnit is set (day/week/month/year); recurInterval
  // is the "every N" multiplier. See utils/recurrence.js for the engine.

  function toggleDone(task) {
    // completedAt (cleared on un-check) is what Analytics buckets task
    // completions by week from — real data, not derived from `done` alone.
    FZ.storage.update('tasks', task.id, { done: !task.done, completedAt: task.done ? null : new Date().toISOString() });
    if (!task.done && task.recurUnit && task.recurUnit !== 'none') {
      FZ.storage.add('tasks', {
        id: FZ.id(),
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        dueDate: FZ.recurrence.next(task.dueDate, task.recurUnit, task.recurInterval),
        done: false,
        recurUnit: task.recurUnit,
        recurInterval: task.recurInterval,
        projectId: task.projectId || '',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // ---- Add / edit form ------------------------------------------------------

  function openForm(existing, onSaved) {
    const projects = FZ.storage.list('projects');
    const fields = [
      { name: 'title', label: 'Title', required: true, value: existing && existing.title },
      { name: 'priority', label: 'Priority', type: 'select', value: (existing && existing.priority) || 'medium',
        options: PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) })) },
      { name: 'dueDate', label: 'Due date', type: 'date', value: existing && existing.dueDate },
      { name: 'recurUnit', label: 'Repeats', type: 'select', value: (existing && existing.recurUnit) || 'none',
        options: [{ value: 'none', label: 'Does not repeat' }].concat(FZ.recurrence.UNITS) },
      { name: 'recurInterval', label: 'Every (N)', type: 'number', value: (existing && existing.recurInterval) || 1, step: '1' },
      { name: 'projectId', label: 'Project', type: 'select', value: existing && existing.projectId,
        options: [{ value: '', label: 'None' }].concat(projects.map((p) => ({ value: p.id, label: p.name }))) },
      { name: 'notes', label: 'Notes', type: 'textarea', value: existing && existing.notes },
    ];

    const { form } = FZ.form.build(fields, existing ? 'Save changes' : 'Add task', (values) => {
      if (existing) {
        FZ.storage.update('tasks', existing.id, values);
        FZ.toast.show('Task updated');
      } else {
        FZ.storage.add('tasks', Object.assign({
          id: FZ.id(), done: false, createdAt: new Date().toISOString(),
        }, values));
        FZ.toast.show('Task added');
      }
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit task' : 'New task', body: form });
  }

  // ---- Render ---------------------------------------------------------------

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const tasks = all().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const dueA = a.dueDate || '9999-99-99';
      const dueB = b.dueDate || '9999-99-99';
      if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    });

    const list = el('div', { class: 'list' },
      tasks.length ? tasks.map((task) => FZ.listRow.build({
        id: task.id,
        title: task.title,
        meta: [
          task.dueDate ? fmt.dueLabel(task.dueDate) : 'No due date',
          FZ.recurrence.label(task.recurUnit, task.recurInterval) ? '· ' + FZ.recurrence.label(task.recurUnit, task.recurInterval) : '',
        ].join(' '),
        tag: task.priority,
        tagClass: task.priority,
        checked: task.done,
        onToggle: () => { toggleDone(task); rerender(); },
        onEdit: () => openForm(task, rerender),
        onDelete: () => FZ.deleteFlow.run({
          label: 'Task',
          onDelete: () => FZ.storage.softDelete('tasks', task.id),
          onUndo: () => FZ.storage.restore('tasks', task.id),
          onDone: rerender,
        }),
      })) : [emptyState({
        icon: '✓',
        title: 'No tasks yet',
        message: 'Track to-dos with priorities, due dates, and repeats — done items and deadlines roll up to your dashboard.',
        actionLabel: '+ Add a task',
        onAction: () => openForm(null, rerender),
      })]
    );

    container.appendChild(
      section({
        title: 'Tasks',
        actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null, rerender) }, '+ Task'),
        children: list,
      })
    );
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.tasks = { render, openForm, all, dueToday, openCount };
})(window.FZ = window.FZ || {});
