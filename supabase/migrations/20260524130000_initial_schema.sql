-- =====================================================
-- PROJ-1: Initial schema — Multi-Mandant Auth Foundation
-- Tables: mandanten, mandant_users, user_profiles
-- Plus triggers + Row Level Security policies
-- =====================================================

-- ---------- Enum: Rechtsform ----------
create type public.rechtsform as enum (
  'GmbH',
  'AG',
  'UG',
  'GmbH_und_Co_KG',
  'Einzelunternehmen',
  'Sonstiges'
);

-- ---------- Table: mandanten ----------
create table public.mandanten (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  rechtsform public.rechtsform not null,
  basiswaehrung char(3) not null default 'EUR'
    check (basiswaehrung ~ '^[A-Z]{3}$'),
  -- Geschäftsjahr-Start im Format MM-DD (Default 01.01.)
  geschaeftsjahr_start char(5) not null default '01-01'
    check (geschaeftsjahr_start ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
  ust_idnr text check (ust_idnr is null or length(ust_idnr) between 4 and 20),
  diamant_mandantennummer text
    check (diamant_mandantennummer is null or length(diamant_mandantennummer) between 1 and 50),
  created_at timestamptz not null default now(),
  -- on delete restrict: User kann nicht gelöscht werden,
  -- solange er Mandanten besitzt. Schutz gegen versehentlichen Datenverlust.
  created_by uuid not null references auth.users(id) on delete restrict
);

create index idx_mandanten_created_by on public.mandanten(created_by);

-- ---------- Table: mandant_users (M:N join) ----------
create table public.mandant_users (
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mandant_id, user_id)
);

create index idx_mandant_users_user_id on public.mandant_users(user_id);

-- ---------- Table: user_profiles ----------
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_mandant_id uuid references public.mandanten(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_profiles_active_mandant on public.user_profiles(active_mandant_id);

-- ---------- Function: set_updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ---------- Trigger: auto-create user_profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.user_profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger trg_auth_users_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Trigger: auto-link creator as owner when mandant created ----------
create or replace function public.handle_new_mandant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.mandant_users (mandant_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger trg_mandanten_create_link
  after insert on public.mandanten
  for each row execute function public.handle_new_mandant();

-- ---------- Helper function: does the current user have access to a mandant? ----------
-- SECURITY DEFINER to bypass RLS recursion when used inside RLS policies.
create or replace function public.user_has_mandant_access(p_mandant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.mandant_users
    where mandant_id = p_mandant_id
      and user_id = auth.uid()
  );
$$;

-- ---------- Enable Row Level Security ----------
alter table public.mandanten enable row level security;
alter table public.mandant_users enable row level security;
alter table public.user_profiles enable row level security;

-- ---------- RLS Policies: user_profiles ----------
-- Each user can read and update only their own profile.
-- INSERT is handled by the SECURITY DEFINER trigger on auth.users.
create policy "user_profiles_self_select"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "user_profiles_self_update"
  on public.user_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- RLS Policies: mandant_users ----------
-- Users can see their own access rows. INSERT happens via SECURITY DEFINER
-- trigger when a mandant is created. DELETE is allowed for self-removal.
-- Team management (cross-user assignments, roles) comes in PROJ-8.
create policy "mandant_users_self_select"
  on public.mandant_users for select
  using (auth.uid() = user_id);

create policy "mandant_users_self_delete"
  on public.mandant_users for delete
  using (auth.uid() = user_id);

-- ---------- RLS Policies: mandanten ----------
-- SELECT/UPDATE/DELETE: only mandanten the user has access to.
-- INSERT: any authenticated user; the trigger will link them as owner.
create policy "mandanten_select_own"
  on public.mandanten for select
  using (public.user_has_mandant_access(id));

create policy "mandanten_insert_authenticated"
  on public.mandanten for insert
  with check (auth.uid() = created_by);

create policy "mandanten_update_own"
  on public.mandanten for update
  using (public.user_has_mandant_access(id))
  with check (public.user_has_mandant_access(id));

create policy "mandanten_delete_own"
  on public.mandanten for delete
  using (public.user_has_mandant_access(id));

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.mandanten to authenticated;
grant select, delete on public.mandant_users to authenticated;
grant select, update on public.user_profiles to authenticated;
