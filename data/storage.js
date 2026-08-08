/* ==========================================================================
   FZ.storage — the only place in the app that touches the database. Every
   module reads/writes through here exactly as before; only the backing
   store changed (Supabase Postgres instead of localStorage), so module
   code needed no changes at all.

   Design: a synchronous in-memory cache, fetched from Supabase once at
   sign-in (FZ.storage.init), makes every read (get/list/trashed) instant
   with no await required at any call site. Writes (set/add/update/remove/
   softDelete/restore) update the cache immediately — the UI reacts exactly
   as fast as it always did — then persist to Supabase in the background
   through a small retry queue ("outbox") so a flaky connection never loses
   a change: it just syncs a little late, with a toast if it's taking a
   while. The outbox is the ONE thing this app still keeps in localStorage,
   and only as a transient retry buffer — Supabase is always the source of
   truth on the next load, never the outbox.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const ARRAY_KEYS = ['tasks', 'clients', 'projects', 'health', 'habits', 'notes', 'calendar'];
  const SINGLETON_KEYS = ['finance', 'settings'];
  const ALL_KEYS = ARRAY_KEYS.concat(SINGLETON_KEYS);

  const DEFAULTS = {
    tasks: [], clients: [], projects: [],
    finance: { transactions: [], subscriptions: [], loans: [], invoices: [] },
    health: [], habits: [], notes: [], calendar: [],
    settings: { theme: 'dark', name: '' },
  };

  const OUTBOX_KEY = 'fz.outbox';

  let cache = clone(DEFAULTS);
  let currentUserId = null;
  let ready = false;
  let outbox = loadOutbox();
  let flushing = false;
  let syncListeners = [];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function table(key) { return 'fz_' + key; }
  function assertKnownKey(key) { if (!ALL_KEYS.includes(key)) throw new Error(`Unknown storage key: ${key}`); }

  // ---- outbox (persist-retry queue) ----------------------------------------

  function loadOutbox() {
    try {
      const raw = window.localStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) { return []; }
  }

  function saveOutbox() {
    try { window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); } catch (err) { /* best effort */ }
  }

  function notifySync(status) { syncListeners.forEach((fn) => { try { fn(status); } catch (err) {} }); }

  function enqueue(op) {
    outbox.push(op);
    saveOutbox();
    flushOutbox();
  }

  async function runOp(op) {
    const sb = FZ.supabase;
    if (op.type === 'upsert') {
      const rows = op.rows.map((payload) => ({ id: payload.id, user_id: currentUserId, payload }));
      const { error } = await sb.from(table(op.key)).upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    } else if (op.type === 'delete') {
      const { error } = await sb.from(table(op.key)).delete().in('id', op.ids);
      if (error) throw error;
    } else if (op.type === 'singleton') {
      const { error } = await sb.from(table(op.key)).upsert([{ user_id: currentUserId, payload: op.payload }], { onConflict: 'user_id' });
      if (error) throw error;
    } else if (op.type === 'eraseAll') {
      for (const key of ARRAY_KEYS) {
        const { error } = await sb.from(table(key)).delete().eq('user_id', currentUserId);
        if (error) throw error;
      }
      for (const key of SINGLETON_KEYS) {
        const { error } = await sb.from(table(key)).delete().eq('user_id', currentUserId);
        if (error) throw error;
      }
    }
  }

  async function flushOutbox() {
    if (flushing || !currentUserId) return;
    flushing = true;
    let hadFailure = false;
    try {
      while (outbox.length) {
        const op = outbox[0];
        try {
          await runOp(op);
          outbox.shift();
          saveOutbox();
        } catch (err) {
          console.warn('FZ.storage: sync failed, will retry shortly', op.type, op.key, err);
          hadFailure = true;
          break; // keep order — stop draining, retry this same op later
        }
      }
    } finally {
      flushing = false;
      notifySync(hadFailure ? 'error' : (outbox.length ? 'pending' : 'synced'));
      if (hadFailure && FZ.toast && !flushOutbox._warnedRecently) {
        flushOutbox._warnedRecently = true;
        FZ.toast.show('Sync paused — check your connection. Changes are saved and will retry.', { duration: 4000 });
        setTimeout(() => { flushOutbox._warnedRecently = false; }, 30000);
      }
    }
  }

  setInterval(() => { if (outbox.length) flushOutbox(); }, 15000);
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => flushOutbox());
  }

  // ---- boot / teardown ------------------------------------------------------

  // Called once after a user signs in. Pushes any leftover outbox ops from a
  // previous session first, then fetches every collection fresh so the app
  // always renders the database's current state, not a stale local guess.
  async function init(userId) {
    currentUserId = userId;
    ready = false;
    notifySync('loading');

    await flushOutbox();

    const arrayFetches = ARRAY_KEYS.map(async (key) => {
      const { data, error } = await FZ.supabase.from(table(key)).select('payload').eq('user_id', userId);
      if (error) throw error;
      cache[key] = (data || []).map((row) => row.payload);
    });

    const singletonFetches = SINGLETON_KEYS.map(async (key) => {
      const { data, error } = await FZ.supabase.from(table(key)).select('payload').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        cache[key] = data.payload;
      } else {
        cache[key] = clone(DEFAULTS[key]);
        const { error: seedError } = await FZ.supabase.from(table(key)).upsert([{ user_id: userId, payload: cache[key] }], { onConflict: 'user_id' });
        if (seedError) throw seedError;
      }
    });

    await Promise.all([...arrayFetches, ...singletonFetches]);
    ready = true;
    notifySync(outbox.length ? 'pending' : 'synced');
  }

  function reset() {
    cache = clone(DEFAULTS);
    currentUserId = null;
    ready = false;
    outbox = [];
    saveOutbox();
    notifySync('signed-out');
  }

  // Real, permanent, cross-device deletion — used only by Settings' "Erase
  // all data" danger-zone action. Unlike everyday soft-delete, this bypasses
  // Archive entirely: there is nothing to restore afterward.
  async function eraseAll() {
    outbox = outbox.filter((op) => op.type === 'eraseAll'); // drop stale queued writes, they'd just be re-deleted
    await runOp({ type: 'eraseAll' });
    cache = clone(DEFAULTS);
    for (const key of SINGLETON_KEYS) {
      await FZ.supabase.from(table(key)).upsert([{ user_id: currentUserId, payload: cache[key] }], { onConflict: 'user_id' });
    }
  }

  // ---- public sync API — identical signatures to the old localStorage
  // version, so every module (tasks/finance/clients/... ) keeps working
  // completely unchanged. ------------------------------------------------

  function get(key) {
    assertKnownKey(key);
    return clone(cache[key]);
  }

  function set(key, value) {
    assertKnownKey(key);
    const next = clone(value);

    if (SINGLETON_KEYS.includes(key)) {
      cache[key] = next;
      enqueue({ type: 'singleton', key, payload: next });
      return;
    }

    const oldIds = new Set(cache[key].map((r) => r.id));
    const newIds = new Set(next.map((r) => r.id));
    const toDelete = [...oldIds].filter((id) => !newIds.has(id));

    cache[key] = next;

    if (next.length) enqueue({ type: 'upsert', key, rows: next });
    if (toDelete.length) enqueue({ type: 'delete', key, ids: toDelete });
  }

  function add(key, record) {
    const list = get(key);
    list.push(record);
    set(key, list);
    return record;
  }

  function update(key, id, patch) {
    const list = get(key);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    list[index] = Object.assign({}, list[index], patch);
    set(key, list);
    return list[index];
  }

  function remove(key, id) {
    const list = get(key);
    const next = list.filter((item) => item.id !== id);
    set(key, next);
    return next.length !== list.length;
  }

  function list(key) { return FZ.archive.active(get(key)); }
  function trashed(key) { return FZ.archive.trashed(get(key)); }
  function softDelete(key, id) { set(key, FZ.archive.softDeleteById(get(key), id)); }
  function restore(key, id) { set(key, FZ.archive.restoreById(get(key), id)); }
  function purgeExpired(key) { set(key, FZ.archive.purgeExpired(get(key))); }

  FZ.storage = {
    KEYS: ALL_KEYS.reduce((acc, k) => { acc[k] = k; return acc; }, {}),
    DEFAULTS,
    get, set, add, update, remove,
    list, trashed, softDelete, restore, purgeExpired,
    init, reset, eraseAll,
    isReady: () => ready,
    hasPendingSync: () => outbox.length > 0,
    onSyncStatus: (fn) => { syncListeners.push(fn); },
  };
})(window.FZ = window.FZ || {});
