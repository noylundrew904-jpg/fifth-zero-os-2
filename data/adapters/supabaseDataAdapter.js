/* ==========================================================================
   FZ.adapters.supabaseData — the production data backend. Implements the
   same small adapter contract as mockDataAdapter.js (see that file for the
   full interface docs); data/storage.js calls this contract, never
   Supabase directly, so swapping backends is a one-line change in
   data/appMode.js rather than a rewrite of the app.
   ========================================================================== */

(function (FZ) {
  'use strict';

  function table(key) { return 'fz_' + key; }

  async function fetchArray(key, userId) {
    const { data, error } = await FZ.supabase.from(table(key)).select('payload').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row) => row.payload);
  }

  async function fetchSingleton(key, userId, defaultPayload) {
    const { data, error } = await FZ.supabase.from(table(key)).select('payload').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    if (data) return data.payload;
    const seeded = JSON.parse(JSON.stringify(defaultPayload));
    const { error: seedError } = await FZ.supabase.from(table(key)).upsert([{ user_id: userId, payload: seeded }], { onConflict: 'user_id' });
    if (seedError) throw seedError;
    return seeded;
  }

  async function upsertRows(key, userId, rows) {
    const rowsForDb = rows.map((payload) => ({ id: payload.id, user_id: userId, payload }));
    const { error } = await FZ.supabase.from(table(key)).upsert(rowsForDb, { onConflict: 'id' });
    if (error) throw error;
  }

  async function deleteRows(key, userId, ids) {
    const { error } = await FZ.supabase.from(table(key)).delete().in('id', ids);
    if (error) throw error;
  }

  async function upsertSingleton(key, userId, payload) {
    const { error } = await FZ.supabase.from(table(key)).upsert([{ user_id: userId, payload }], { onConflict: 'user_id' });
    if (error) throw error;
  }

  async function eraseAllForUser(userId) {
    const ARRAY_KEYS = ['tasks', 'clients', 'projects', 'health', 'habits', 'notes', 'calendar'];
    const SINGLETON_KEYS = ['finance', 'settings'];
    for (const key of ARRAY_KEYS) {
      const { error } = await FZ.supabase.from(table(key)).delete().eq('user_id', userId);
      if (error) throw error;
    }
    for (const key of SINGLETON_KEYS) {
      const { error } = await FZ.supabase.from(table(key)).delete().eq('user_id', userId);
      if (error) throw error;
    }
  }

  FZ.adapters = FZ.adapters || {};
  FZ.adapters.supabaseData = { fetchArray, fetchSingleton, upsertRows, deleteRows, upsertSingleton, eraseAllForUser };
})(window.FZ = window.FZ || {});
