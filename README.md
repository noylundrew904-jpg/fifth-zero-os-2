# Fifth & Zero OS

A calm, premium personal operating system — Tasks, Clients, Projects,
Finance, Health, Habits, Calendar, and Knowledge (notes) — in one
dashboard. Built per `PROJECT_SPEC.md` as a static site: pure HTML, CSS,
and vanilla JavaScript, no build step, no frameworks, no npm install.
In production, data is stored in Supabase Postgres, scoped per
signed-in user by Row Level Security, so it persists across devices and
browser sessions rather than living only in one browser's
`localStorage`.

## Two modes, one codebase

The app runs in one of two modes, decided automatically at load time by
`data/appMode.js` — nothing else in the app knows or cares which one is
active:

- **Development Mode** — the default, with no setup required. There is
  no Supabase project yet (`config.js` still has placeholder values), so
  the app runs entirely on local adapters (`data/adapters/mockData.js`,
  `mockAuth.js`): real sign up/sign in with real (if local-only)
  accounts, real CRUD, real persistence across a reload — all backed by
  this browser's `localStorage` under its own namespace. A banner at the
  top of the app and a tag in Settings make this unmistakable; nothing
  pretends to be syncing to the cloud.
- **Production/Supabase Mode** — activates automatically the moment
  `config.js` has a real Supabase URL and anon key. See `DEPLOYMENT.md`
  for the full provisioning checklist.

Every module, and `data/storage.js`/`components/auth.js` themselves,
only ever call `FZ.dataAdapter.*` / `FZ.authAdapter.*` — never Supabase
directly — so connecting a real project later is a `config.js` change,
not an application rewrite.

## Run it

**Development Mode (default, no setup):**
```bash
npx serve .
```
Open the served URL, sign up with any email/password, and use the app —
data stays in this browser only, clearly labeled as such.

**Production/Supabase Mode:**
1. Create a Supabase project and run `supabase/schema.sql` once in its
   SQL Editor.
2. Fill in `config.js` with that project's URL and anon (public) key —
   see the comment in that file for why the anon key is safe to commit.
3. Serve the folder the same way as above. Sign up for an account —
   every table's Row Level Security policy is keyed to the signed-in
   user, so your data is never visible to anyone else's account.

Full deployment steps (Supabase provisioning + Vercel) are in
`DEPLOYMENT.md`.

## Folder structure

```
index.html      app shell: auth gate + sidebar + page host
styles.css      the whole design system (dark mode, cards, forms, modal, auth)
script.js       bootstrap + hash router (runs after auth + data load)

config.js       Supabase project URL + anon key (anon key is meant to be public;
                placeholder values here = Development Mode)
DEPLOYMENT.md   full Supabase + Vercel provisioning checklist
/supabase       schema.sql — Postgres tables + Row Level Security policies

/data           data/appMode.js picks FZ.dataAdapter / FZ.authAdapter
                (see "Two modes" above); data/supabaseClient.js builds
                the Supabase client (production only); data/storage.js
                is the ONLY place app code touches persisted data —
                every module calls FZ.storage.get/set/add/update/
                remove/list/trashed/softDelete/restore exactly as
                before, backed by an in-memory cache that syncs through
                whichever adapter is active
/data/adapters  supabaseDataAdapter.js + mockDataAdapter.js (same
                contract, real Postgres vs. local `localStorage`);
                supabaseAuthAdapter.js + mockAuthAdapter.js (same
                contract, real Supabase Auth vs. local dev accounts)
/utils          shared helpers: id generation, date/currency formatting,
                DOM-building, a tiny markdown renderer
/components     reusable UI: auth gate, sidebar, modal, toast, forms,
                list rows, dashboard/panel cards
/modules        one file per feature: dashboard, tasks, finance, clients,
                projects, health, habits, knowledge, calendar, settings
/vendor         supabase-js, vendored rather than CDN-loaded

images/         favicon.svg, logo.svg
```

Scripts are loaded as plain `<script>` tags (not ES modules) in
dependency order, each attaching itself to a shared `FZ` namespace
(`FZ.storage`, `FZ.dom`, `FZ.modules.tasks`, …). No module file needed
to change when the storage backend moved from localStorage to a
Supabase-or-mock adapter pair — they all go through `FZ.storage`, which
kept the exact same synchronous method signatures on top of the async
adapter underneath (reads serve instantly from cache; writes update the
cache immediately and sync through the active adapter in the
background, retrying through a small local outbox if the connection
drops).

## Data model

Every collection lives in its own Supabase table (`fz_tasks`,
`fz_clients`, …, see `supabase/schema.sql`), each row scoped to its
owner via `user_id` and Row Level Security:

- `tasks`, `clients`, `projects`, `health`, `habits`, `notes`,
  `calendar` — one row per record, `payload` jsonb holds the record
- `finance` — one row per user, `payload` is `{ transactions,
  subscriptions, loans, invoices }`
- `settings` — one row per user, `payload` is `{ theme, name }`

The `payload` shape is exactly what the app already worked with
locally (including its own `deletedAt` for the archive/soft-delete
system), so no module needed to change field names.

## What's built (Version 1)

All eight modules are functional: add/edit/delete records, a home
dashboard with six live summary cards (Tasks Today, Cash Available,
Pending Payments, Steps, Calories, Calendar Events), quick-add actions
for Task/Expense/Client/Note, a finance overview chart (plain
`<canvas>`, no charting library), a month calendar that merges
standalone events with task due dates, invoices that can be marked paid
(auto-generates the income transaction) and un-marked (reverses it,
recoverable from Archive), and markdown notes with search.
Authentication (sign up/in/out, password reset, protected routes),
Supabase-backed persistence with a local Development Mode fallback, and
a one-time import path for pre-cloud-sync local data (Settings →
"Import from this browser") are also in place.

## Future integrations

Apple Health, Google Calendar, Gmail, Drive, and an AI assistant are
not wired up yet.
