-- ═══════════════════════════════════════════════════════════════
-- WHC CONCIERGE — MASTER DATABASE SCHEMA
-- Structured taxonomy matching platform for luxury spa & wellness
-- ═══════════════════════════════════════════════════════════════

-- =====================
-- ENUMS
-- =====================

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'agency', 'seasonal'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE role_level AS ENUM ('junior', 'therapist', 'senior', 'supervisor', 'manager', 'director', 'executive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE right_to_work_status AS ENUM ('citizen', 'visa_required', 'visa_holder', 'open_to_work'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE right_to_work_requirement AS ENUM ('any', 'uk_only', 'eu_only', 'visa_sponsored'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE property_type AS ENUM ('hotel_spa', 'day_spa', 'resort', 'medical_spa', 'wellness_retreat', 'cruise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE star_rating AS ENUM ('3_star', '4_star', '5_star', 'ultra_luxury', 'unrated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'filled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE skill_category AS ENUM ('treatment', 'operational', 'commercial', 'leadership', 'technology'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE proficiency_level AS ENUM ('basic', 'competent', 'advanced', 'expert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE requirement_level AS ENUM ('required', 'preferred'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE certification_category AS ENUM ('beauty', 'massage', 'fitness', 'health_safety', 'management', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE product_house_tier AS ENUM ('mass', 'professional', 'luxury', 'ultra_luxury'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE hotel_brand_tier AS ENUM ('luxury', 'ultra_luxury', 'lifestyle', 'boutique', 'independent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE application_status AS ENUM ('applied', 'viewed', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE system_category AS ENUM ('booking', 'pos', 'scheduling', 'crm', 'reporting', 'membership'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =====================
-- TAXONOMY TABLES
-- =====================

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category skill_category NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);

CREATE TABLE IF NOT EXISTS systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    vendor TEXT,
    category system_category,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    origin_country TEXT,
    tier product_house_tier,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    issuing_body TEXT,
    category certification_category,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS hotel_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier hotel_brand_tier,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0
);


-- =====================
-- CANDIDATE JOIN TABLES
-- =====================

CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency proficiency_level NOT NULL DEFAULT 'competent',
    years_using INTEGER,
    PRIMARY KEY (candidate_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_skill ON candidate_skills(skill_id);

CREATE TABLE IF NOT EXISTS candidate_systems (
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    proficiency proficiency_level NOT NULL DEFAULT 'competent',
    PRIMARY KEY (candidate_id, system_id)
);

CREATE TABLE IF NOT EXISTS candidate_product_houses (
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    product_house_id UUID NOT NULL REFERENCES product_houses(id) ON DELETE CASCADE,
    years_using INTEGER,
    PRIMARY KEY (candidate_id, product_house_id)
);

CREATE TABLE IF NOT EXISTS candidate_certifications (
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    issued_date DATE,
    expiry_date DATE,
    document_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (candidate_id, certification_id)
);

CREATE TABLE IF NOT EXISTS candidate_hotel_brands (
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    hotel_brand_id UUID NOT NULL REFERENCES hotel_brands(id) ON DELETE CASCADE,
    years_worked INTEGER,
    role_held TEXT,
    PRIMARY KEY (candidate_id, hotel_brand_id)
);

CREATE TABLE IF NOT EXISTS candidate_previous_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    employer_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prev_roles_candidate ON candidate_previous_roles(candidate_id);


-- =====================
-- JOB REQUIREMENT JOIN TABLES
-- =====================

CREATE TABLE IF NOT EXISTS job_required_skills (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_trainable BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS job_preferred_skills (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_trainable BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS job_required_systems (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    is_trainable BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (job_id, system_id)
);

CREATE TABLE IF NOT EXISTS job_required_product_houses (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    product_house_id UUID NOT NULL REFERENCES product_houses(id) ON DELETE CASCADE,
    requirement_level requirement_level NOT NULL DEFAULT 'required',
    is_trainable BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (job_id, product_house_id)
);

CREATE TABLE IF NOT EXISTS job_required_certifications (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    requirement_level requirement_level NOT NULL DEFAULT 'required',
    is_trainable BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (job_id, certification_id)
);

CREATE TABLE IF NOT EXISTS job_required_hotel_brands (
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    hotel_brand_id UUID NOT NULL REFERENCES hotel_brands(id) ON DELETE CASCADE,
    requirement_level requirement_level NOT NULL DEFAULT 'preferred',
    PRIMARY KEY (job_id, hotel_brand_id)
);


-- =====================
-- MATCH SCORES (persisted)
-- =====================

CREATE TABLE IF NOT EXISTS match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    skills_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    preferred_skills_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    systems_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    product_house_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    certifications_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    commercial_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    leadership_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    eligibility_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    has_hard_blocker BOOLEAN NOT NULL DEFAULT false,
    blocker_reason TEXT,
    trainable_gaps JSONB DEFAULT '[]',
    missing_required JSONB DEFAULT '[]',
    match_strengths JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (candidate_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_match_scores_candidate ON match_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_job ON match_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_total ON match_scores(total_score DESC);


-- =====================
-- ADMIN AUDIT LOG
-- =====================

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);


-- =====================
-- RLS POLICIES
-- =====================

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read skills" ON skills;
CREATE POLICY "Anyone read skills" ON skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage skills" ON skills;
CREATE POLICY "Auth manage skills" ON skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read systems" ON systems;
CREATE POLICY "Anyone read systems" ON systems FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage systems" ON systems;
CREATE POLICY "Auth manage systems" ON systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read product_houses" ON product_houses;
CREATE POLICY "Anyone read product_houses" ON product_houses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage product_houses" ON product_houses;
CREATE POLICY "Auth manage product_houses" ON product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read certifications" ON certifications;
CREATE POLICY "Anyone read certifications" ON certifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage certifications" ON certifications;
CREATE POLICY "Auth manage certifications" ON certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read hotel_brands" ON hotel_brands;
CREATE POLICY "Anyone read hotel_brands" ON hotel_brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage hotel_brands" ON hotel_brands;
CREATE POLICY "Auth manage hotel_brands" ON hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_skills" ON candidate_skills;
CREATE POLICY "Auth access candidate_skills" ON candidate_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_systems" ON candidate_systems;
CREATE POLICY "Auth access candidate_systems" ON candidate_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_product_houses" ON candidate_product_houses;
CREATE POLICY "Auth access candidate_product_houses" ON candidate_product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_certifications" ON candidate_certifications;
CREATE POLICY "Auth access candidate_certifications" ON candidate_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_hotel_brands" ON candidate_hotel_brands;
CREATE POLICY "Auth access candidate_hotel_brands" ON candidate_hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE candidate_previous_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access candidate_previous_roles" ON candidate_previous_roles;
CREATE POLICY "Auth access candidate_previous_roles" ON candidate_previous_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_skills" ON job_required_skills;
CREATE POLICY "Auth access job_required_skills" ON job_required_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_preferred_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_preferred_skills" ON job_preferred_skills;
CREATE POLICY "Auth access job_preferred_skills" ON job_preferred_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_systems" ON job_required_systems;
CREATE POLICY "Auth access job_required_systems" ON job_required_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_product_houses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_product_houses" ON job_required_product_houses;
CREATE POLICY "Auth access job_required_product_houses" ON job_required_product_houses FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_certifications" ON job_required_certifications;
CREATE POLICY "Auth access job_required_certifications" ON job_required_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE job_required_hotel_brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access job_required_hotel_brands" ON job_required_hotel_brands;
CREATE POLICY "Auth access job_required_hotel_brands" ON job_required_hotel_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access match_scores" ON match_scores;
CREATE POLICY "Auth access match_scores" ON match_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth access audit_log" ON admin_audit_log;
CREATE POLICY "Auth access audit_log" ON admin_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- =====================
-- SEED TAXONOMY DATA
-- =====================

-- Treatment skills
INSERT INTO skills (name, category, sort_order) VALUES
  ('Swedish Massage', 'treatment', 1), ('Deep Tissue Massage', 'treatment', 2),
  ('Hot Stone Massage', 'treatment', 3), ('Pregnancy Massage', 'treatment', 4),
  ('Lymphatic Drainage', 'treatment', 5), ('Sports Massage', 'treatment', 6),
  ('Reflexology', 'treatment', 7), ('Body Treatments', 'treatment', 8),
  ('Facials', 'treatment', 9), ('Advanced Facial Technology', 'treatment', 10),
  ('Hydrotherapy', 'treatment', 11), ('Ayurveda', 'treatment', 12),
  ('Wellness Consultation', 'treatment', 13), ('Manicure & Pedicure', 'treatment', 14),
  ('Waxing', 'treatment', 15), ('Aromatherapy', 'treatment', 16),
  ('Reiki', 'treatment', 17), ('Indian Head Massage', 'treatment', 18),
  ('Couples Treatments', 'treatment', 19), ('Rasul & Hammam', 'treatment', 20)
ON CONFLICT (name) DO NOTHING;

-- Commercial skills
INSERT INTO skills (name, category, sort_order) VALUES
  ('Retail Selling', 'commercial', 1), ('Upselling', 'commercial', 2),
  ('Membership Sales', 'commercial', 3), ('Package Selling', 'commercial', 4),
  ('Guest Recovery', 'commercial', 5), ('KPI Reporting', 'commercial', 6),
  ('Target Delivery', 'commercial', 7), ('Team Coaching', 'commercial', 8),
  ('Revenue Management', 'commercial', 9), ('Yield Management', 'commercial', 10)
ON CONFLICT (name) DO NOTHING;

-- Leadership skills
INSERT INTO skills (name, category, sort_order) VALUES
  ('Rota Planning', 'leadership', 1), ('Team Leadership', 'leadership', 2),
  ('Recruitment', 'leadership', 3), ('Payroll Input', 'leadership', 4),
  ('SOP Training', 'leadership', 5), ('Stock Control', 'leadership', 6),
  ('Opening & Closing Procedures', 'leadership', 7), ('Budget Control', 'leadership', 8),
  ('Pre-Opening Experience', 'leadership', 9), ('Audit Readiness', 'leadership', 10),
  ('P&L Management', 'leadership', 11), ('Guest Experience Management', 'leadership', 12),
  ('Supplier Management', 'leadership', 13)
ON CONFLICT (name) DO NOTHING;

-- Operational skills
INSERT INTO skills (name, category, sort_order) VALUES
  ('Health & Safety Compliance', 'operational', 1), ('Quality Auditing', 'operational', 2),
  ('Pool Management', 'operational', 3), ('Thermal Suite Operations', 'operational', 4),
  ('Treatment Menu Development', 'operational', 5), ('Guest Journey Mapping', 'operational', 6)
ON CONFLICT (name) DO NOTHING;

-- Systems
INSERT INTO systems (name, category, sort_order) VALUES
  ('Book4Time', 'booking', 1), ('Opera PMS', 'booking', 2),
  ('SpaSoft', 'booking', 3), ('Trybe', 'booking', 4),
  ('Mindbody', 'booking', 5), ('Premier Software', 'booking', 6),
  ('Rezlynx', 'booking', 7), ('Spa Booker', 'booking', 8),
  ('Treatwell', 'booking', 9), ('Microsoft Excel', 'reporting', 10),
  ('POS Systems', 'pos', 11), ('Membership Systems', 'membership', 12),
  ('Concept', 'booking', 13), ('Shortcuts', 'booking', 14),
  ('Salon IQ', 'booking', 15)
ON CONFLICT (name) DO NOTHING;

-- Product houses
INSERT INTO product_houses (name, tier, sort_order) VALUES
  ('ESPA', 'luxury', 1), ('Elemis', 'professional', 2),
  ('111SKIN', 'ultra_luxury', 3), ('Natura Bissé', 'ultra_luxury', 4),
  ('Wildsmith', 'luxury', 5), ('Ground Wellbeing', 'luxury', 6),
  ('Aromatherapy Associates', 'luxury', 7), ('Kama Ayurveda', 'luxury', 8),
  ('Biologique Recherche', 'ultra_luxury', 9), ('Comfort Zone', 'professional', 10),
  ('Dermalogica', 'professional', 11), ('Thalgo', 'professional', 12),
  ('Guinot', 'professional', 13), ('Clarins', 'luxury', 14),
  ('Sisley', 'ultra_luxury', 15), ('La Mer', 'ultra_luxury', 16),
  ('Bamford', 'luxury', 17), ('Sodashi', 'luxury', 18),
  ('Ila Spa', 'luxury', 19), ('Decléor', 'professional', 20),
  ('IMAGE Skincare', 'professional', 21), ('Medik8', 'professional', 22),
  ('Murad', 'professional', 23), ('Valmont', 'ultra_luxury', 24),
  ('Susanne Kaufmann', 'luxury', 25), ('Temple Spa', 'professional', 26),
  ('VOYA', 'luxury', 27), ('Ishga', 'luxury', 28)
ON CONFLICT (name) DO NOTHING;

-- Certifications
INSERT INTO certifications (name, category, sort_order) VALUES
  ('NVQ Level 2', 'beauty', 1), ('NVQ Level 3', 'beauty', 2),
  ('NVQ Level 4', 'management', 3), ('CIDESCO', 'beauty', 4),
  ('CIBTAC', 'beauty', 5), ('ITEC', 'beauty', 6),
  ('VTCT', 'beauty', 7), ('City & Guilds', 'beauty', 8),
  ('First Aid', 'health_safety', 9), ('Pool Plant Certificate', 'health_safety', 10),
  ('Fitness Qualifications', 'fitness', 11), ('COSHH', 'health_safety', 12),
  ('Manual Handling', 'health_safety', 13), ('Food Hygiene', 'health_safety', 14),
  ('Level 3 Sports Massage', 'massage', 15), ('Level 4 Sports Massage', 'massage', 16)
ON CONFLICT (name) DO NOTHING;

-- Hotel brands
INSERT INTO hotel_brands (name, tier, sort_order) VALUES
  ('Fairmont', 'luxury', 1), ('Four Seasons', 'ultra_luxury', 2),
  ('Mandarin Oriental', 'ultra_luxury', 3), ('Rosewood', 'ultra_luxury', 4),
  ('Corinthia', 'luxury', 5), ('The Lanesborough', 'ultra_luxury', 6),
  ('Gleneagles', 'luxury', 7), ('Soho House', 'lifestyle', 8),
  ('Marriott', 'luxury', 9), ('Hilton', 'luxury', 10),
  ('IHG', 'luxury', 11), ('Accor', 'luxury', 12),
  ('Dorchester Collection', 'ultra_luxury', 13), ('Belmond', 'ultra_luxury', 14),
  ('Aman', 'ultra_luxury', 15), ('Six Senses', 'luxury', 16),
  ('COMO', 'luxury', 17), ('Chewton Glen', 'boutique', 18),
  ('Cliveden', 'boutique', 19), ('The Pig', 'boutique', 20),
  ('Independent', 'independent', 99)
ON CONFLICT (name) DO NOTHING;


-- Reload schema cache
NOTIFY pgrst, 'reload schema';
