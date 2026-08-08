/* ==========================================================================
   FZ.adapters.mockAuth — Development Mode auth. Same contract as
   supabaseAuthAdapter.js (getSession/onAuthStateChange/getUser/
   signInWithPassword/signUp/signOut/resetPasswordForEmail/updateUser), so
   components/auth.js runs completely unchanged against either one.

   This deliberately does NOT fake success: signing in with a wrong
   password against a real locally-created account genuinely fails, an
   email that's already signed up genuinely can't sign up again, and a
   session genuinely has to exist to get past the auth gate. What it does
   NOT do — send email, hash/encrypt anything, or survive a cleared
   browser — is exactly the gap Supabase Mode closes. Password reset is
   honestly reported as unavailable here rather than faking an email send.
   ========================================================================== */

(function (FZ) {
  'use strict';

  const ACCOUNTS_KEY = 'fzdev.accounts';
  const SESSION_KEY = 'fzdev.session';
  const LATENCY_MS = 60;

  function delay(value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
  }

  function readAccounts() {
    try { return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY)) || {}; } catch (err) { return {}; }
  }
  function writeAccounts(accounts) { window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }

  function readSession() {
    try { return JSON.parse(window.localStorage.getItem(SESSION_KEY)); } catch (err) { return null; }
  }
  function writeSession(session) {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  }

  let listener = null;
  function notify(event, session) { if (listener) listener(event, session); }
  function sessionFor(email, id) { return { user: { id, email } }; }

  async function getSession() {
    return delay({ data: { session: readSession() }, error: null });
  }

  function onAuthStateChange(cb) {
    listener = cb;
    return { data: { subscription: { unsubscribe() { listener = null; } } } };
  }

  async function getUser() {
    const session = readSession();
    return delay({ data: { user: session ? session.user : null }, error: null });
  }

  async function signUp({ email, password }) {
    email = (email || '').trim().toLowerCase();
    if (!email || !password) return delay({ data: {}, error: { message: 'Email and password are required.' } });
    const accounts = readAccounts();
    if (accounts[email]) {
      return delay({ data: {}, error: { message: 'An account with this email already exists in Development Mode.' } });
    }
    const id = 'dev-' + Math.random().toString(36).slice(2, 10);
    accounts[email] = { password, id };
    writeAccounts(accounts);
    const session = sessionFor(email, id);
    writeSession(session);
    notify('SIGNED_IN', session);
    return delay({ data: { session }, error: null });
  }

  async function signInWithPassword({ email, password }) {
    email = (email || '').trim().toLowerCase();
    const account = readAccounts()[email];
    if (!account || account.password !== password) {
      return delay({ error: { message: 'Invalid email or password (Development Mode account).' } });
    }
    const session = sessionFor(email, account.id);
    writeSession(session);
    notify('SIGNED_IN', session);
    return delay({ error: null });
  }

  async function signOut() {
    writeSession(null);
    notify('SIGNED_OUT', null);
    return delay({ error: null });
  }

  async function resetPasswordForEmail() {
    return delay({ error: { message: 'Password reset isn’t available in Development Mode — this works once Supabase is connected.' } });
  }

  async function updateUser({ password }) {
    const session = readSession();
    if (!session) return delay({ error: { message: 'Not signed in.' } });
    const accounts = readAccounts();
    if (accounts[session.user.email]) {
      accounts[session.user.email].password = password;
      writeAccounts(accounts);
    }
    return delay({ error: null });
  }

  FZ.adapters = FZ.adapters || {};
  FZ.adapters.mockAuth = {
    getSession, onAuthStateChange, getUser, signInWithPassword, signUp, signOut, resetPasswordForEmail, updateUser,
  };
})(window.FZ = window.FZ || {});
