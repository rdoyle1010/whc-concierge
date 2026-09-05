import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// Help a spa manager write an advert.
//
// The eleven fields that make somebody want a job - why the role exists, what
// success looks like at ninety days, why move here - are the best thing on a
// listing and the most likely to be left blank, because they are genuinely
// hard to write and the person writing them runs a spa rather than a copy
// desk. A weak advert is the commonest reason a good role does not fill.
//
// Two rules hold this to something honest:
//
//   It drafts, it never publishes. Everything comes back for the employer to
//   read and edit. Nothing written here reaches a candidate unread.
//
//   It rewrites, it never invents. The model is given the facts already on
//   the role and told plainly that anything not there is not available. A
//   property whose advert promises a team of twelve it does not have is a
//   problem that surfaces at interview, in front of the person you were
//   trying to impress.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_APPLICATION_MODEL = process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'

const STORY_FIELDS = [
  'why_role_exists', 'success_90_days', 'reporting_line', 'opening_hours',
  'commercial_responsibility', 'why_move', 'career_progression', 'interview_process',
] as const

// reporting_line, team_size and membership_size are facts, not prose. The
// model is never asked to produce a number nobody gave it.
const POLISHABLE = new Set<string>([
  'job_description', 'why_role_exists', 'success_90_days', 'commercial_responsibility',
  'why_move', 'career_progression', 'interview_process', 'requirements', 'benefits',
])

const HOUSE_STYLE = [
  'British English throughout.',
  'Plain, confident, specific. No corporate filler, no "fast-paced dynamic environment", no "wear many hats".',
  'Never use an em dash. Use a comma, a full stop, or a hyphen.',
  'Do not invent facts. Only use what you are given. If something is not stated, leave it out rather than guessing.',
  'Do not promise salary, benefits, progression or team size unless those exact details were provided.',
  'Write as the property speaking to a professional it respects, not as a job board.',
].join(' ')

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
    }
  }
  return ''
}

async function ask(input: string, maxTokens: number) {
  if (!OPENAI_API_KEY) throw new Error('The writing assistant is not configured yet.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_APPLICATION_MODEL,
      reasoning: { effort: 'low' },
      input,
      max_output_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error(`Job copy assistant failed ${response.status}:`, detail.slice(0, 500))
    throw new Error('The writing assistant is temporarily unavailable. Please try again.')
  }

  return extractResponseText(await response.json()).trim()
}

/** What the model is allowed to know. Nothing else about the property. */
function factsFor(role: Record<string, any>) {
  const facts: string[] = []
  const add = (label: string, value: unknown) => {
    const text = Array.isArray(value) ? value.join(', ') : String(value ?? '').trim()
    if (text) facts.push(`${label}: ${text}`)
  }
  add('Job title', role.job_title)
  add('Property', role.property_name)
  add('Location', role.location)
  add('Contract', role.contract_type)
  add('Hours', role.job_type)
  if (role.salary_min && role.salary_max) add('Salary', `£${role.salary_min} to £${role.salary_max}`)
  add('Level', role.required_role_level)
  add('Reporting line', role.reporting_line)
  add('Team size', role.team_size)
  add('Opening hours', role.opening_hours)
  add('Membership size', role.membership_size)
  add('Required skills', role.required_skills)
  add('Required product houses', role.required_brands)
  add('Required qualifications', role.required_qualifications)
  add('Required systems', role.required_systems)
  add('Shift pattern', role.shift_pattern)
  add('Benefits', role.benefits)
  add('Existing description', role.job_description)
  return facts.length ? facts.join('\n') : 'No details have been entered yet.'
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode === 'draft_story' ? 'draft_story' : 'polish'
    const admin = createAdminClient()

    const { data: employer } = await admin.from('employer_profiles')
      .select('id, property_name, company_name').eq('user_id', user.id).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Only a property can use this.' }, { status: 403 })

    // The role as it stands. A jobId is optional so this works while a role
    // is still being written and has no id yet; anything sent without one is
    // taken from the form as-is.
    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    let role: Record<string, any> = { ...(body.role || {}) }
    if (jobId) {
      const { data: saved } = await admin.from('job_listings').select('*')
        .eq('id', jobId).eq('employer_id', employer.id).maybeSingle()
      if (!saved) return NextResponse.json({ error: 'That role is not yours.' }, { status: 403 })
      role = { ...saved, ...role }
    }
    role.property_name = employer.property_name || employer.company_name || ''

    if (mode === 'polish') {
      const field = String(body.field || '')
      const draft = String(body.text || '').trim().slice(0, 4000)
      if (!POLISHABLE.has(field)) return NextResponse.json({ error: 'That field cannot be rewritten.' }, { status: 400 })
      if (draft.length < 10) return NextResponse.json({ error: 'Write a little more first, then this can tidy it.' }, { status: 400 })

      const text = await ask([
        'You are helping a luxury spa or hotel write one part of a job advert.',
        HOUSE_STYLE,
        '',
        'Facts about the role. You may use these and nothing else:',
        factsFor(role),
        '',
        `The employer wrote this for the field "${field}":`,
        draft,
        '',
        'Rewrite it so it reads well and says the same thing. Keep every fact they gave.',
        'Do not add facts they did not give. Do not make it longer than it needs to be.',
        'Reply with the rewritten text only. No preamble, no quotation marks, no explanation.',
      ].join('\n'), 900)

      if (!text) return NextResponse.json({ error: 'Nothing came back. Please try again.' }, { status: 502 })
      return NextResponse.json({ text })
    }

    // draft_story: propose the fields that are hard to write, from notes.
    const notes = String(body.notes || '').trim().slice(0, 4000)
    if (notes.length < 20) {
      return NextResponse.json({ error: 'Give it a few lines about the role first - rough notes are fine.' }, { status: 400 })
    }

    const raw = await ask([
      'You are helping a luxury spa or hotel turn rough notes into the parts of a job advert that persuade somebody to apply.',
      HOUSE_STYLE,
      '',
      'Facts about the role. You may use these and nothing else:',
      factsFor(role),
      '',
      'The employer notes:',
      notes,
      '',
      'Return JSON only, with exactly these keys, each a string:',
      JSON.stringify(STORY_FIELDS),
      '',
      'Guidance for each:',
      'why_role_exists: a new opening, a promotion, somebody leaving. Two sentences at most.',
      'success_90_days: what would be settled by the end of a first quarter. Concrete.',
      'reporting_line: only if stated in the facts or notes, otherwise an empty string.',
      'opening_hours: only if stated, otherwise an empty string.',
      'commercial_responsibility: what this person owns commercially. Empty string if not stated.',
      'why_move: the honest case for this property. No superlatives you cannot support.',
      'career_progression: where this leads. Empty string if nothing supports an answer.',
      'interview_process: the stages, who they meet, roughly how long. Empty string if not stated.',
      '',
      'An empty string is the right answer whenever the facts and notes do not support one. Never fill a gap with something plausible.',
    ].join('\n'), 1800)

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Job copy assistant returned unparseable JSON:', cleaned.slice(0, 300))
      return NextResponse.json({ error: 'The draft came back malformed. Please try again.' }, { status: 502 })
    }

    // Only the keys asked for, only strings, and trimmed. A model that
    // invents an extra key must not be able to write it onto a listing.
    const draft: Record<string, string> = {}
    for (const field of STORY_FIELDS) {
      const value = parsed[field]
      if (typeof value === 'string' && value.trim()) draft[field] = value.trim().slice(0, 2000)
    }

    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'The writing assistant failed.' }, { status: 500 })
  }
}
