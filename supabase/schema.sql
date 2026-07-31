-- ============================================================
-- Fifth Zero OS — Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- CLIENTS -----------------------------------------------------
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  org text,
  status text default 'active',        -- active | prospect | past
  column_key text default 'later',     -- overdue | today | this_week | later
  tag text default 'WARM',             -- HOT | WARM | COOL
  note text,
  category text,
  created_at timestamptz default now()
);

-- PROJECTS ------------------------------------------------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  name text not null,
  client text,
  status text default 'active',        -- active | waiting | someday | archived
  progress int default 0,
  next_task text,
  deadline text,
  created_at timestamptz default now()
);

-- INVOICES ------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  client text not null,
  amount numeric not null,
  status text default 'pending',       -- pending | paid | overdue
  due_date date,
  created_at timestamptz default now()
);

-- JOURNAL ENTRIES -------------------------------------------------
create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  entry_date date default current_date,
  content text not null,
  created_at timestamptz default now()
);

-- INBOX / CAPTURE -------------------------------------------------
create table if not exists inbox_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null default auth.uid(),
  content text not null,
  category text,
  reviewed boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY -- each user only ever sees their own rows
-- ============================================================
alter table clients enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;
alter table journal_entries enable row level security;
alter table inbox_items enable row level security;

create policy "own rows only" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on inbox_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
