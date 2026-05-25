-- =====================================================
-- PROJ-2: Diamant Datei-Import schema
-- Tables:  konten, importe, salden
-- Enums:   konten_typ, import_status
-- RPC:     import_salden(...)
-- =====================================================

-- ---------- Enums ----------
create type public.konten_typ as enum (
  'Aktiva',
  'Passiva',
  'Aufwand',
  'Ertrag'
);

create type public.import_status as enum (
  'erfolgreich',
  'ueberschrieben',
  'fehlgeschlagen'
);

-- ---------- Table: konten ----------
create table public.konten (
  id uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  nummer text not null check (length(nummer) between 1 and 20),
  bezeichnung text not null check (length(bezeichnung) between 1 and 200),
  typ public.konten_typ not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mandant_id, nummer)
);

create index idx_konten_mandant on public.konten(mandant_id);

create trigger trg_konten_updated_at
  before update on public.konten
  for each row execute function public.set_updated_at();

-- ---------- Table: importe ----------
create table public.importe (
  id uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  periode_jahr int not null check (periode_jahr between 2000 and 2100),
  periode_monat int not null check (periode_monat between 1 and 12),
  dateiname text not null check (length(dateiname) between 1 and 255),
  status public.import_status not null,
  anzahl_konten int not null default 0,
  anzahl_salden int not null default 0,
  summe_soll numeric(18,2) not null default 0,
  summe_haben numeric(18,2) not null default 0,
  error_message text
);

create index idx_importe_mandant_periode
  on public.importe(mandant_id, periode_jahr desc, periode_monat desc);
create index idx_importe_mandant_status
  on public.importe(mandant_id, status);
create index idx_importe_created_by on public.importe(created_by);

-- ---------- Table: salden ----------
create table public.salden (
  id uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  konto_id uuid not null references public.konten(id) on delete cascade,
  import_id uuid not null references public.importe(id) on delete restrict,
  jahr int not null check (jahr between 2000 and 2100),
  monat int not null check (monat between 1 and 12),
  eb_soll numeric(18,2) not null default 0,
  eb_haben numeric(18,2) not null default 0,
  vk_soll numeric(18,2) not null default 0,
  vk_haben numeric(18,2) not null default 0,
  saldo_soll numeric(18,2) not null default 0,
  saldo_haben numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (konto_id, jahr, monat)
);

create index idx_salden_mandant_periode on public.salden(mandant_id, jahr, monat);
create index idx_salden_import on public.salden(import_id);
create index idx_salden_konto on public.salden(konto_id);

-- ---------- Row Level Security ----------
alter table public.konten enable row level security;
alter table public.importe enable row level security;
alter table public.salden enable row level security;

-- All three tables: only users with mandant access can read/write.
-- The user_has_mandant_access() helper was created in PROJ-1.

-- konten
create policy "konten_select_own"
  on public.konten for select
  using (public.user_has_mandant_access(mandant_id));

create policy "konten_insert_own"
  on public.konten for insert
  with check (public.user_has_mandant_access(mandant_id));

create policy "konten_update_own"
  on public.konten for update
  using (public.user_has_mandant_access(mandant_id))
  with check (public.user_has_mandant_access(mandant_id));

create policy "konten_delete_own"
  on public.konten for delete
  using (public.user_has_mandant_access(mandant_id));

-- importe
create policy "importe_select_own"
  on public.importe for select
  using (public.user_has_mandant_access(mandant_id));

create policy "importe_insert_own"
  on public.importe for insert
  with check (public.user_has_mandant_access(mandant_id) and created_by = auth.uid());

create policy "importe_update_own"
  on public.importe for update
  using (public.user_has_mandant_access(mandant_id))
  with check (public.user_has_mandant_access(mandant_id));

-- salden
create policy "salden_select_own"
  on public.salden for select
  using (public.user_has_mandant_access(mandant_id));

create policy "salden_insert_own"
  on public.salden for insert
  with check (public.user_has_mandant_access(mandant_id));

create policy "salden_delete_own"
  on public.salden for delete
  using (public.user_has_mandant_access(mandant_id));

-- ---------- Grants ----------
grant select, insert, update, delete on public.konten to authenticated;
grant select, insert, update on public.importe to authenticated;
grant select, insert, delete on public.salden to authenticated;

-- ---------- RPC: import_salden ----------
-- One transactional unit-of-work for the entire import:
--   1) auth/access checks
--   2) sanity-check that salden reference konten in the same payload
--   3) mark prior successful import for (mandant, year, month) as overwritten
--   4) delete existing salden for that period
--   5) upsert konten (insert or update bezeichnung/typ; DB ID survives)
--   6) create new importe row with status='erfolgreich'
--   7) insert salden, resolving konto_id by konto.nummer
--   8) update importe row with final counts
-- Any error → full rollback, no partial state.

