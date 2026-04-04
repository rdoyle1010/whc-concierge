import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  const results: any[] = []

  // Update employer property_name
  await supabase.from('employer_profiles')
    .update({ property_name: 'Fairmont Hotel & Spa Cheshire' })
    .eq('company_name', 'Fairmont')

  // 1. Spa Manager → Spa & Wellness Operations Manager
  const { error: e1 } = await supabase.from('job_listings')
    .update({
      job_title: 'Spa & Wellness Operations Manager',
      job_description: 'The Spa & Wellness Operations Manager leads daily operational delivery of the Spa & Wellness facilities at Fairmont Cheshire, The Mere. Responsibilities include overseeing daily operations across treatment rooms, wet facilities, pool and gym, ensuring adherence to Fairmont brand standards, leading operational presence on the spa floor, managing guest escalations, supporting rota planning, overseeing stock control, and monitoring operational costs. Minimum 2 years experience in a luxury spa or wellness environment required.',
      required_role_level: 'Spa Manager',
      required_brands: ['ESPA', 'Elemis'],
      required_qualifications: ['NVQ Level 3', 'First Aid', 'COSHH'],
      salary_min: 35000,
      salary_max: 45000,
    })
    .eq('job_title', 'Spa Manager')
  results.push({ job: 'Spa Manager → Spa & Wellness Operations Manager', error: e1?.message || null })

  // 2. Senior Spa Therapist → Spa Therapist
  const { error: e2 } = await supabase.from('job_listings')
    .update({
      job_title: 'Spa Therapist',
      job_description: 'Deliver exceptional professional massage therapy and advanced face and body treatments at Fairmont Cheshire, The Mere. Perform Swedish, deep tissue, hot stone and aromatherapy treatments. Conduct thorough guest consultations, maintain immaculate treatment rooms, and provide exceptional customer service. NVQ Level 3 in Beauty Therapy or equivalent required. Minimum 1 year experience in a luxury spa or 5-star hospitality environment.',
      required_role_level: 'Senior Therapist',
      required_brands: ['ESPA', 'Elemis'],
      required_qualifications: ['NVQ Level 3', 'CIDESCO', 'CIBTAC', 'First Aid', 'COSHH'],
      salary_min: 26000,
      salary_max: 32000,
    })
    .eq('job_title', 'Senior Spa Therapist')
  results.push({ job: 'Senior Spa Therapist → Spa Therapist', error: e2?.message || null })

  // 3. Beauty Therapist → Spa Attendant
  const { error: e3 } = await supabase.from('job_listings')
    .update({
      job_title: 'Spa Attendant',
      job_description: 'Support delivery of an exceptional luxury spa experience by maintaining immaculate facilities at Fairmont Cheshire, The Mere. Maintain all spa, wellness and changing areas to a pristine 5-star standard, replenish towels, robes and amenities, prepare relaxation spaces and assist guests warmly and discreetly.',
      required_role_level: 'Apprentice',
      required_brands: [],
      required_qualifications: ['First Aid'],
      salary_min: 20000,
      salary_max: 24000,
    })
    .eq('job_title', 'Beauty Therapist')
  results.push({ job: 'Beauty Therapist → Spa Attendant', error: e3?.message || null })

  // 4. Spa Receptionist — update description
  const { error: e4 } = await supabase.from('job_listings')
    .update({
      job_description: 'The Spa Receptionist delivers a warm, seamless and luxurious welcome to all guests at Fairmont Cheshire, The Mere. Manage arrivals and departures, operate telephones professionally, maintain full knowledge of spa services, handle guest concerns, and maximise value by promoting spa services. 1-2 years experience in a spa or luxury front-of-house role preferred.',
      required_role_level: 'Receptionist',
      required_qualifications: ['First Aid'],
      salary_min: 22000,
      salary_max: 26000,
    })
    .eq('job_title', 'Spa Receptionist')
  results.push({ job: 'Spa Receptionist', error: e4?.message || null })

  return NextResponse.json({ results })
}
