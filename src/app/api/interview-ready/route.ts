import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const INTERVIEW_MODEL = process.env.OPENAI_INTERVIEW_MODEL || process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'
const MAX_CV_SIZE = 10 * 1024 * 1024

const clean = (value: unknown) => String(value || '').trim()
const list = (value: unknown): string[] => Array.isArray(value) ? value.filter(Boolean).map(String) : []
const clamp = (value: unknown) => Math.max(0, Math.min(100, Number(value) || 0))

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

function parseJson(text: string) {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  if (first >= 0 && last > first) return JSON.parse(stripped.slice(first, last + 1))
  return null
}

async function generateJson(prompt: string, maxOutputTokens = 1800) {
  if (!OPENAI_API_KEY) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5500)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: INTERVIEW_MODEL,
        reasoning: { effort: 'low' },
        input: prompt,
        max_output_tokens: maxOutputTokens,
      }),
    })
    if (!response.ok) {
      console.error('Interview Ready OpenAI error', response.status, (await response.text().catch(() => '')).slice(0, 400))
      return null
    }
    return parseJson(extractResponseText(await response.json()))
  } catch (error) {
    console.error('Interview Ready OpenAI fallback', error instanceof Error ? error.message : error)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function extractCvText(supabase: any, cvUrl: string | null, userId: string) {
  if (!cvUrl) return ''
  try {
    const fileUrl = new URL(cvUrl, 'https://whc.local')
    const bucket = fileUrl.searchParams.get('bucket')
    const path = fileUrl.searchParams.get('path')
    if (bucket !== 'talent-documents' || !path || !path.startsWith(`${userId}/`) || path.includes('..')) return ''
    const ext = path.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'docx'].includes(ext)) return ''
    const { data: file, error } = await supabase.storage.from(bucket).download(path)
    if (error || !file || file.size > MAX_CV_SIZE) return ''
    const buffer = Buffer.from(await file.arrayBuffer())
    if (ext === 'docx') {
      const mammoth = await import('mammoth')
      return (await mammoth.extractRawText({ buffer })).value.slice(0, 18000)
    }
    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer), CanvasFactory })
    try { return (await parser.getText()).text.slice(0, 18000) } finally { await parser.destroy() }
  } catch { return '' }
}

