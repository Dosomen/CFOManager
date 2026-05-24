-- Temporary debug helper — REMOVE after fixing the RLS issue.
create or replace function public.whoami()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_user', current_user,
    'session_user', session_user
  );
$$;

grant execute on function public.whoami() to anon, authenticated;
