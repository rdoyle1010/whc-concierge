import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

const JOB_FIELDS = `
  id,job_title,job_description,location,salary_min,salary_max,salary_display_text,job_type,contract_type,
  tier,posted_date,expires_at,is_live,required_skills,required_brands,required_qualifications,min_years_experience,
  required_systems,required_management_skills,required_role_level,location_postcode,radius_miles,insurance_required,
  preferred_business_skills,shift_pattern,offers_accommodation,is_agency_role,latitude,longitude,employer_id
`

const EMPLOYER_FIELDS = `
  id,company_name,property_name,property_photos,tagline,review_score,review_count,star_rating
`

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* session refresh is handled by proxy */ },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'candidate') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date().toISOString()
  const { data: jobs, error: jobsError } = await admin.from('job_listings')
    .select(JOB_FIELDS)
    .eq('is_live', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('posted_date', { ascending: false })
    .limit(100)

  if (jobsError) {
    console.error('Match jobs query failed:', jobsError.message)
    return NextResponse.json({ error: 'Could not load live roles.' }, { status: 500 })
  }

  const employerIds = Array.from(new Set((jobs || []).map((job: any) => job.employer_id).filter(Boolean)))
  let employerById = new Map<string, any>()

  if (employerIds.length > 0) {
    const { data: employers, error: employersError } = await admin.from('employer_profiles')
      .select(EMPLOYER_FIELDS)
      .in('id', employerIds)

    if (employersError) {
      console.error('Match employers query failed:', employersError.message)
    } else {
      employerById = new Map((employers || []).map((employer: any) => [employer.id, employer]))
    }
  }

  const rows = (jobs || []).map((job: any) => ({
    ...job,
    employer_profiles: employerById.get(job.employer_id) || null,
  }))

  return NextResponse.json({ rows })
}
