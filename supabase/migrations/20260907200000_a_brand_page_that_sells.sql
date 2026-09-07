-- 20260907200000: A brand page that actually sells, and a way in for brands.
--
-- Additive and idempotent. Safe to run more than once.
--
-- WHY
--
-- The brand page argued one case, the spa's. That is the right case to lead
-- with and it is not the only one being made in the room. A spa director
-- weighing a house wants to know what an independent voice thinks of it and
-- whether her therapists will actually want to work with it, because a brand
-- the team resents is a brand that never gets retailed however good the
-- margin looks on paper.
--
-- So the page now carries three voices: why a spa stocks it, what Wellness
-- House Collective makes of it, and why therapists like working on it. The
-- middle one is the reason anybody trusts the page at all - a directory where
-- every entry is written by its subject is a brochure rack.
--
-- Then it has to be actionable. A page that persuades and offers no way to act
-- has wasted the persuasion, so a brand carries a named contact and a spa can
-- send an enquiry straight from the page.
--
-- And brands need a way in that does not run through one person's inbox. The
-- application form is deliberately shaped like the page itself, so a brand
-- that fills it in has written most of its own entry and what arrives is a
-- draft rather than a lead.

-- --- The other two voices, and who to call ------------------------------

ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS why_we_love_it text;
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS why_therapists_love_it text;
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS contact_role text;
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS contact_phone text;

-- One picture was never going to carry a brand. A house sells on the room, the
-- product, the texture and the moment in the treatment, and a spa director
-- deciding on a partner is buying the look of all four.
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}';

-- --- A spa asking about a brand -----------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_slug text NOT NULL,
  brand_name text,
  property_name text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  role_title text,
  treatment_rooms text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_enquiries_recent_idx
  ON public.brand_enquiries (created_at DESC);

ALTER TABLE public.brand_enquiries ENABLE ROW LEVEL SECURITY;

-- No policy, deliberately. An enquiry is a named person at a named property
-- saying what they are thinking of buying, which is exactly the kind of thing
-- that must never be readable through the anon key. It is written by the API
-- with the service role and read only in admin.

-- --- A brand applying for a page ----------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  website_url text,
  contact_name text NOT NULL,
  contact_role text,
  contact_email text NOT NULL,
  contact_phone text,

  -- Shaped like the page on purpose. A brand that fills this in has written
  -- most of its own entry, and what lands in admin is a draft to edit rather
  -- than a lead to chase.
  usp text,
  why_spas text,
  why_therapists_love_it text,
  how_to_sell text,
  director_quote text,
  director_name text,
  director_role text,
  founded text,
  origin text,
  hero_ingredients text[] NOT NULL DEFAULT '{}',
  signature_treatments text[] NOT NULL DEFAULT '{}',
  notable_partners text[] NOT NULL DEFAULT '{}',
  offers_masterclass boolean NOT NULL DEFAULT false,

  status text NOT NULL DEFAULT 'new',
  converted_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_applications_recent_idx
  ON public.brand_applications (status, created_at DESC);

ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;

-- Same reasoning: an unreviewed application is a brand's own pitch, including
-- who to ring. Written by the API, read in admin, invisible to everyone else.
