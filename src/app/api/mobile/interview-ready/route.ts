import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const INTERVIEW_MODEL = process.env.OPENAI_INTERVIEW_MODEL || process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'
const MAX_CV_SIZE = 10 * 1024 * 1024

const clean = (value: unknown) => String(value || '').trim()
const list = (value: unknown): string[] => Array.isArray(value) ? value.filter(Boolean).map(String) : []

function parseResponseText(payload: any): string {
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
  if (first >= 0 && last > first) {
    try { return JSON.parse(stripped.slice(first, last + 1)) } catch {}
  }
  return null
}

async function generatePreparation(prompt: string) {
  if (!OPENAI_API_KEY) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: INTERVIEW_MODEL, reasoning: { effort: 'low' }, input: prompt, max_output_tokens: 2600 }),
    })
    if (!response.ok) return null
    return parseJson(parseResponseText(await response.json()))
  } catch {
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
  } catch {
    return ''
  }
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

function focusFor(level: string) {
  if (level === 'Director / Executive') return ['commercial strategy and P&L', 'senior stakeholder influence', 'leadership culture and succession', 'business planning and transformation', 'luxury guest strategy']
  if (level === 'Manager') return ['team leadership', 'revenue and productivity', 'standards and operations', 'complaint recovery', 'recruitment and development']
  if (level === 'Supervisor / Lead') return ['day-to-day leadership', 'coaching colleagues', 'standards', 'guest recovery', 'supporting targets']
  if (level === 'Senior professional') return ['advanced guest care', 'mentoring', 'treatment standards', 'retail and rebooking', 'handling difficult situations']
  if (level === 'Entry / Junior') return ['guest care', 'reliability', 'learning attitude', 'teamwork', 'technical foundations']
  return ['guest experience', 'technical confidence', 'retail and rebooking', 'teamwork', 'standards and reliability']
}

function companyFacts(employer: any) {
  const facts: Array<{ label: string; value: string }> = []
  const add = (label: string, value: unknown) => { if (clean(value)) facts.push({ label, value: clean(value) }) }
  add('Property', employer?.property_name)
  add('Company / brand', employer?.company_name)
  add('Hotel group', employer?.hotel_group || employer?.hotel_group_name || employer?.group_name)
  add('Property type', employer?.property_type || employer?.company_type)
  add('Star rating', employer?.star_rating)
  add('Location', employer?.location)
  add('Treatment rooms', employer?.num_treatment_rooms)
  add('Spa team size', employer?.team_size)
  const brands = list(employer?.product_houses_used || employer?.product_houses || employer?.brand_partners)
  if (brands.length) facts.push({ label: 'Spa / product brands', value: brands.join(', ') })
  return facts
}

