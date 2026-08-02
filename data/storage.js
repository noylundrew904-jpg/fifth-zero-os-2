/* ==========================================================================
   FZ.storage — the only place in the app that touches window.localStorage.
   Every module reads/writes through here so each data domain (tasks,
   clients, projects, finance, health, habits, notes, calendar, settings)
   stays isolated under its own key, per PROJECT_SPEC.md.
   ========================================================================== */

(function (FZ) {
  'use strict';

  // Every localStorage key the app owns, namespaced so we never collide
  // with anything else that might live in the same browser storage.
  const KEYS = {
    tasks: 'fz.tasks',
    clients: 'fz.clients',
    projects: 'fz.projects',
    finance: 'fz.finance',
    health: 'fz.health',
    habits: 'fz.habits',
    notes: 'fz.notes',
    calendar: 'fz.calendar',
    settings: 'fz.settings',
  };

  // Shape of a brand-new install: every collection starts empty, settings
  // start at sane defaults. Modules extend/read this, never invent keys.
  const DEFAULTS = {
    tasks: [],
    clients: [],
    projects: [],
    finance: { transactions: [], subscriptions: [], loans: [], invoices: [] },
    health: [],
    habits: [],
    notes: [],
    calendar: [],
    settings: { theme: 'dark', name: '' },
  };

  // Read a collection, falling back to its default shape if missing/corrupt.
  function get(key) {
    const storageKey = KEYS[key];
    if (!storageKey) throw new Error(`Unknown storage key: ${key}`);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return clone(DEFAULTS[key]);
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`FZ.storage: corrupt data for "${key}", resetting.`, err);
      return clone(DEFAULTS[key]);
    }
  }

  // Persist a collection as-is (caller owns the full value).
  function set(key, value) {
    const storageKey = KEYS[key];
    if (!storageKey) throw new Error(`Unknown storage key: ${key}`);
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }

  // Convenience for array collections: push a record and save.
  function add(key, record) {
    const list = get(key);
    list.push(record);
    set(key, list);
    return record;
  }

  // Convenience for array collections: patch a record by id and save.
  function update(key, id, patch) {
    const list = get(key);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    list[index] = Object.assign({}, list[index], patch);
    set(key, list);
    return list[index];
  }

  // Hard remove — bypasses the archive. Only used by the Archive screen's
  // "Delete permanently" action and by the 30-day auto-purge.
  function remove(key, id) {
    const list = get(key);
    const next = list.filter((item) => item.id !== id);
    set(key, next);
    return next.length !== list.length;
  }

  // ---- Soft delete (see PROJECT_SPEC's approved delete behavior) -----------
  // Nothing a user deletes disappears immediately: it's stamped with
  // deletedAt and kept for 30 days so it can be restored from the Archive.

  // Active (non-deleted) records — what every module lists/renders.
  function list(key) {
    return FZ.archive.active(get(key));
  }

  // Deleted-but-recoverable records — what the Archive screen shows.
  function trashed(key) {
    return FZ.archive.trashed(get(key));
  }

  function softDelete(key, id) {
    set(key, FZ.archive.softDeleteById(get(key), id));
  }

  function restore(key, id) {
    set(key, FZ.archive.restoreById(get(key), id));
  }

  // Drop anything past its 30-day retention window. Safe to call on boot.
  function purgeExpired(key) {
    set(key, FZ.archive.purgeExpired(get(key)));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  FZ.storage = {
    KEYS, get, set, add, update, remove,
    list, trashed, softDelete, restore, purgeExpired,
  };
})(window.FZ = window.FZ || {});
