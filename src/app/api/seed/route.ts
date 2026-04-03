import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SEED_JOBS = [
  {
    title: 'Senior Spa Therapist',
    description: 'Join our award-winning spa team delivering world-class ESPA and Elemis treatments to discerning guests at this iconic Cheshire property. You will deliver a full range of face and body treatments, maintain exceptional standards, and contribute to the spa\'s five-star reputation.',
    location: 'Knutsford, Cheshire',
    location_postcode: 'WA16 0SU',
    job_type: 'Full-time',
    contract_type: 'permanent',
    required_role_level: 'Senior Therapist',
    salary_min: 28000, salary_max: 34000,
    required_product_houses: ['ESPA', 'Elemis'],
    required_qualifications: ['NVQ Level 3 Beauty', 'CIDESCO'],
    requirements: ['NVQ Level 3 or equivalent', 'CIDESCO or CIBTAC qualification', '3+ years luxury spa experience', 'ESPA or Elemis trained preferred'],
    benefits: ['Staff meals on duty', 'Use of spa facilities', 'Product discounts', 'Career development programme', 'Uniform provided'],
    tier: 'Platinum', status: 'active',
    insurance_required: false, is_agency_role: false,
  },
  {
    title: 'Spa Manager',
    description: 'Lead the spa operations at Fairmont, overseeing a team of 15+ therapists and reception staff. Full P&L responsibility, treatment menu development, team training, and guest experience management. A rare leadership opportunity at one of the UK\'s finest wellness destinations.',
    location: 'Knutsford, Cheshire',
    location_postcode: 'WA16 0SU',
    job_type: 'Full-time',
    contract_type: 'permanent',
    required_role_level: 'Spa Manager',
    salary_min: 42000, salary_max: 52000,
    required_product_houses: ['ESPA', 'Elemis', 'Comfort Zone'],
    required_qualifications: ['NVQ Level 4 Beauty'],
    requirements: ['5+ years spa management experience', 'Revenue and P&L management', 'Team leadership of 10+ staff', 'Strong commercial awareness'],
    benefits: ['Competitive salary + bonus', 'Private healthcare', 'Relocation support available', 'Leadership development', 'Complimentary hotel stays'],
    tier: 'Platinum', status: 'active',
    insurance_required: false, is_agency_role: false,
  },
  {
    title: 'Spa Therapist — Agency Cover',
    description: 'We are seeking experienced spa therapists for agency cover shifts at our Cheshire property. Flexible shifts available including weekends. Must hold valid professional insurance and be ESPA trained or willing to complete brand induction.',
    location: 'Knutsford, Cheshire',
    location_postcode: 'WA16 0SU',
    job_type: 'Freelance',
    contract_type: 'agency_cover',
    required_role_level: 'Therapist',
    salary_min: 150, salary_max: 200,
    required_product_houses: ['ESPA'],
    required_qualifications: ['NVQ Level 3 Beauty'],
    requirements: ['Valid professional insurance', 'NVQ Level 3 or equivalent', 'ESPA trained preferred', 'Own transport recommended'],
    benefits: ['Competitive day rates', 'Flexible scheduling', 'Use of spa facilities on shift', 'Ongoing work available'],
    tier: 'Gold', status: 'active',
    insurance_required: true, is_agency_role: true,
  },
  {
    title: 'Beauty Therapist',
    description: 'Deliver premium beauty treatments including facials, manicures, pedicures, waxing and tinting. You will work with Elemis and Dermalogica product houses in a luxurious five-star environment.',
    location: 'Knutsford, Cheshire',
    location_postcode: 'WA16 0SU',
    job_type: 'Full-time',
    contract_type: 'permanent',
    required_role_level: 'Beauty Therapist',
    salary_min: 23000, salary_max: 27000,
    required_product_houses: ['Elemis', 'Dermalogica'],
    required_qualifications: ['NVQ Level 2 Beauty'],
    requirements: ['NVQ Level 2 Beauty Therapy', 'Elemis or Dermalogica experience preferred', 'Excellent attention to detail'],
    benefits: ['Staff meals', 'Uniform provided', 'Product discounts', 'Training opportunities'],
    tier: 'Silver', status: 'active',
    insurance_required: false, is_agency_role: false,
  },
  {
    title: 'Spa Receptionist',
    description: 'Be the first point of contact for our spa guests. Manage bookings, handle enquiries, process payments and ensure every guest receives a warm five-star welcome. Experience with Spa Booker or similar booking systems preferred.',
    location: 'Knutsford, Cheshire',
    location_postcode: 'WA16 0SU',
    job_type: 'Full-time',
    contract_type: 'permanent',
    required_role_level: 'Receptionist',
    salary_min: 22000, salary_max: 25000,
    required_product_houses: [],
    required_qualifications: [],
    required_systems: ['Spa Booker'],
    requirements: ['Previous reception or front-of-house experience', 'Spa Booker or similar system experience preferred', 'Excellent communication skills', 'Smart presentation'],
    benefits: ['Staff meals', 'Use of spa facilities', 'Career progression into spa management', 'Training provided'],
    tier: 'Bronze', status: 'active',
    insurance_required: false, is_agency_role: false,
  },
]

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Check if we already have seed data
    const { count } = await supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('location_postcode', 'WA16 0SU')
    if (count && count >= 5) {
      return NextResponse.json({ message: 'Seed data already exists', count })
    }

    // Need an employer to attach jobs to — create Fairmont if not exists
    let employerId: string | null = null
    const { data: existing } = await supabase.from('employer_profiles').select('id').eq('company_name', 'Fairmont').single()

    if (existing) {
      employerId = existing.id
    } else {
      const { data: newEmp } = await supabase.from('employer_profiles').insert({
        company_name: 'Fairmont',
        contact_name: 'Spa Director',
        location: 'Knutsford, Cheshire',
        postcode: 'WA16 0SU',
        company_type: 'Hotel',
        product_houses_used: ['ESPA', 'Elemis', 'Comfort Zone'],
        systems_used: ['Spa Booker'],
        approval_status: 'approved',
        description: 'Fairmont is a luxury hotel and spa in the heart of the Cheshire countryside.',
      }).select('id').single()
      employerId = newEmp?.id || null
    }

    if (!employerId) {
      return NextResponse.json({ error: 'Could not create employer' }, { status: 500 })
    }

    // Insert jobs
    const jobs = SEED_JOBS.map(j => ({ ...j, employer_id: employerId }))
    const { error } = await supabase.from('job_listings').insert(jobs)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, count: jobs.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return POST(new Request('http://localhost') as any)
}
