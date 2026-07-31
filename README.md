# Fifth Zero OS — static site (index.html / style.css / script.js)

Same live app as before (Supabase-backed Inbox, Projects, Clients, Finance,
Journal, gated behind login) — rebuilt as a plain static site instead of a
Next.js project. No build step, no `npm install` needed to run it.

## Folder contents
```
index.html      the whole app shell + auth screen
style.css       all styling
script.js       all logic (auth + Supabase CRUD)
config.js       <- put your Supabase URL + anon key here
images/         favicon.svg, logo.svg
fonts/          see fonts/README.txt (works via Google Fonts CDN by default)
supabase/       schema.sql — run this in Supabase once
```

## 1. Set up Supabase (~3 min)
1. [supabase.com](https://supabase.com) → New project.
2. SQL Editor → New query → paste all of `supabase/schema.sql` → Run.
   This creates the 5 tables and locks every row to its owner (RLS), so the
   public anon key can never see or touch another user's data.
3. Project Settings → API → copy the **Project URL** and **anon public** key.
4. (Optional, convenience) Authentication → Providers → Email → turn off
   "Confirm email" so you can sign up and use it immediately.

## 2. Fill in config.js
Open `config.js` and paste in the two values from step 1:
```js
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key';
```

## 3. Try it locally
Just open `index.html` directly in a browser, or serve the folder:
```bash
npx serve .
```

## 4. Deploy for real
Because this is a static site (no build step), any of these work:

**Vercel** (drag-and-drop, no CLI needed):
- Go to vercel.com/new → drag this whole folder onto the page → Deploy.
- Since there's no framework to detect, Vercel just serves the files as-is.

**Netlify:**
- netlify.com/drop → drag the folder → get a live URL instantly.

**GitHub Pages:**
- Push the folder to a GitHub repo → Settings → Pages → deploy from the
  main branch root.

No environment variables needed at deploy time — the Supabase keys are
already sitting in `config.js`, and that's fine: the anon key is meant to be
public, Row Level Security is what actually protects your data.

## What's real vs. not yet
- **Real**: Inbox, Projects, Clients, Finance, Journal — full add/edit/delete,
  persisted in Supabase, private to your logged-in account.
- **Not yet wired**: Today, Calendar, AI Console, Health, Memory, Ideas,
  Knowledge, Settings, Fifth Zero, Job Dashboard — same pattern (a table +
  a render function) extends to these whenever you want them built out.
- **No AI auto-classification** on Inbox yet — capture works, but nothing
  automatically files it for you. That layer needs a backend function
  calling an LLM on top of this.
