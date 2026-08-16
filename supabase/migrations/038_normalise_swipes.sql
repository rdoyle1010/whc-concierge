-- 038: Normalise the legacy swipes schema and make decisions atomic.
-- Additive, preserves existing decisions, and safe to re-run.

ALTER TABLE public.swipes
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS swiper_id uuid,
  ADD COLUMN IF NOT EXISTS swiper_type text,
  ADD COLUMN IF NOT EXISTS action text;

UPDATE public.swipes
SET
  swiper_id = COALESCE(swiper_id, user_id),
  swiper_type = COALESCE(
    swiper_type,
    CASE WHEN target_type = 'job' THEN 'candidate' ELSE 'employer' END
  ),
  action = COALESCE(action, direction)
WHERE swiper_id IS NULL OR swiper_type IS NULL OR action IS NULL;

-- Keep the newest row for each decision before adding the unique key.
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY swiper_id, swiper_type, target_id, target_type
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS duplicate_number
  FROM public.swipes
  WHERE swiper_id IS NOT NULL
    AND swiper_type IS NOT NULL
    AND target_id IS NOT NULL
    AND target_type IS NOT NULL
)
DELETE FROM public.swipes s
USING ranked r
WHERE s.id = r.id AND r.duplicate_number > 1;

DROP INDEX IF EXISTS public.swipes_decision_unique;
CREATE UNIQUE INDEX swipes_decision_unique
  ON public.swipes (swiper_id, swiper_type, target_id, target_type);

ALTER TABLE public.swipes
  DROP CONSTRAINT IF EXISTS swipes_swiper_type_check,
  DROP CONSTRAINT IF EXISTS swipes_target_type_check,
  DROP CONSTRAINT IF EXISTS swipes_action_check;

ALTER TABLE public.swipes
  ADD CONSTRAINT swipes_swiper_type_check
    CHECK (swiper_type IS NULL OR swiper_type IN ('candidate', 'employer')),
  ADD CONSTRAINT swipes_target_type_check
    CHECK (target_type IN ('job', 'candidate')),
  ADD CONSTRAINT swipes_action_check
    CHECK (action IS NULL OR action IN ('left', 'right'));

-- The server route uses the service role, but retain least-privilege RLS for
-- any authenticated reads that still occur elsewhere in the application.
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage swipes" ON public.swipes;
DROP POLICY IF EXISTS "Users manage own swipes" ON public.swipes;
CREATE POLICY "Users manage own swipes"
  ON public.swipes
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = swiper_id)
  WITH CHECK ((SELECT auth.uid()) = swiper_id);

NOTIFY pgrst, 'reload schema';
