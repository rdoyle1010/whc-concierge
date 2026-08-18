import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

const JOB_FIELDS = `
  id,job_title,job_description,location,salary_min,salary_max,salary_display_text,job_type,contract_type,
  tier,posted_date,expires_at,is_live,required_skills,required_brands,required_qualifications,min_years_experience,
  required_systems,required_management_skills,required_role_level,location_postcode,radius_miles,insurance_required,
  preferred_business_skills,shift_pattern,offers_accommodation,is_agency_role,latitude,longitude,employer_id,
  employer_profiles(company_name,property_name,property_photos,tagline,review_score,review_count,star_rating)
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
  const { data, error } = await admin.from('job_listings')
    .select(JOB_FIELDS)
    .eq('is_live', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('posted_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Match roles query failed:', error.message)
    return NextResponse.json({ error: 'Could not load live roles.' }, { status: 500 })
  }
  return NextResponse.json({ rows: data || [] })
}
