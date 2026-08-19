import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'

function extractText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

async function generate(input: string) {
  if (!OPENAI_API_KEY) throw new Error('AI is not configured yet.')
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, reasoning: { effort: 'low' }, input, max_output_tokens: 700 }),
  })
  if (!response.ok) {
    console.error('Recruitment communication AI failed:', response.status, (await response.text().catch(() => '')).slice(0, 400))
    throw new Error('The AI assistant is temporarily unavailable. Please try again.')
  }
  return extractText(await response.json()).trim()
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { applicationId, type } = await req.json()
    if (!applicationId || !['shortlist', 'not_progressing', 'offer'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: employer } = await admin.from('employer_profiles')
      .select('id,user_id,company_name,property_name,tagline')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })

    const { data: application } = await admin.from('applications')
      .select('id,candidate_id,role_id,job_id,status,cover_letter,cover_note')
      .eq('id', applicationId)
      .maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

    const jobId = application.role_id || application.job_id
    const [{ data: job }, { data: candidate }] = await Promise.all([
      admin.from('job_listings').select('id,job_title,employer_id').eq('id', jobId).maybeSingle(),
      admin.from('candidate_profiles').select('id,full_name,headline,role_level,experience_years,qualifications,product_houses,systems_experience,treatment_skills,services_offered').eq('id', application.candidate_id).maybeSingle(),
    ])
    if (!job || job.employer_id !== employer.id || !candidate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const property = employer.property_name || employer.company_name || 'the property'
    const firstName = (candidate.full_name || 'there').split(' ')[0]
    const task = type === 'shortlist'
      ? `Draft a warm, concise note telling ${firstName} they have been shortlisted and that the property would like to take their application forward. Say that interview details will follow. Do not promise the job.`
      : type === 'offer'
        ? `Draft a warm, celebratory message telling ${firstName} that ${property} would like to offer them the role of ${job.job_title}. Make clear that the formal offer letter or contract containing salary, start date and full employment terms will be sent separately by the employer. Do not invent salary, start date, benefits or contractual terms.`
        : `Draft a warm, respectful note thanking ${firstName} for applying and explaining that the property will not be taking this application forward. Keep it gracious, never give invented reasons, and encourage them to keep their Spa Platform profile active for future opportunities.`

    const prompt = `You write recruitment communications for Spa Platform, a premium UK spa, wellness and hospitality talent platform.

${task}

Role: ${job.job_title}
Property: ${property}
Candidate: ${candidate.full_name}
Candidate profile evidence: ${JSON.stringify(candidate)}
Candidate covering letter: ${JSON.stringify(application.cover_letter || application.cover_note || '')}

Rules:
- UK English.
- 90-160 words.
- Human, polished and warm, not corporate or generic.
- Never mention AI, match percentages or internal scoring.
- Never invent facts, pay, dates, benefits, reasons or contractual terms.
- Start with "Hi ${firstName}," and end with "Kind regards," followed by ${property}.
- Return only the message body, no subject line and no markdown.`

    const note = await generate(prompt)
    return NextResponse.json({ note: note.slice(0, 3000), model: MODEL })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'AI assistant unavailable' }, { status: 500 })
  }
}
