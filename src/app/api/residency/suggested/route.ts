import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { calculateMatchScore } from '@/lib/matching'
import { toPublicResidencyProfile } from '@/lib/residency-public'

// Matching for residencies: score every approved residency specialist
// against a residency-flagged job, so properties get ranked suggestions
// instead of a browse-only directory. Identity stays protected - the same
// sanitised public shape as the directory, with a match score attached.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const jobId = String(req.nextUrl.searchParams.get('jobId') || '')
  if (!jobId) return NextResponse.json({ error: 'Job is required.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const { data: job } = await admin.from('job_listings').select('*').eq('id', jobId).maybeSingle()
  if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })

  const { data: listings } = await admin.from('residency_profiles')
    .select('*')
    .eq('approval_status', 'approved')
    .limit(100)
  if (!listings?.length) return NextResponse.json({ suggestions: [] })

  const candidateIds = Array.from(new Set(listings.map(listing => listing.candidate_profile_id).filter(Boolean)))
  const { data: candidates } = candidateIds.length
    ? await admin.from('candidate_profiles').select('*').in('id', candidateIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map(candidate => [candidate.id, candidate]))

  const jobContext = { ...job, title: job.job_title, required_product_houses: job.required_brands }
  const suggestions = listings
    .map(listing => {
      const candidate = candidateMap.get(listing.candidate_profile_id)
      if (!candidate) return null
      const result = calculateMatchScore(candidate, jobContext)
      if (result.hardStop) return null
      return { listing, score: result.score }
    })
    .filter((entry): entry is { listing: any; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ listing, score }) => ({ ...toPublicResidencyProfile(listing), match_score: score }))

  return NextResponse.json({ suggestions })
}
