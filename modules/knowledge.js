/* ==========================================================================
   FZ.modules.knowledge — markdown notes with a live search box. Notes are
   stored as raw markdown and rendered on view.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section, emptyState } = FZ.card;
  const fmt = FZ.format;

  function all() {
    return FZ.storage.list('notes').sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  function openForm(existing, onSaved) {
    const fields = [
      { name: 'title', label: 'Title', required: true, value: existing && existing.title },
      { name: 'tags', label: 'Tags (comma separated)', value: existing && existing.tags },
      { name: 'body', label: 'Body (markdown supported)', type: 'textarea', rows: 8, value: existing && existing.body },
    ];

    const { form } = FZ.form.build(fields, existing ? 'Save changes' : 'Add note', (values) => {
      const now = new Date().toISOString();
      if (existing) {
        FZ.storage.update('notes', existing.id, Object.assign({}, values, { updatedAt: now }));
      } else {
        FZ.storage.add('notes', Object.assign({ id: FZ.id(), createdAt: now, updatedAt: now }, values));
      }
      FZ.toast.show('Note saved');
      FZ.modal.close();
      if (onSaved) onSaved();
    });

    FZ.modal.open({ title: existing ? 'Edit note' : 'New note', body: form });
  }

  function openView(note, onEdited) {
    const body = el('div', { class: 'detail-view' }, [
      note.tags ? el('div', { class: 'tag-row' }, note.tags.split(',').map((t) => el('span', { class: 'tag' }, t.trim()))) : null,
      el('div', { class: 'markdown-body', html: FZ.markdown.toHtml(note.body) }),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => openForm(note, onEdited) }, 'Edit note'),
    ]);
    FZ.modal.open({ title: note.title, body });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';

    const searchInput = el('input', { type: 'search', class: 'search-input', placeholder: 'Search notes…' });
    const listHost = el('div', { class: 'list' });

    function renderList(query) {
      const notes = all().filter((n) => {
        if (!query) return true;
        const haystack = (n.title + ' ' + (n.tags || '') + ' ' + n.body).toLowerCase();
        return haystack.includes(query.toLowerCase());
      });
      listHost.innerHTML = '';
      if (!notes.length) {
        listHost.appendChild(emptyState(query ? {
          icon: '✎', title: 'No matches', message: 'No notes match your search.',
        } : {
          icon: '✎', title: 'No notes yet', message: 'Capture markdown notes and find them again with search.',
          actionLabel: '+ Add a note', onAction: () => openForm(null, rerender),
        }));
        return;
      }
      notes.forEach((note) => {
        const row = FZ.listRow.build({
          id: note.id,
          title: note.title,
          meta: fmt.friendlyDate((note.updatedAt || note.createdAt || '').slice(0, 10)),
          onEdit: () => openForm(note, rerender),
          onDelete: () => FZ.deleteFlow.run({
            label: 'Note',
            onDelete: () => FZ.storage.softDelete('notes', note.id),
            onUndo: () => FZ.storage.restore('notes', note.id),
            onDone: rerender,
          }),
        });
        row.querySelector('.row-title').classList.add('row-title-link');
        row.querySelector('.row-title').addEventListener('click', () => openView(note, rerender));
        listHost.appendChild(row);
      });
    }

    searchInput.addEventListener('input', () => renderList(searchInput.value));
    renderList('');

    container.appendChild(
      section({
        title: 'Knowledge',
        actions: el('button', { class: 'btn btn-primary', type: 'button', onclick: () => openForm(null, rerender) }, '+ Note'),
        children: el('div', {}, [searchInput, listHost]),
      })
    );
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.knowledge = { render, openForm, all };
})(window.FZ = window.FZ || {});
