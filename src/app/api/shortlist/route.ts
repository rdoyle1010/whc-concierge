import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'

async function getEmployerProfile() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin.from('employer_profiles').select('id, user_id, property_name, company_name').eq('user_id', user.id).single()
  return data
}

export async function GET() {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('shortlisted_candidates')
    .select('*, candidate_profiles(id, user_id, full_name, headline, role_level, location, services_offered, experience_years, profile_image_url, review_score), job_listings(id, job_title)')
    .eq('employer_id', profile.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ shortlisted: data || [] })
}

export async function POST(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { candidateId, jobId, notes } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('shortlisted_candidates').insert({
    employer_id: profile.id,
    candidate_id: candidateId,
    job_id: jobId || null,
    notes: notes || null,
  })

  if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })

  // Shortlisting IS the employer's "yes" - record it as a right-swipe and run
  // mutual-match detection, otherwise matches can never be created (the
  // Shortlist button replaced the swipe UI but the matcher watched for swipes).
  let matched = false
  let matchedJobTitle = ''
  let candidateName = ''
  try {
    await admin.from('swipes').insert({
      swiper_id: profile.user_id, swiper_type: 'employer', target_id: candidateId, target_type: 'candidate', action: 'right',
    })

    const { data: cand } = await admin
      .from('candidate_profiles')
      .select('id, user_id, full_name')
      .eq('id', candidateId)
      .maybeSingle()

    if (cand) {
      candidateName = cand.full_name || ''
      const { data: myJobs } = await admin.from('job_listings').select('id, job_title').eq('employer_id', profile.id)
      const jobIds = (myJobs || []).map((j: any) => j.id)

      if (jobIds.length > 0 && cand.user_id) {
        // Mutual if the candidate right-swiped one of my roles OR already applied
        const [{ data: theirSwipes }, { data: theirApps }] = await Promise.all([
          admin.from('swipes').select('target_id')
            .eq('swiper_id', cand.user_id).eq('swiper_type', 'candidate')
            .eq('target_type', 'job').eq('action', 'right').in('target_id', jobIds),
          admin.from('applications').select('job_id').eq('candidate_id', cand.id).in('job_id', jobIds),
        ])
        const mutualJobIds = Array.from(new Set([
          ...(theirSwipes || []).map((r: any) => r.target_id),
          ...(theirApps || []).map((r: any) => r.job_id),
        ].filter(Boolean)))

        if (mutualJobIds.length > 0) {
          const employerName = profile.property_name || profile.company_name || 'An employer'
          for (const jid of mutualJobIds) {
            const job = (myJobs || []).find((j: any) => j.id === jid)
            if (!job) continue
            if (!matchedJobTitle) matchedJobTitle = job.job_title
            const { data: existingMatch } = await admin.from('matches').select('id')
              .eq('candidate_id', cand.id).eq('job_id', job.id).maybeSingle()
            if (!existingMatch) {
              await admin.from('matches').insert({
                candidate_id: cand.id, employer_id: profile.id, job_id: job.id, score: null, status: 'active',
              })
              matched = true
            }
          }

          if (matched) {
            await admin.from('messages').insert({
              sender_id: profile.user_id, recipient_id: cand.user_id,
              content: `It's a match! You both said yes to ${matchedJobTitle} at ${employerName}. Say hello and take it from here.`,
              read: false,
            })
            await createNotification(cand.user_id, 'new_match', "It's a match!",
              `${employerName} wants to talk about ${matchedJobTitle}. Start the conversation.`, '/talent/messages')
            await createNotification(profile.user_id, 'new_match', "It's a match!",
              `${cand.full_name || 'A candidate'} already liked ${matchedJobTitle}. Start the conversation.`, '/employer/messages')
          }
        }
      }
    }
  } catch (e: any) {
    console.error('Shortlist match detection failed:', e?.message)
  }

  return NextResponse.json({ success: true, already: error?.code === '23505', matched, candidateName, jobTitle: matchedJobTitle })
}

export async function PATCH(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('shortlisted_candidates')
    .update({ notes })
    .eq('id', id)
    .eq('employer_id', profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const profile = await getEmployerProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('shortlisted_candidates').delete().eq('id', id).eq('employer_id', profile.id)
  return NextResponse.json({ success: true })
}
