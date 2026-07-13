create table if not exists public.lottery_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.lottery_state enable row level security;

drop policy if exists "lottery read" on public.lottery_state;
drop policy if exists "lottery insert" on public.lottery_state;
drop policy if exists "lottery update" on public.lottery_state;

create policy "lottery read"
on public.lottery_state
for select
to anon
using (true);

create policy "lottery insert"
on public.lottery_state
for insert
to anon
with check (true);

create policy "lottery update"
on public.lottery_state
for update
to anon
using (true)
with check (true);
