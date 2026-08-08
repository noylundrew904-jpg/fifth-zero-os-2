# Fifth & Zero OS

A calm, premium personal operating system — Tasks, Clients, Projects,
Finance, Health, Habits, Calendar, and Knowledge (notes) — in one
dashboard. Built per `PROJECT_SPEC.md` as a static site: pure HTML, CSS,
and vanilla JavaScript, no build step, no frameworks, no npm install.
Data is stored in Supabase Postgres, scoped per signed-in user by Row
Level Security, so it persists across devices and browser sessions
rather than living only in one browser's `localStorage`.

## Run it

1. Create a Supabase project and run `supabase/schema.sql` once in its
   SQL Editor.
2. Fill in `config.js` with that project's URL and anon (public) key —
   see the comment in that file for why the anon key is safe to commit.
3. Serve the folder (a plain `file://` open won't work once network
   requests are involved — use any static server):
   ```bash
   npx serve .
   ```
4. Sign up for an account on first load. Every table's Row Level
   Security policy is keyed to the signed-in user, so your data is
   never visible to anyone else's account.

## Folder structure

```
index.html      app shell: auth gate + sidebar + page host
styles.css      the whole design system (dark mode, cards, forms, modal, auth)
script.js       bootstrap + hash router (runs after auth + data load)

config.js       Supabase project URL + anon key (anon key is meant to be public)
/supabase       schema.sql — Postgres tables + Row Level Security policies

/data           data/supabaseClient.js (the Supabase client) and
                data/storage.js — the ONLY place that talks to the
                database; every module still calls FZ.storage.get/set/
                add/update/remove/list/trashed/softDelete/restore exactly
                as before, now backed by an in-memory cache synced to
                Supabase in the background instead of localStorage
/utils          shared helpers: id generation, date/currency formatting,
                DOM-building, a tiny markdown renderer
/components     reusable UI: auth gate, sidebar, modal, toast, forms,
                list rows, dashboard/panel cards
/modules        one file per feature: dashboard, tasks, finance, clients,
                projects, health, habits, knowledge, calendar, settings

images/         favicon.svg, logo.svg
```

Scripts are loaded as plain `<script>` tags (not ES modules) in
dependency order, each attaching itself to a shared `FZ` namespace
(`FZ.storage`, `FZ.dom`, `FZ.modules.tasks`, …). No module file needed
to change when the storage backend moved from localStorage to
Supabase — they all go through `FZ.storage`, which kept the exact same
synchronous method signatures on top of the new async backend (reads
serve instantly from cache; writes update the cache immediately and
sync to Supabase in the background, retrying through a small local
outbox if the connection drops).

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
standalone events with task due dates, and markdown notes with search.
Authentication (sign up/in/out, password reset), Supabase-backed
persistence, and a one-time import path for pre-cloud-sync local data
(Settings → "Import from this browser") are also in place.

## Future integrations

Apple Health, Google Calendar, Gmail, Drive, and an AI assistant are
not wired up yet.
