# NOEL OS

Noel's personal AI operating system — tasks, priorities, ideas, notes,
money, debt, pipeline and Fifth & Zero, captured by voice or text and
organised automatically. This is **Phase 1** of the build: a fully working
app with real interactions, running entirely in the browser with zero
setup, on a data layer designed to be swapped for Google Workspace without
touching the UI.

**Visual language:** dark OS + editorial data interface. Numbered modules
(`01 // OPERATOR`, `02 // SESSION`, `a1 // LIQUID CASH`…), hairline
dividers instead of heavy cards, outlined status pills, a monospace face
for system chrome/metadata paired with an italic serif for the human
voice (greeting, review notes). Colour is used only for meaning — red/
orange/yellow/muted priority, green for positive — everything else is
black, white and grey. See `style.css` for the full token system.

No build step, no `npm install`. Open `index.html` or serve the folder.

## Run it

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the printed local URL. Everything works immediately — voice
capture, quick capture, tasks, money, debt, pipeline, ideas, notes, the
assistant, global search, and the confirmation flow — using realistic
seeded data from the spec (Sonia, Azeem, Shreya, Clyde, Marlyne, Mai, CRED,
Bluestone, etc). It's also installable as a PWA (see below).

## What's real vs. what's a placeholder

**Real and interactive today (Phase 1):**
- Dashboard (10 numbered modules: Operator, Session, Priorities, Key
  Blockers, Money, Pipeline, Fifth & Zero, Ideas, Notes, Review), Tasks,
  Finance (Overview/Liabilities/Receivables), CRM (Pipeline/Clients/Leads),
  Fifth & Zero, Ideas, Notes, Calendar, Review, Memory, Assistant,
  Settings, global search.
- **Key Blockers** — computed automatically from real state, not
  hand-entered: tasks stuck in `Waiting`/`Blocked` status, receivables
  pending 3+ days, and any project carrying a `blockedReason`. Recalculates
  live; nothing here is a fixed label.
- Deterministic Level-1 capture: expenses, income, debt payments, tasks,
  ideas, notes, and multi-action voice notes — parsed with plain JS/regex,
  **no AI API call**, matching the spec's low-token requirement.
- Voice capture via the browser's built-in SpeechRecognition (real speech
  → text → classification → confirmation → dashboard update).
- Confirmation-before-write for every financial change, an ambiguous-input
  flow that asks Task/Idea/Note instead of guessing, and Undo on every
  captured action (session-scoped).
- Assistant chat that answers only from data actually stored in the app —
  it never fabricates a number.
- All data persists to `localStorage` in this browser and updates the
  dashboard immediately — no manual refresh anywhere.

**Explicitly not connected yet — labelled "Not connected" in the UI itself
rather than faked:**
- Google Sheets / Docs / Drive / Calendar / Gmail / Chat (Phases 2–4, 8).
  `data.js` is the single seam this plugs into later — see below.
- A model-based AI fallback for ambiguous or multi-dataset reasoning
  (Phase 7). The Assistant is template-based over real data today; it
  says so plainly when it can't answer something instead of guessing.
- Google OAuth / account sign-in (Phase 2). The Supabase-backed
  `config.js` / `supabase/schema.sql` from the previous iteration of this
  repo are kept as-is for a future persistence phase but aren't wired into
  NOEL OS yet.

## Data abstraction

`data.js` is the *only* file that touches storage. Every other file calls
functions like `getTasks()`, `createTask()`, `payDebt()`,
`getMoneySummary()`. Swapping the body of these functions for Google
Sheets/Docs calls later requires no UI changes — this is what section 76
of the spec asks for ("UI → Data Service → mock data → Google Workspace").

```
data.js       storage + seed data + all CRUD + computed money/debt values
parser.js     Level 1 deterministic capture (regex, no network call)
voice.js      transcribeAudio() — wraps the browser's SpeechRecognition;
              swap the body for Whisper/Deepgram/Google STT later
assistant.js  rule-based Q&A over real stored data (Level 1, no AI)
app.js        UI, router, all pages, capture pipeline, modals
```

## Files

