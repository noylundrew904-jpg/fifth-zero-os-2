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
    return FZ.storage.get('tasks');
  }

  function dueToday() {
    const today = fmt.todayISO();
    return all().filter((t) => !t.done && t.dueDate === today);
  }

  function openCount() {
    return all().filter((t) => !t.done).length;
  }

  // ---- Recurring task handling ---------------------------------------------

  // When a recurring task is completed, spawn the next occurrence.
  function nextOccurrenceDate(dueDate, recurring) {
    if (!dueDate) return fmt.todayISO();
    const d = new Date(dueDate + 'T00:00:00');
    if (recurring === 'daily') d.setDate(d.getDate() + 1);
    else if (recurring === 'weekly') d.setDate(d.getDate() + 7);
    else if (recurring === 'monthly') d.setMonth(d.getMonth() + 1);
    return fmt.toISODate(d);
  }

  function toggleDone(task) {
    FZ.storage.update('tasks', task.id, { done: !task.done });
    if (!task.done && task.recurring && task.recurring !== 'none') {
      FZ.storage.add('tasks', {
        id: FZ.id(),
        title: task.title,
        notes: task.notes,
        priority: task.priority,
        dueDate: nextOccurrenceDate(task.dueDate, task.recurring),
        done: false,
        recurring: task.recurring,
        projectId: task.projectId || '',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // ---- Add / edit form ------------------------------------------------------

  function openForm(existing, onSaved) {
    const projects = FZ.storage.get('projects');
    const fields = [
      { name: 'title', label: 'Title', required: true, value: existing && existing.title },
      { name: 'priority', label: 'Priority', type: 'select', value: (existing && existing.priority) || 'medium',
        options: PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) })) },
      { name: 'dueDate', label: 'Due date', type: 'date', value: existing && existing.dueDate },
      { name: 'recurring', label: 'Repeats', type: 'select', value: (existing && existing.recurring) || 'none',
        options: [
          { value: 'none', label: 'Does not repeat' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ] },
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
        title: task.title,
        meta: [
          task.dueDate ? fmt.dueLabel(task.dueDate) : 'No due date',
          task.recurring && task.recurring !== 'none' ? '· repeats ' + task.recurring : '',
        ].join(' '),
        tag: task.priority,
        tagClass: task.priority,
        checked: task.done,
        onToggle: () => { toggleDone(task); rerender(); },
        onEdit: () => openForm(task, rerender),
        onDelete: () => { FZ.storage.remove('tasks', task.id); rerender(); },
      })) : [emptyState('No tasks yet. Add your first one.')]
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
