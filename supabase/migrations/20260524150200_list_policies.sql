-- Temporary debug — list all policies on the project tables.
create or replace function public.debug_list_policies()
returns table (tablename text, policyname text, cmd text, qual text, with_check text)
language sql
stable
as $$
  select
    tablename::text,
    policyname::text,
    cmd::text,
    qual::text,
    with_check::text
  from pg_policies
  where schemaname = 'public'
    and tablename in ('mandanten', 'mandant_users', 'user_profiles')
  order by tablename, policyname;
$$;

grant execute on function public.debug_list_policies() to anon, authenticated;
