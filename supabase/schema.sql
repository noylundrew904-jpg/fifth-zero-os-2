-- ============================================================
-- Fifth & Zero OS — Supabase schema
--
-- Mirrors the app's existing localStorage collections 1:1 so the
-- client-side data layer (data/storage.js) can swap its backing store
-- without any module code changing. Each row's `payload` jsonb IS the
-- exact record object the app already works with (same field names,
-- including its own `deletedAt` used by the soft-delete/archive system).
--
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Safe to re-run (every statement is idempotent).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---- helper: keep updated_at current on every write -----------------------
create or replace function fz_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---- array-type collections -------------------------------------------
-- One row per record. `id` matches the app-generated id in payload->>'id'.
-- user_id scopes every row to its owner; RLS below is what actually
-- enforces the boundary (the default is a convenience, not the guarantee).

do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'clients', 'projects', 'health', 'habits', 'notes', 'calendar']
  loop
    execute format($f$
      create table if not exists fz_%1$s (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
        payload jsonb not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table fz_%1$s enable row level security;', t);

    execute format($f$
      drop policy if exists "own rows only" on fz_%1$s;
      create policy "own rows only" on fz_%1$s
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);

    execute format($f$
      drop trigger if exists set_updated_at on fz_%1$s;
      create trigger set_updated_at before update on fz_%1$s
        for each row execute function fz_set_updated_at();
    $f$, t);

    execute format('create index if not exists fz_%1$s_user_id_idx on fz_%1$s (user_id);', t);
  end loop;
end $$;

-- ---- singleton collections ----------------------------------------------
-- `finance` ({transactions, subscriptions, loans, invoices}) and
-- `settings` ({theme, name}) are single objects per user, not arrays —
-- one row per user, keyed by user_id itself.

create table if not exists fz_finance (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null default '{"transactions":[],"subscriptions":[],"loans":[],"invoices":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table fz_finance enable row level security;
drop policy if exists "own row only" on fz_finance;
create policy "own row only" on fz_finance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_updated_at on fz_finance;
create trigger set_updated_at before update on fz_finance
  for each row execute function fz_set_updated_at();

create table if not exists fz_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null default '{"theme":"dark","name":""}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table fz_settings enable row level security;
drop policy if exists "own row only" on fz_settings;
create policy "own row only" on fz_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_updated_at on fz_settings;
create trigger set_updated_at before update on fz_settings
  for each row execute function fz_set_updated_at();

-- ============================================================
-- Notes
--
-- * auth.users is Supabase's built-in user table — sign-up/sign-in/
--   sign-out/password-reset are handled entirely by Supabase Auth, no
--   custom user table needed.
-- * RLS policies use `for all` (select/insert/update/delete) so a user
--   can only ever read or write rows where user_id = auth.uid() — one
--   user can never see or modify another user's data, enforced at the
--   database layer regardless of what the frontend sends.
-- * There is no service-role key anywhere in this file or in the app —
--   every table is designed to be safely queried with the public anon
--   key precisely because RLS (not key secrecy) is the security boundary.
-- * default auth.uid() on user_id means the frontend never has to (and
--   never should) set user_id itself on insert — Postgres stamps it from
--   the authenticated session, so a malicious client can't write rows
--   under someone else's id even if it tried.
-- ============================================================
