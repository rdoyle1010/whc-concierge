import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_APPLICATION_MODEL = process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

async function generateJson(input: string) {
  if (!OPENAI_API_KEY) throw new Error('AI is not configured yet. Add OPENAI_API_KEY to the production environment.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_APPLICATION_MODEL,
      reasoning: { effort: 'low' },
      input,
      max_output_tokens: 1800,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error(`OpenAI application assistant failed ${response.status}:`, detail.slice(0, 500))
    throw new Error('The AI assistant is temporarily unavailable. Please try again.')
  }

  const payload = await response.json()
  const text = extractResponseText(payload).trim()
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const applicationId = String(body.applicationId || '')
    const mode = ['analyse', 'draft', 'improve'].includes(body.mode) ? body.mode : 'analyse'
    const currentLetter = String(body.currentLetter || '').slice(0, 5000)
    if (!applicationId) return NextResponse.json({ error: 'Missing application' }, { status: 400 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,full_name,headline,role_level,experience_years,years_experience,qualifications,treatment_skills,services_offered,product_houses,systems_experience,bio,location,shift_preferences,transport_method,max_commute')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

    const { data: application } = await admin.from('applications')
      .select('id,status,match_score,cover_letter,cover_note,job_id,role_id,job_listings(id,job_title,job_description,location,contract_type,job_type,required_role_level,required_skills,required_brands,required_qualifications,min_years_experience,preferred_business_skills,required_systems,shift_pattern,offers_accommodation,employer_id)')
      .eq('id', applicationId)
      .eq('candidate_id', candidate.id)
      .maybeSingle()
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (application.status !== 'draft') return NextResponse.json({ error: 'AI writing help is available before an application is sent.' }, { status: 400 })

    const job: any = Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings
    if (!job) return NextResponse.json({ error: 'Role not found' }, { status: 404 })

    const { data: employer } = await admin.from('employer_profiles')
      .select('company_name,property_name,tagline')
      .eq('id', job.employer_id)
      .maybeSingle()

    const propertyName = employer?.property_name || employer?.company_name || 'the property'
    const candidateName = candidate.full_name || 'Candidate'
    const task = mode === 'draft'
      ? 'Write a complete polished covering letter tailored to this role.'
      : mode === 'improve'
        ? 'Improve the candidate\'s current covering letter while preserving their meaning and factual accuracy. Return a complete letter, not just the body.'
        : 'Analyse the application and identify its strongest evidence and any genuine gaps the candidate should consider addressing.'

    const prompt = `You are the WHC Concierge AI Application Assistant for luxury spa, wellness and hospitality professionals in the UK.

Your job is to help the candidate present their OWN verified experience clearly. Never invent qualifications, employers, brands, skills, experience, availability or achievements. Never infer protected characteristics. Do not make hiring decisions or predict whether the employer will hire them.

${task}

Return ONLY valid JSON in this exact shape:
{
  "summary": "1-2 sentence factual application assessment",
  "strengths": ["up to 4 concise strengths grounded in supplied data"],
  "gaps": ["up to 3 factual gaps or profile items not evidenced; phrase constructively"],
  "covering_letter": "a complete UK English covering letter of around 180-260 words, or an empty string when mode is analyse and no letter is requested"
}

Candidate profile:
${JSON.stringify(candidate)}

Role:
${JSON.stringify(job)}

Property:
${JSON.stringify({ name: propertyName, tagline: employer?.tagline || '' })}

Saved match score: ${application.match_score ?? 'not recorded'}
Current covering letter: ${JSON.stringify(currentLetter || application.cover_letter || application.cover_note || '')}
Mode: ${mode}

Covering-letter format rules when mode is draft or improve:
- Begin with a greeting on its own line. If no named hiring contact is supplied, use "Dear Hiring Team,". Never invent a person's name.
- Use 3-5 short, natural paragraphs.
- End with a courteous closing such as "Kind regards," followed on the next line by the candidate's real name: ${JSON.stringify(candidateName)}.
- The returned covering_letter must include the greeting and sign-off, not only the middle paragraphs.

Style rules: sophisticated but natural UK English; no clichés such as 'I am writing to express my interest'; no exaggerated claims; do not mention AI; do not mention a match percentage in the letter; keep the candidate's voice professional and human.`

    const result = await generateJson(prompt)
    return NextResponse.json({
      summary: String(result.summary || ''),
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 4).map(String) : [],
      gaps: Array.isArray(result.gaps) ? result.gaps.slice(0, 3).map(String) : [],
      covering_letter: String(result.covering_letter || '').slice(0, 5000),
      model: OPENAI_APPLICATION_MODEL,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'AI assistant unavailable' }, { status: 500 })
  }
}
