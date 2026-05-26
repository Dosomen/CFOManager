-- =====================================================
-- PROJ-8: Team & Roles — owner vs member per mandant
-- =====================================================

create type public.mandant_rolle as enum ('owner', 'member');

alter table public.mandant_users
  add column rolle public.mandant_rolle not null default 'member';

-- Backfill: anyone who is currently in mandant_users *for a mandant they
-- created* is the owner. Everyone else (none currently) stays 'member'.
update public.mandant_users mu
  set rolle = 'owner'
  from public.mandanten m
  where m.id = mu.mandant_id
    and m.created_by = mu.user_id;

-- Update the auto-link trigger so mandant creators land as 'owner'.
create or replace function public.handle_new_mandant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.mandant_users (mandant_id, user_id, rolle)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

-- Helper: is the current user an owner of the given mandant?
-- SECURITY DEFINER so it can read mandant_users without recursing through
-- the SELECT policy.
create or replace function public.is_mandant_owner(p_mandant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.mandant_users
    where mandant_id = p_mandant_id
      and user_id = auth.uid()
      and rolle = 'owner'
  );
$$;

-- DELETE policy: replace the self-only delete with one that also allows
-- the owner to remove other members of their mandant.
drop policy if exists "mandant_users_self_delete" on public.mandant_users;

create policy "mandant_users_self_or_owner_delete"
  on public.mandant_users for delete
  using (
    auth.uid() = user_id
    or public.is_mandant_owner(mandant_id)
  );