function workingStyle(answers: string[]) {
  const names = ['Driver', 'Connector', 'Planner', 'Explorer'] as const
  const counts: Record<string, number> = Object.fromEntries(names.map(name => [name, 0]))
  answers.forEach(answer => { if (names.includes(answer as any)) counts[answer] += 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return { primary: sorted[0]?.[0] || 'Planner', secondary: sorted[1]?.[0] || 'Connector' }
}

function seniority(job: any) {
  const value = `${job?.required_role_level || ''} ${job?.job_title || ''}`.toLowerCase()
  if (/director|executive|head of spa|head of wellness|general manager/.test(value)) return 'Director / Executive'
  if (/manager/.test(value)) return 'Manager'
  if (/supervisor|lead therapist|team lead/.test(value)) return 'Supervisor / Lead'
  if (/senior/.test(value)) return 'Senior professional'
  if (/apprentice|junior|assistant|attendant|receptionist/.test(value)) return 'Entry / Junior'
  return 'Professional / Therapist'
}

function seniorityFocus(level: string) {
  if (level === 'Director / Executive') return ['commercial strategy and P&L', 'senior stakeholder influence', 'leadership culture and succession', 'business planning and transformation', 'luxury guest strategy']
  if (level === 'Manager') return ['team leadership', 'revenue and productivity', 'standards and operations', 'complaint recovery', 'recruitment and development']
  if (level === 'Supervisor / Lead') return ['day-to-day leadership', 'coaching colleagues', 'standards', 'guest recovery', 'supporting targets']
  if (level === 'Senior professional') return ['advanced guest care', 'mentoring', 'treatment standards', 'retail and rebooking', 'handling difficult situations']
  if (level === 'Entry / Junior') return ['guest care', 'reliability', 'learning attitude', 'teamwork', 'technical foundations']
  return ['guest experience', 'technical confidence', 'retail and rebooking', 'teamwork', 'standards and reliability']
}

function companyFacts(employer: any, externalName: string) {
  const e = employer || {}
  const facts: Array<{ label: string; value: string }> = []
  const add = (label: string, value: unknown) => { if (clean(value)) facts.push({ label, value: clean(value) }) }
  add('Property', e.property_name)
  add('Company / brand', e.company_name)
  add('Hotel group', e.hotel_group_name || e.group_name || e.parent_brand)
  add('Property type', e.property_type || e.company_type)
  add('Star rating', e.star_rating)
  add('Location', e.location)
  add('Treatment rooms', e.num_treatment_rooms)
  add('Spa team size', e.team_size)
  add('Hotel bedrooms', e.room_count || e.hotel_rooms || e.number_of_rooms)
  add('Property opened', e.opened_year || e.opening_year)
  add('Spa opened', e.spa_opened_year || e.spa_opening_year)
  const brands = list(e.product_houses_used || e.product_houses || e.brand_partners)
  if (brands.length) facts.push({ label: 'Spa / product brands', value: brands.join(', ') })
  const facilities = list(e.services_offered || e.spa_facilities || e.facilities)
  if (facilities.length) facts.push({ label: 'Spa facilities / services', value: facilities.slice(0, 12).join(', ') })
  const groupName = clean(e.hotel_group_name || e.group_name || e.parent_brand)
  const gaps: string[] = []
  if (!groupName) gaps.push('Hotel group / independent status is not yet verified in the WHC property profile.')
  if (!(e.room_count || e.hotel_rooms || e.number_of_rooms)) gaps.push('Hotel bedroom count is not yet verified in the WHC property profile.')
  if (!(e.spa_opened_year || e.spa_opening_year)) gaps.push('Spa opening date is not yet verified in the WHC property profile.')
  if (!brands.length) gaps.push('Spa product house / treatment brand information is not yet verified in the WHC property profile.')
  return {
    name: clean(e.property_name || e.company_name || externalName) || 'The employer',
    group_name: groupName,
    is_group_property: Boolean(groupName),
    tagline: clean(e.tagline),
    about: clean(e.about_text),
    culture: list(e.culture_points),
    highlights: list(e.highlights),
    verified_facts: facts,
    research_gaps: gaps,
  }
}

function overlap(candidateValues: unknown, requiredValues: unknown) {
  const candidate = list(candidateValues).map(v => v.toLowerCase())
  return list(requiredValues).filter(req => candidate.includes(req.toLowerCase()))
}

function fallback(candidate: any, job: any, employer: any, style: any, cvText: string, externalName: string) {
  const level = seniority(job)
  const focus = seniorityFocus(level)
  const company = companyFacts(employer, externalName)
  const strengths = [
    ...overlap(candidate.treatment_skills || candidate.services_offered, job.required_skills),
    ...overlap(candidate.product_houses, job.required_brands),
    ...overlap(candidate.qualifications, job.required_qualifications),
    ...overlap(candidate.systems_experience || candidate.systems_knowledge, job.required_systems),
  ].slice(0, 6)
  const required = [...list(job.required_skills), ...list(job.required_brands), ...list(job.required_qualifications), ...list(job.required_systems)]
  const gaps = required.filter(item => !strengths.some(s => s.toLowerCase() === item.toLowerCase())).slice(0, 5)
  const title = clean(job.job_title) || 'this role'
  return {
    style: { ...style, summary: `Your answers lean toward ${style.primary}, with ${style.secondary} as a secondary style. Use this as coaching language for how you naturally work.` },
    company_intelligence: { ...company, why_it_matters: company.verified_facts.slice(0, 5).map(f => `${f.label}: ${f.value}. Consider how that fact could shape guest expectations, team structure or the commercial priorities of the role.`) },
    role_intelligence: {
      seniority: level,
      role_summary: `${title} is being prepared at ${level.toLowerCase()} level. The interview is likely to test ${focus.slice(0, 3).join(', ')}.`,
      what_they_are_really_hiring_for: focus,
      top_priorities: [...list(job.preferred_business_skills), ...list(job.required_skills), ...list(job.required_qualifications)].slice(0, 7),
      interview_themes: focus,
    },
    cv_match: {
      why_you_match: strengths.length ? strengths.map(item => `Your profile already evidences ${item}; prepare one real example that proves it.`) : ['Your profile provides the starting point. Pull out examples that directly answer the responsibilities in this job description.'],
      strongest_evidence: strengths,
      underused_evidence: cvText ? ['Look for CV statements that describe responsibility but not the outcome. Add the genuine scale, result or learning when you know it.'] : ['Your CV file could not be read on this attempt. Your WHC profile and the job description are still being used; re-uploading the CV will allow deeper evidence coaching.'],
      gaps_or_risks: gaps,
      talk_about_this: focus.slice(0, 5).map(item => `Prepare one real example showing your capability in ${item}.`),
      cv_improvements: ['Make evidence relevant to this exact role easy to spot.', 'Turn responsibilities into verified outcomes where you genuinely know the result.'],
    },
    hard_questions: gaps.slice(0, 4).map(item => ({
      question: `This role asks for ${item}. Your profile does not clearly evidence it. How would you address that?`,
      why: 'The interviewer may test a requirement that is not obvious in your CV.',
      prepare: ['Identify the closest transferable experience you genuinely have.', 'Be clear about what you have not done yet.', 'Explain the evidence that shows you can learn or step up.'],
    })),
    likely_questions: focus.map(item => `Tell me about a time you demonstrated ${item}.`).concat([
      `Why does ${title} at ${company.name} interest you?`,
      'Tell me about a difficult guest or team situation and what you learned.',
      'What would your current manager say is your strongest contribution?',
    ]).slice(0, 10),
    star_examples: strengths.slice(0, 4).map(item => ({
      title: item,
      situation: `Choose a genuine situation from your experience involving ${item}.`,
      task: 'What were you personally responsible for?',
      action_prompt: 'Explain the actions you personally took.',
      result_prompt: 'What changed because of your actions? Add a real metric or outcome if you know it.',
      best_for: [item],
    })),
    questions_to_ask: [
      'What would success in the first 90 days look like?',
      'What are the biggest priorities for the spa team right now?',
      `How does ${company.name} measure guest experience and commercial success?`,
      'What development opportunities are available within the property or wider group?',
      'What would you most like the person joining this role to improve or protect?',
    ],
    readiness: {
      overall: strengths.length >= 4 ? 78 : strengths.length >= 2 ? 68 : 58,
      company: company.verified_facts.length >= 4 ? 80 : 60,
      role: clean(job.job_description) ? 80 : 60,
      evidence: strengths.length >= 3 ? 75 : 55,
      difficult_questions: gaps.length ? 55 : 75,
      practice: 50,
      message: 'Your preparation is started. Focus next on turning responsibilities into specific evidence and practising the areas the role may challenge.',
    },
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === 'coach' ? 'coach' : 'prepare'

    const { data: candidate, error: candidateError } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (candidateError) console.error('Interview Ready candidate query', candidateError.message)
    if (!candidate) return NextResponse.json({ error: 'Complete your talent profile first.' }, { status: 404 })

    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    let job: any = null
    let employer: any = null
    if (jobId) {
      const { data, error } = await supabase.from('job_listings').select('*, employer_profiles(*)').eq('id', jobId).maybeSingle()
      if (error) console.error('Interview Ready job query', error.message)
      job = data
      employer = Array.isArray(data?.employer_profiles) ? data.employer_profiles[0] : data?.employer_profiles
    }

    const customRole = clean(body.targetRole).slice(0, 180)
    const customDescription = clean(body.jobDescription).slice(0, 10000)
    const externalName = clean(body.companyName).slice(0, 180)
    if (!job && !customRole) return NextResponse.json({ error: 'Choose a role or enter a target role.' }, { status: 400 })

    const role = job || { job_title: customRole, job_description: customDescription, required_role_level: customRole }
    const style = workingStyle(Array.isArray(body.styleAnswers) ? body.styleAnswers.map(String).slice(0, 12) : [])
    const cvText = await extractCvText(supabase, candidate.cv_url, user.id)
    const company = companyFacts(employer, externalName)
    const level = seniority(role)
    const focus = seniorityFocus(level)

    if (mode === 'coach') {
      const question = clean(body.question).slice(0, 1800)
      const answer = clean(body.answer).slice(0, 6000)
      if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 })
      const ai = await generateJson(`You are Interview Ready, a confidence-building interview coach for luxury spa, wellness and hospitality professionals. Never write a replacement answer and never invent evidence. Return only JSON: {"score":0,"strong":"","improve":"","missing":"","try_again":"","follow_up":""}. Review the candidate's own answer against the exact role.\nSeniority: ${level}\nFocus: ${JSON.stringify(focus)}\nCandidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}\nCV: ${JSON.stringify(cvText)}\nRole: ${JSON.stringify(role)}\nVerified company facts: ${JSON.stringify(company.verified_facts)}\nQuestion: ${JSON.stringify(question)}\nAnswer: ${JSON.stringify(answer)}`, 1700)
      return NextResponse.json(ai ? {
        score: clamp(ai.score),
        strong: clean(ai.strong),
        improve: clean(ai.improve),
        missing: clean(ai.missing),
        try_again: clean(ai.try_again),
        follow_up: clean(ai.follow_up),
      } : {
        score: 60,
        strong: 'You have given a real answer in your own words.',
        improve: 'Make the situation, your personal action and the outcome easier to separate.',
        missing: 'Add the most relevant factual result, scale or learning if you have it.',
        try_again: 'Try again with one specific example and finish with what changed because of your actions.',
        follow_up: 'What was the measurable guest, team, commercial or operational outcome?',
      })
    }

    const base = fallback(candidate, role, employer, style, cvText, externalName)
    return NextResponse.json({
      ...base,
      source: { hasCv: Boolean(cvText), hasPlatformJob: Boolean(job), usedAi: false },
    })
  } catch (error: any) {
    console.error('Interview Ready request failed', error?.message || error)
    return NextResponse.json({ error: 'Interview Ready could not build your preparation. Please try again.' }, { status: 500 })
  }
}
