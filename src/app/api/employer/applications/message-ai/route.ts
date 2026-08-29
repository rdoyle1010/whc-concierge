import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_APPLICATION_MODEL = process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'

type Intent = 'shortlist' | 'interview' | 'decline' | 'offer'

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

function stageError(intent: Intent, status: string, completedInterviews: number) {
  if (intent === 'shortlist' && !['pending', 'reviewed', 'shortlisted'].includes(status)) {
    return 'A shortlist message is only available while reviewing an application.'
  }
  if (intent === 'interview' && !['shortlisted', 'interview'].includes(status)) {
    return 'Shortlist the candidate before creating an interview message.'
  }
  if (intent === 'offer' && (!['interview', 'offered'].includes(status) || completedInterviews < 1)) {
    return 'Complete at least one confirmed interview before creating an offer message.'
  }
  if (intent === 'decline' && !['pending', 'reviewed', 'shortlisted', 'interview'].includes(status)) {
    return 'This application is no longer at a stage where a decline message can be created.'
  }
  return null
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const intent = String(body.intent || '') as Intent
    if (!applicationId || !['shortlist', 'interview', 'decline', 'offer'].includes(intent)) {
      return NextResponse.json({ error: 'Choose a valid candidate message type.' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 })

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,company_name,property_name,contact_name')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer account not found.' }, { status: 404 })

    const { data: application } = await admin.from('applications')
      .select('id,status,match_score,candidate_profiles(full_name,headline,role_level,bio,location),job_listings(id,job_title,location,employer_id)')
      .eq('id', applicationId)
      .maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 })

    const job: any = Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings
    const candidate: any = Array.isArray(application.candidate_profiles) ? application.candidate_profiles[0] : application.candidate_profiles
    if (!job || job.employer_id !== employer.id) return NextResponse.json({ error: 'This application does not belong to your property.' }, { status: 403 })

    const { count: completedInterviewCount } = await admin.from('application_interviews')
      .select('id', { count: 'exact', head: true })
      .eq('application_id', application.id)
      .eq('status', 'completed')
    const stageProblem = stageError(intent, String(application.status || ''), completedInterviewCount || 0)
    if (stageProblem) return NextResponse.json({ error: stageProblem }, { status: 409 })

    const actionInstruction = intent === 'shortlist'
      ? 'Write a warm message telling the candidate they have been shortlisted and that the property would like to progress them to the interview stage.'
      : intent === 'interview'
        ? 'Write a warm interview invitation introduction. Explain that the property would like to meet the candidate and that they will be asked to choose from the interview times supplied separately in the platform.'
        : intent === 'decline'
          ? 'Write a respectful, kind decline message. Do not invent a reason. Thank the candidate for their time and interest and leave the relationship positive.'
          : 'Write a warm job-offer message after a completed interview. Tell the candidate the property would like to offer them the role and that they can review and respond to the offer through the platform.'

    const prompt = `You are the WHC Concierge employer messaging assistant for luxury spa, wellness and hospitality recruitment in the UK.

${actionInstruction}

Use only the supplied facts. Never invent interview feedback, salary, benefits, start dates, qualifications, personal details or reasons for a decision. Do not mention AI or a match percentage. Keep the tone polished, warm, human and concise. UK English. Around 60-110 words. Address the candidate by first name if supplied. Sign off from the property/team, not from an invented named person.

Property: ${JSON.stringify({ name: employer.property_name || employer.company_name || 'the property' })}
Candidate: ${JSON.stringify(candidate || {})}
Role: ${JSON.stringify(job || {})}
Application stage: ${JSON.stringify(application.status || '')}
Completed interviews: ${completedInterviewCount || 0}
Action: ${intent}

Return only the message text, with no heading, quotation marks or markdown.`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OPENAI_APPLICATION_MODEL,
        reasoning: { effort: 'low' },
        input: prompt,
        max_output_tokens: 350,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`OpenAI employer message failed ${response.status}:`, detail.slice(0, 400))
      return NextResponse.json({ error: 'The AI message assistant is temporarily unavailable.' }, { status: 502 })
    }

    const payload = await response.json()
    const message = extractResponseText(payload).trim().slice(0, 1600)
    if (!message) return NextResponse.json({ error: 'The AI assistant did not return a message.' }, { status: 502 })

    return NextResponse.json({ message, intent, model: OPENAI_APPLICATION_MODEL })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'AI message assistant unavailable.' }, { status: 500 })
  }
}
