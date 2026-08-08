/* ==========================================================================
   FZ.appMode — decides ONCE, at load time, whether the app runs in
   Development Mode (local-only, no Supabase project configured) or
   Production/Supabase Mode, and wires FZ.dataAdapter / FZ.authAdapter to
   the matching pair of adapters. Nothing else in the app checks the mode
   directly — data/storage.js and components/auth.js only ever call
   FZ.dataAdapter.* / FZ.authAdapter.*, so this file is the ONLY place
   "which backend" is decided. Connecting a real Supabase project later is
   filling in config.js, not touching application code.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const hasRealSupabaseConfig =
    typeof SUPABASE_URL === 'string' && SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1 &&
    typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.indexOf('your-anon-public-key') === -1;

  FZ.mode = hasRealSupabaseConfig ? 'production' : 'development';
  FZ.isDevMode = FZ.mode === 'development';

  FZ.dataAdapter = FZ.isDevMode ? FZ.adapters.mockData : FZ.adapters.supabaseData;
  FZ.authAdapter = FZ.isDevMode ? FZ.adapters.mockAuth : FZ.adapters.supabaseAuth;

  const banner = document.getElementById('devBanner');
  if (banner) banner.hidden = !FZ.isDevMode;

  if (FZ.isDevMode) {
    console.info(
      'Fifth & Zero OS — Development Mode: data is stored only in this browser (not Supabase). ' +
      'Fill in config.js with a real Supabase URL/anon key to switch to Production Mode.'
    );
  }
})(window.FZ = window.FZ || {});
