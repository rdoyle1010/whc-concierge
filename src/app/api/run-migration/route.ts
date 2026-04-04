import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Check which tables exist by trying to select from them
  const tables = ['skills', 'systems', 'product_houses', 'certifications', 'hotel_brands',
    'candidate_skills', 'candidate_systems', 'candidate_product_houses',
    'candidate_certifications', 'candidate_hotel_brands', 'candidate_previous_roles',
    'job_required_skills', 'job_preferred_skills', 'job_required_systems',
    'job_required_product_houses', 'job_required_certifications', 'job_required_hotel_brands',
    'match_scores']

  const existing: string[] = []
  const missing: string[] = []

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0)
    if (error && (error.message.includes('does not exist') || error.message.includes('relation') || error.code === '42P01')) {
      missing.push(table)
    } else {
      existing.push(table)
    }
  }

  // If taxonomy tables exist, seed them with data
  const seeded: Record<string, any> = {}

  if (existing.includes('skills')) {
    const { count } = await supabase.from('skills').select('id', { count: 'exact', head: true })
    if ((count || 0) < 10) {
      const skills = [
        { name: 'Swedish Massage', category: 'treatment', sort_order: 1, is_active: true },
        { name: 'Deep Tissue Massage', category: 'treatment', sort_order: 2, is_active: true },
        { name: 'Hot Stone Massage', category: 'treatment', sort_order: 3, is_active: true },
        { name: 'Pregnancy Massage', category: 'treatment', sort_order: 4, is_active: true },
        { name: 'Lymphatic Drainage', category: 'treatment', sort_order: 5, is_active: true },
        { name: 'Sports Massage', category: 'treatment', sort_order: 6, is_active: true },
        { name: 'Reflexology', category: 'treatment', sort_order: 7, is_active: true },
        { name: 'Body Treatments', category: 'treatment', sort_order: 8, is_active: true },
        { name: 'Facials', category: 'treatment', sort_order: 9, is_active: true },
        { name: 'Advanced Facial Technology', category: 'treatment', sort_order: 10, is_active: true },
        { name: 'Hydrotherapy', category: 'treatment', sort_order: 11, is_active: true },
        { name: 'Ayurveda', category: 'treatment', sort_order: 12, is_active: true },
        { name: 'Wellness Consultation', category: 'treatment', sort_order: 13, is_active: true },
        { name: 'Manicure & Pedicure', category: 'treatment', sort_order: 14, is_active: true },
        { name: 'Waxing', category: 'treatment', sort_order: 15, is_active: true },
        { name: 'Aromatherapy', category: 'treatment', sort_order: 16, is_active: true },
        { name: 'Reiki', category: 'treatment', sort_order: 17, is_active: true },
        { name: 'Indian Head Massage', category: 'treatment', sort_order: 18, is_active: true },
        { name: 'Couples Treatments', category: 'treatment', sort_order: 19, is_active: true },
        { name: 'Rasul & Hammam', category: 'treatment', sort_order: 20, is_active: true },
        { name: 'Retail Selling', category: 'commercial', sort_order: 21, is_active: true },
        { name: 'Upselling', category: 'commercial', sort_order: 22, is_active: true },
        { name: 'Membership Sales', category: 'commercial', sort_order: 23, is_active: true },
        { name: 'Package Selling', category: 'commercial', sort_order: 24, is_active: true },
        { name: 'Guest Recovery', category: 'commercial', sort_order: 25, is_active: true },
        { name: 'KPI Reporting', category: 'commercial', sort_order: 26, is_active: true },
        { name: 'Target Delivery', category: 'commercial', sort_order: 27, is_active: true },
        { name: 'Team Coaching', category: 'commercial', sort_order: 28, is_active: true },
        { name: 'Revenue Management', category: 'commercial', sort_order: 29, is_active: true },
        { name: 'Yield Management', category: 'commercial', sort_order: 30, is_active: true },
        { name: 'Rota Planning', category: 'leadership', sort_order: 31, is_active: true },
        { name: 'Team Leadership', category: 'leadership', sort_order: 32, is_active: true },
        { name: 'Recruitment', category: 'leadership', sort_order: 33, is_active: true },
        { name: 'Payroll Input', category: 'leadership', sort_order: 34, is_active: true },
        { name: 'SOP Training', category: 'leadership', sort_order: 35, is_active: true },
        { name: 'Stock Control', category: 'leadership', sort_order: 36, is_active: true },
        { name: 'Opening & Closing Procedures', category: 'leadership', sort_order: 37, is_active: true },
        { name: 'Budget Control', category: 'leadership', sort_order: 38, is_active: true },
        { name: 'Pre-Opening Experience', category: 'leadership', sort_order: 39, is_active: true },
        { name: 'Audit Readiness', category: 'leadership', sort_order: 40, is_active: true },
        { name: 'P&L Management', category: 'leadership', sort_order: 41, is_active: true },
        { name: 'Guest Experience Management', category: 'leadership', sort_order: 42, is_active: true },
        { name: 'Supplier Management', category: 'leadership', sort_order: 43, is_active: true },
        { name: 'Health & Safety Compliance', category: 'operational', sort_order: 44, is_active: true },
        { name: 'Quality Auditing', category: 'operational', sort_order: 45, is_active: true },
        { name: 'Pool Management', category: 'operational', sort_order: 46, is_active: true },
        { name: 'Thermal Suite Operations', category: 'operational', sort_order: 47, is_active: true },
        { name: 'Treatment Menu Development', category: 'operational', sort_order: 48, is_active: true },
        { name: 'Guest Journey Mapping', category: 'operational', sort_order: 49, is_active: true },
      ]
      const { error } = await supabase.from('skills').upsert(skills, { onConflict: 'name' })
      seeded.skills = error ? error.message : skills.length
    } else {
      seeded.skills = `Already has ${count} items`
    }
  }

  if (existing.includes('systems')) {
    const { count } = await supabase.from('systems').select('id', { count: 'exact', head: true })
    if ((count || 0) < 5) {
      const items = [
        { name: 'Book4Time', category: 'booking', sort_order: 1, is_active: true },
        { name: 'Opera PMS', category: 'booking', sort_order: 2, is_active: true },
        { name: 'SpaSoft', category: 'booking', sort_order: 3, is_active: true },
        { name: 'Trybe', category: 'booking', sort_order: 4, is_active: true },
        { name: 'Mindbody', category: 'booking', sort_order: 5, is_active: true },
        { name: 'Premier Software', category: 'booking', sort_order: 6, is_active: true },
        { name: 'Rezlynx', category: 'booking', sort_order: 7, is_active: true },
        { name: 'Spa Booker', category: 'booking', sort_order: 8, is_active: true },
        { name: 'Treatwell', category: 'booking', sort_order: 9, is_active: true },
        { name: 'Microsoft Excel', category: 'reporting', sort_order: 10, is_active: true },
        { name: 'POS Systems', category: 'pos', sort_order: 11, is_active: true },
        { name: 'Membership Systems', category: 'membership', sort_order: 12, is_active: true },
        { name: 'Concept', category: 'booking', sort_order: 13, is_active: true },
        { name: 'Shortcuts', category: 'booking', sort_order: 14, is_active: true },
        { name: 'Salon IQ', category: 'booking', sort_order: 15, is_active: true },
      ]
      const { error } = await supabase.from('systems').upsert(items, { onConflict: 'name' })
      seeded.systems = error ? error.message : items.length
    } else { seeded.systems = `Already has ${count} items` }
  }

  if (existing.includes('product_houses')) {
    const { count } = await supabase.from('product_houses').select('id', { count: 'exact', head: true })
    if ((count || 0) < 10) {
      const items = [
        { name: 'ESPA', tier: 'luxury', sort_order: 1, is_active: true },
        { name: 'Elemis', tier: 'professional', sort_order: 2, is_active: true },
        { name: '111SKIN', tier: 'ultra_luxury', sort_order: 3, is_active: true },
        { name: 'Natura Bissé', tier: 'ultra_luxury', sort_order: 4, is_active: true },
        { name: 'Wildsmith', tier: 'luxury', sort_order: 5, is_active: true },
        { name: 'Aromatherapy Associates', tier: 'luxury', sort_order: 7, is_active: true },
        { name: 'Biologique Recherche', tier: 'ultra_luxury', sort_order: 9, is_active: true },
        { name: 'Comfort Zone', tier: 'professional', sort_order: 10, is_active: true },
        { name: 'Dermalogica', tier: 'professional', sort_order: 11, is_active: true },
        { name: 'Thalgo', tier: 'professional', sort_order: 12, is_active: true },
        { name: 'Clarins', tier: 'luxury', sort_order: 14, is_active: true },
        { name: 'Sisley', tier: 'ultra_luxury', sort_order: 15, is_active: true },
        { name: 'La Mer', tier: 'ultra_luxury', sort_order: 16, is_active: true },
        { name: 'Bamford', tier: 'luxury', sort_order: 17, is_active: true },
        { name: 'Sodashi', tier: 'luxury', sort_order: 18, is_active: true },
        { name: 'Decléor', tier: 'professional', sort_order: 20, is_active: true },
        { name: 'IMAGE Skincare', tier: 'professional', sort_order: 21, is_active: true },
        { name: 'Medik8', tier: 'professional', sort_order: 22, is_active: true },
        { name: 'Murad', tier: 'professional', sort_order: 23, is_active: true },
        { name: 'Valmont', tier: 'ultra_luxury', sort_order: 24, is_active: true },
        { name: 'Temple Spa', tier: 'professional', sort_order: 26, is_active: true },
        { name: 'VOYA', tier: 'luxury', sort_order: 27, is_active: true },
      ]
      const { error } = await supabase.from('product_houses').upsert(items, { onConflict: 'name' })
      seeded.product_houses = error ? error.message : items.length
    } else { seeded.product_houses = `Already has ${count} items` }
  }

  if (existing.includes('certifications')) {
    const { count } = await supabase.from('certifications').select('id', { count: 'exact', head: true })
    if ((count || 0) < 5) {
      const items = [
        { name: 'NVQ Level 2', category: 'beauty', sort_order: 1, is_active: true },
        { name: 'NVQ Level 3', category: 'beauty', sort_order: 2, is_active: true },
        { name: 'NVQ Level 4', category: 'management', sort_order: 3, is_active: true },
        { name: 'CIDESCO', category: 'beauty', sort_order: 4, is_active: true },
        { name: 'CIBTAC', category: 'beauty', sort_order: 5, is_active: true },
        { name: 'ITEC', category: 'beauty', sort_order: 6, is_active: true },
        { name: 'VTCT', category: 'beauty', sort_order: 7, is_active: true },
        { name: 'City & Guilds', category: 'beauty', sort_order: 8, is_active: true },
        { name: 'First Aid', category: 'health_safety', sort_order: 9, is_active: true },
        { name: 'Pool Plant Certificate', category: 'health_safety', sort_order: 10, is_active: true },
        { name: 'Fitness Qualifications', category: 'fitness', sort_order: 11, is_active: true },
        { name: 'COSHH', category: 'health_safety', sort_order: 12, is_active: true },
        { name: 'Manual Handling', category: 'health_safety', sort_order: 13, is_active: true },
        { name: 'Food Hygiene', category: 'health_safety', sort_order: 14, is_active: true },
        { name: 'Level 3 Sports Massage', category: 'massage', sort_order: 15, is_active: true },
        { name: 'Level 4 Sports Massage', category: 'massage', sort_order: 16, is_active: true },
      ]
      const { error } = await supabase.from('certifications').upsert(items, { onConflict: 'name' })
      seeded.certifications = error ? error.message : items.length
    } else { seeded.certifications = `Already has ${count} items` }
  }

  if (existing.includes('hotel_brands')) {
    const { count } = await supabase.from('hotel_brands').select('id', { count: 'exact', head: true })
    if ((count || 0) < 5) {
      const items = [
        { name: 'Fairmont', tier: 'luxury', sort_order: 1, is_active: true },
        { name: 'Four Seasons', tier: 'ultra_luxury', sort_order: 2, is_active: true },
        { name: 'Mandarin Oriental', tier: 'ultra_luxury', sort_order: 3, is_active: true },
        { name: 'Rosewood', tier: 'ultra_luxury', sort_order: 4, is_active: true },
        { name: 'Corinthia', tier: 'luxury', sort_order: 5, is_active: true },
        { name: 'Gleneagles', tier: 'luxury', sort_order: 7, is_active: true },
        { name: 'Soho House', tier: 'lifestyle', sort_order: 8, is_active: true },
        { name: 'Marriott', tier: 'luxury', sort_order: 9, is_active: true },
        { name: 'Hilton', tier: 'luxury', sort_order: 10, is_active: true },
        { name: 'Dorchester Collection', tier: 'ultra_luxury', sort_order: 13, is_active: true },
        { name: 'Aman', tier: 'ultra_luxury', sort_order: 15, is_active: true },
        { name: 'Six Senses', tier: 'luxury', sort_order: 16, is_active: true },
        { name: 'Chewton Glen', tier: 'boutique', sort_order: 18, is_active: true },
        { name: 'The Pig', tier: 'boutique', sort_order: 20, is_active: true },
        { name: 'Independent', tier: 'independent', sort_order: 99, is_active: true },
      ]
      const { error } = await supabase.from('hotel_brands').upsert(items, { onConflict: 'name' })
      seeded.hotel_brands = error ? error.message : items.length
    } else { seeded.hotel_brands = `Already has ${count} items` }
  }

  return NextResponse.json({
    tables_existing: existing,
    tables_missing: missing,
    seeded,
    action: missing.length > 0
      ? `${missing.length} tables are MISSING. The Supabase JS client cannot create tables — you must run the CREATE TABLE SQL directly in the Supabase SQL Editor. Copy ONLY the CREATE TABLE and CREATE INDEX statements from the migration (the ENUMs already exist). Then visit this endpoint again to seed data.`
      : 'All tables exist and data has been seeded.',
  })
}
