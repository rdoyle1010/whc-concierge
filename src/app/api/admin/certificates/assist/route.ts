import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { HOUSE_RULES } from '@/lib/house-style'
import { askForJson, aiConfigured, AI_MODEL } from '@/lib/ai'

// AI review assistant for certificate verification. It reasons about the
// submission details (qualification name, awarding body, country, year)
// against known industry awarding bodies and drafts the message to the
// professional for each possible outcome. It only ever ASSISTS - Rebecca
// makes the decision, and the assistant is told to be honest about what a
// document check cannot prove.


// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

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

    if (!aiConfigured()) {
      return NextResponse.json({
        assessment: 'AI assistance is not switched on (ANTHROPIC_API_KEY is not set). Review the document manually: check the name matches the profile, the awarding body is legible on the certificate, and the qualification title matches what was submitted.',
        checks: [],
        drafts: null,
        model: 'fallback',
      })
    }

    const prompt = `You are the certificate verification assistant for Talent House Collective, the UK's specialist recruitment platform for luxury spa, wellness and hospitality. An admin is reviewing a qualification certificate a professional has submitted. Your job: help the admin review it well, and draft the message to the professional for each possible outcome.

Submission:
- Qualification title: ${certificate.title}
- Awarding body: ${certificate.awarding_body || 'not stated'}
- Country of training: ${certificate.country || 'not stated'}
- Year awarded: ${certificate.year_awarded || 'not stated'}
- Professional: ${candidate?.full_name || 'unknown'}, role level ${candidate?.role_level || 'unknown'}, ${candidate?.experience_years || '?'} years experience, based ${candidate?.location_country || 'UK'}
- Treatments they offer: ${(candidate?.services_offered || []).slice(0, 10).join(', ') || 'none listed'}
- Other stated qualifications: ${(candidate?.qualifications || []).join(', ') || 'none listed'}

You know the spa and beauty qualification landscape: international bodies (CIDESCO, CIBTAC, ITEC), UK bodies (VTCT, City & Guilds, NVQ levels 2-4, BTEC), and that many excellent professionals trained overseas under national systems (e.g. South Africa's SAAHSP, Australia's Certificate III/IV, US state licensure, Philippines TESDA). Be honest about what a document review can and cannot prove: Talent House checks that the document is a genuine-looking certificate matching the submitted details and the person's name - it does not contact the awarding body unless escalated.

Return STRICT JSON, no markdown, with exactly these keys:
{
  "assessment": "3-5 sentences for the admin: what this qualification is, whether the body is recognised, whether the details are internally consistent (does the qualification fit their treatments/experience?), and your overall read",
  "recognition": "one of: well_known | recognised | unfamiliar | inconsistent",
  "checks": ["4-6 short imperative checks the admin should do on the opened document, specific to THIS submission"],
  "equivalence_note": "1-2 sentences on how this maps to UK expectations (e.g. broadly NVQ Level 3 equivalent) - only if you are reasonably confident, otherwise say an equivalence judgement needs the Talent House review table",
  "drafts": {
    "verified": "warm message to the professional confirming verification, congratulating them, and noting the badge now shows to employers. 40-80 words, UK English.",
    "more_info": "kind message asking for what is most likely missing (full document, awarding body visible, name matching profile, English translation if applicable). Specific to this submission. 40-90 words.",
    "rejected": "respectful message explaining the document could not be verified as submitted, what they can do next (resubmit with corrections, contact the awarding body for a verification letter, or use ENIC for international equivalence), and that Talent House is happy to help. Never accusatory. 50-100 words."
  }
}`

    const result = await askForJson<any>({
      label: 'certificate assist', tier: 'writing',
      system: HOUSE_RULES, prompt, maxTokens: 900,
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }
    const parsed: any = result.data
    if (!parsed?.assessment) {
      return NextResponse.json({
        assessment: 'The assistant returned nothing useful. Review this one by hand.',
        checks: [], drafts: null, model: AI_MODEL,
      })
    }
    return NextResponse.json({ ...parsed, model: AI_MODEL })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Assist failed.' }, { status: 500 })
  }
}