```
index.html      app shell, top session strip, nav, modals, voice overlay
style.css       dark OS + editorial design system (modules, mono/serif type)
data.js         data layer (see above)
parser.js       deterministic capture engine
voice.js        speech capture abstraction
assistant.js    rule-based assistant
app.js          UI / router / capture pipeline
manifest.json   PWA manifest
sw.js           offline shell caching
images/         icons, favicon, logo
config.js, supabase/   kept from the previous Supabase-backed iteration,
                       not currently used by NOEL OS
```

## Mobile / PWA

Tested at 390×844 (mobile) and 1440×900 (desktop) with Playwright — no
horizontal overflow, bottom nav (`Home · Tasks · Talk · Finance ·
Assistant`) with a raised mic button on mobile, sidebar + a single
floating mic on desktop. Add to Home Screen from a mobile browser to
install; `sw.js` caches the app shell for offline use after the first
load.

## Memory

Today "memory" is Notes + Activity Log, persisted to `localStorage` in
this browser. The Memory page shows the eight Google Docs this becomes in
Phase 4 (Personal Context, Fifth & Zero, Business Strategy, Client
Context, Decisions, Ideas, SOPs, Important Conversations) — each is
labelled "Not connected" until that phase lands, rather than faked.

## Voice

`voice.js` exposes one function, `transcribeAudio()`, wrapping the
browser's native `SpeechRecognition` API (Chrome/Edge; free, no API key,
needs a secure context). Hold-to-talk shows Listening… → Understanding… →
Updated. On unsupported browsers it fails gracefully with a message
pointing at the text capture bar instead of silently doing nothing. A
dedicated STT provider can replace the function body later without
touching any caller.

## Google Workspace

Not connected yet (see "what's a placeholder" above). Every place this
matters is labelled "Not connected" in the Settings, Memory, and Calendar
pages rather than simulated.

## Security

- No credentials or API keys anywhere in this code — there's nothing to
  connect to yet.
- No financial figures are hardcoded in the UI; every number on Money,
  Debt, Receivables and the dashboard is computed live from `data.js`.
- Financial changes (expenses, income, debt payments) always require
  confirmation before they're written — see `processCapture()` in
  `app.js`.
- When Google OAuth lands (Phase 2), tokens will be handled server-side,
  least-privilege scopes only.

## Cost

Phase 1 costs **$0** to run: static files, browser `localStorage`, the
browser's built-in speech recognition. No AI API is called anywhere in
this phase — that's the point of the Level 1/Level 2 architecture in the
spec. Google Workspace APIs (Phase 2+) are free within Google's standard
quotas. Any AI fallback added in Phase 7 would be the only line item with
a per-call cost, and only fires on inputs Level 1 can't classify.

## QA

Verified with an automated Playwright pass against a local server,
covering all 10 required test cases from the spec plus interaction and
responsive checks — 40/40 passing:

- Deterministic expense ("Spent ₹850 on food.") → Expense, ₹850, Food,
  cash reduced, no AI call.
- Debt payment ("Paid Clyde ₹5,000.") → Clyde marked paid, total debt
  reduced by exactly ₹5,000.
- Income ("Azeem paid ₹30,000.") → cash +₹30,000, Azeem's receivable
  reduced to ₹0.
- Task with due date ("Finish the Fifth & Zero website tomorrow.") →
  Task, Fifth & Zero, due date set, auto-applied (non-financial).
- Idea ("Idea — Fifth & Zero should make brands behave like
  characters.") → Idea filed under Fifth & Zero.
- Note ("Remember Sonia prefers minimal websites.") → Note, Client:
  Sonia.
- Multi-action ("Spent ₹700 on fuel, Azeem paid ₹30k and remind me to
  send Sonia the proposal tomorrow.") → 3 actions split correctly, net
  cash change exactly +₹29,300.
- Ambiguous input ("I was thinking about that Sonia thing.") → asks
  Task/Idea/Note instead of guessing.
- Assistant planning/search queries ("What should I do today?", "What
  do I know about Sonia?") → answered from real stored data only.
- Navigation, priority changes, task completion, idea→task conversion,
  global search, and mobile/desktop layout at 390×844 and 1440×900 — all
  verified interactive, not decorative.

## Roadmap (Phases 2–10)

Google OAuth → Sheets persistence → Docs/Drive memory → dedicated speech
provider → richer classification → AI fallback for ambiguous/complex
reasoning → Calendar/Gmail/Chat → final security/QA pass. Each phase is
additive on top of the same `data.js` seam — the UI already assumes
nothing about where the data comes from.
