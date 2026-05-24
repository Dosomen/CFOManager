-- =====================================================
-- Fix: mandanten SELECT policy fails for INSERT ... RETURNING
-- =====================================================
-- PostgreSQL CTE snapshot isolation means the AFTER INSERT trigger's
-- mandant_users row is not visible to the outer SELECT that PostgREST
-- runs to return the inserted row. Result: every INSERT via PostgREST
-- with `Prefer: return=representation` raised "row-level security
-- policy" — even though INSERT itself succeeded.
--
-- Fix: extend the SELECT policy to also accept `auth.uid() = created_by`.
-- This is logically equivalent (the creator is always the owner via the
-- trigger), but doesn't depend on the trigger's effects being visible.
-- =====================================================

drop policy if exists "mandanten_select_own" on public.mandanten;

create policy "mandanten_select_own"
  on public.mandanten for select
  using (
    auth.uid() = created_by
    or public.user_has_mandant_access(id)
  );

-- Cleanup of debug functions from earlier diagnosis
drop function if exists public.whoami();
drop function if exists public.debug_can_insert(uuid);
drop function if exists public.debug_list_policies();
