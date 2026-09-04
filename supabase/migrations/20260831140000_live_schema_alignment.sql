-- Live-schema alignment, from a full cross-check of every database
-- reference in the code against the production information_schema.
-- All additive and idempotent.

-- Contact form: the code has been writing subject and type since the
-- complaints repair, but the live table never gained the columns - every
-- public contact-form submission failed silently.
ALTER TABLE contact_queries ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE contact_queries ADD COLUMN IF NOT EXISTS type text DEFAULT 'general';

-- Matches: admin listing orders by created_at.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Reviews: the writer and three readers distinguish employer reviews by type.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS type text;
