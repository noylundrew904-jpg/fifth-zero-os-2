# Fifth & Zero OS

A calm, premium personal operating system — Tasks, Clients, Projects,
Finance, Health, Habits, Calendar, and Knowledge (notes) — in one
dashboard. Built per `PROJECT_SPEC.md` as a static site: pure HTML, CSS,
and vanilla JavaScript, no build step, no frameworks, no npm install.

## Run it

Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

Everything is stored in `localStorage`, so the app works fully offline
and keeps your data on your machine.

## Folder structure

```
index.html      app shell: sidebar + page host
styles.css      the whole design system (dark mode, cards, forms, modal)
script.js       bootstrap + hash router

/data           localStorage abstraction (data/storage.js) — the only
                place that touches window.localStorage
/utils          shared helpers: id generation, date/currency formatting,
                DOM-building, a tiny markdown renderer
/components     reusable UI: sidebar, modal, toast, forms, list rows,
                dashboard/panel cards
/modules        one file per feature: dashboard, tasks, finance, clients,
                projects, health, habits, knowledge, calendar

images/         favicon.svg, logo.svg
config.js       Supabase URL/anon key placeholder — for future use
supabase/       schema.sql — for future use
```

Scripts are loaded as plain `<script>` tags (not ES modules) in
dependency order, each attaching itself to a shared `FZ` namespace
(`FZ.storage`, `FZ.dom`, `FZ.modules.tasks`, …). This keeps the app
runnable by opening `index.html` directly — no server, no bundler,
no CORS issues with modules over `file://`.

## Data model

Every collection lives under its own `localStorage` key (see
`data/storage.js`), isolated from the others:

- `tasks`, `clients`, `projects`, `health`, `habits`, `notes`,
  `calendar` — arrays of records
- `finance` — `{ transactions, subscriptions, loans, invoices }`
- `settings` — `{ theme, name }`

## What's built (Version 1)

All eight modules are functional: add/edit/delete records, a home
dashboard with six live summary cards (Tasks Today, Cash Available,
Pending Payments, Steps, Calories, Calendar Events), quick-add actions
for Task/Expense/Client/Note, a finance overview chart (plain
`<canvas>`, no charting library), a month calendar that merges
standalone events with task due dates, and markdown notes with search.

## Future integrations

Supabase (`config.js` / `supabase/schema.sql` are placeholders for
this), Apple Health, Google Calendar, Gmail, Drive, and an AI
assistant — none of these are wired up yet. The local-first data layer
is designed so a Supabase sync layer can be added later without
touching module code.
