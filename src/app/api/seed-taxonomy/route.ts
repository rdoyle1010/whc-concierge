import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const SKILLS = [
  // Treatment
  { name: 'Swedish Massage', category: 'treatment', sort_order: 1 },
  { name: 'Deep Tissue Massage', category: 'treatment', sort_order: 2 },
  { name: 'Hot Stone Massage', category: 'treatment', sort_order: 3 },
  { name: 'Pregnancy Massage', category: 'treatment', sort_order: 4 },
  { name: 'Lymphatic Drainage', category: 'treatment', sort_order: 5 },
  { name: 'Sports Massage', category: 'treatment', sort_order: 6 },
  { name: 'Reflexology', category: 'treatment', sort_order: 7 },
  { name: 'Body Treatments', category: 'treatment', sort_order: 8 },
  { name: 'Facials', category: 'treatment', sort_order: 9 },
  { name: 'Advanced Facial Technology', category: 'treatment', sort_order: 10 },
  { name: 'Hydrotherapy', category: 'treatment', sort_order: 11 },
  { name: 'Ayurveda', category: 'treatment', sort_order: 12 },
  { name: 'Wellness Consultation', category: 'treatment', sort_order: 13 },
  { name: 'Manicure & Pedicure', category: 'treatment', sort_order: 14 },
  { name: 'Waxing', category: 'treatment', sort_order: 15 },
  { name: 'Aromatherapy', category: 'treatment', sort_order: 16 },
  { name: 'Reiki', category: 'treatment', sort_order: 17 },
  { name: 'Indian Head Massage', category: 'treatment', sort_order: 18 },
  { name: 'Couples Treatments', category: 'treatment', sort_order: 19 },
  { name: 'Rasul & Hammam', category: 'treatment', sort_order: 20 },
  // Commercial
  { name: 'Retail Selling', category: 'commercial', sort_order: 21 },
  { name: 'Upselling', category: 'commercial', sort_order: 22 },
  { name: 'Membership Sales', category: 'commercial', sort_order: 23 },
  { name: 'Package Selling', category: 'commercial', sort_order: 24 },
  { name: 'Guest Recovery', category: 'commercial', sort_order: 25 },
  { name: 'KPI Reporting', category: 'commercial', sort_order: 26 },
  { name: 'Target Delivery', category: 'commercial', sort_order: 27 },
  { name: 'Team Coaching', category: 'commercial', sort_order: 28 },
  { name: 'Revenue Management', category: 'commercial', sort_order: 29 },
  { name: 'Yield Management', category: 'commercial', sort_order: 30 },
  // Leadership
  { name: 'Rota Planning', category: 'leadership', sort_order: 31 },
  { name: 'Team Leadership', category: 'leadership', sort_order: 32 },
  { name: 'Recruitment', category: 'leadership', sort_order: 33 },
  { name: 'Payroll Input', category: 'leadership', sort_order: 34 },
  { name: 'SOP Training', category: 'leadership', sort_order: 35 },
  { name: 'Stock Control', category: 'leadership', sort_order: 36 },
  { name: 'Opening & Closing Procedures', category: 'leadership', sort_order: 37 },
  { name: 'Budget Control', category: 'leadership', sort_order: 38 },
  { name: 'Pre-Opening Experience', category: 'leadership', sort_order: 39 },
  { name: 'Audit Readiness', category: 'leadership', sort_order: 40 },
  { name: 'P&L Management', category: 'leadership', sort_order: 41 },
  { name: 'Guest Experience Management', category: 'leadership', sort_order: 42 },
  { name: 'Supplier Management', category: 'leadership', sort_order: 43 },
  // Operational
  { name: 'Health & Safety Compliance', category: 'operational', sort_order: 44 },
  { name: 'Quality Auditing', category: 'operational', sort_order: 45 },
  { name: 'Pool Management', category: 'operational', sort_order: 46 },
  { name: 'Thermal Suite Operations', category: 'operational', sort_order: 47 },
  { name: 'Treatment Menu Development', category: 'operational', sort_order: 48 },
  { name: 'Guest Journey Mapping', category: 'operational', sort_order: 49 },
]