// Ported verbatim from src/app/api/interview-ready/route.ts so the phone and
// the web give the same preparation. Interviewers at every level respect a
// candidate who understands how a spa makes money; these are pitched at the
// seniority of the role rather than one generic list.
function commercialTalkingPoints(level: string, employer: any) {
  const e = employer || {}
  const rooms = Number(e.num_treatment_rooms) || null
  const brands = list(e.product_houses_used || e.product_houses)
  const bedrooms = Number(e.room_count) || null
  const points: string[] = []
  if (level === 'Director / Executive') {
    points.push(
      rooms ? `With ${rooms} treatment rooms, be ready to talk utilisation: occupancy percentage, revenue per treatment room and how you would move both.` : 'Ask about treatment room count early, then talk utilisation: occupancy percentage and revenue per available treatment hour.',
      'Payroll is the biggest line in any spa P&L - speak to payroll as a percentage of revenue, productive versus contracted hours, and how you protect margin without burning the team.',
      bedrooms ? `A ${bedrooms}-bedroom property means in-house capture matters: what percentage of hotel guests use the spa, and what one point of capture is worth.` : 'Ask what percentage of hotel guests currently use the spa - capture rate is usually the biggest untapped revenue lever.',
      'Membership and retail: recurring revenue smooths seasonality; retail percentage of treatment revenue is a marker of a commercially trained team.',
      'Come with a view on pricing and yield - peak and off-peak, treatment mix, and where the menu is working hardest.',
    )
  } else if (level === 'Manager') {
    points.push(
      rooms ? `Know your numbers for a ${rooms}-room spa: therapist utilisation, average treatment value and rebooking rate are the three you will be asked about.` : 'Know the three numbers every spa manager is asked about: therapist utilisation, average treatment value and rebooking rate.',
      'Retail attachment: how you coach a team to recommend honestly and what a realistic retail-to-treatment percentage looks like.',
      brands.length ? `They work with ${brands.slice(0, 2).join(' and ')} - product house targets, training and stock control will be part of the job.` : 'Ask which product houses they partner with - brand targets and training will be part of the job.',
      'Rota and payroll discipline: matching therapist hours to demand without hurting service or the team.',
    )
  } else if (level === 'Supervisor / Lead') {
    points.push(
      'Rebooking and retail conversations: how you personally do them, and how you help colleagues do them without feeling salesy.',
      'Utilisation basics: why an empty treatment room costs the business, and what you do with quiet time.',
      'Upgrades and add-ons: enhancing the guest experience in a way that also lifts average spend.',
    )
  } else {
    points.push(
      'Rebooking: the honest, guest-first way you invite someone to book their next treatment before they leave.',
      'Retail: how you recommend homecare because it extends the treatment result - the commercial benefit follows the genuine advice.',
      brands.length ? `They use ${brands.slice(0, 2).join(' and ')} - showing you understand brand standards and homecare philosophy marks you out.` : 'Ask about their product houses - showing interest in brand standards and homecare marks you out.',
      'Why reliability is commercial: a filled column and a full treatment book is the business.',
    )
  }
  return points
}

// 30/60/90-day thinking, scaled to seniority. Not a plan to recite - a
// structure that shows the interviewer the candidate thinks beyond day one.
function plan306090(level: string, company: { name: string }) {
  if (level === 'Director / Executive') return {
    thirty: ['Listen and audit: the P&L line by line, payroll structure, utilisation data, guest feedback, team one-to-ones - before changing anything.', `Understand how the spa fits ${company.name}'s wider commercial strategy and who the key stakeholders are.`, 'Identify the two or three quickest wins that build credibility without destabilising the team.'],
    sixty: ['Present a diagnostic to your stakeholders: where the spa makes and loses money, and the priority order for fixing it.', 'Begin the structural moves: rota against demand, pricing and menu review, retail and membership strategy.', 'Set the leadership rhythm - what gets measured, what gets celebrated, and the standards that are non-negotiable.'],
    ninety: ['Deliver the first measurable movement: utilisation, capture rate, retail percentage or payroll ratio - whichever you committed to.', 'A twelve-month plan agreed with the business: investment cases, team development and succession, and the guest experience vision.'],
  }
  if (level === 'Manager') return {
    thirty: ['Learn the team, the guests and the numbers before changing anything - work alongside every role at least once.', 'Review the diary: where utilisation is lost, where the rota fights demand, and what guests say in reviews.'],
    sixty: ['Set clear standards and coach to them - treatment quality, arrival experience, rebooking and retail conversations.', 'Fix the two operational frustrations the team raises most - that buys trust for everything after.'],
    ninety: ['Show movement on the numbers you are measured on: utilisation, average treatment value, rebooking, retail attachment.', 'A development plan per team member and a hiring pipeline for the gaps.'],
  }
  return {
    thirty: ['Learn the treatment menu, protocols and brand standards until they are second nature.', 'Get to know the team and how this spa likes things done - every property is different.'],
    sixty: ['Build your rebooking and retail confidence - set a personal target and track it honestly.', 'Ask for feedback on your treatments and act on it visibly.'],
    ninety: ['Be the reliable name on the rota - the person guests re-request and colleagues trust.', 'Tell your manager where you want to develop next and ask what it takes to get there.'],
  }
}

