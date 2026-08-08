/* ==========================================================================
   FZ.auth — the sign-in gate. Nothing in the app renders, and no database
   read ever happens, until a real Supabase session exists: every table's
   RLS policy is keyed off auth.uid(), so an unauthenticated request simply
   returns no rows rather than anything belonging to someone else.

   Flow: boot() checks for an existing session, subscribes to auth state
   changes (sign in / sign out / password recovery), and toggles between
   the auth screen (#authRoot) and the real app shell (#appShell) — never
   both visible at once. Once a session exists, it calls FZ.storage.init()
   before handing control to the app, so the very first render already has
   real data instead of an empty flash.
   ========================================================================== */

(function (FZ) {
  'use strict';
  const { el, clear } = FZ.dom;

  let authRoot = null;
  let appShell = null;
  let onReadyCallback = null;
  let booted = false;

  function showAuth() {
    appShell.hidden = true;
    authRoot.hidden = false;
  }

  function showApp() {
    authRoot.hidden = true;
    appShell.hidden = false;
  }

  function card(children) {
    return el('div', { class: 'auth-screen' }, [
      el('div', { class: 'auth-card' }, [
        el('div', { class: 'auth-brand' }, [
          el('img', { src: 'images/favicon.svg', alt: '' }),
          el('span', {}, 'Fifth & Zero'),
        ]),
        ...children,
      ]),
    ]);
  }

  function renderLoading(message) {
    clear(authRoot);
    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, message || 'Loading your workspace…'),
    ]));
    showAuth();
  }

  function renderErrorScreen(message, onRetry) {
    clear(authRoot);
    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Something went wrong'),
      el('p', { class: 'auth-error' }, message),
      el('button', { class: 'btn btn-primary', type: 'button', onclick: onRetry }, 'Try again'),
    ]));
    showAuth();
  }

  function field(config) {
    const id = 'auth_' + config.name;
    const input = el('input', {
      id,
      type: config.type || 'text',
      required: !!config.required,
      autocomplete: config.autocomplete,
      minlength: config.minlength,
    });
    return {
      input,
      node: el('div', { class: 'field' }, [
        el('label', { for: id }, config.label),
        input,
      ]),
    };
  }

  // ---- Sign in ---------------------------------------------------------

  function renderSignIn(errorMessage) {
    clear(authRoot);
    const emailField = field({ name: 'email', type: 'email', label: 'Email', required: true, autocomplete: 'email' });
    const passwordField = field({ name: 'password', type: 'password', label: 'Password', required: true, autocomplete: 'current-password' });

    const form = el('form', {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        const { error } = await FZ.supabase.auth.signInWithPassword({
          email: emailField.input.value.trim(),
          password: passwordField.input.value,
        });
        if (error) {
          submitBtn.disabled = false;
          renderSignIn(error.message);
        }
        // success: onAuthStateChange picks it up and boots the app
      },
    }, [
      emailField.node,
      passwordField.node,
      errorMessage ? el('div', { class: 'auth-error' }, errorMessage) : null,
      el('button', { type: 'submit', class: 'btn btn-primary' }, 'Sign in'),
    ]);

    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Sign in to your workspace'),
      form,
      el('div', { class: 'auth-links' }, [
        el('button', { class: 'auth-link', type: 'button', onclick: () => renderForgotPassword() }, 'Forgot password?'),
        el('button', { class: 'auth-link', type: 'button', onclick: () => renderSignUp() }, "Don't have an account? Sign up"),
      ]),
    ]));
    showAuth();
  }

  // ---- Sign up -----------------------------------------------------------

  function renderSignUp(errorMessage) {
    clear(authRoot);
    const emailField = field({ name: 'suEmail', type: 'email', label: 'Email', required: true, autocomplete: 'email' });
    const passwordField = field({ name: 'suPassword', type: 'password', label: 'Password (min 6 characters)', required: true, minlength: 6, autocomplete: 'new-password' });

    const form = el('form', {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        const { data, error } = await FZ.supabase.auth.signUp({
          email: emailField.input.value.trim(),
          password: passwordField.input.value,
        });
        if (error) {
          submitBtn.disabled = false;
          renderSignUp(error.message);
          return;
        }
        if (data.session) {
          // project has email confirmation disabled — signed in immediately
          return;
        }
        renderCheckEmail(emailField.input.value.trim());
      },
    }, [
      emailField.node,
      passwordField.node,
      errorMessage ? el('div', { class: 'auth-error' }, errorMessage) : null,
      el('button', { type: 'submit', class: 'btn btn-primary' }, 'Create account'),
    ]);

    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Create your workspace'),
      form,
      el('div', { class: 'auth-links' }, [
        el('button', { class: 'auth-link', type: 'button', onclick: () => renderSignIn() }, 'Already have an account? Sign in'),
      ]),
    ]));
    showAuth();
  }

  function renderCheckEmail(email) {
    clear(authRoot);
    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Check your email'),
      el('p', { class: 'auth-body' }, `We sent a confirmation link to ${email}. Open it to activate your account, then sign in here.`),
      el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => renderSignIn() }, 'Back to sign in'),
    ]));
    showAuth();
  }

  // ---- Forgot password -----------------------------------------------------

  function renderForgotPassword(errorMessage, sent) {
    clear(authRoot);
    if (sent) {
      authRoot.appendChild(card([
        el('p', { class: 'auth-subtitle' }, 'Check your email'),
        el('p', { class: 'auth-body' }, 'If an account exists for that address, a password reset link is on its way.'),
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => renderSignIn() }, 'Back to sign in'),
      ]));
      showAuth();
      return;
    }

    const emailField = field({ name: 'resetEmail', type: 'email', label: 'Email', required: true, autocomplete: 'email' });
    const form = el('form', {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        const { error } = await FZ.supabase.auth.resetPasswordForEmail(emailField.input.value.trim(), {
          redirectTo: window.location.origin + window.location.pathname,
        });
        if (error) {
          submitBtn.disabled = false;
          renderForgotPassword(error.message);
          return;
        }
        renderForgotPassword(null, true);
      },
    }, [
      emailField.node,
      errorMessage ? el('div', { class: 'auth-error' }, errorMessage) : null,
      el('button', { type: 'submit', class: 'btn btn-primary' }, 'Send reset link'),
    ]);

    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Reset your password'),
      form,
      el('div', { class: 'auth-links' }, [
        el('button', { class: 'auth-link', type: 'button', onclick: () => renderSignIn() }, 'Back to sign in'),
      ]),
    ]));
    showAuth();
  }

  // Reached after clicking the emailed reset link — Supabase fires a
  // PASSWORD_RECOVERY auth event and hands us a temporary recovery session.
  function renderNewPassword(errorMessage) {
    clear(authRoot);
    const passwordField = field({ name: 'newPassword', type: 'password', label: 'New password (min 6 characters)', required: true, minlength: 6, autocomplete: 'new-password' });
    const form = el('form', {
      class: 'modal-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        const { error } = await FZ.supabase.auth.updateUser({ password: passwordField.input.value });
        if (error) {
          submitBtn.disabled = false;
          renderNewPassword(error.message);
          return;
        }
        FZ.toast.show('Password updated');
        // onAuthStateChange (SIGNED_IN) will boot the app from here
      },
    }, [
      passwordField.node,
      errorMessage ? el('div', { class: 'auth-error' }, errorMessage) : null,
      el('button', { type: 'submit', class: 'btn btn-primary' }, 'Set new password'),
    ]);

    authRoot.appendChild(card([
      el('p', { class: 'auth-subtitle' }, 'Choose a new password'),
      form,
    ]));
    showAuth();
  }

  // ---- Boot / session lifecycle --------------------------------------------

  async function handleSignedIn(user) {
    renderLoading('Loading your workspace…');
    try {
      await FZ.storage.init(user.id);
      showApp();
      if (onReadyCallback) onReadyCallback();
    } catch (err) {
      console.error('FZ.auth: failed to load data after sign-in', err);
      renderErrorScreen('We couldn’t load your data. This usually means a network hiccup — check your connection and try again.', () => handleSignedIn(user));
    }
  }

  function signOut() {
    return FZ.supabase.auth.signOut();
  }

  async function checkInitialSession() {
    renderLoading('Loading…');
    const { data, error } = await FZ.supabase.auth.getSession();
    if (error) {
      renderErrorScreen('Could not reach the authentication service. Check your connection and try again.', checkInitialSession);
      return;
    }
    if (data.session && data.session.user) {
      await handleSignedIn(data.session.user);
    } else {
      renderSignIn();
    }
  }

  // container ids expected in index.html: #authRoot, #appShell.
  // onReady is called every time the app becomes visible with fresh data
  // (initial sign-in, and again after any later sign-in).
  async function boot(onReady) {
    if (booted) return;
    booted = true;
    authRoot = document.getElementById('authRoot');
    appShell = document.getElementById('appShell');
    onReadyCallback = onReady;

    if (!FZ.supabase) {
      renderErrorScreen('Could not load the app’s database client. Check your connection and reload the page.', () => window.location.reload());
      return;
    }

    FZ.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        renderNewPassword();
        return;
      }
      if (event === 'SIGNED_OUT') {
        FZ.storage.reset();
        renderSignIn();
        return;
      }
      if (session && session.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        // Avoid re-running the full data load on every token refresh —
        // only (re)load when we don't already have a ready cache for this user.
        if (!FZ.storage.isReady()) handleSignedIn(session.user);
      }
    });

    await checkInitialSession();
  }

  FZ.auth = { boot, signOut };
})(window.FZ = window.FZ || {});
