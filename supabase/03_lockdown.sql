-- Familierutine: lockdown af families-tabellen
-- Kør dette i Supabase Studio → SQL Editor → New query
-- Forudsætning: 02_admin.sql er kørt (created_at-kolonnen findes)

-- 1) Sørg for at created_at findes (idempotent, så denne fil kan køres alene)
alter table public.families
  add column if not exists created_at timestamptz not null default now();

-- 2) Fjern de gamle vidtåbne RLS-politikker
drop policy if exists "anon read" on public.families;
drop policy if exists "anon insert" on public.families;
drop policy if exists "anon update" on public.families;

-- 3) Anon må ikke længere røre tabellen direkte
revoke all on public.families from anon;

-- 4) RPC: hent én familie (kun den med det angivne id).
--    SECURITY DEFINER bypasser RLS, så funktionen kører som ejeren af tabellen.
create or replace function public.get_family(p_id text)
returns table(
  id text,
  payload jsonb,
  last_device text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, payload, last_device, created_at, updated_at
  from public.families
  where id = p_id;
$$;

revoke all on function public.get_family(text) from public;
grant execute on function public.get_family(text) to anon;

-- 5) RPC: upsert af én familie. Tjekker at id matcher payload-formen,
--    så anon-klienten ikke kan skrive til en anden familie.
create or replace function public.upsert_family(
  p_id text,
  p_payload jsonb,
  p_device text
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_at timestamptz;
begin
  if p_id is null or length(p_id) < 6 then
    raise exception 'invalid family id';
  end if;
  insert into public.families (id, payload, last_device, updated_at)
  values (p_id, p_payload, p_device, now())
  on conflict (id) do update set
    payload = excluded.payload,
    last_device = excluded.last_device,
    updated_at = now()
  returning updated_at into v_updated_at;
  return v_updated_at;
end;
$$;

revoke all on function public.upsert_family(text, jsonb, text) from public;
grant execute on function public.upsert_family(text, jsonb, text) to anon;

-- 6) Realtime via broadcast-trigger.
--    realtime.send broadcaster til en kanal — den eneste måde at lytte er at
--    kende kanal-navnet (= familie-ID'et). Ingen RLS påkrævet, ingen enumeration mulig.
create or replace function public.families_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'id', NEW.id,
      'payload', NEW.payload,
      'last_device', NEW.last_device,
      'updated_at', NEW.updated_at
    ),
    'family_update',
    'family:' || NEW.id,
    false
  );
  return NEW;
end;
$$;

drop trigger if exists families_broadcast_trigger on public.families;
create trigger families_broadcast_trigger
after insert or update on public.families
for each row execute function public.families_broadcast();
