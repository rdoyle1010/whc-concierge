-- ═══════════════════════════════════════════════════════════════
-- WHC CONCIERGE — STRUCTURED TAXONOMY MATCHING SCHEMA
-- This is the relational foundation for weighted talent matching
-- ═══════════════════════════════════════════════════════════════

-- ── ENUMS ──

DO $$ BEGIN
  CREATE TYPE taxonomy_category AS ENUM (
    'treatment_skill', 'system', 'brand', 'certification',
    'commercial_skill', 'leadership_skill', 'language'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE requirement_importance AS ENUM ('required', 'preferred', 'trainable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE proficiency_level AS ENUM ('basic', 'competent', 'advanced', 'expert');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE role_level AS ENUM (
    'apprentice', 'therapist', 'senior_therapist', 'lead_therapist',
    'supervisor', 'assistant_manager', 'spa_manager', 'spa_director', 'group_director'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('permanent', 'fixed_term', 'freelance', 'agency', 'seasonal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE right_to_work_status AS ENUM ('uk_citizen', 'settled_status', 'visa_sponsored', 'eu_national', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('hotel_spa', 'day_spa', 'resort', 'clinic', 'cruise', 'members_club', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── TAXONOMY ITEMS (master list) ──

CREATE TABLE IF NOT EXISTS taxonomy_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category taxonomy_category NOT NULL,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  UNIQUE(category, name)
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_category ON taxonomy_items(category);
CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy_items(is_active);


-- ── CANDIDATE TAXONOMY (what a candidate has) ──

CREATE TABLE IF NOT EXISTS candidate_taxonomy (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  taxonomy_id uuid NOT NULL REFERENCES taxonomy_items(id) ON DELETE CASCADE,
  proficiency proficiency_level DEFAULT 'competent',
  years_using integer,
  notes text,
  created_at timestamptz DEFAULT now(),

  UNIQUE(candidate_id, taxonomy_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_taxonomy_cand ON candidate_taxonomy(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_taxonomy_tax ON candidate_taxonomy(taxonomy_id);


-- ── JOB REQUIREMENTS (what a job needs) ──

CREATE TABLE IF NOT EXISTS job_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  taxonomy_id uuid NOT NULL REFERENCES taxonomy_items(id) ON DELETE CASCADE,
  importance requirement_importance NOT NULL DEFAULT 'required',
  minimum_proficiency proficiency_level,
  created_at timestamptz DEFAULT now(),

  UNIQUE(job_id, taxonomy_id)
);

CREATE INDEX IF NOT EXISTS idx_job_requirements_job ON job_requirements(job_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_tax ON job_requirements(taxonomy_id);
CREATE INDEX IF NOT EXISTS idx_job_requirements_importance ON job_requirements(importance);


-- ── CANDIDATE WORK HISTORY ──

CREATE TABLE IF NOT EXISTS candidate_work_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  employer_name text NOT NULL,
  employer_brand text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_history_cand ON candidate_work_history(candidate_id);


-- ── RLS POLICIES ──

ALTER TABLE taxonomy_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read taxonomy" ON taxonomy_items FOR SELECT USING (true);
CREATE POLICY "Admin can manage taxonomy" ON taxonomy_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access candidate_taxonomy" ON candidate_taxonomy FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access job_requirements" ON job_requirements FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_work_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access work_history" ON candidate_work_history FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ── SEED TAXONOMY DATA ──

-- Treatment skills
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('treatment_skill', 'Swedish Massage', 1),
  ('treatment_skill', 'Deep Tissue Massage', 2),
  ('treatment_skill', 'Hot Stone Massage', 3),
  ('treatment_skill', 'Pregnancy Massage', 4),
  ('treatment_skill', 'Lymphatic Drainage', 5),
  ('treatment_skill', 'Sports Massage', 6),
  ('treatment_skill', 'Reflexology', 7),
  ('treatment_skill', 'Body Treatments', 8),
  ('treatment_skill', 'Body Wraps', 9),
  ('treatment_skill', 'Facials', 10),
  ('treatment_skill', 'Advanced Facial Technology', 11),
  ('treatment_skill', 'Hydrotherapy', 12),
  ('treatment_skill', 'Ayurveda', 13),
  ('treatment_skill', 'Wellness Consultation', 14),
  ('treatment_skill', 'Manicure & Pedicure', 15),
  ('treatment_skill', 'Waxing', 16),
  ('treatment_skill', 'Lash & Brow Treatments', 17),
  ('treatment_skill', 'Aromatherapy', 18),
  ('treatment_skill', 'Reiki', 19),
  ('treatment_skill', 'Indian Head Massage', 20),
  ('treatment_skill', 'Couples Treatments', 21),
  ('treatment_skill', 'Scalp Treatments', 22),
  ('treatment_skill', 'Rasul & Hammam', 23)
ON CONFLICT (category, name) DO NOTHING;

-- Systems
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('system', 'Book4Time', 1),
  ('system', 'Opera PMS', 2),
  ('system', 'SpaSoft', 3),
  ('system', 'Trybe', 4),
  ('system', 'Mindbody', 5),
  ('system', 'Premier Software', 6),
  ('system', 'Rezlynx', 7),
  ('system', 'Spa Booker', 8),
  ('system', 'Treatwell', 9),
  ('system', 'Microsoft Excel', 10),
  ('system', 'POS Systems', 11),
  ('system', 'Membership Systems', 12),
  ('system', 'Scheduling Systems', 13),
  ('system', 'Concept', 14),
  ('system', 'Shortcuts', 15),
  ('system', 'Salon IQ', 16)
ON CONFLICT (category, name) DO NOTHING;

-- Brands
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('brand', 'ESPA', 1),
  ('brand', 'Elemis', 2),
  ('brand', '111SKIN', 3),
  ('brand', 'Natura Bissé', 4),
  ('brand', 'Wildsmith', 5),
  ('brand', 'Ground Wellbeing', 6),
  ('brand', 'Aromatherapy Associates', 7),
  ('brand', 'Kama Ayurveda', 8),
  ('brand', 'Biologique Recherche', 9),
  ('brand', 'Comfort Zone', 10),
  ('brand', 'Dermalogica', 11),
  ('brand', 'Thalgo', 12),
  ('brand', 'Guinot', 13),
  ('brand', 'Clarins', 14),
  ('brand', 'Sisley', 15),
  ('brand', 'La Mer', 16),
  ('brand', 'Bamford', 17),
  ('brand', 'Sodashi', 18),
  ('brand', 'Ila Spa', 19),
  ('brand', 'Decléor', 20),
  ('brand', 'IMAGE Skincare', 21),
  ('brand', 'Medik8', 22),
  ('brand', 'Murad', 23),
  ('brand', 'Valmont', 24),
  ('brand', 'Susanne Kaufmann', 25),
  ('brand', 'Temple Spa', 26),
  ('brand', 'VOYA', 27)
ON CONFLICT (category, name) DO NOTHING;

-- Certifications
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('certification', 'NVQ Level 2', 1),
  ('certification', 'NVQ Level 3', 2),
  ('certification', 'NVQ Level 4', 3),
  ('certification', 'CIDESCO', 4),
  ('certification', 'CIBTAC', 5),
  ('certification', 'ITEC', 6),
  ('certification', 'VTCT', 7),
  ('certification', 'City & Guilds', 8),
  ('certification', 'First Aid', 9),
  ('certification', 'Pool Plant Certificate', 10),
  ('certification', 'Fitness Qualifications', 11),
  ('certification', 'Beauty Therapy Licence', 12),
  ('certification', 'Massage Qualifications', 13),
  ('certification', 'COSHH', 14),
  ('certification', 'Manual Handling', 15),
  ('certification', 'Food Hygiene', 16)
ON CONFLICT (category, name) DO NOTHING;

-- Commercial skills
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('commercial_skill', 'Retail Selling', 1),
  ('commercial_skill', 'Upselling', 2),
  ('commercial_skill', 'Membership Sales', 3),
  ('commercial_skill', 'Package Selling', 4),
  ('commercial_skill', 'Guest Recovery', 5),
  ('commercial_skill', 'KPI Reporting', 6),
  ('commercial_skill', 'Target Delivery', 7),
  ('commercial_skill', 'Team Coaching', 8),
  ('commercial_skill', 'Revenue Management', 9),
  ('commercial_skill', 'Yield Management', 10)
ON CONFLICT (category, name) DO NOTHING;

-- Leadership / operations
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('leadership_skill', 'Rota Planning', 1),
  ('leadership_skill', 'Team Leadership', 2),
  ('leadership_skill', 'Recruitment', 3),
  ('leadership_skill', 'Payroll Input', 4),
  ('leadership_skill', 'SOP Training', 5),
  ('leadership_skill', 'Stock Control', 6),
  ('leadership_skill', 'Opening & Closing Procedures', 7),
  ('leadership_skill', 'Budget Control', 8),
  ('leadership_skill', 'Pre-Opening Experience', 9),
  ('leadership_skill', 'Audit Readiness', 10),
  ('leadership_skill', 'P&L Management', 11),
  ('leadership_skill', 'Guest Experience Management', 12),
  ('leadership_skill', 'Supplier Management', 13)
ON CONFLICT (category, name) DO NOTHING;

-- Languages
INSERT INTO taxonomy_items (category, name, display_order) VALUES
  ('language', 'English', 1),
  ('language', 'French', 2),
  ('language', 'Spanish', 3),
  ('language', 'German', 4),
  ('language', 'Italian', 5),
  ('language', 'Portuguese', 6),
  ('language', 'Mandarin', 7),
  ('language', 'Arabic', 8),
  ('language', 'Russian', 9),
  ('language', 'Japanese', 10),
  ('language', 'Korean', 11),
  ('language', 'Hindi', 12),
  ('language', 'Thai', 13),
  ('language', 'Polish', 14)
ON CONFLICT (category, name) DO NOTHING;