const SYSTEMS = [
  { name: 'Book4Time', category: 'booking', sort_order: 1 },
  { name: 'Opera PMS', category: 'booking', sort_order: 2 },
  { name: 'SpaSoft', category: 'booking', sort_order: 3 },
  { name: 'Trybe', category: 'booking', sort_order: 4 },
  { name: 'Mindbody', category: 'booking', sort_order: 5 },
  { name: 'Premier Software', category: 'booking', sort_order: 6 },
  { name: 'Rezlynx', category: 'booking', sort_order: 7 },
  { name: 'Spa Booker', category: 'booking', sort_order: 8 },
  { name: 'Treatwell', category: 'booking', sort_order: 9 },
  { name: 'Microsoft Excel', category: 'reporting', sort_order: 10 },
  { name: 'POS Systems', category: 'pos', sort_order: 11 },
  { name: 'Membership Systems', category: 'membership', sort_order: 12 },
  { name: 'Concept', category: 'booking', sort_order: 13 },
  { name: 'Shortcuts', category: 'booking', sort_order: 14 },
  { name: 'Salon IQ', category: 'booking', sort_order: 15 },
]

const PRODUCT_HOUSES = [
  { name: 'ESPA', tier: 'luxury', sort_order: 1 },
  { name: 'Elemis', tier: 'professional', sort_order: 2 },
  { name: '111SKIN', tier: 'ultra_luxury', sort_order: 3 },
  { name: 'Natura Bissé', tier: 'ultra_luxury', sort_order: 4 },
  { name: 'Wildsmith', tier: 'luxury', sort_order: 5 },
  { name: 'Ground Wellbeing', tier: 'luxury', sort_order: 6 },
  { name: 'Aromatherapy Associates', tier: 'luxury', sort_order: 7 },
  { name: 'Kama Ayurveda', tier: 'luxury', sort_order: 8 },
  { name: 'Biologique Recherche', tier: 'ultra_luxury', sort_order: 9 },
  { name: 'Comfort Zone', tier: 'professional', sort_order: 10 },
  { name: 'Dermalogica', tier: 'professional', sort_order: 11 },
  { name: 'Thalgo', tier: 'professional', sort_order: 12 },
  { name: 'Guinot', tier: 'professional', sort_order: 13 },
  { name: 'Clarins', tier: 'luxury', sort_order: 14 },
  { name: 'Sisley', tier: 'ultra_luxury', sort_order: 15 },
  { name: 'La Mer', tier: 'ultra_luxury', sort_order: 16 },
  { name: 'Bamford', tier: 'luxury', sort_order: 17 },
  { name: 'Sodashi', tier: 'luxury', sort_order: 18 },
  { name: 'Ila Spa', tier: 'luxury', sort_order: 19 },
  { name: 'Decléor', tier: 'professional', sort_order: 20 },
  { name: 'IMAGE Skincare', tier: 'professional', sort_order: 21 },
  { name: 'Medik8', tier: 'professional', sort_order: 22 },
  { name: 'Murad', tier: 'professional', sort_order: 23 },
  { name: 'Valmont', tier: 'ultra_luxury', sort_order: 24 },
  { name: 'Susanne Kaufmann', tier: 'luxury', sort_order: 25 },
  { name: 'Temple Spa', tier: 'professional', sort_order: 26 },
  { name: 'VOYA', tier: 'luxury', sort_order: 27 },
  { name: 'Ishga', tier: 'luxury', sort_order: 28 },
]

const CERTIFICATIONS = [
  { name: 'NVQ Level 2', category: 'beauty', sort_order: 1 },
  { name: 'NVQ Level 3', category: 'beauty', sort_order: 2 },
  { name: 'NVQ Level 4', category: 'management', sort_order: 3 },
  { name: 'CIDESCO', category: 'beauty', sort_order: 4 },
  { name: 'CIBTAC', category: 'beauty', sort_order: 5 },
  { name: 'ITEC', category: 'beauty', sort_order: 6 },
  { name: 'VTCT', category: 'beauty', sort_order: 7 },
  { name: 'City & Guilds', category: 'beauty', sort_order: 8 },
  { name: 'First Aid', category: 'health_safety', sort_order: 9 },
  { name: 'Pool Plant Certificate', category: 'health_safety', sort_order: 10 },
  { name: 'Fitness Qualifications', category: 'fitness', sort_order: 11 },
  { name: 'COSHH', category: 'health_safety', sort_order: 12 },
  { name: 'Manual Handling', category: 'health_safety', sort_order: 13 },
  { name: 'Food Hygiene', category: 'health_safety', sort_order: 14 },
  { name: 'Level 3 Sports Massage', category: 'massage', sort_order: 15 },
  { name: 'Level 4 Sports Massage', category: 'massage', sort_order: 16 },
]

