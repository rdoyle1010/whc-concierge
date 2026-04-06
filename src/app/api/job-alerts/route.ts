import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateMatchScore } from '@/lib/matching'
import { jobAlertEmailHtml } from '@/lib/job-alert-email-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const supabase = createAdminClient()

    // Get the job with employer info
    const { data: job } = await supabase
      .from('job_listings')
      .select('*, employer_profiles(company_name, property_name)')
      .eq('id', jobId)
      .single()

    if (!job || !job.is_live) return NextResponse.json({ error: 'Job not found or not live' }, { status: 404 })

    const propertyName = job.employer_profiles?.property_name || job.employer_profiles?.company_name || ''
    const jobTitle = job.job_title || job.title || ''
    const salary = job.salary_min && job.salary_max
      ? `£${Math.round(job.salary_min / 1000)}k–£${Math.round(job.salary_max / 1000)}k`
      : undefined

    // Get all candidates with job alerts enabled
    const { data: candidates } = await supabase
      .from('candidate_profiles')
      .select('*, auth_email:user_id')
      .eq('job_alerts_enabled', true)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No candidates with alerts enabled' })
    }

    // Get emails from auth.users for all candidates
    const userIds = candidates.map(c => c.user_id).filter(Boolean)
    const emailMap = new Map<string, string>()
    for (const uid of userIds) {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid)
      if (authUser?.user?.email) emailMap.set(uid, authUser.user.email)
    }

    let sent = 0
    const errors: string[] = []

    for (const candidate of candidates) {
      // Skip if no email
      const email = emailMap.get(candidate.user_id)
      if (!email) continue

      // Only process instant alerts for MVP
      if (candidate.job_alerts_frequency && candidate.job_alerts_frequency !== 'instant') continue

      // Calculate match score
      const result = calculateMatchScore(candidate, job)
      if (result.hardStop) continue

      // Check against candidate's minimum score threshold
      const minScore = candidate.job_alerts_min_score || 60
      if (result.score < minScore) continue

      // Send email
      const firstName = candidate.full_name?.split(' ')[0] || 'there'
      const html = jobAlertEmailHtml({
        firstName, jobTitle, propertyName,
        matchScore: result.score, location: job.location, salary,
      })

      if (!RESEND_API_KEY) {
        console.log(`[Job alert skipped] To: ${email}, Job: ${jobTitle}, Score: ${result.score}%`)
        sent++
        continue
      }

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL, to: email,
            subject: `New role matching your profile — ${jobTitle} at ${propertyName}, ${result.score}% match`,
            html,
          }),
        })
        sent++
      } catch (err) {
        errors.push(`Failed to send to ${email}`)
      }
    }

    return NextResponse.json({ sent, total: candidates.length, errors: errors.length > 0 ? errors : undefined })
  } catch (error: any) {
    console.error('Job alerts error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
