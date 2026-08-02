/* ==========================================================================
   FZ.modules.settings — the one place to set your name (used in the
   dashboard greeting), plus data ownership tools: export a full JSON
   backup, import one back in, or wipe local data entirely. Every field
   saves immediately — there is no Save button anywhere in this app.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el } = FZ.dom;
  const { section } = FZ.card;

  const EXPORT_VERSION = 1;

  function saveSetting(patch) {
    const settings = FZ.storage.get('settings');
    FZ.storage.set('settings', Object.assign({}, settings, patch));
  }

  // ---- Export: one JSON file with every collection, versioned so a future
  // schema change can detect and handle older exports. ---------------------

  function exportData() {
    const payload = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), data: {} };
    Object.keys(FZ.storage.KEYS).forEach((key) => { payload.data[key] = FZ.storage.get(key); });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: `fifth-zero-backup-${FZ.format.todayISO()}.json` });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    FZ.toast.show('Backup downloaded');
  }

  // ---- Import: validated against the known collection shapes before a
  // single localStorage key is touched, so a malformed file can't corrupt
  // real data — either the whole import applies, or none of it does. -------

  const ARRAY_KEYS = ['tasks', 'clients', 'projects', 'health', 'habits', 'notes', 'calendar'];

  function validatePayload(payload) {
    if (!payload || typeof payload !== 'object' || typeof payload.data !== 'object') {
      return 'This file doesn’t look like a Fifth & Zero backup.';
    }
    const data = payload.data;
    for (const key of ARRAY_KEYS) {
      if (key in data && !Array.isArray(data[key])) return `"${key}" should be a list — file may be corrupted.`;
    }
    if ('finance' in data) {
      const f = data.finance;
      const shapeOk = f && typeof f === 'object'
        && Array.isArray(f.transactions) && Array.isArray(f.invoices)
        && Array.isArray(f.subscriptions) && Array.isArray(f.loans);
      if (!shapeOk) return '"finance" is missing expected fields — file may be corrupted.';
    }
    if ('settings' in data && (typeof data.settings !== 'object' || Array.isArray(data.settings))) {
      return '"settings" should be an object — file may be corrupted.';
    }
    return null;
  }

  function importData(file, onDone) {
    const reader = new FileReader();
    reader.onload = () => {
      let payload;
      try {
        payload = JSON.parse(reader.result);
      } catch (err) {
        FZ.toast.show('Import failed — not valid JSON');
        return;
      }
      const error = validatePayload(payload);
      if (error) {
        FZ.toast.show('Import failed — ' + error);
        return;
      }
      Object.keys(FZ.storage.KEYS).forEach((key) => {
        if (key in payload.data) FZ.storage.set(key, payload.data[key]);
      });
      FZ.toast.show('Backup restored');
      if (onDone) onDone();
    };
    reader.readAsText(file);
  }

  function confirmImport(file, onDone) {
    FZ.confirm.ask({
      title: 'Replace local data?',
      message: 'Importing overwrites everything currently stored in this browser with the contents of the backup file. This cannot be undone.',
      confirmLabel: 'Import and replace',
      danger: true,
      onConfirm: () => importData(file, onDone),
    });
  }

  function confirmReset(onDone) {
    FZ.confirm.ask({
      title: 'Erase all local data?',
      message: 'This permanently deletes every task, client, project, finance record, health entry, habit, note, and calendar event on this device — including anything in Archive. Export a backup first if you want to keep it.',
      confirmLabel: 'Erase everything',
      danger: true,
      onConfirm: () => {
        Object.keys(FZ.storage.KEYS).forEach((key) => window.localStorage.removeItem(FZ.storage.KEYS[key]));
        FZ.toast.show('Local data erased');
        if (onDone) onDone();
      },
    });
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';
    const settings = FZ.storage.get('settings');

    // Profile
    const nameInput = el('input', {
      type: 'text', value: settings.name || '', placeholder: 'Your name',
      onchange: (e) => { saveSetting({ name: e.target.value }); FZ.toast.show('Saved'); },
    });
    container.appendChild(section({
      title: 'Profile',
      children: el('div', { class: 'field' }, [
        el('label', { for: 'settingsName' }, 'Name — shown in your dashboard greeting'),
        Object.assign(nameInput, { id: 'settingsName' }),
      ]),
    }));

    // Data
    const fileInput = el('input', {
      type: 'file', accept: 'application/json', class: 'sr-only', id: 'importFile',
      onchange: (e) => { if (e.target.files[0]) confirmImport(e.target.files[0], rerender); e.target.value = ''; },
    });
    container.appendChild(section({
      title: 'Data',
      children: el('div', { class: 'settings-actions' }, [
        el('div', { class: 'detail-line' }, 'Everything is stored only in this browser. Export a backup periodically, or before clearing your browser data.'),
        el('div', { class: 'quick-actions' }, [
          el('button', { class: 'btn btn-ghost', type: 'button', onclick: exportData }, 'Export backup (JSON)'),
          el('label', { class: 'btn btn-ghost', for: 'importFile' }, 'Import backup'),
          fileInput,
        ]),
      ]),
    }));

    // Danger zone
    container.appendChild(section({
      title: 'Danger zone',
      children: el('div', { class: 'settings-actions' }, [
        el('div', { class: 'detail-line' }, 'Erase every record on this device. Consider exporting a backup first.'),
        el('button', { class: 'btn btn-danger', type: 'button', onclick: () => confirmReset(rerender) }, 'Erase all local data'),
      ]),
    }));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.settings = { render };
})(window.FZ = window.FZ || {});
