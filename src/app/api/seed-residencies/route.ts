import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const SEED_RESIDENCIES = [
  {
    title: 'ESPA Specialist — Luxury Hotel Residency',
    description: 'Senior spa therapist with 12 years of luxury hotel experience, trained in ESPA and Elemis protocols. Available for extended residencies at five-star properties across the UK and Europe.',
    services_offered: ['Swedish Massage', 'Deep Tissue', 'Hot Stone', 'Facials', 'Body Wraps', 'Aromatherapy'],
    product_houses: ['ESPA', 'Elemis', 'Aromatherapy Associates'],
    duration: '1 month',
    day_rate: 350,
    weekly_rate: 1750,
    monthly_rate: 6000,
    travel_availability: 'uk_and_europe',
    availability_start: '2026-05-01',
    approval_status: 'approved',
    is_featured: true,
  },
  {
    title: 'Holistic Wellness Practitioner — Retreat Residency',
    description: 'Certified in reiki, sound healing, breathwork and yoga instruction. Ideal for wellness retreats, country house hotels, and boutique properties seeking a holistic offering.',
    services_offered: ['Reiki', 'Sound Healing', 'Breathwork', 'Yoga', 'Meditation'],
    product_houses: ['Ground Wellbeing', 'Bamford'],
    duration: '2 weeks',
    day_rate: 280,
    weekly_rate: 1400,
    monthly_rate: 4800,
    travel_availability: 'uk_only',
    availability_start: '2026-06-01',
    approval_status: 'approved',
    is_featured: false,
  },
  {
    title: 'Advanced Facial & Skincare Expert',
    description: 'Specialist in advanced facial treatments and results-driven skincare. Trained in Biologique Recherche, 111SKIN and Natura Bissé. Perfect for properties looking to elevate their facial menu.',
    services_offered: ['Facials', 'Aromatherapy', 'Body Wraps'],
    product_houses: ['Biologique Recherche', '111SKIN', 'Natura Bissé'],
    duration: '1 week',
    day_rate: 400,
    weekly_rate: 2000,
    monthly_rate: 7000,
    travel_availability: 'worldwide',
    availability_start: '2026-05-15',
    approval_status: 'approved',
    is_featured: false,
  },
  {
    title: 'Spa Manager & Therapist — Seasonal Residency',
    description: 'Dual-qualified spa manager and senior therapist with experience at Four Seasons, Mandarin Oriental and Corinthia. Available for seasonal placements with full operational and treatment delivery.',
    services_offered: ['Swedish Massage', 'Deep Tissue', 'Reflexology', 'Facials', 'Holistic Therapy'],
    product_houses: ['ESPA', 'Comfort Zone', 'Wildsmith'],
    duration: '3 months',
    day_rate: 320,
    weekly_rate: 1600,
    monthly_rate: 5500,
    travel_availability: 'uk_and_europe',
    availability_start: '2026-07-01',
    approval_status: 'approved',
    is_featured: true,
  },
]

export async function GET() {
  const supabase = createAdminClient()

  // Check existing count
  const { count } = await supabase
    .from('residency_profiles')
    .select('id', { count: 'exact', head: true })

  if ((count || 0) > 0) {
    return NextResponse.json({ message: `Table already has ${count} rows — skipping seed`, count })
  }

  const { data, error } = await supabase
    .from('residency_profiles')
    .insert(SEED_RESIDENCIES)
    .select('id, title')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Seeded ${data.length} residency profiles`, data })
}
