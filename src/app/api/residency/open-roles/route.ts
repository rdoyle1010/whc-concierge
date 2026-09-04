import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'

// The other side of residency matching: live residency-flagged roles,
// scored for the signed-in specialist, so residency members see matched
// opportunities rather than waiting to be browsed.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Talent profile not found.' }, { status: 404 })

  const now = new Date().toISOString()
  const { data: jobs } = await admin.from('job_listings')
    .select('*')
    .eq('is_live', true)
    .eq('is_residency_role', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(40)
  if (!jobs?.length) return NextResponse.json({ roles: [] })

  const employerIds = Array.from(new Set(jobs.map(job => job.employer_id).filter(Boolean)))
  const { data: employers } = employerIds.length
    ? await admin.from('employer_profiles').select('id,company_name,property_name').in('id', employerIds)
    : { data: [] as any[] }
  const employerMap = new Map((employers || []).map(employer => [employer.id, employer]))

  const roles = jobs
    .map(job => {
      const result = calculateMatchScore(candidate, { ...job, title: job.job_title, required_product_houses: job.required_brands })
      if (result.hardStop) return null
      const employer = employerMap.get(job.employer_id)
      return {
        id: job.id,
        job_title: job.job_title,
        location: job.location,
        property_name: employer?.property_name || employer?.company_name || 'Luxury property',
        score: result.score,
      }
    })
    .filter((role): role is NonNullable<typeof role> => Boolean(role))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  return NextResponse.json({ roles })
}
