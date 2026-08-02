/* ==========================================================================
   FZ.modules.clients — lightweight CRM: contacts, plus a detail view that
   rolls up each client's projects, invoices, and notes.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function all() {
    return FZ.storage.get('clients');
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
    const projects = FZ.storage.get('projects').filter((p) => p.clientId === client.id);
    const invoices = FZ.storage.get('finance').invoices.filter((inv) => inv.clientId === client.id);

    const body = el('div', { class: 'detail-view' }, [
      client.company ? el('div', { class: 'detail-line' }, client.company) : null,
      client.email ? el('div', { class: 'detail-line' }, client.email) : null,
      client.phone ? el('div', { class: 'detail-line' }, client.phone) : null,
      client.notes ? el('div', { class: 'detail-notes' }, client.notes) : null,

      el('h3', { class: 'detail-subhead' }, 'Projects'),
      projects.length
        ? el('div', { class: 'list' }, projects.map((p) => FZ.listRow.build({ title: p.name, meta: p.status })))
        : emptyState('No projects yet.'),

      el('h3', { class: 'detail-subhead' }, 'Invoices'),
      invoices.length
        ? el('div', { class: 'list' }, invoices.map((inv) => FZ.listRow.build({
            title: fmt.currency(inv.amount), meta: 'Due ' + fmt.friendlyDate(inv.dueDate), tag: inv.status,
          })))
        : emptyState('No invoices yet.'),
    ]);

    FZ.modal.open({ title: client.name, body });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const clients = all();
    const list = el('div', { class: 'list' },
      clients.length ? clients.map((client) => FZ.listRow.build({
        title: client.name,
        meta: [client.company, client.email].filter(Boolean).join(' · '),
        onEdit: () => openForm(client, rerender),
        onDelete: () => { FZ.storage.remove('clients', client.id); rerender(); },
      })) : [emptyState('No clients yet. Add your first one.')]
    );

    // Make the row title clickable to open detail, without disturbing edit/delete buttons.
    Array.from(list.children).forEach((row, i) => {
      const titleEl = row.querySelector('.row-title');
      if (titleEl) {
        titleEl.classList.add('row-title-link');
        titleEl.addEventListener('click', () => openDetail(clients[i]));
      }
    });

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
