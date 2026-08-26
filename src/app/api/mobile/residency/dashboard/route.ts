import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const role = account?.role === 'employer' ? 'employer' : 'talent'

    if (role === 'employer') {
      const { data: employer } = await admin.from('employer_profiles')
        .select('id,user_id,property_name,company_name,approval_status').eq('user_id', user.id).maybeSingle()
      if (!employer) return NextResponse.json({ role, employer: null, bookings: [] })

      const { data: bookings, error } = await admin.from('residency_bookings').select('*')
        .eq('employer_id', employer.id).order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: 'Could not load Residency bookings.' }, { status: 500 })

      const candidateIds = Array.from(new Set((bookings || []).map((row: any) => row.candidate_id).filter(Boolean)))
      const profileIds = Array.from(new Set((bookings || []).map((row: any) => row.residency_profile_id).filter(Boolean)))
      const [{ data: candidates }, { data: residencyProfiles }] = await Promise.all([
        candidateIds.length ? admin.from('candidate_profiles').select('id,full_name,user_id').in('id', candidateIds) : Promise.resolve({ data: [] as any[] }),
        profileIds.length ? admin.from('residency_profiles').select('id,primary_specialism').in('id', profileIds) : Promise.resolve({ data: [] as any[] }),
      ])
      const candidateMap = new Map((candidates || []).map((row: any) => [row.id, row]))
      const residencyMap = new Map((residencyProfiles || []).map((row: any) => [row.id, row]))

      return NextResponse.json({
        role,
        employer: {
          propertyName: employer.property_name || employer.company_name || '',
          approvalStatus: employer.approval_status || null,
        },
        bookings: (bookings || []).map((row: any) => ({
          ...row,
          candidate_name: candidateMap.get(row.candidate_id)?.full_name || 'Residency specialist',
          candidate_user_id: candidateMap.get(row.candidate_id)?.user_id || null,
          primary_specialism: residencyMap.get(row.residency_profile_id)?.primary_specialism || null,
        })),
      })
    }

    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,user_id,full_name,residency_member,residency_subscription_status').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ role, candidate: null, bookings: [] })

    const { data: bookings, error } = await admin.from('residency_bookings').select('*')
      .eq('candidate_id', candidate.id).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Could not load Residency offers.' }, { status: 500 })

    const employerIds = Array.from(new Set((bookings || []).map((row: any) => row.employer_id).filter(Boolean)))
    const { data: employers } = employerIds.length
      ? await admin.from('employer_profiles').select('id,user_id,property_name,company_name,location').in('id', employerIds)
      : { data: [] as any[] }
    const employerMap = new Map((employers || []).map((row: any) => [row.id, row]))

    const { data: residencyProfile } = await admin.from('residency_profiles')
      .select('id,approval_status,primary_specialism,is_featured').eq('candidate_profile_id', candidate.id).maybeSingle()

    return NextResponse.json({
      role,
      candidate: {
        residencyMember: candidate.residency_member === true,
        subscriptionStatus: candidate.residency_subscription_status || null,
        listing: residencyProfile || null,
      },
      bookings: (bookings || []).map((row: any) => ({
        ...row,
        employer_name: employerMap.get(row.employer_id)?.property_name || employerMap.get(row.employer_id)?.company_name || row.property_name || 'Property',
        employer_location: employerMap.get(row.employer_id)?.location || null,
        employer_user_id: employerMap.get(row.employer_id)?.user_id || null,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not load Residency.' }, { status: 500 })
  }
}