function fallback(candidate: any, job: any, employer: any, cvText: string) {
  const level = seniority(job)
  const focus = focusFor(level)
  const candidateSkills = list(candidate.treatment_skills || candidate.services_offered)
  const candidateBrands = list(candidate.product_houses || candidate.brand_experience)
  const candidateQuals = list(candidate.qualifications)
  const required = [...list(job.required_skills), ...list(job.required_brands), ...list(job.required_qualifications)]
  const evidence = required.filter(req => [...candidateSkills, ...candidateBrands, ...candidateQuals].some(x => x.toLowerCase() === req.toLowerCase())).slice(0, 6)
  const gaps = required.filter(req => !evidence.some(x => x.toLowerCase() === req.toLowerCase())).slice(0, 5)
  const companyName = clean(employer?.property_name || employer?.company_name) || 'the employer'
  return {
    company_intelligence: { name: companyName, verified_facts: companyFacts(employer) },
    role_intelligence: {
      seniority: level,
      role_summary: `This ${clean(job.job_title) || 'role'} is being prepared at ${level.toLowerCase()} level. Expect the interview to test ${focus.slice(0, 3).join(', ')}.`,
      what_they_are_really_hiring_for: focus,
    },
    cv_match: {
      why_you_match: evidence.length ? evidence.map(x => `Your profile already shows ${x}. Prepare one real example that proves it.`) : ['Use the job description to pull out the strongest evidence from your own experience.'],
      strongest_evidence: evidence,
      gaps_or_risks: gaps,
      talk_about_this: focus.map(x => `Prepare one genuine example showing your capability in ${x}.`).slice(0, 5),
      underused_evidence: cvText ? ['Look for CV statements that describe responsibility but not the result. Prepare the real outcome, scale or learning.'] : [],
    },
    likely_questions: focus.map(x => `Tell me about a time you demonstrated ${x}.`).concat([`Why does ${clean(job.job_title)} at ${companyName} interest you?`, 'Tell me about a difficult guest or team situation and what you learned.']).slice(0, 9),
    hard_questions: gaps.slice(0, 4).map(x => ({ question: `This role asks for ${x}. Your profile does not clearly evidence it. How would you address that?`, prepare: ['Use the closest genuine transferable experience.', 'Be clear about what you have not done yet.', 'Show how you would learn or step up.'] })),
    commercial_talking_points: commercialTalkingPoints(level, employer),
    plan_30_60_90: plan306090(level, { name: companyName }),
    questions_to_ask: ['What would success in the first 90 days look like?', 'What are the biggest priorities for the spa team right now?', `How does ${companyName} measure guest experience and commercial success?`, 'What development opportunities are available?'],
    readiness: { overall: evidence.length >= 4 ? 78 : evidence.length >= 2 ? 68 : 58, message: 'Focus next on turning responsibilities into specific evidence and practising the areas the role may challenge.' },
  }
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) return NextResponse.json({ error: 'Server configuration is incomplete.' }, { status: 500 })

  const authClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Two-step verification applies to bearer tokens here exactly as in
  // getRequestUser: an account with a verified authenticator must present an
  // aal2 token - a password-only token is refused.
  try {
    const hasVerifiedFactor = Array.isArray((user as any).factors)
      && (user as any).factors.some((factor: any) => factor?.status === 'verified')
    if (hasVerifiedFactor) {
      const payload = JSON.parse(Buffer.from((token.split('.')[1] || ''), 'base64url').toString('utf8'))
      if (payload?.aal !== 'aal2') return NextResponse.json({ error: 'Two-step verification required' }, { status: 401 })
    }
  } catch { return NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }

  const supabase = createClient(url, key, {
    accessToken: async () => token,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  try {
    const body = await req.json().catch(() => ({}))
    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    if (!jobId) return NextResponse.json({ error: 'Choose a role to prepare for.' }, { status: 400 })

    const { data: candidate, error: candidateError } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    if (candidateError || !candidate) return NextResponse.json({ error: 'Complete your talent profile first.' }, { status: 404 })

    const credits = Math.max(0, Number(candidate.interview_ready_credits || 0))
    if (credits < 1) return NextResponse.json({
      error: 'You have used your Interview Ready allowance. A membership adds credits every month.',
      code: 'FEATURE_LOCKED',
      upgradeHref: '/talent/membership',
    }, { status: 403 })

    const { data: job, error: jobError } = await supabase.from('job_listings').select('*, employer_profiles(*)').eq('id', jobId).maybeSingle()
    if (jobError || !job) return NextResponse.json({ error: 'This role is no longer available.' }, { status: 404 })
    const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
    const cvText = await extractCvText(supabase, candidate.cv_url, user.id)
    const base = fallback(candidate, job, employer, cvText)
    const level = seniority(job)
    const focus = focusFor(level)

    const ai = await generatePreparation(`You are Interview Ready, a confidence builder for spa, wellness and luxury hospitality professionals from entry level through Director. Do not write robotic replacement answers and never invent evidence. Help the candidate understand the employer, the role, what in their own experience matters, and what to practise. Return JSON only with this structure: {"role_summary":"","why_you_match":[""],"strongest_evidence":[""],"gaps_or_risks":[""],"likely_questions":[""],"hard_questions":[{"question":"","prepare":[""]}],"questions_to_ask":[""],"readiness":{"overall":0,"message":""}}.\nCandidate profile: ${JSON.stringify({ ...candidate, cv_url: undefined })}\nCV text: ${JSON.stringify(cvText)}\nRole: ${JSON.stringify(job)}\nEmployer facts: ${JSON.stringify(companyFacts(employer))}\nSeniority: ${level}\nFocus: ${JSON.stringify(focus)}`)

    const preparation = ai ? {
      ...base,
      role_intelligence: { ...base.role_intelligence, role_summary: clean(ai.role_summary) || base.role_intelligence.role_summary },
      cv_match: {
        ...base.cv_match,
        why_you_match: list(ai.why_you_match).length ? list(ai.why_you_match) : base.cv_match.why_you_match,
        strongest_evidence: list(ai.strongest_evidence).length ? list(ai.strongest_evidence) : base.cv_match.strongest_evidence,
        gaps_or_risks: list(ai.gaps_or_risks).length ? list(ai.gaps_or_risks) : base.cv_match.gaps_or_risks,
      },
      likely_questions: list(ai.likely_questions).length ? list(ai.likely_questions) : base.likely_questions,
      hard_questions: Array.isArray(ai.hard_questions) && ai.hard_questions.length ? ai.hard_questions.slice(0, 5) : base.hard_questions,
      questions_to_ask: list(ai.questions_to_ask).length ? list(ai.questions_to_ask) : base.questions_to_ask,
      readiness: { overall: Math.max(0, Math.min(100, Number(ai.readiness?.overall) || base.readiness.overall)), message: clean(ai.readiness?.message) || base.readiness.message },
    } : base

    const nextCredits = credits - 1
    const { data: consumed, error: consumeError } = await supabase.from('candidate_profiles')
      .update({ interview_ready_credits: nextCredits })
      .eq('id', candidate.id)
      .eq('interview_ready_credits', credits)
      .select('interview_ready_credits')
      .maybeSingle()

    if (consumeError || !consumed) return NextResponse.json({ error: 'Your Interview Ready allowance changed. Please try again.', code: 'ALLOWANCE_CHANGED' }, { status: 409 })

    return NextResponse.json({ ...preparation, creditsRemaining: consumed.interview_ready_credits, source: { hasCv: Boolean(cvText), hasPlatformJob: true, usedAi: Boolean(ai) } })
  } catch (error) {
    console.error('Mobile Interview Ready failed', error)
    return NextResponse.json({ error: 'Interview Ready could not build your preparation. Please try again.' }, { status: 500 })
  }
}
