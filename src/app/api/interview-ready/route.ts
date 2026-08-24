import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const INTERVIEW_MODEL = process.env.OPENAI_INTERVIEW_MODEL || process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'
const MAX_CV_SIZE = 10 * 1024 * 1024

const asArray = (value: any): string[] => Array.isArray(value) ? value.filter(Boolean).map(String) : []
const clean = (value: any) => String(value || '').trim()
const clamp = (value: any) => Math.max(0, Math.min(100, Number(value) || 0))

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

function parseJsonObject(text: string) {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(stripped) } catch { /* recover below */ }
  const first = stripped.indexOf('{')
  const last = stripped.lastIndexOf('}')
  if (first >= 0 && last > first) return JSON.parse(stripped.slice(first, last + 1))
  throw new Error('The preparation response could not be read.')
}

async function generateJson(input: string, maxOutputTokens = 5000) {
  if (!OPENAI_API_KEY) return null
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: INTERVIEW_MODEL, reasoning: { effort: 'low' }, input, max_output_tokens: maxOutputTokens }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`Interview Ready AI failed ${response.status}:`, detail.slice(0, 500))
      return null
    }
    const payload = await response.json()
    return parseJsonObject(extractResponseText(payload))
  } catch (error) {
    console.error('Interview Ready AI fallback used:', error instanceof Error ? error.message : 'unknown error')
    return null
  }
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
      return (await mammoth.extractRawText({ buffer })).value.slice(0, 18000)
    }
    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer), CanvasFactory })
    try { return (await parser.getText()).text.slice(0, 18000) } finally { await parser.destroy() }
  } catch { return '' }
}

