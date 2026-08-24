import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const INTERVIEW_MODEL = process.env.OPENAI_INTERVIEW_MODEL || process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'
const MAX_CV_SIZE = 10 * 1024 * 1024

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

async function generateJson(input: string, maxOutputTokens = 3200) {
  if (!OPENAI_API_KEY) throw new Error('Interview Ready is not configured yet.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: INTERVIEW_MODEL,
      reasoning: { effort: 'low' },
      input,
      max_output_tokens: maxOutputTokens,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error(`Interview Ready failed ${response.status}:`, detail.slice(0, 500))
    throw new Error('Interview Ready is temporarily unavailable. Please try again.')
  }

  const payload = await response.json()
  const text = extractResponseText(payload).trim()
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}

async function extractCvText(admin: any, cvUrl: string | null, userId: string) {
  if (!cvUrl) return ''
  try {
    const fileUrl = new URL(cvUrl, 'https://whc.local')
    const bucket = fileUrl.searchParams.get('bucket')
    const path = fileUrl.searchParams.get('path')
    if (bucket !== 'talent-documents' || !path || !path.startsWith(`${userId}/`) || path.includes('..')) return ''

    const extension = path.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'docx'].includes(extension)) return ''
    const { data: file, error } = await admin.storage.from(bucket).download(path)
    if (error || !file || file.size > MAX_CV_SIZE) return ''

    const buffer = Buffer.from(await file.arrayBuffer())
    if (extension === 'docx') {
      const mammoth = await import('mammoth')
      return (await mammoth.extractRawText({ buffer })).value.slice(0, 16000)
    }

    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer), CanvasFactory })
    try {
      return (await parser.getText()).text.slice(0, 16000)
    } finally {
      await parser.destroy()
    }
  } catch {
    return ''
  }
}

