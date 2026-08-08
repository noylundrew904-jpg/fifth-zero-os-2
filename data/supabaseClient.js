/* ==========================================================================
   FZ.supabase — the one Supabase client instance, built from config.js.
   Only exists in Production Mode (see data/appMode.js) — with placeholder
   config.js values there's no real project to talk to, so this is skipped
   entirely and the app runs on the local Development Mode adapters
   instead. FZ.supabase is only ever read from data/adapters/supabase*.js,
   never from app code directly.

   The anon key in config.js is meant to be public — see the note there and
   in supabase/schema.sql. Row Level Security is the real security boundary,
   not keeping this key secret. No service-role key is ever referenced here
   or anywhere else in the frontend.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const hasRealConfig =
    typeof SUPABASE_URL === 'string' && SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1 &&
    typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.indexOf('your-anon-public-key') === -1;

  if (!hasRealConfig) {
    // Expected in Development Mode — data/appMode.js routes the app to the
    // local adapters instead, so no client is needed here.
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error('FZ.supabase: supabase-js failed to load — check network access, then reload.');
    return;
  }

  FZ.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
})(window.FZ = window.FZ || {});
