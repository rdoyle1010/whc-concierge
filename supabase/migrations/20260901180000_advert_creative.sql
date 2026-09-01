-- 20260901180000: Adverts get real creative, and a slot can rotate.
--
-- Additive and idempotent. Safe to run more than once. Every existing advert
-- keeps working exactly as it does today: media_type defaults to 'logo', which
-- is the behaviour that already exists.
--
-- WHY
--
-- Advertising is how this platform makes money, and until now a slot could
-- hold exactly one advert, rendered as a logo, a brand name and a line of
-- text. That is a directory entry, not an advertisement. A brand paying £400
-- a month for the homepage expects to supply creative, and a slot with three
-- paying brands in it should show all three rather than only whichever had
-- the fewest impressions.
--
-- This adds:
--   media_url / media_type  - a still image or a video as the advert itself,
--                             with the logo kept as the fallback and as the
--                             poster frame for video
--   cta_label               - what the button says, because "Discover more"
--                             is not what every brand wants it to say
--   rotation_weight         - a brand paying for the premium slot can be
--                             shown more often than one on the base rate
--   sort_order              - the order brands appear in a carousel

ALTER TABLE public.ad_placements
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'logo',
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS rotation_weight integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sort_order integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_placements_media_type_check'
      AND conrelid = 'public.ad_placements'::regclass
  ) THEN
    ALTER TABLE public.ad_placements
      ADD CONSTRAINT ad_placements_media_type_check
      CHECK (media_type IN ('logo', 'image', 'video'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_placements_rotation_weight_check'
      AND conrelid = 'public.ad_placements'::regclass
  ) THEN
    ALTER TABLE public.ad_placements
      ADD CONSTRAINT ad_placements_rotation_weight_check
      CHECK (rotation_weight BETWEEN 1 AND 10);
  END IF;
END $$;

-- Anything written before this migration keeps the logo treatment.
UPDATE public.ad_placements
  SET media_type = 'logo'
  WHERE media_type IS NULL OR media_type NOT IN ('logo', 'image', 'video');

-- The serving query filters on placement and status and orders on
-- impressions; at any real volume it should not be scanning the table.
CREATE INDEX IF NOT EXISTS ad_placements_serving_idx
  ON public.ad_placements(placement, status, review_status, payment_status);

-- category is NOT NULL and the direct-advert form never set it, so every
-- direct advert an administrator tried to place failed with a raw constraint
-- error. A default means a future caller that forgets cannot break it again.
ALTER TABLE public.ad_placements
  ALTER COLUMN category SET DEFAULT 'Sponsored';

UPDATE public.ad_placements SET category = 'Sponsored' WHERE category IS NULL;

-- How many adverts a slot shows at once, and how long each is held. A slot
-- left alone behaves exactly as it does today: one advert, no rotation.
ALTER TABLE public.ad_slot_settings
  ADD COLUMN IF NOT EXISTS carousel_size integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rotate_seconds integer NOT NULL DEFAULT 8;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_slot_settings_carousel_size_check'
      AND conrelid = 'public.ad_slot_settings'::regclass
  ) THEN
    ALTER TABLE public.ad_slot_settings
      ADD CONSTRAINT ad_slot_settings_carousel_size_check
      CHECK (carousel_size BETWEEN 1 AND 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_slot_settings_rotate_seconds_check'
      AND conrelid = 'public.ad_slot_settings'::regclass
  ) THEN
    ALTER TABLE public.ad_slot_settings
      ADD CONSTRAINT ad_slot_settings_rotate_seconds_check
      CHECK (rotate_seconds BETWEEN 4 AND 60);
  END IF;
END $$;

COMMENT ON COLUMN public.ad_placements.media_type IS
  'logo = brand mark beside text (the original treatment). image = full creative. video = MP4 or WebM, muted and looping, with logo_url as the poster frame.';
COMMENT ON COLUMN public.ad_placements.rotation_weight IS
  'How often this advert is chosen relative to others in the same slot. 1 to 10.';
COMMENT ON COLUMN public.ad_slot_settings.carousel_size IS
  'How many adverts this slot cycles through. 1 keeps the single-advert behaviour.';

NOTIFY pgrst, 'reload schema';
