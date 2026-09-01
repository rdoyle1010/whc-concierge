-- Academy admin control (1 Sep 2026): give the admin Academy page a display
-- order it can set for the catalogue talent sees. Additive and idempotent.
--
-- Course teaching content stays in code: academy_courses only ever carries the
-- commercial overrides an admin sets (price, image, summary line, display
-- order, visibility). Nothing here changes that contract.

ALTER TABLE public.academy_courses
  ADD COLUMN IF NOT EXISTS sort_order integer;

CREATE INDEX IF NOT EXISTS academy_courses_sort_order_idx
  ON public.academy_courses(sort_order NULLS LAST, created_at);

COMMENT ON COLUMN public.academy_courses.sort_order IS
  'Admin display order for the Academy catalogue. Lower first; null keeps the code order.';

NOTIFY pgrst, 'reload schema';
