-- Admin hardening + per-booking reviews (16 Jul 2026). Idempotent.

-- Per-shift reviews: a review can now be tied to one booking
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id uuid;

-- Content tables were created ad hoc in the dashboard; make sure they exist
-- with the columns the admin console uses, then add anything missing.
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, slug text, content text, excerpt text, image_url text,
  author text, category text, tags text[], status text DEFAULT 'draft',
  published_at timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS tags text[];

CREATE TABLE IF NOT EXISTS site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot text UNIQUE, label text, image_url text, heading text, subtext text,
  sort_order integer DEFAULT 0, active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text, description text, type text, status text DEFAULT 'draft',
  start_date date, end_date date, target_audience text, content text,
  sent_at timestamptz, recipients_count integer, created_at timestamptz DEFAULT now()
);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipients_count integer;

-- Lock the admin-managed tables down. Writes now go through service-role
-- admin API routes; the public keeps exactly the access it needs.
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published posts" ON blog_posts;
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT USING (status = 'published');

ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site images" ON site_images;
CREATE POLICY "Public read site images" ON site_images FOR SELECT USING (true);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY; -- no policies: service-role only

ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY; -- no policies: service-role only

ALTER TABLE contact_queries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit an enquiry" ON contact_queries;
CREATE POLICY "Anyone can submit an enquiry" ON contact_queries FOR INSERT WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
