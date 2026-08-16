-- Checkpoint 20: explicit, private availability windows and timed shifts.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS public.agency_availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/London',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agency_availability_window_order CHECK (start_time < end_time),
  CONSTRAINT agency_availability_window_unique UNIQUE (candidate_id, date, start_time, end_time)
);

ALTER TABLE public.agency_availability_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_availability_windows FROM anon, authenticated;

ALTER TABLE public.agency_bookings
  ADD COLUMN IF NOT EXISTS shift_start_time time,
  ADD COLUMN IF NOT EXISTS shift_end_time time;

-- Preserve exact part-hour shifts (for example, 09:00-13:30 = 4.5 hours).
ALTER TABLE public.agency_bookings
  ALTER COLUMN hours TYPE numeric(5,2) USING hours::numeric;

ALTER TABLE public.agency_bookings DROP CONSTRAINT IF EXISTS agency_booking_time_order;
ALTER TABLE public.agency_bookings ADD CONSTRAINT agency_booking_time_order
  CHECK ((shift_start_time IS NULL AND shift_end_time IS NULL) OR shift_start_time < shift_end_time);

-- Prevent races: a candidate cannot hold two open/booked overlapping shifts.
ALTER TABLE public.agency_bookings DROP CONSTRAINT IF EXISTS agency_booking_no_overlap;
ALTER TABLE public.agency_bookings ADD CONSTRAINT agency_booking_no_overlap
  EXCLUDE USING gist (
    candidate_id WITH =,
    tsrange(shift_date + shift_start_time, shift_date + shift_end_time, '[)') WITH &&
  ) WHERE (
    shift_start_time IS NOT NULL AND shift_end_time IS NOT NULL
    AND status IN ('pending', 'countered', 'accepted', 'confirmed')
  );

CREATE INDEX IF NOT EXISTS agency_availability_windows_search
  ON public.agency_availability_windows (date, start_time, end_time, candidate_id);

NOTIFY pgrst, 'reload schema';
