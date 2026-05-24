-- Temporary debug — extended diagnostic for the RLS issue.
create or replace function public.debug_can_insert(p_created_by uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_uid_type', pg_typeof(auth.uid())::text,
    'p_created_by', p_created_by,
    'are_equal', auth.uid() = p_created_by,
    'auth_uid_text_equal', auth.uid()::text = p_created_by::text,
    'policy_def', (
      select qual::text || ' || WITH CHECK: ' || coalesce(with_check::text, 'NULL')
      from pg_policies
      where tablename = 'mandanten' and policyname = 'mandanten_insert_authenticated'
    )
  );
$$;

grant execute on function public.debug_can_insert(uuid) to anon, authenticated;
