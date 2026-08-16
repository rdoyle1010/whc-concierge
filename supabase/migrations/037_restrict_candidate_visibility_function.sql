-- 037: SECURITY DEFINER visibility checks are for signed-in accounts only.
-- PostgreSQL grants function execution to PUBLIC by default, so revoke it
-- explicitly after replacing the function in migration 036.

REVOKE ALL ON FUNCTION public.approved_employer_can_view_candidate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approved_employer_can_view_candidate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approved_employer_can_view_candidate(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
