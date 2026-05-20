-- Familierutine: cloud sync schema
-- Kør dette i Supabase Studio → SQL Editor → New query

create table if not exists public.families (
  id text primary key,
  payload jsonb not null,
  last_device text,
  updated_at timestamptz not null default now()
);

-- Row Level Security: enable, men lad alle læse/skrive
-- (familie-ID'et er adgangsnøglen — anyone with the ID can read/write that row).
alter table public.families enable row level security;

-- Tillad anonyme læsninger
drop policy if exists "anon read" on public.families;
create policy "anon read" on public.families
  for select
  to anon
  using (true);

-- Tillad anonyme inserts (når en ny familie laves)
drop policy if exists "anon insert" on public.families;
create policy "anon insert" on public.families
  for insert
  to anon
  with check (true);

-- Tillad anonyme updates (når en eksisterende familie skifter rutine)
drop policy if exists "anon update" on public.families;
create policy "anon update" on public.families
  for update
  to anon
  using (true)
  with check (true);

-- Slå realtime til på tabellen (kør i Supabase Studio → Database → Replication
-- og toggle 'families' tabellen ON for at modtage broadcasts).
-- Eller via SQL:
alter publication supabase_realtime add table public.families;
