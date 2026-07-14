import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Column names below match the LIVE residency_profiles table:
// primary_specialism, bio, secondary_specialisms, brand_experience,
// preferred_duration, weekly_rate, will_travel_to, available_from,
// profile_photo_url, qualifications, approval_status, is_featured.
const SEED_RESIDENCIES = [
  {
    primary_specialism: 'Award-Winning Yoga & Wellness Specialist',
    bio: 'With over 15 years in the luxury wellness industry, I specialise in Kundalini yoga, Vinyasa flow, yoga retreats, and yoga massage. I\'ve held residencies at five-star London hotels, an internationally renowned wellness clinic in Spain, and a destination wellness retreat in Thailand. I create bespoke retreat programmes combining breathwork, meditation, and therapeutic bodywork. Qualified in 200hr and 500hr YTT, Thai massage, and Ayurvedic treatments. Available for seasonal placements, wellness weekends, and full retreat programming.',
    secondary_specialisms: ['Kundalini Yoga', 'Vinyasa Flow', 'Yoga Retreats', 'Yoga Massage', 'Breathwork', 'Meditation'],
    qualifications: ['Yoga Teacher 200hr', 'Yoga Teacher 500hr', 'Thai Massage', 'Ayurvedic Treatments'],
    brand_experience: ['Aromatherapy Associates', 'Bamford', 'Ground Wellbeing'],
    preferred_duration: '1–3 months',
    weekly_rate: 1750,
    will_travel_to: 'worldwide',
    available_from: '2026-05-01',
    approval_status: 'approved',
    is_featured: true,
    profile_photo_url: 'https://images.pexels.com/photos/6724313/pexels-photo-6724313.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
  },
  {
    primary_specialism: 'Senior Spa Therapist — Luxury Facial & Body Specialist',
    bio: '12 years\' experience across five-star London hotels and destination spas. CIDESCO and CIBTAC qualified with advanced training in Biologique Recherche, 111SKIN, and Dr Barbara Sturm protocols. I\'ve worked at five-star London hotels and luxury country estate spas. My speciality is results-driven facial treatments and luxury body rituals. Available for short-term cover, seasonal placements, and product launch residencies.',
    secondary_specialisms: ['Advanced Facials', 'Body Rituals', 'Skincare Consultations', 'Aromatherapy', 'Hot Stone Massage'],
    qualifications: ['CIDESCO', 'CIBTAC'],
    brand_experience: ['Biologique Recherche', '111SKIN', 'Natura Bissé', 'Dr Barbara Sturm'],
    preferred_duration: '1 week – 1 month',
    weekly_rate: 2000,
    will_travel_to: 'uk_and_europe',
    available_from: '2026-05-15',
    approval_status: 'approved',
    is_featured: true,
    profile_photo_url: 'https://images.pexels.com/photos/6187430/pexels-photo-6187430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
  },
  {
    primary_specialism: 'Holistic Wellness Practitioner & Retreat Leader',
    bio: 'A holistic therapist with 10 years\' experience blending Eastern and Western wellness traditions. Trained in Traditional Chinese Medicine, reflexology, aromatherapy, and crystal healing. I\'ve designed and delivered wellness programmes for luxury Scottish resorts, country house hotels, and members\' clubs. I create immersive guest experiences combining treatments, workshops, and mindfulness sessions. ITEC, FHT, and IFA qualified.',
    secondary_specialisms: ['Reflexology', 'Aromatherapy', 'Crystal Healing', 'Sound Healing', 'Wellness Workshops', 'Mindfulness'],
    qualifications: ['ITEC', 'FHT', 'IFA'],
    brand_experience: ['ESPA', 'Comfort Zone', 'Wildsmith', 'Ila Spa'],
    preferred_duration: '2 weeks – 3 months',
    weekly_rate: 1500,
    will_travel_to: 'uk_only',
    available_from: '2026-06-01',
    approval_status: 'approved',
    is_featured: false,
    profile_photo_url: 'https://images.pexels.com/photos/19695969/pexels-photo-19695969.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
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
    .select('id, primary_specialism')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Seeded ${data.length} residency profiles`, data })
}
