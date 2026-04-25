import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const SEED_RESIDENCIES = [
  {
    title: 'Award-Winning Yoga & Wellness Specialist',
    description: 'With over 15 years in the luxury wellness industry, I specialise in Kundalini yoga, Vinyasa flow, yoga retreats, and yoga massage. I\'ve held residencies at five-star London hotels, an internationally renowned wellness clinic in Spain, and a destination wellness retreat in Thailand. I create bespoke retreat programmes combining breathwork, meditation, and therapeutic bodywork. Qualified in 200hr and 500hr YTT, Thai massage, and Ayurvedic treatments. Available for seasonal placements, wellness weekends, and full retreat programming.',
    services_offered: ['Kundalini Yoga', 'Vinyasa Flow', 'Yoga Retreats', 'Yoga Massage', 'Breathwork', 'Meditation'],
    product_houses: ['Aromatherapy Associates', 'Bamford', 'Ground Wellbeing'],
    duration: '1–3 months',
    day_rate: 350,
    weekly_rate: 1750,
    monthly_rate: 6000,
    travel_availability: 'worldwide',
    availability_start: '2026-05-01',
    approval_status: 'approved',
    is_featured: true,
    gallery_urls: [
      'https://images.pexels.com/photos/6724313/pexels-photo-6724313.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/3735619/pexels-photo-3735619.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/7587466/pexels-photo-7587466.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/5563472/pexels-photo-5563472.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
    ],
  },
  {
    title: 'Senior Spa Therapist — Luxury Facial & Body Specialist',
    description: '12 years\' experience across five-star London hotels and destination spas. CIDESCO and CIBTAC qualified with advanced training in Biologique Recherche, 111SKIN, and Dr Barbara Sturm protocols. I\'ve worked at five-star London hotels and luxury country estate spas. My speciality is results-driven facial treatments and luxury body rituals. Available for short-term cover, seasonal placements, and product launch residencies.',
    services_offered: ['Advanced Facials', 'Body Rituals', 'Skincare Consultations', 'Aromatherapy', 'Hot Stone Massage'],
    product_houses: ['Biologique Recherche', '111SKIN', 'Natura Bissé', 'Dr Barbara Sturm'],
    duration: '1 week – 1 month',
    day_rate: 400,
    weekly_rate: 2000,
    monthly_rate: 7000,
    travel_availability: 'uk_and_europe',
    availability_start: '2026-05-15',
    approval_status: 'approved',
    is_featured: true,
    gallery_urls: [
      'https://images.pexels.com/photos/6187430/pexels-photo-6187430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/19641835/pexels-photo-19641835.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/4041391/pexels-photo-4041391.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/16249146/pexels-photo-16249146.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
    ],
  },
  {
    title: 'Holistic Wellness Practitioner & Retreat Leader',
    description: 'A holistic therapist with 10 years\' experience blending Eastern and Western wellness traditions. Trained in Traditional Chinese Medicine, reflexology, aromatherapy, and crystal healing. I\'ve designed and delivered wellness programmes for luxury Scottish resorts, country house hotels, and members\' clubs. I create immersive guest experiences combining treatments, workshops, and mindfulness sessions. ITEC, FHT, and IFA qualified.',
    services_offered: ['Reflexology', 'Aromatherapy', 'Crystal Healing', 'Sound Healing', 'Wellness Workshops', 'Mindfulness'],
    product_houses: ['ESPA', 'Comfort Zone', 'Wildsmith', 'Ila Spa'],
    duration: '2 weeks – 3 months',
    day_rate: 300,
    weekly_rate: 1500,
    monthly_rate: 5200,
    travel_availability: 'uk_only',
    availability_start: '2026-06-01',
    approval_status: 'approved',
    is_featured: false,
    gallery_urls: [
      'https://images.pexels.com/photos/19695969/pexels-photo-19695969.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/10894305/pexels-photo-10894305.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/34939747/pexels-photo-34939747.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
      'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
    ],
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
