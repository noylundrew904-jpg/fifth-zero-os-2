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

  // Pre-Supabase builds of this app kept everything under these localStorage
  // keys. They're irrelevant to a fresh install but may still be sitting in
  // the browser of anyone upgrading from that version — this is the map
  // used to detect and offer a one-time import of that data into the
  // signed-in account (merge, not overwrite — see confirmMigrateLegacy).
  const LEGACY_KEYS = {
    tasks: 'fz.tasks', clients: 'fz.clients', projects: 'fz.projects', finance: 'fz.finance',
    health: 'fz.health', habits: 'fz.habits', notes: 'fz.notes', calendar: 'fz.calendar', settings: 'fz.settings',
  };
  const LEGACY_ARRAY_KEYS = ['tasks', 'clients', 'projects', 'health', 'habits', 'notes', 'calendar'];
  const LEGACY_FINANCE_FIELDS = ['transactions', 'invoices', 'subscriptions', 'loans'];

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
      title: 'Replace your data?',
      message: 'Importing overwrites everything currently stored in your account with the contents of the backup file. This cannot be undone.',
      confirmLabel: 'Import and replace',
      danger: true,
      onConfirm: () => importData(file, onDone),
    });
  }

  function confirmReset(onDone) {
    FZ.confirm.ask({
      title: 'Erase all data?',
      message: 'This permanently deletes every task, client, project, finance record, health entry, habit, note, and calendar event in your account — on every device — including anything in Archive. Export a backup first if you want to keep it. This cannot be undone.',
      confirmLabel: 'Erase everything',
      danger: true,
      onConfirm: async () => {
        try {
          await FZ.storage.eraseAll();
          FZ.toast.show('All data erased');
        } catch (err) {
          console.error('FZ.settings: erase failed', err);
          FZ.toast.show('Erase failed — check your connection and try again');
        }
        if (onDone) onDone();
      },
    });
  }

  // ---- Legacy localStorage -> Supabase one-time migration -------------------
  // Merges by id rather than overwriting, so it's safe to run even if the
  // account already has some data (nothing already in the account is lost).

  function detectLegacyData() {
    return Object.values(LEGACY_KEYS).some((k) => window.localStorage.getItem(k) !== null);
  }

  function readLegacyPayload() {
    const data = {};
    Object.keys(LEGACY_KEYS).forEach((key) => {
      const raw = window.localStorage.getItem(LEGACY_KEYS[key]);
      if (!raw) return;
      try { data[key] = JSON.parse(raw); } catch (err) { /* skip unreadable entry */ }
    });
    return data;
  }

  function mergeById(current, incoming) {
    const currentIds = new Set(current.map((r) => r.id));
    return current.concat((incoming || []).filter((r) => r && !currentIds.has(r.id)));
  }

  function migrateLegacyData(onDone) {
    const legacy = readLegacyPayload();

    LEGACY_ARRAY_KEYS.forEach((key) => {
      if (!Array.isArray(legacy[key]) || !legacy[key].length) return;
      FZ.storage.set(key, mergeById(FZ.storage.get(key), legacy[key]));
    });

    if (legacy.finance && typeof legacy.finance === 'object') {
      const current = FZ.storage.get('finance');
      LEGACY_FINANCE_FIELDS.forEach((field) => {
        current[field] = mergeById(current[field] || [], legacy.finance[field]);
      });
      FZ.storage.set('finance', current);
    }

    // Settings (name/theme) are left alone deliberately — the signed-in
    // account's own settings should win, not a stale value from a
    // pre-migration anonymous session.

    Object.values(LEGACY_KEYS).forEach((k) => window.localStorage.removeItem(k));
    FZ.toast.show('Local data imported into your account');
    if (onDone) onDone();
  }

  function confirmMigrateLegacy(onDone) {
    FZ.confirm.ask({
      title: 'Import data from this browser?',
      message: 'We found tasks, clients, projects, and other data stored locally in this browser from before cloud sync was added. Import it into your account? This adds to what’s already here — it won’t remove or overwrite anything.',
      confirmLabel: 'Import local data',
      onConfirm: () => migrateLegacyData(onDone),
    });
  }

  // ---- Sync status ------------------------------------------------------

  function renderSyncStatus() {
    const pending = FZ.storage.hasPendingSync();
    return el('div', { class: 'sync-status' }, [
      el('span', { class: 'sync-dot' + (pending ? ' sync-dot-pending' : '') }),
      el('span', {}, pending ? 'Syncing…' : 'All changes saved'),
    ]);
  }

  function render(container) {
    const rerender = () => render(container);
    container.innerHTML = '';
    const settings = FZ.storage.get('settings');

    // Account
    const accountEmail = el('div', { class: 'detail-line' }, 'Loading account…');
    FZ.authAdapter.getUser().then(({ data }) => {
      accountEmail.textContent = 'Signed in as ' + ((data && data.user && data.user.email) || 'unknown');
    }).catch(() => { accountEmail.textContent = 'Signed in'; });
    container.appendChild(section({
      title: 'Account',
      children: el('div', { class: 'settings-actions' }, [
        el('div', { class: 'tag-row' }, [
          el('span', { class: 'tag' + (FZ.isDevMode ? ' tag-warning' : ' tag-success') }, FZ.isDevMode ? 'Development Mode' : 'Production'),
        ]),
        accountEmail,
        FZ.isDevMode ? el('div', { class: 'detail-line' }, 'Data is stored only in this browser and is not connected to Supabase.') : null,
        renderSyncStatus(),
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => FZ.auth.signOut() }, 'Sign out'),
      ]),
    }));

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

    // Legacy local-data import (only shown if pre-cloud-sync data is found)
    if (detectLegacyData()) {
      container.appendChild(section({
        title: 'Import from this browser',
        children: el('div', { class: 'settings-actions' }, [
          el('div', { class: 'detail-line' }, 'We found data stored locally in this browser from before cloud sync. Import it into your account?'),
          el('button', { class: 'btn btn-primary', type: 'button', onclick: () => confirmMigrateLegacy(rerender) }, 'Import local data'),
        ]),
      }));
    }

    // Data
    const fileInput = el('input', {
      type: 'file', accept: 'application/json', class: 'sr-only', id: 'importFile',
      onchange: (e) => { if (e.target.files[0]) confirmImport(e.target.files[0], rerender); e.target.value = ''; },
    });
    container.appendChild(section({
      title: 'Data',
      children: el('div', { class: 'settings-actions' }, [
        el('div', { class: 'detail-line' }, 'Everything is stored in your account and synced to Supabase — available on any device you sign into. Export a backup periodically for your own records.'),
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
        el('div', { class: 'detail-line' }, 'Erase every record in your account, on every device. Consider exporting a backup first.'),
        el('button', { class: 'btn btn-danger', type: 'button', onclick: () => confirmReset(rerender) }, 'Erase all data'),
      ]),
    }));
  }

  FZ.modules = FZ.modules || {};
  FZ.modules.settings = { render };
})(window.FZ = window.FZ || {});
