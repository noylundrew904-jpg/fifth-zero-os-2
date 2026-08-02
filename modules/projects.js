/* ==========================================================================
   FZ.modules.projects — timeline (start/end), budget, linked tasks, and a
   profit figure derived from active (non-archived) finance transactions
   tagged to the project.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  const STATUSES = ['active', 'on-hold', 'completed'];

  function all() {
    return FZ.storage.list('projects');
  }

  function profit(projectId) {
    const transactions = FZ.archive.active(FZ.storage.get('finance').transactions).filter((t) => t.projectId === projectId);
    return transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  }

  function openForm(existing, onSaved) {
    const clients = FZ.storage.list('clients');
    const fields = [
      { name: 'name', label: 'Project name', required: true, value: existing && existing.name },
      { name: 'clientId', label: 'Client', type: 'select', value: existing && existing.clientId,
        options: [{ value: '', label: 'None' }].concat(clients.map((c) => ({ value: c.id, label: c.name }))) },
      { name: 'status', label: 'Status', type: 'select', value: (existing && existing.status) || 'active',
        options: STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
      { name: 'budget', label: 'Budget', type: 'number', step: '0.01', value: existing && existing.budget },
      { name: 'startDate', label: 'Start date', type: 'date', value: existing && existing.startDate },
      { name: 'endDate', label: 'End date', type: 'date', value: existing && existing.endDate },
      { name: 'notes', label: 'Notes', type: 'textarea', value: existing && existing.notes },
    ];

    const { form } = FZ.form.build(fields, existing ? 'Save changes' : 'Add project', (values) => {
      if (existing) {
        FZ.storage.update('projects', existing.id, values);
        FZ.toast.show('Project updated');
      } else {
        FZ.storage.add('projects', Object.assign({ id: FZ.id(), createdAt: new Date().toISOString() }, values));
        FZ.toast.show('Project added');
      }
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit project' : 'New project', body: form });
  }

  function openDetail(project) {
    const client = FZ.storage.list('clients').find((c) => c.id === project.clientId);
    const tasks = FZ.storage.list('tasks').filter((t) => t.projectId === project.id);
    const spent = profit(project.id);
    const budget = Number(project.budget) || 0;

    const body = el('div', { class: 'detail-view' }, [
      client ? el('div', { class: 'detail-line' }, 'Client: ' + client.name) : null,
      el('div', { class: 'detail-line' }, 'Timeline: ' + (project.startDate ? fmt.friendlyDate(project.startDate) : '—') + ' → ' + (project.endDate ? fmt.friendlyDate(project.endDate) : '—')),
      el('div', { class: 'stat-row' }, [
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Budget'), el('div', { class: 'stat-value' }, fmt.currency(budget))]),
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Profit'), el('div', { class: 'stat-value' }, fmt.currency(spent))]),
      ]),
      project.notes ? el('div', { class: 'detail-notes' }, project.notes) : null,
      el('h3', { class: 'detail-subhead' }, 'Tasks'),
      tasks.length
        ? el('div', { class: 'list' }, tasks.map((t) => FZ.listRow.build({ id: t.id, title: t.title, meta: t.dueDate ? fmt.dueLabel(t.dueDate) : '', checked: t.done })))
        : emptyState({ icon: '✓', title: 'No tasks yet', message: 'Tasks linked to this project will show up here.' }),
    ]);

    FZ.modal.open({ title: project.name, body });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const projects = all();
    const list = el('div', { class: 'list' },
      projects.length ? projects.map((project) => {
        const row = FZ.listRow.build({
          id: project.id,
          title: project.name,
          meta: fmt.currency(Number(project.budget) || 0) + ' budget · profit ' + fmt.currency(profit(project.id)),
          tag: project.status,
          tagClass: project.status === 'active' ? 'success' : project.status === 'completed' ? 'default' : 'warning',
          onEdit: () => openForm(project, rerender),
          onDelete: () => FZ.deleteFlow.run({
            label: 'Project',
            onDelete: () => FZ.storage.softDelete('projects', project.id),
            onUndo: () => FZ.storage.restore('projects', project.id),
            onDone: rerender,
          }),
        });
        const titleEl = row.querySelector('.row-title');
        titleEl.classList.add('row-title-link');
        titleEl.addEventListener('click', () => openDetail(project));
        return row;
      }) : [emptyState({
        icon: '◆',
        title: 'No projects yet',
        message: 'Track timeline, budget, and profit for each piece of work.',
        actionLabel: '+ Add a project',
        onAction: () => openForm(null, rerender),
      })]
    );

    container.appendChild(
      section({
        title: 'Projects',
        actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null, rerender) }, '+ Project'),
        children: list,
      })
    );
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.projects = { render, openForm, all, profit };
})(window.FZ = window.FZ || {});
