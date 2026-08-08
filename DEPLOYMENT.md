# Deployment Checklist

Fifth & Zero OS is code-complete and running in **Development Mode**
(local-only persistence, no backend). Everything below is what turns that
into the production deployment: **connect Supabase → configure production
environment → deploy → test the live URL.** Nothing on the application
side is left to build — this is a provisioning/configuration checklist,
not a development task list.

---

## 1. Supabase

### 1.1 Project
- [ ] Create a new Supabase project (any region close to you; this app
      has no region-specific requirements).
- [ ] Note the project's **URL** and **anon (public) key** from
      Project Settings → API. The anon key is *meant* to be public — see
      the comment in `config.js` and in `supabase/schema.sql`. Row Level
      Security (below) is the actual security boundary, not key secrecy.
- [ ] **Never** copy the `service_role` key anywhere in this repo or in
      Vercel's frontend-exposed env vars. This app has no backend/server
      function that would legitimately need it — it is not referenced
      anywhere in the codebase, and it must stay that way.

### 1.2 Schema (tables, columns, relationships, indexes, RLS)
- [ ] Run `supabase/schema.sql` once, in full, via Dashboard → SQL Editor.
      It is idempotent (safe to re-run).
- [ ] It creates 9 tables, one per data collection the app already uses:

  | Table | Shape | Columns |
  |---|---|---|
  | `fz_tasks` | one row per record | `id uuid pk`, `user_id uuid`, `payload jsonb`, `created_at`, `updated_at` |
  | `fz_clients` | one row per record | same shape as above |
  | `fz_projects` | one row per record | same shape as above |
  | `fz_health` | one row per record | same shape as above |
  | `fz_habits` | one row per record | same shape as above |
  | `fz_notes` | one row per record | same shape as above |
  | `fz_calendar` | one row per record | same shape as above |
  | `fz_finance` | **one row per user** | `user_id uuid pk`, `payload jsonb` = `{transactions, subscriptions, loans, invoices}`, `updated_at` |
  | `fz_settings` | **one row per user** | `user_id uuid pk`, `payload jsonb` = `{theme, name}`, `updated_at` |

  `payload` holds the exact same record shape the app already works with
  (including its own `deletedAt` for the soft-delete/Archive system) —
  there is no field-name translation layer to maintain.
- [ ] **Relationships**: `user_id` on every table references
      `auth.users(id) on delete cascade` — deleting a Supabase user
      cleans up all their rows automatically. There are no foreign keys
      between app tables (e.g. task → project) because the app already
      treats those as soft references resolved client-side, exactly as it
      did with localStorage.
- [ ] **Indexes**: `fz_<key>_user_id_idx` on every array table's `user_id`
      column (created by the schema script) — this is the only column
      every query filters on, so it's the only index that matters at this
      scale.
- [ ] **RLS**: every table has Row Level Security enabled with a single
      `for all using (auth.uid() = user_id) with check (auth.uid() =
      user_id)` policy. Confirm in Dashboard → Authentication → Policies
      that all 9 tables show RLS **on** with exactly one policy each.

### 1.3 Auth configuration
- [ ] Email/password auth is enabled by default — no action needed for
      sign up/sign in to work.
- [ ] Dashboard → Authentication → URL Configuration: set **Site URL**
      to your production Vercel URL once you have it (needed for the
      password-reset email's redirect link to land back on the real app
      instead of `localhost`).
- [ ] Decide whether to require email confirmation on sign-up
      (Authentication → Providers → Email → "Confirm email"). The app
      already handles both cases (`components/auth.js` checks whether
      `signUp` returns a session immediately or not).
- [ ] Optional: customize the password-reset email template
      (Authentication → Email Templates) — cosmetic, not required.

### 1.4 Storage requirements
- [ ] None. This app has no file/image upload feature in its current
      scope, so no Supabase Storage buckets are needed.

### 1.5 Environment variables (Supabase side)
- [ ] None to set *in* Supabase itself for this app — the anon key and
      URL are consumed by the frontend (`config.js`), not by any
      Supabase-side function/trigger.

### 1.6 Seed / test data
- [ ] Not required. Every new account starts empty by design (the app's
      empty states are part of the product, not a gap to fill).
- [ ] If you want to sanity-check the schema before pointing the real app
      at it: sign up once through the deployed app itself and create a
      task — that exercises every RLS policy and the singleton-seeding
      logic (`fz_finance`/`fz_settings` auto-create their one row on
      first read) end-to-end.

---

## 2. Vercel

### 2.1 Project setup
- [ ] Import this GitHub repository as a new Vercel project.
- [ ] **Framework preset**: "Other" / static site. There is no build
      step — no npm install, no bundler.
- [ ] **Build command**: leave empty (or `echo "no build step"` if
      Vercel requires a non-empty value).
- [ ] **Output directory**: `.` (repo root) — `index.html` is already at
      the top level.
- [ ] **Install command**: leave empty — there is no `package.json` to
      install from.

### 2.2 Environment variables (Vercel side)
- [ ] None are required for Vercel itself. `SUPABASE_URL` and
      `SUPABASE_ANON_KEY` live in `config.js`, committed directly to the
      repo (safe — see 1.1). This app has no server/API routes, so there
      is no `.env` surface Vercel needs to inject at build or runtime.
- [ ] If you'd prefer not to commit the anon key directly (a preference,
      not a security requirement, since the key is meant to be public):
      you could switch `config.js` to read `window.__ENV__` values
      injected by a tiny Vercel build step — not done here, since it adds
      a build step this project deliberately doesn't have, for a key
      that's safe to commit either way.

### 2.3 Production settings
- [ ] Root directory: repo root (default).
- [ ] Node.js version: irrelevant (no build/runtime uses it).
- [ ] Custom domain: optional, attach whenever you're ready.

### 2.4 Deployment steps
1. Fill in `config.js` with the real `SUPABASE_URL` / `SUPABASE_ANON_KEY`
   from step 1.1 (this alone flips `FZ.mode` from `development` to
   `production` at load time — see `data/appMode.js` — no other code
   change needed).
2. Commit and push `config.js`.
3. Connect the repo in Vercel (2.1) and deploy.
4. In Supabase, set Site URL (1.3) to the resulting `*.vercel.app` URL
   (or your custom domain).
5. Open the deployed URL, sign up for a real account, and run through
   the acceptance checklist below.

---

## 3. Post-deploy acceptance checklist

Run these against the **live URL**, not localhost:

- [ ] Sign up → land in the app with an empty workspace
- [ ] Create a task → refresh → still there
- [ ] Sign out → sign back in → still there
- [ ] Open the same account in a second browser/device → same data
- [ ] Password reset email actually arrives and its link works
- [ ] Create data in every module, confirm Dashboard/Analytics/Finance
      numbers agree with each other
- [ ] Archive a record → restore it
- [ ] Mark an invoice paid → cash updates → un-mark it → cash rolls back
- [ ] Confirm the Development Mode banner is **gone** (proof `config.js`
      is pointing at the real project, not placeholders)
- [ ] Open Supabase Dashboard → Table Editor → confirm rows exist under
      your account's `user_id` in each table
- [ ] Try to query another user's rows with your own session (e.g. via
      the browser console using a real record id you don't own) and
      confirm RLS returns nothing

Once these pass, the deployment is done — nothing further to build.
