-- 036: Make selective stealth, distance matching and travel information
-- enforceable rather than presentational. Additive and safe to re-run.

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS transport_walk_minutes integer,
  ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxi_support boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxi_notes text,
  ADD COLUMN IF NOT EXISTS travel_notes text;

ALTER TABLE public.employer_profiles
  DROP CONSTRAINT IF EXISTS employer_profiles_transport_walk_minutes_check;
ALTER TABLE public.employer_profiles
  ADD CONSTRAINT employer_profiles_transport_walk_minutes_check
  CHECK (transport_walk_minutes IS NULL OR transport_walk_minutes BETWEEN 0 AND 240);

CREATE OR REPLACE FUNCTION public.approved_employer_can_view_candidate(candidate_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employer_profiles e
    JOIN public.candidate_profiles c ON c.id = candidate_uuid
    WHERE e.user_id = auth.uid()
      AND e.approval_status = 'approved'
      AND c.approval_status = 'approved'
      AND COALESCE(c.profile_visible, true)
      AND NOT EXISTS (
        SELECT 1 FROM public.profile_blocks b
        WHERE b.candidate_id = c.id AND b.blocked_employer_id = e.id
      )
  );
$$;

REVOKE ALL ON FUNCTION public.approved_employer_can_view_candidate(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approved_employer_can_view_candidate(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approved_employer_can_view_candidate(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
