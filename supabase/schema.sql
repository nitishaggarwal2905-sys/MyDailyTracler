-- MyDailyTracler schema
-- Run this once in the Supabase SQL editor (SQL → New query → paste → Run).

create table if not exists public.entries (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id text not null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  minutes     integer not null check (minutes > 0),
  note        text default '',
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_end_idx
  on public.entries (user_id, end_time desc);

-- Row Level Security: each user can only see and modify their own rows.
alter table public.entries enable row level security;

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own"
  on public.entries for select
  using (auth.uid() = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
  on public.entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own"
  on public.entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own"
  on public.entries for delete
  using (auth.uid() = user_id);
