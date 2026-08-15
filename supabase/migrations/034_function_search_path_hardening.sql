-- Pin trigger/helper function lookup to the public schema and prevent direct
-- Data API execution of trigger-only functions. Triggers continue to run.

alter function public.check_mutual_match() set search_path = public;
alter function public.handle_new_candidate() set search_path = public;
alter function public.update_ratings_on_review() set search_path = public;
alter function public.update_thread_last_message() set search_path = public;
alter function public.update_updated_at() set search_path = public;
alter function public.increment_role_views(uuid) set search_path = public;

revoke execute on function public.check_mutual_match() from public, anon, authenticated;
revoke execute on function public.handle_new_candidate() from public, anon, authenticated;
revoke execute on function public.update_ratings_on_review() from public, anon, authenticated;
revoke execute on function public.update_thread_last_message() from public, anon, authenticated;
revoke execute on function public.update_updated_at() from public, anon, authenticated;
revoke execute on function public.protect_profile_identity() from public, anon, authenticated;

grant execute on function public.check_mutual_match() to service_role;
grant execute on function public.handle_new_candidate() to service_role;
grant execute on function public.update_ratings_on_review() to service_role;
grant execute on function public.update_thread_last_message() to service_role;
grant execute on function public.update_updated_at() to service_role;
grant execute on function public.protect_profile_identity() to service_role;
