-- Employer property profile fields used by the web and mobile property experience.
-- Idempotent so environments that already received individual columns stay safe.

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS star_rating text,
  ADD COLUMN IF NOT EXISTS about_text text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS services_offered text[],
  ADD COLUMN IF NOT EXISTS brand_partners text[],
  ADD COLUMN IF NOT EXISTS num_treatment_rooms integer,
  ADD COLUMN IF NOT EXISTS team_size integer,
  ADD COLUMN IF NOT EXISTS commute_car_required boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS nearest_transport text,
  ADD COLUMN IF NOT EXISTS transport_walk_minutes integer,
  ADD COLUMN IF NOT EXISTS parking_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxi_support boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS taxi_notes text,
  ADD COLUMN IF NOT EXISTS travel_notes text,
  ADD COLUMN IF NOT EXISTS culture_points text[],
  ADD COLUMN IF NOT EXISTS highlights text[],
  ADD COLUMN IF NOT EXISTS property_photos text[],
  ADD COLUMN IF NOT EXISTS tripadvisor_url text,
  ADD COLUMN IF NOT EXISTS treatment_menu_url text,
  ADD COLUMN IF NOT EXISTS guest_review_summary text;

NOTIFY pgrst, 'reload schema';
