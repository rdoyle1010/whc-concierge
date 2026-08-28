-- Harden trigger/helper functions that should never be callable from the public REST/RPC surface.
-- Keep service_role access for trusted server-side operations while preserving trigger execution.

alter function public.touch_property_fact_file() set search_path = public, pg_temp;
alter function public.touch_agency_case() set search_path = public, pg_temp;

revoke execute on function public.apply_low_review_agency_violation() from public, anon, authenticated;
revoke execute on function public.apply_resolved_no_show_violation() from public, anon, authenticated;
revoke execute on function public.generate_booking_arrival_pack(text, uuid) from public, anon, authenticated;
revoke execute on function public.recalculate_agency_violation_status(uuid) from public, anon, authenticated;
revoke execute on function public.trg_generate_agency_arrival_pack() from public, anon, authenticated;
revoke execute on function public.trg_generate_residency_arrival_pack() from public, anon, authenticated;

grant execute on function public.apply_low_review_agency_violation() to service_role;
grant execute on function public.apply_resolved_no_show_violation() to service_role;
grant execute on function public.generate_booking_arrival_pack(text, uuid) to service_role;
grant execute on function public.recalculate_agency_violation_status(uuid) to service_role;
grant execute on function public.trg_generate_agency_arrival_pack() to service_role;
grant execute on function public.trg_generate_residency_arrival_pack() to service_role;
