# vendor/

Third-party code vendored directly into the repo instead of loaded from a
CDN at runtime, so the app doesn't depend on an external origin being up
just to load its own JavaScript.

- `supabase-js.umd.js` — `@supabase/supabase-js` v2.112.2, UMD build
  (`dist/umd/supabase.js` from the published npm package). Defines the
  global `supabase.createClient(...)` that `data/supabaseClient.js` uses.

## Updating

```bash
npm pack @supabase/supabase-js@2
tar xzf supabase-supabase-js-*.tgz
cp package/dist/umd/supabase.js vendor/supabase-js.umd.js
```

Then update the version noted above and smoke-test sign-in/out before
committing.
