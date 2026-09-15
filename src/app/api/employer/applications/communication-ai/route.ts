import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { HOUSE_RULES } from '@/lib/house-style'
import { askForText, AI_MODEL } from '@/lib/ai'

// Twenty-six seconds, and eighteen for the model inside it.
//
// This route declared neither, so it inherited the platform default of ten
// and the model was given no limit at all. A reasoning model asked to rewrite
// a job description does not reliably answer in ten seconds, so the function
// was killed mid-request and returned an error page rather than JSON. On
// screen that is a writing assistant that "just does not work sometimes",
// which is the hardest kind of broken to report and the easiest to live with.
export const maxDuration = 26



// One client, one key, one bill. See src/lib/ai.ts for why there used to be
// two, and what the six hand-written fetch calls cost in errors nobody could
// read.
async function generate(input: string) {
  const result = await askForText({
    label: 'employer communication',
    system: HOUSE_RULES,
    prompt: input,
    maxTokens: 700,
  })
  if (!result.ok) throw new Error(result.error)
  return result.text
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

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
    if (!job || job.employer_id !== employer.id || !candidate) return NextResponse.json({ error: 'You do not have access to that. If that looks wrong, sign in with the account that does.' }, { status: 403 })

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
    return NextResponse.json({ note: note.slice(0, 3000), model: AI_MODEL })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'AI assistant unavailable' }, { status: 500 })
  }
}