create or replace function public.import_salden(
  p_mandant_id uuid,
  p_jahr int,
  p_monat int,
  p_dateiname text,
  p_konten jsonb,
  p_salden jsonb,
  p_summe_soll numeric,
  p_summe_haben numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user_id uuid := auth.uid();
  v_import_id uuid;
  v_konten_count int;
  v_salden_count int;
  v_was_overwritten boolean := false;
  v_orphan_count int;
begin
  -- 1) Authorization
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not public.user_has_mandant_access(p_mandant_id) then
    raise exception 'No access to mandant' using errcode = '42501';
  end if;

  -- 2) Salden must only reference konten that are in the same payload
  select count(*)
    into v_orphan_count
    from jsonb_array_elements(p_salden) as s
   where not exists (
     select 1
       from jsonb_array_elements(p_konten) as k
      where k->>'nummer' = s->>'konto_nummer'
   );

  if v_orphan_count > 0 then
    raise exception 'Salden reference konten not in payload: % rows', v_orphan_count;
  end if;

  -- 3) Mark prior successful import for this period as overwritten
  update public.importe
     set status = 'ueberschrieben'
   where mandant_id = p_mandant_id
     and periode_jahr = p_jahr
     and periode_monat = p_monat
     and status = 'erfolgreich';

  if found then
    v_was_overwritten := true;
  end if;

  -- 4) Delete existing salden for this period
  delete from public.salden
   where mandant_id = p_mandant_id
     and jahr = p_jahr
     and monat = p_monat;

  -- 5) UPSERT konten — DB IDs are preserved across re-imports
  with input as (
    select
      (e->>'nummer')::text          as nummer,
      (e->>'bezeichnung')::text     as bezeichnung,
      (e->>'typ')::public.konten_typ as typ
    from jsonb_array_elements(p_konten) as e
  )
  insert into public.konten (mandant_id, nummer, bezeichnung, typ)
  select p_mandant_id, nummer, bezeichnung, typ from input
  on conflict (mandant_id, nummer) do update
    set bezeichnung = excluded.bezeichnung,
        typ = excluded.typ,
        updated_at = now();

  get diagnostics v_konten_count = row_count;

  -- 6) Create the import row (we need its id for the salden FK)
  insert into public.importe (
    mandant_id, created_by, periode_jahr, periode_monat, dateiname,
    status, anzahl_konten, anzahl_salden, summe_soll, summe_haben
  ) values (
    p_mandant_id, v_user_id, p_jahr, p_monat, p_dateiname,
    'erfolgreich', 0, 0, p_summe_soll, p_summe_haben
  )
  returning id into v_import_id;

  -- 7) Insert salden, resolving konto_id by mandant + nummer
  with input as (
    select
      (e->>'konto_nummer')::text                  as konto_nummer,
      coalesce((e->>'eb_soll')::numeric, 0)       as eb_soll,
      coalesce((e->>'eb_haben')::numeric, 0)      as eb_haben,
      coalesce((e->>'vk_soll')::numeric, 0)       as vk_soll,
      coalesce((e->>'vk_haben')::numeric, 0)      as vk_haben,
      coalesce((e->>'saldo_soll')::numeric, 0)    as saldo_soll,
      coalesce((e->>'saldo_haben')::numeric, 0)   as saldo_haben
    from jsonb_array_elements(p_salden) as e
  )
  insert into public.salden (
    mandant_id, konto_id, import_id, jahr, monat,
    eb_soll, eb_haben, vk_soll, vk_haben, saldo_soll, saldo_haben
  )
  select
    p_mandant_id,
    k.id,
    v_import_id,
    p_jahr,
    p_monat,
    i.eb_soll, i.eb_haben, i.vk_soll, i.vk_haben, i.saldo_soll, i.saldo_haben
  from input i
  join public.konten k
    on k.mandant_id = p_mandant_id
   and k.nummer = i.konto_nummer;

  get diagnostics v_salden_count = row_count;

  -- 8) Finalise import counts
  update public.importe
     set anzahl_konten = v_konten_count,
         anzahl_salden = v_salden_count
   where id = v_import_id;

  return jsonb_build_object(
    'import_id',       v_import_id,
    'anzahl_konten',   v_konten_count,
    'anzahl_salden',   v_salden_count,
    'was_overwritten', v_was_overwritten
  );
end;
$$;

grant execute on function public.import_salden(uuid, int, int, text, jsonb, jsonb, numeric, numeric)
  to authenticated;
