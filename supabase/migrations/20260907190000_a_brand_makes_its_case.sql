-- 20260907190000: Brand pages, the other half of the Academy bargain.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- A property gets a page on this platform that argues for it: who they are,
-- what it is like to work there, why a therapist should want the job. A
-- product house gets nothing, which is odd, because a product house is exactly
-- the kind of business that has to be argued for. A spa director choosing a
-- skincare partner is making a five-figure decision on a treatment menu, a
-- retail wall and a training commitment, and there is nowhere on this platform
-- that makes the case.
--
-- It is also the other half of a bargain worth having. A brand that gives the
-- Academy a masterclass has given us something real. A page that sells them
-- into spas is what they get back, and the two link to each other: the course
-- teaches the house, the page argues for stocking it.
--
-- The columns are the argument, in the order a spa director asks for it: what
-- is the proposition, why should I stock it, what does the person who runs it
-- say, and how would my therapists actually sell it.

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  slug text PRIMARY KEY,
  name text NOT NULL,
  tagline text,

  -- The argument.
  usp text,
  why_spas text,
  how_to_sell text,
  director_quote text,
  director_name text,
  director_role text,

  -- The facts a director checks before believing any of it.
  founded text,
  origin text,
  hero_ingredients text[] NOT NULL DEFAULT '{}',
  signature_treatments text[] NOT NULL DEFAULT '{}',
  notable_partners text[] NOT NULL DEFAULT '{}',

  -- Pictures.
  logo_url text,
  image_url text,
  website_url text,

  -- The loop. academy_course_slug points at the masterclass the brand gave us;
  -- product_house_name is the taxonomy entry a therapist ticks on her profile,
  -- so the page, the course and the match score are all talking about the same
  -- house rather than three similar strings.
  academy_course_slug text,
  product_house_name text,

  is_published boolean NOT NULL DEFAULT false,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The directory reads published brands in display order, so that is the index.
CREATE INDEX IF NOT EXISTS brand_profiles_published_idx
  ON public.brand_profiles (is_published, sort_order NULLS LAST, name);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Published brands are public: this is marketing, and the whole point is that
-- a spa director who has never signed in can read it. Everything else - drafts
-- included - is invisible to the anon key, and every write goes through the
-- service role from the admin API. An unpublished brand is a draft, and a
-- draft that the public could read would not be one.
DROP POLICY IF EXISTS "Published brands are public" ON public.brand_profiles;
CREATE POLICY "Published brands are public"
  ON public.brand_profiles FOR SELECT
  USING (is_published = true);

CREATE OR REPLACE FUNCTION public.touch_brand_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS brand_profiles_touch_updated_at ON public.brand_profiles;
CREATE TRIGGER brand_profiles_touch_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_brand_profiles_updated_at();
