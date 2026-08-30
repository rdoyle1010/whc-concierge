import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (account?.role !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: employer } = await admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!employer) return NextResponse.json({ stats: {}, jobs: [], funnel: {}, topSkills: [] })

  const { data: jobs, error: jobsError } = await admin.from('job_listings').select('*').eq('employer_id', employer.id).order('posted_date', { ascending: false })
  if (jobsError) return NextResponse.json({ error: 'Could not load job analytics.' }, { status: 500 })
  const allJobs = jobs || []
  if (!allJobs.length) return NextResponse.json({ stats: { activeListings: 0, totalAppsMonth: 0, totalAppsLastMonth: 0, avgMatch: 0, avgDaysToFirst: 0 }, jobs: [], funnel: { total: 0 }, topSkills: [] })

  const jobIds = allJobs.map(job => job.id)
  const { data: apps, error: appsError } = await admin.from('applications').select('*').in('role_id', jobIds).neq('status', 'draft')
  if (appsError) return NextResponse.json({ error: 'Could not load application analytics.' }, { status: 500 })
  const applicationRows = apps || []

  const candidateIds = Array.from(new Set(applicationRows.map((app: any) => app.candidate_id).filter(Boolean))) as string[]
  const { data: candidates } = candidateIds.length
    ? await admin.from('candidate_profiles').select('id,services_offered,treatment_skills').in('id', candidateIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map((candidate: any) => [candidate.id, candidate]))

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = applicationRows.filter((app: any) => new Date(app.created_at) >= thisMonthStart)
  const lastMonth = applicationRows.filter((app: any) => {
    const date = new Date(app.created_at)
    return date >= lastMonthStart && date < thisMonthStart
  })
  const scores = applicationRows.map((app: any) => Number(app.match_score || 0)).filter((score: number) => score > 0)
  const avgMatch = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0

  const firstDays: number[] = []
  for (const job of allJobs) {
    const jobApps = applicationRows.filter((app: any) => app.role_id === job.id).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    if (jobApps.length && job.posted_date) firstDays.push(Math.max(0, Math.round((new Date(jobApps[0].created_at).getTime() - new Date(job.posted_date).getTime()) / 86400000)))
  }

  const rows = allJobs.map((job: any) => {
    const jobApps = applicationRows.filter((app: any) => app.role_id === job.id)
    const jobScores = jobApps.map((app: any) => Number(app.match_score || 0)).filter((score: number) => score > 0)
    const posted = job.posted_date ? new Date(job.posted_date) : new Date(job.created_at)
    return {
      id: job.id,
      title: job.job_title || job.title || 'Untitled',
      tier: job.tier || 'Standard',
      daysLive: Math.max(0, Math.round((now.getTime() - posted.getTime()) / 86400000)),
      totalApps: jobApps.length,
      shortlisted: jobApps.filter((app: any) => app.status === 'shortlisted' || app.status === 'accepted').length,
      avgScore: jobScores.length ? Math.round(jobScores.reduce((a: number, b: number) => a + b, 0) / jobScores.length) : 0,
      status: job.is_live ? 'live' : job.status === 'filled' ? 'filled' : 'closed',
    }
  })

  const funnel: Record<string, number> = { total: applicationRows.length }
  for (const app of applicationRows as any[]) funnel[app.status] = (funnel[app.status] || 0) + 1

  const skillCounts: Record<string, number> = {}
  for (const app of applicationRows as any[]) {
    const candidate: any = candidateMap.get(app.candidate_id)
    const skills = candidate?.services_offered || candidate?.treatment_skills || []
    for (const skill of skills) skillCounts[String(skill)] = (skillCounts[String(skill)] || 0) + 1
  }

  return NextResponse.json({
    stats: {
      activeListings: allJobs.filter(job => job.is_live).length,
      totalAppsMonth: thisMonth.length,
      totalAppsLastMonth: lastMonth.length,
      avgMatch,
      avgDaysToFirst: firstDays.length ? Math.round(firstDays.reduce((a, b) => a + b, 0) / firstDays.length) : 0,
    },
    jobs: rows,
    funnel,
    topSkills: Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([skill]) => skill),
  })
}
