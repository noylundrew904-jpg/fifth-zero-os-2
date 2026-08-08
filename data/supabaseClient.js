/* ==========================================================================
   FZ.supabase — the one Supabase client instance, built from config.js.
   Loaded after the supabase-js CDN script and config.js, before
   data/storage.js (which reads/writes through this client) and
   components/auth.js (which drives sign in/up/out through it).

   The anon key in config.js is meant to be public — see the note there and
   in supabase/schema.sql. Row Level Security is the real security boundary,
   not keeping this key secret. No service-role key is ever referenced here
   or anywhere else in the frontend.
   ========================================================================== */

(function (FZ) {
  'use strict';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('FZ.supabase: supabase-js failed to load — check network access to the CDN.');
    return;
  }
  if (typeof SUPABASE_URL !== 'string' || SUPABASE_URL.indexOf('YOUR-PROJECT-REF') !== -1) {
    console.error('FZ.supabase: config.js still has placeholder values — fill in SUPABASE_URL / SUPABASE_ANON_KEY.');
  }

  FZ.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})(window.FZ = window.FZ || {});
