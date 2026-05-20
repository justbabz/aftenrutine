-- Familierutine: admin dashboard schema additions
-- Kør dette i Supabase Studio → SQL Editor → New query

-- Track hvornår en familie blev oprettet (eksisterende rækker får dagens dato).
alter table public.families
  add column if not exists created_at timestamptz not null default now();
