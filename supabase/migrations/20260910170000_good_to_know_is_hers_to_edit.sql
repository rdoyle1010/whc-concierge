-- Good to Know, out of the source and into her hands.
--
-- The page shipped as a TypeScript array, which meant every correction - a
-- body renaming itself, a link moving, a paragraph she wanted sharper, a
-- photograph she had taken - needed a developer and a deploy. That is a fine
-- way to ship a page once and a terrible way to own one, and this is a page
-- whose whole value is being current and being right.
--
-- The sections stay in code because they are structure rather than content:
-- there are four, they describe what kind of organisation sits in each, and
-- reordering them is a design decision. Everything inside them is hers.

CREATE TABLE IF NOT EXISTS public.industry_bodies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Which of the four sections this sits in. A slug rather than a foreign key:
  -- the sections are defined in code, and a body pointing at a section that no
  -- longer exists should disappear quietly rather than break the page.
  section text NOT NULL,
  name text NOT NULL,
  short_name text,
  url text NOT NULL,
  image_url text,
  what text,
  -- The three voices. A reference page that refuses to have a view is a list
  -- of links somebody could have found themselves.
  why_it_matters text,
  why_we_rate_it text,
  why_spas_value_it text,
  tags text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS industry_bodies_section_idx
  ON public.industry_bodies(section, sort_order) WHERE is_published;

ALTER TABLE public.industry_bodies ENABLE ROW LEVEL SECURITY;

-- The page is public and so is everything on it. Drafts are the one thing
-- that is not: an entry being written stays out of sight until it is ready.
DROP POLICY IF EXISTS pub_read_published_bodies ON public.industry_bodies;
CREATE POLICY pub_read_published_bodies ON public.industry_bodies
  FOR SELECT USING (is_published = true);

-- Writes are service-role only, through the admin API, which is where the
-- two-step verification check lives.

NOTIFY pgrst, 'reload schema';
