/* ==========================================================================
   FZ.adapters.mockData — the Development Mode data backend. Same contract
   as supabaseDataAdapter.js, so data/storage.js works identically either
   way, but persists to THIS browser's localStorage under its own
   namespace ("fzdev.db") instead of a real database. This is what the app
   runs on automatically whenever config.js still has placeholder Supabase
   credentials (see data/appMode.js) — it exists so the whole app can be
   built, used, and QA'd for real before a Supabase project exists, without
   pretending any of it is actually persisted remotely.

   Adapter contract (both this file and supabaseDataAdapter.js implement
   it identically):
     fetchArray(key, userId)                 -> Promise<Array<payload>>
     fetchSingleton(key, userId, defaultVal)  -> Promise<payload>  (seeds+persists defaultVal if missing)
     upsertRows(key, userId, rows)            -> Promise<void>
     deleteRows(key, userId, ids)             -> Promise<void>
     upsertSingleton(key, userId, payload)    -> Promise<void>
     eraseAllForUser(userId)                  -> Promise<void>
   ========================================================================== */

(function (FZ) {
  'use strict';

  const DB_KEY = 'fzdev.db';
  const LATENCY_MS = 60; // small artificial delay so loading states get genuinely exercised, not skipped

  function delay(value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
  }

  function readDB() {
    try { return JSON.parse(window.localStorage.getItem(DB_KEY)) || {}; } catch (err) { return {}; }
  }

  function writeDB(db) {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function userSlice(db, userId) {
    if (!db[userId]) db[userId] = {};
    return db[userId];
  }

  async function fetchArray(key, userId) {
    const slice = userSlice(readDB(), userId);
    return delay(Array.isArray(slice[key]) ? slice[key] : []);
  }

  async function fetchSingleton(key, userId, defaultPayload) {
    const db = readDB();
    const slice = userSlice(db, userId);
    if (slice[key] === undefined) {
      slice[key] = JSON.parse(JSON.stringify(defaultPayload));
      writeDB(db);
    }
    return delay(slice[key]);
  }

  async function upsertRows(key, userId, rows) {
    const db = readDB();
    const slice = userSlice(db, userId);
    const existing = Array.isArray(slice[key]) ? slice[key] : [];
    const byId = new Map(existing.map((r) => [r.id, r]));
    rows.forEach((r) => byId.set(r.id, r));
    slice[key] = [...byId.values()];
    writeDB(db);
    return delay(undefined);
  }

  async function deleteRows(key, userId, ids) {
    const db = readDB();
    const slice = userSlice(db, userId);
    const idSet = new Set(ids);
    slice[key] = (Array.isArray(slice[key]) ? slice[key] : []).filter((r) => !idSet.has(r.id));
    writeDB(db);
    return delay(undefined);
  }

  async function upsertSingleton(key, userId, payload) {
    const db = readDB();
    const slice = userSlice(db, userId);
    slice[key] = payload;
    writeDB(db);
    return delay(undefined);
  }

  async function eraseAllForUser(userId) {
    const db = readDB();
    delete db[userId];
    writeDB(db);
    return delay(undefined);
  }

  FZ.adapters = FZ.adapters || {};
  FZ.adapters.mockData = { fetchArray, fetchSingleton, upsertRows, deleteRows, upsertSingleton, eraseAllForUser };
})(window.FZ = window.FZ || {});
