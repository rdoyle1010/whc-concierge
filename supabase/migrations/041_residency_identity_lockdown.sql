-- 041: Protect Residency specialist identity at the database boundary.
-- Public discovery is served by the sanitised server API, not direct table reads.

DROP POLICY IF EXISTS "Anyone can view approved residents" ON public.residency_profiles;
DROP POLICY IF EXISTS "Public can view approved residency profiles" ON public.residency_profiles;
DROP POLICY IF EXISTS "Users can insert their own residency profile" ON public.residency_profiles;
DROP POLICY IF EXISTS "Users can update their own residency profile" ON public.residency_profiles;
DROP POLICY IF EXISTS "Users can manage own residency" ON public.residency_profiles;
REVOKE ALL ON TABLE public.residency_profiles FROM anon, authenticated;

-- The legacy residency_applications flow is superseded by
-- residency_profiles + residency_conversations + residency_bookings.
-- Preserve historical rows but keep the table server-only until retired.
DROP POLICY IF EXISTS "Anyone can submit residency app" ON public.residency_applications;
DROP POLICY IF EXISTS "Users manage own residency apps" ON public.residency_applications;
DROP POLICY IF EXISTS "Admins can view residency apps" ON public.residency_applications;
DROP POLICY IF EXISTS "Admins can update residency apps" ON public.residency_applications;
REVOKE ALL ON TABLE public.residency_applications FROM anon, authenticated;