function workingStyleFromAnswers(answers: string[]) {
  const valid = ['Driver', 'Connector', 'Planner', 'Explorer']
  const counts: Record<string, number> = { Driver: 0, Connector: 0, Planner: 0, Explorer: 0 }
  answers.forEach(answer => { if (valid.includes(answer)) counts[answer] += 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return { primary: sorted[0]?.[0] || 'Planner', secondary: sorted[1]?.[0] || 'Connector', counts }
}

function seniorityFor(job: any) {
  const value = `${job?.required_role_level || ''} ${job?.job_title || job?.title || ''}`.toLowerCase()
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

function verifiedCompanyIntelligence(employer: any, externalName: string) {
  const e = employer || {}
  const name = clean(e.property_name || e.company_name || externalName) || 'The employer'
  const groupName = clean(e.hotel_group_name || e.group_name || e.parent_brand || '')
  const facts: Array<{ label: string; value: string }> = []
  const add = (label: string, value: any) => { if (value !== null && value !== undefined && clean(value)) facts.push({ label, value: clean(value) }) }

  add('Property', e.property_name)
  add('Company / brand', e.company_name)
  add('Hotel group', groupName)
  add('Property type', e.property_type || e.company_type)
  add('Star rating', e.star_rating ? `${e.star_rating}${/^\d+$/.test(String(e.star_rating)) ? ' star' : ''}` : '')
  add('Location', e.location || e.property_location)
  add('Treatment rooms', e.num_treatment_rooms ?? e.treatment_rooms)
  add('Spa team size', e.team_size)
  add('Hotel bedrooms', e.room_count ?? e.hotel_rooms ?? e.number_of_rooms)
  add('Property opened', e.opened_year ?? e.opening_year)
  add('Spa opened', e.spa_opened_year ?? e.spa_opening_year)
  const productHouses = asArray(e.product_houses_used || e.product_houses || e.spa_brand_partners || e.brand_partners)
  if (productHouses.length) facts.push({ label: 'Spa / product brands', value: productHouses.join(', ') })
  const facilities = asArray(e.spa_facilities || e.facilities || e.services_offered)
  if (facilities.length) facts.push({ label: 'Spa facilities / services', value: facilities.slice(0, 12).join(', ') })
  const systems = asArray(e.systems_used)
  if (systems.length) facts.push({ label: 'Systems used', value: systems.join(', ') })

  const researchGaps: string[] = []
  if (!groupName && !e.chain_parent_id) researchGaps.push('Hotel group / independent status is not yet verified in the WHC property profile.')
  if (!(e.room_count || e.hotel_rooms || e.number_of_rooms)) researchGaps.push('Hotel bedroom count is not yet verified in the WHC property profile.')
  if (!(e.spa_opened_year || e.spa_opening_year)) researchGaps.push('Spa opening date is not yet verified in the WHC property profile.')
  if (!productHouses.length) researchGaps.push('Spa product house / treatment brand information is not yet verified in the WHC property profile.')

  return {
    name,
    group_name: groupName,
    is_group_property: Boolean(groupName || e.chain_parent_id),
    tagline: clean(e.tagline),
    about: clean(e.about_text || e.about),
    website: clean(e.website || e.company_website),
    culture: asArray(e.culture_points || e.culture_values),
    highlights: asArray(e.highlights),
    verified_facts: facts,
    research_gaps: researchGaps,
  }
}

function overlap(candidateValues: any, requiredValues: any) {
  const candidate = asArray(candidateValues).map(v => v.toLowerCase())
  return asArray(requiredValues).filter(req => candidate.some(c => c === req.toLowerCase()))
}

function fallbackPlan(candidate: any, job: any, employer: any, style: any, cvText: string, externalName: string) {
  const seniority = seniorityFor(job)
  const focus = seniorityFocus(seniority)
  const company = verifiedCompanyIntelligence(employer, externalName)
  const skills = overlap(candidate.treatment_skills || candidate.services_offered, job.required_skills)
  const brands = overlap(candidate.product_houses, job.required_brands)
  const quals = overlap(candidate.qualifications, job.required_qualifications)
  const systems = overlap(candidate.systems_experience || candidate.systems_knowledge, job.required_systems)
  const strengths = [...skills, ...brands, ...quals, ...systems].slice(0, 6)
  const required = [...asArray(job.required_skills), ...asArray(job.required_brands), ...asArray(job.required_qualifications), ...asArray(job.required_systems)]
  const missing = required.filter(item => !strengths.some(s => s.toLowerCase() === item.toLowerCase())).slice(0, 5)
  const roleTitle = clean(job.job_title || job.title) || 'this role'

  return {
    style: { primary: style.primary, secondary: style.secondary, summary: `Your answers lean toward ${style.primary}, with ${style.secondary} as a secondary style. Use that as language for how you work, not as a label that limits you.` },
    company_intelligence: { ...company, why_it_matters: company.verified_facts.slice(0, 4).map(f => `${f.label}: ${f.value}. Think about how this could shape the guest, team or commercial expectations in the interview.`) },
    role_intelligence: {
      seniority,
      role_summary: `${roleTitle} is being prepared at ${seniority.toLowerCase()} level. Your preparation should centre on ${focus.slice(0, 3).join(', ')}.`,
      what_they_are_really_hiring_for: focus,
      top_priorities: [...asArray(job.preferred_business_skills), ...asArray(job.required_skills), ...asArray(job.required_qualifications)].slice(0, 7),
      interview_themes: focus,
    },
    cv_match: {
      why_you_match: strengths.length ? strengths.map(item => `Your profile already evidences ${item}; connect it to a specific outcome or guest/team example.`) : ['Your profile and CV give the starting point. Pull out examples that directly answer the responsibilities in this job description.'],
      strongest_evidence: strengths,
      underused_evidence: cvText ? ['Look for achievements in your CV that state responsibility but not the result. Add the real number, scale, team size or guest outcome if you know it.'] : ['Upload a CV to let Interview Ready identify evidence that may be undersold.'],
      gaps_or_risks: missing,
      talk_about_this: focus.slice(0, 4).map(item => `Prepare one real example that proves your capability in ${item}.`),
      cv_improvements: ['Where your CV says you were responsible for something, add the genuine result or scale when you can verify it.', 'Make sure experience relevant to this exact job description is easy to spot rather than buried in older roles.'],
    },
    hard_questions: missing.slice(0, 4).map(item => ({ question: `This role asks for ${item}. Your current profile does not clearly evidence it. How would you address that?`, why: 'The interviewer may test a requirement that is not obvious in your CV.', prepare: ['Identify the closest transferable experience you genuinely have.', 'Be clear about what you have not done yet.', 'Explain the evidence that shows you can learn or step up without pretending to have experience you do not have.'] })),
    likely_questions: focus.map(item => `Tell me about a time you demonstrated ${item}.`).concat([`Why does ${roleTitle} at ${company.name} interest you?`, 'What would your current manager say is your strongest contribution?', 'Tell me about a difficult guest or team situation and what you learned.']).slice(0, 10),
    star_examples: strengths.slice(0, 4).map(item => ({ title: item, situation: `Find a genuine situation from your CV or profile involving ${item}.`, task: 'What were you personally responsible for?', action_prompt: 'Explain the actions you personally took, not just what the team did.', result_prompt: 'What changed as a result? Add a real revenue, team, operational or guest outcome if you know it.', best_for: [item] })),
    questions_to_ask: [`What would success in the first 90 days look like for this role?`, `What are the biggest priorities for the spa team right now?`, `How does ${company.name} measure guest experience and commercial success?`, 'What development opportunities are available within the property or wider group?', 'What would you most like the person joining this role to improve or protect?'],
    readiness: { overall: strengths.length >= 4 ? 78 : strengths.length >= 2 ? 68 : 58, company: company.verified_facts.length >= 4 ? 80 : 60, role: clean(job.job_description) ? 80 : 60, evidence: strengths.length >= 3 ? 75 : 55, difficult_questions: missing.length ? 55 : 75, practice: 50, message: 'Your preparation is started. Focus next on turning responsibilities into specific evidence and practising the areas the role may challenge.' },
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

    const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Complete your talent profile first.' }, { status: 404 })

    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    let job: any = null
    let employer: any = null
    if (jobId) {
      const { data } = await admin.from('job_listings').select('*').eq('id', jobId).maybeSingle()
      job = data
      if (job?.employer_id) {
        const { data: emp } = await admin.from('employer_profiles').select('*').eq('id', job.employer_id).maybeSingle()
        employer = emp
      }
    }

    const customRole = clean(body.targetRole).slice(0, 180)
    const customDescription = clean(body.jobDescription).slice(0, 10000)
    const externalName = clean(body.companyName).slice(0, 180)
    if (!job && !customRole) return NextResponse.json({ error: 'Choose a role or enter a target role.' }, { status: 400 })

    const roleContext = job || { job_title: customRole, job_description: customDescription, required_role_level: customRole }
    const style = workingStyleFromAnswers(Array.isArray(body.styleAnswers) ? body.styleAnswers.map(String).slice(0, 12) : [])
    const cvText = await extractCvText(admin, candidate.cv_url, user.id)
    const company = verifiedCompanyIntelligence(employer, externalName)
    const seniority = seniorityFor(roleContext)
    const focus = seniorityFocus(seniority)

    if (mode === 'coach') {
      const question = clean(body.question).slice(0, 1800)
      const answer = clean(body.answer).slice(0, 6000)
      if (!question || !answer) return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 })
      const ai = await generateJson(`You are Interview Ready, a confidence-building interview coach for luxury spa, wellness and hospitality professionals. You are NOT an answer machine. Never write a replacement answer and never invent evidence. Review the candidate's own answer against the role. Return only JSON with keys score (0-100), strong, improve, missing, try_again, follow_up. "missing" must identify evidence or context they may need to add. "try_again" must coach them what to include without scripting the answer.\n\nSeniority: ${seniority}\nInterview focus: ${JSON.stringify(focus)}\nCandidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}\nCV text: ${JSON.stringify(cvText)}\nRole: ${JSON.stringify(roleContext)}\nVerified company facts: ${JSON.stringify(company.verified_facts)}\nQuestion: ${JSON.stringify(question)}\nCandidate answer: ${JSON.stringify(answer)}`, 1700)
      if (ai) return NextResponse.json({ score: clamp(ai.score), strong: clean(ai.strong), improve: clean(ai.improve), missing: clean(ai.missing), try_again: clean(ai.try_again), follow_up: clean(ai.follow_up) })
      return NextResponse.json({ score: 60, strong: 'You have given a real answer in your own words.', improve: 'Make the situation, your personal action and the outcome easier to separate.', missing: 'Add the most relevant factual result, scale or learning if you have it.', try_again: 'Try again using one specific example and finish with what changed because of your actions.', follow_up: 'What was the measurable guest, team, commercial or operational outcome?' })
    }

    const fallback = fallbackPlan(candidate, roleContext, employer, style, cvText, externalName)
    const ai = await generateJson(`You are Interview Ready for luxury spa, wellness and hospitality professionals. Core principle: NOT an answer machine; a confidence builder. Build a personalised preparation dossier from the person's real CV/profile, exact job description and ONLY the verified company facts supplied below. Never invent a hotel room count, opening date, product brand, achievement, qualification, salary, employer or metric. If a fact is not supplied, do not claim it. Do not make hiring decisions.

Seniority is ${seniority}. Calibrate the preparation accordingly. Entry/junior roles should focus on guest care, reliability, teamwork and foundations. Senior/supervisor roles should add mentoring, standards and problem-solving. Manager roles should add people leadership, productivity, targets, complaints and operations. Director/executive roles should strongly cover P&L/commercial strategy, stakeholder influence, culture, transformation, business planning and luxury guest strategy.

Return ONLY valid JSON with this shape:
{
 "style":{"primary":"Driver|Connector|Planner|Explorer","secondary":"Driver|Connector|Planner|Explorer","summary":"..."},
 "company_interpretation":{"why_it_matters":["4-6 insights based ONLY on verified facts"]},
 "role_intelligence":{"role_summary":"...","what_they_are_really_hiring_for":["5-8 themes"],"top_priorities":["5-8 priorities"],"interview_themes":["5-8 themes"]},
 "cv_match":{"why_you_match":["3-6 evidence-based points"],"strongest_evidence":["3-6 concise evidence items"],"underused_evidence":["2-5 things present but undersold"],"gaps_or_risks":["0-5 genuine gaps"],"talk_about_this":["3-6 prompts"],"cv_improvements":["2-5 factual improvements before applying/interview"]},
 "hard_questions":[{"question":"...","why":"...","prepare":["2-4 prompts to find their own answer"]}],
 "likely_questions":["8-12 tailored questions"],
 "star_examples":[{"title":"...","situation":"factual source from CV/profile","task":"...","action_prompt":"...","result_prompt":"...","best_for":["..."]}],
 "questions_to_ask":["5-7 intelligent employer questions"],
 "readiness":{"overall":0,"company":0,"role":0,"evidence":0,"difficult_questions":0,"practice":0,"message":"..."}
}

Working style answers: ${JSON.stringify(style)}
Candidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}
CV text (transient evidence source): ${JSON.stringify(cvText)}
Role: ${JSON.stringify(roleContext)}
Verified company facts: ${JSON.stringify(company)}
`, 6200)

    if (!ai) return NextResponse.json({ ...fallback, source: { hasCv: Boolean(cvText), hasPlatformJob: Boolean(job), usedAi: false } })

    return NextResponse.json({
      style: ai.style || fallback.style,
      company_intelligence: { ...company, why_it_matters: asArray(ai.company_interpretation?.why_it_matters).slice(0, 6) },
      role_intelligence: { seniority, ...(ai.role_intelligence || fallback.role_intelligence) },
      cv_match: ai.cv_match || fallback.cv_match,
      hard_questions: Array.isArray(ai.hard_questions) ? ai.hard_questions.slice(0, 7) : fallback.hard_questions,
      likely_questions: asArray(ai.likely_questions).slice(0, 12).length ? asArray(ai.likely_questions).slice(0, 12) : fallback.likely_questions,
      star_examples: Array.isArray(ai.star_examples) ? ai.star_examples.slice(0, 6) : fallback.star_examples,
      questions_to_ask: asArray(ai.questions_to_ask).slice(0, 7).length ? asArray(ai.questions_to_ask).slice(0, 7) : fallback.questions_to_ask,
      readiness: {
        overall: clamp(ai.readiness?.overall ?? fallback.readiness.overall),
        company: clamp(ai.readiness?.company ?? fallback.readiness.company),
        role: clamp(ai.readiness?.role ?? fallback.readiness.role),
        evidence: clamp(ai.readiness?.evidence ?? fallback.readiness.evidence),
        difficult_questions: clamp(ai.readiness?.difficult_questions ?? fallback.readiness.difficult_questions),
        practice: clamp(ai.readiness?.practice ?? fallback.readiness.practice),
        message: clean(ai.readiness?.message || fallback.readiness.message),
      },
      source: { hasCv: Boolean(cvText), hasPlatformJob: Boolean(job), usedAi: true },
    })
  } catch (error: any) {
    console.error('Interview Ready request failed:', error?.message || error)
    return NextResponse.json({ error: 'Interview Ready could not load your profile or role. Please refresh and try again.' }, { status: 500 })
  }
}
