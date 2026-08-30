import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// AI review assistant for certificate verification. It reasons about the
// submission details (qualification name, awarding body, country, year)
// against known industry awarding bodies and drafts the message to the
// professional for each possible outcome. It only ever ASSISTS - Rebecca
// makes the decision, and the assistant is told to be honest about what a
// document check cannot prove.

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

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Certificate is required.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: certificate } = await admin.from('certificate_submissions')
      .select('id,candidate_id,title,awarding_body,country,year_awarded,status')
      .eq('id', id).maybeSingle()
    if (!certificate) return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 })

    const { data: candidate } = await admin.from('candidate_profiles')
      .select('full_name,role_level,experience_years,services_offered,qualifications,location_country')
      .eq('id', certificate.candidate_id).maybeSingle()

    if (!OPENAI_API_KEY) {
      return NextResponse.json({
        assessment: 'AI assistance is not configured (no API key). Review the document manually: check the name matches the profile, the awarding body is legible on the certificate, and the qualification title matches what was submitted.',
        checks: [],
        drafts: null,
        model: 'fallback',
      })
    }

    const prompt = `You are the certificate verification assistant for WHC Concierge, the UK's specialist recruitment platform for luxury spa, wellness and hospitality. An admin is reviewing a qualification certificate a professional has submitted. Your job: help the admin review it well, and draft the message to the professional for each possible outcome.

Submission:
- Qualification title: ${certificate.title}
- Awarding body: ${certificate.awarding_body || 'not stated'}
- Country of training: ${certificate.country || 'not stated'}
- Year awarded: ${certificate.year_awarded || 'not stated'}
- Professional: ${candidate?.full_name || 'unknown'}, role level ${candidate?.role_level || 'unknown'}, ${candidate?.experience_years || '?'} years experience, based ${candidate?.location_country || 'UK'}
- Treatments they offer: ${(candidate?.services_offered || []).slice(0, 10).join(', ') || 'none listed'}
- Other stated qualifications: ${(candidate?.qualifications || []).join(', ') || 'none listed'}

You know the spa and beauty qualification landscape: international bodies (CIDESCO, CIBTAC, ITEC), UK bodies (VTCT, City & Guilds, NVQ levels 2-4, BTEC), and that many excellent professionals trained overseas under national systems (e.g. South Africa's SAAHSP, Australia's Certificate III/IV, US state licensure, Philippines TESDA). Be honest about what a document review can and cannot prove: WHC checks that the document is a genuine-looking certificate matching the submitted details and the person's name - it does not contact the awarding body unless escalated.

Return STRICT JSON, no markdown, with exactly these keys:
{
  "assessment": "3-5 sentences for the admin: what this qualification is, whether the body is recognised, whether the details are internally consistent (does the qualification fit their treatments/experience?), and your overall read",
  "recognition": "one of: well_known | recognised | unfamiliar | inconsistent",
  "checks": ["4-6 short imperative checks the admin should do on the opened document, specific to THIS submission"],
  "equivalence_note": "1-2 sentences on how this maps to UK expectations (e.g. broadly NVQ Level 3 equivalent) - only if you are reasonably confident, otherwise say an equivalence judgement needs the WHC review table",
  "drafts": {
    "verified": "warm message to the professional confirming verification, congratulating them, and noting the badge now shows to employers. 40-80 words, UK English.",
    "more_info": "kind message asking for what is most likely missing (full document, awarding body visible, name matching profile, English translation if applicable). Specific to this submission. 40-90 words.",
    "rejected": "respectful message explaining the document could not be verified as submitted, what they can do next (resubmit with corrections, contact the awarding body for a verification letter, or use ENIC for international equivalence), and that WHC is happy to help. Never accusatory. 50-100 words."
  }
}`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OPENAI_APPLICATION_MODEL, reasoning: { effort: 'low' }, input: prompt, max_output_tokens: 900 }),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`Certificate assist failed ${response.status}:`, detail.slice(0, 300))
      return NextResponse.json({ error: 'The AI assistant is unavailable right now - review manually or try again.' }, { status: 502 })
    }
    const payload = await response.json()
    const raw = extractResponseText(payload).trim()
    let parsed: any = null
    try { parsed = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '')) } catch { /* fall through */ }
    if (!parsed?.assessment) {
      return NextResponse.json({ assessment: raw.slice(0, 1500) || 'The assistant returned nothing useful - review manually.', checks: [], drafts: null, model: OPENAI_APPLICATION_MODEL })
    }
    return NextResponse.json({ ...parsed, model: OPENAI_APPLICATION_MODEL })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Assist failed.' }, { status: 500 })
  }
}
