/* ==========================================================================
   FZ.adapters.supabaseAuth — the production auth backend. Thin pass-through
   to FZ.supabase.auth, matching the same contract mockAuthAdapter.js
   implements locally, so components/auth.js is written against
   FZ.authAdapter and never needs to know which one is active.
   ========================================================================== */

(function (FZ) {
  'use strict';

  FZ.adapters = FZ.adapters || {};
  FZ.adapters.supabaseAuth = {
    getSession: (...args) => FZ.supabase.auth.getSession(...args),
    onAuthStateChange: (...args) => FZ.supabase.auth.onAuthStateChange(...args),
    getUser: (...args) => FZ.supabase.auth.getUser(...args),
    signInWithPassword: (...args) => FZ.supabase.auth.signInWithPassword(...args),
    signUp: (...args) => FZ.supabase.auth.signUp(...args),
    signOut: (...args) => FZ.supabase.auth.signOut(...args),
    resetPasswordForEmail: (...args) => FZ.supabase.auth.resetPasswordForEmail(...args),
    updateUser: (...args) => FZ.supabase.auth.updateUser(...args),
  };
})(window.FZ = window.FZ || {});
