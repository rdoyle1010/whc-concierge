-- Academy editorial control (1 Sep 2026): give the admin Academy real content
-- control without ever letting an empty or partial row blank a good course.
-- Additive and idempotent. All application code works before and after it runs.
--
-- THE CONTRACT THIS COLUMN PAIR ENFORCES
--   content_source = 'platform' (the default)  the course is served exactly as
--     it is authored in code. Nothing in the database can change its modules,
--     lessons, assessment or answer key. This is the state every existing row
--     lands in, so running this migration changes nothing for any learner.
--   content_source = 'custom'  the course is served from the `content`
--     document below, and ONLY when that document passes validation in
--     src/lib/academy-course-content.ts (at least one module, every module
--     titled with at least one lesson, every lesson titled with a body, and a
--     complete assessment). A document that fails validation is ignored and
--     the platform version is served instead, with a warning on the admin
--     Academy list.
--
-- Taking editorial control copies the full platform content into `content`
-- first, so the admin always edits a complete working copy. Reverting sets
-- content_source back to 'platform' and leaves `content` in place, so nothing
-- an admin has written is ever destroyed by reverting.

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS content_source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS content jsonb,
  ADD COLUMN IF NOT EXISTS content_updated_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academy_courses_content_source_check'
      AND conrelid = 'public.academy_courses'::regclass
  ) THEN
    ALTER TABLE public.academy_courses
      ADD CONSTRAINT academy_courses_content_source_check
      CHECK (content_source IN ('platform', 'custom'));
  END IF;
END $$;

-- Any row written before this migration keeps the platform content.
UPDATE public.academy_courses
  SET content_source = 'platform'
  WHERE content_source IS NULL OR content_source NOT IN ('platform', 'custom');

CREATE INDEX IF NOT EXISTS academy_courses_content_source_idx
  ON public.academy_courses(content_source);

COMMENT ON COLUMN public.academy_courses.content_source IS
  'platform = serve the course exactly as authored in code (default). custom = serve the validated document in the content column; an invalid document falls back to the platform version.';
COMMENT ON COLUMN public.academy_courses.content IS
  'Admin-authored course document: title, tagline, category, minutes, aims, audience, outcomes, modules (each with lessons, objectives, key terms, knowledge checks, case study) and the assessment questions with their answer key. Served only while content_source = custom and the document validates.';
COMMENT ON COLUMN public.academy_courses.content_updated_at IS
  'When the admin last saved the course document.';

NOTIFY pgrst, 'reload schema';