function workingStyleFromAnswers(answers: string[]) {
  const valid = ['Driver', 'Connector', 'Planner', 'Explorer']
  const counts: Record<string, number> = { Driver: 0, Connector: 0, Planner: 0, Explorer: 0 }
  for (const answer of answers) if (valid.includes(answer)) counts[answer] += 1
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return {
    primary: sorted[0]?.[0] || 'Planner',
    secondary: sorted[1]?.[0] || 'Connector',
    counts,
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === 'coach' ? 'coach' : 'prepare'
    const admin = createAdminClient()

    const { data: candidate } = await admin.from('candidate_profiles')
      .select('id,user_id,full_name,headline,role_level,experience_years,years_experience,qualifications,treatment_skills,services_offered,product_houses,systems_experience,bio,location,shift_preferences,transport_method,max_commute,cv_url')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Complete your talent profile first.' }, { status: 404 })

    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    let job: any = null
    let employer: any = null
    if (jobId) {
      const { data } = await admin.from('job_listings')
        .select('id,job_title,job_description,location,contract_type,job_type,required_role_level,required_skills,required_brands,required_qualifications,min_years_experience,preferred_business_skills,required_systems,shift_pattern,salary_min,salary_max,employer_id')
        .eq('id', jobId)
        .maybeSingle()
      job = data
      if (job?.employer_id) {
        const { data: emp } = await admin.from('employer_profiles')
          .select('company_name,property_name,tagline')
          .eq('id', job.employer_id)
          .maybeSingle()
        employer = emp
      }
    }

    const customRole = String(body.targetRole || '').slice(0, 180)
    const customDescription = String(body.jobDescription || '').slice(0, 9000)
    if (!job && !customRole) return NextResponse.json({ error: 'Choose a role or enter a target role.' }, { status: 400 })

    const answers = Array.isArray(body.styleAnswers) ? body.styleAnswers.map(String).slice(0, 12) : []
    const style = workingStyleFromAnswers(answers)
    const cvText = await extractCvText(admin, candidate.cv_url, user.id)

    const roleContext = job || {
      job_title: customRole,
      job_description: customDescription,
      location: '',
      contract_type: '',
    }
    const propertyContext = employer ? {
      name: employer.property_name || employer.company_name || '',
      tagline: employer.tagline || '',
    } : { name: String(body.companyName || '').slice(0, 180), tagline: '' }

    if (mode === 'coach') {
      const question = String(body.question || '').slice(0, 1800)
      const answer = String(body.answer || '').slice(0, 6000)
      if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 })

      const result = await generateJson(`You are Interview Ready, a confidence-building interview coach for luxury spa, wellness and hospitality professionals.

CORE PRINCIPLE: You are NOT an answer machine. Never write a replacement interview answer for the professional and never invent evidence. Help them understand what is already strong, identify what is missing, ask them to add their own factual evidence, and coach them to try again in their own words.

Assess this answer against the exact role and the professional's supplied experience. Return ONLY valid JSON:
{
  "score": 0,
  "strong": "one specific thing that worked",
  "improve": "one specific weakness or missing piece",
  "try_again": "a short coaching instruction telling them what evidence/result to add, without writing the answer for them",
  "follow_up": "one optional probing question that would help them find stronger evidence from their own experience"
}

Scoring guide: 0-39 weak/unstructured, 40-59 partial, 60-74 credible, 75-89 strong, 90-100 exceptional and evidence-rich.
Prefer measurable revenue, team, operational, guest, quality, retention, productivity or commercial outcomes where relevant. Do not penalise a candidate for not having a metric if the example is genuinely qualitative.

Working style: ${JSON.stringify(style)}
Candidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}
CV text (transient, factual source only): ${JSON.stringify(cvText)}
Role: ${JSON.stringify(roleContext)}
Property: ${JSON.stringify(propertyContext)}
Question: ${JSON.stringify(question)}
Candidate's answer: ${JSON.stringify(answer)}`, 1600)

      return NextResponse.json({
        score: Math.max(0, Math.min(100, Number(result.score) || 0)),
        strong: String(result.strong || ''),
        improve: String(result.improve || ''),
        try_again: String(result.try_again || ''),
        follow_up: String(result.follow_up || ''),
      })
    }

    const result = await generateJson(`You are Interview Ready, a confidence-building interview preparation coach for luxury spa, wellness and hospitality professionals.

CORE PRINCIPLE: This is NOT an answer machine. Do not write scripted interview answers. Do not invent achievements, employers, qualifications, brands, metrics or responsibilities. Use the professional's real profile and CV to help them recognise evidence they already have, structure it, and practise expressing it confidently.

The WHC proprietary working-style language is:
- Driver: decisive, ambitious and commercially focused.
- Connector: people-focused, expressive and relationship-led.
- Planner: structured, considered and dependable.
- Explorer: curious, adaptive and creative.
It is a coaching framework, not a psychometric diagnosis. Never claim scientific validation or make hiring suitability judgments from it.

Return ONLY valid JSON in exactly this shape:
{
  "style": {
    "primary": "Driver|Connector|Planner|Explorer",
    "secondary": "Driver|Connector|Planner|Explorer",
    "summary": "2 sentences describing how they naturally tend to work and one interview strength to lean into"
  },
  "role_summary": "2 concise sentences on what this exact interview is likely to test",
  "likely_questions": ["8-10 tailored interview questions"],
  "star_examples": [
    {"title":"short evidence label","situation":"factual situation from profile/CV","task":"what responsibility/challenge is evidenced","action_prompt":"prompt telling the candidate what part of THEIR action to explain","result_prompt":"prompt asking for the factual/measurable outcome; never invent it","best_for":["question themes"]}
  ],
  "questions_to_ask": ["5-7 intelligent questions the candidate could ask the employer"],
  "confidence_prep": {
    "weakness": ["3 coaching prompts for choosing and discussing a genuine weakness"],
    "salary": ["3 preparation prompts relevant to the role; do not invent market salary data"],
    "confidence": ["3 practical reminders grounded in their evidence"]
  },
  "focus_areas": {
    "leadership": ["2-3 tailored prompts/questions"],
    "commercial": ["2-3 tailored prompts/questions"],
    "guest_experience": ["2-3 tailored prompts/questions"],
    "conflict": ["2-3 tailored prompts/questions"]
  },
  "readiness_score": 0,
  "readiness_message": "one concise message saying what is already interview-ready and the top 1-2 things to practise next"
}

Readiness score is preparation completeness, NOT employability or likelihood of being hired. Score higher when the supplied evidence gives the candidate several relevant examples and lower when key interview themes lack evidence. Never use protected characteristics.

Calculated working style from their own answers: ${JSON.stringify(style)}
Candidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}
CV text (transient, do not quote excessively or expose separately): ${JSON.stringify(cvText)}
Target role: ${JSON.stringify(roleContext)}
Property/company: ${JSON.stringify(propertyContext)}`)

    return NextResponse.json({
      ...result,
      readiness_score: Math.max(0, Math.min(100, Number(result.readiness_score) || 0)),
      source: { hasCv: Boolean(cvText), hasPlatformJob: Boolean(job) },
      model: INTERVIEW_MODEL,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Interview Ready unavailable' }, { status: 500 })
  }
}
