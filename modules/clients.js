/* ==========================================================================
   FZ.modules.clients — lightweight CRM: contacts, plus a detail view that
   rolls up each client's projects, invoices, and total revenue.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function all() {
    return FZ.storage.list('clients');
  }

  function openForm(existing, onSaved) {
    const fields = [
      { name: 'name', label: 'Name', required: true, value: existing && existing.name },
      { name: 'company', label: 'Company', value: existing && existing.company },
      { name: 'email', label: 'Email', type: 'email', value: existing && existing.email },
      { name: 'phone', label: 'Phone', value: existing && existing.phone },
      { name: 'notes', label: 'Notes', type: 'textarea', value: existing && existing.notes },
    ];

    const { form } = FZ.form.build(fields, existing ? 'Save changes' : 'Add client', (values) => {
      if (existing) {
        FZ.storage.update('clients', existing.id, values);
        FZ.toast.show('Client updated');
      } else {
        FZ.storage.add('clients', Object.assign({ id: FZ.id(), createdAt: new Date().toISOString() }, values));
        FZ.toast.show('Client added');
      }
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit client' : 'New client', body: form });
  }

  function openDetail(client) {
    const projects = FZ.storage.list('projects').filter((p) => p.clientId === client.id);
    const invoices = FZ.archive.active(FZ.storage.get('finance').invoices).filter((inv) => inv.clientId === client.id);
    const revenue = FZ.modules.finance.revenueByClient(client.id);

    const body = el('div', { class: 'detail-view' }, [
      client.company ? el('div', { class: 'detail-line' }, client.company) : null,
      client.email ? el('div', { class: 'detail-line' }, client.email) : null,
      client.phone ? el('div', { class: 'detail-line' }, client.phone) : null,
      el('div', { class: 'stat-row' }, [
        el('div', { class: 'stat' }, [el('div', { class: 'stat-label' }, 'Revenue'), el('div', { class: 'stat-value' }, fmt.currency(revenue))]),
      ]),
      client.notes ? el('div', { class: 'detail-notes' }, client.notes) : null,

      el('h3', { class: 'detail-subhead' }, 'Projects'),
      projects.length
        ? el('div', { class: 'list' }, projects.map((p) => FZ.listRow.build({ id: p.id, title: p.name, meta: p.status })))
        : emptyState({ icon: '◆', title: 'No projects yet', message: 'Projects linked to this client will show up here.' }),

      el('h3', { class: 'detail-subhead' }, 'Invoices'),
      invoices.length
        ? el('div', { class: 'list' }, invoices.map((inv) => FZ.listRow.build({
            id: inv.id, title: fmt.currency(inv.amount), meta: 'Due ' + fmt.friendlyDate(inv.dueDate), tag: inv.status,
          })))
        : emptyState({ icon: '⏳', title: 'No invoices yet', message: 'Invoices billed to this client will show up here.' }),
    ]);

    FZ.modal.open({ title: client.name, body });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const clients = all();
    const list = el('div', { class: 'list' },
      clients.length ? clients.map((client) => {
        const row = FZ.listRow.build({
          id: client.id,
          title: client.name,
          meta: [client.company, client.email].filter(Boolean).join(' · '),
          onEdit: () => openForm(client, rerender),
          onDelete: () => FZ.deleteFlow.run({
            label: 'Client',
            onDelete: () => FZ.storage.softDelete('clients', client.id),
            onUndo: () => FZ.storage.restore('clients', client.id),
            onDone: rerender,
          }),
        });
        const titleEl = row.querySelector('.row-title');
        titleEl.classList.add('row-title-link');
        titleEl.addEventListener('click', () => openDetail(client));
        return row;
      }) : [emptyState({
        icon: '☺',
        title: 'No clients yet',
        message: 'Add contacts to track their projects, invoices, and revenue in one place.',
        actionLabel: '+ Add a client',
        onAction: () => openForm(null, rerender),
      })]
    );

    container.appendChild(
      section({
        title: 'Clients',
        actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null, rerender) }, '+ Client'),
        children: list,
      })
    );
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.clients = { render, openForm, all };
})(window.FZ = window.FZ || {});