const HOTEL_BRANDS = [
  { name: 'Fairmont', tier: 'luxury', sort_order: 1 },
  { name: 'Four Seasons', tier: 'ultra_luxury', sort_order: 2 },
  { name: 'Mandarin Oriental', tier: 'ultra_luxury', sort_order: 3 },
  { name: 'Rosewood', tier: 'ultra_luxury', sort_order: 4 },
  { name: 'Corinthia', tier: 'luxury', sort_order: 5 },
  { name: 'The Lanesborough', tier: 'ultra_luxury', sort_order: 6 },
  { name: 'Gleneagles', tier: 'luxury', sort_order: 7 },
  { name: 'Soho House', tier: 'lifestyle', sort_order: 8 },
  { name: 'Marriott', tier: 'luxury', sort_order: 9 },
  { name: 'Hilton', tier: 'luxury', sort_order: 10 },
  { name: 'IHG', tier: 'luxury', sort_order: 11 },
  { name: 'Accor', tier: 'luxury', sort_order: 12 },
  { name: 'Dorchester Collection', tier: 'ultra_luxury', sort_order: 13 },
  { name: 'Belmond', tier: 'ultra_luxury', sort_order: 14 },
  { name: 'Aman', tier: 'ultra_luxury', sort_order: 15 },
  { name: 'Six Senses', tier: 'luxury', sort_order: 16 },
  { name: 'COMO', tier: 'luxury', sort_order: 17 },
  { name: 'Chewton Glen', tier: 'boutique', sort_order: 18 },
  { name: 'Cliveden', tier: 'boutique', sort_order: 19 },
  { name: 'The Pig', tier: 'boutique', sort_order: 20 },
  { name: 'Independent', tier: 'independent', sort_order: 99 },
]

export async function GET() {
  const supabase = createAdminClient()
  const results: Record<string, any> = {}

  // Check what exists first
  const { count: skillCount } = await supabase.from('skills').select('id', { count: 'exact', head: true })
  const { count: systemCount } = await supabase.from('systems').select('id', { count: 'exact', head: true })
  const { count: phCount } = await supabase.from('product_houses').select('id', { count: 'exact', head: true })
  const { count: certCount } = await supabase.from('certifications').select('id', { count: 'exact', head: true })
  const { count: brandCount } = await supabase.from('hotel_brands').select('id', { count: 'exact', head: true })

  results.existing = { skills: skillCount, systems: systemCount, product_houses: phCount, certifications: certCount, hotel_brands: brandCount }

  // Only seed if tables are empty or have very few items
  if ((skillCount || 0) < 10) {
    const { error } = await supabase.from('skills').upsert(SKILLS.map(s => ({ ...s, is_active: true })), { onConflict: 'name' })
    results.skills = error ? error.message : `${SKILLS.length} seeded`
  } else {
    results.skills = `Already has ${skillCount} items`
  }

  if ((systemCount || 0) < 5) {
    const { error } = await supabase.from('systems').upsert(SYSTEMS.map(s => ({ ...s, is_active: true })), { onConflict: 'name' })
    results.systems = error ? error.message : `${SYSTEMS.length} seeded`
  } else {
    results.systems = `Already has ${systemCount} items`
  }

  if ((phCount || 0) < 10) {
    const { error } = await supabase.from('product_houses').upsert(PRODUCT_HOUSES.map(p => ({ ...p, is_active: true })), { onConflict: 'name' })
    results.product_houses = error ? error.message : `${PRODUCT_HOUSES.length} seeded`
  } else {
    results.product_houses = `Already has ${phCount} items`
  }

  if ((certCount || 0) < 5) {
    const { error } = await supabase.from('certifications').upsert(CERTIFICATIONS.map(c => ({ ...c, is_active: true })), { onConflict: 'name' })
    results.certifications = error ? error.message : `${CERTIFICATIONS.length} seeded`
  } else {
    results.certifications = `Already has ${certCount} items`
  }

  if ((brandCount || 0) < 5) {
    const { error } = await supabase.from('hotel_brands').upsert(HOTEL_BRANDS.map(b => ({ ...b, is_active: true })), { onConflict: 'name' })
    results.hotel_brands = error ? error.message : `${HOTEL_BRANDS.length} seeded`
  } else {
    results.hotel_brands = `Already has ${brandCount} items`
  }

  // Verify final counts
  const [s, sy, ph, c, hb] = await Promise.all([
    supabase.from('skills').select('id', { count: 'exact', head: true }),
    supabase.from('systems').select('id', { count: 'exact', head: true }),
    supabase.from('product_houses').select('id', { count: 'exact', head: true }),
    supabase.from('certifications').select('id', { count: 'exact', head: true }),
    supabase.from('hotel_brands').select('id', { count: 'exact', head: true }),
  ])

  results.final_counts = {
    skills: s.count, systems: sy.count, product_houses: ph.count,
    certifications: c.count, hotel_brands: hb.count,
    total: (s.count || 0) + (sy.count || 0) + (ph.count || 0) + (c.count || 0) + (hb.count || 0),
  }

  return NextResponse.json(results)
}
