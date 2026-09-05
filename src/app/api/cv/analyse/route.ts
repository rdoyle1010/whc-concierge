import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyseCvText, type CvSuggestions } from '@/lib/cv-analysis'

export const runtime = 'nodejs'

const MAX_CV_SIZE = 10 * 1024 * 1024
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
// A reasoning model reading eighteen thousand characters of CV does not
// answer in seven seconds. The abort below was set to 7000ms and the route
// had no maxDuration at all, so it inherited the platform default of ten -
// which meant the AI half of "Analyse CV with Talent House AI" timed out
// almost every time and fell back to plain extraction. On screen that read
// "AI was unavailable", which is true and tells nobody anything: not the
// professional, not the administrator, and not whoever is asked to fix it.
export const maxDuration = 60
const AI_TIMEOUT_MS = 45000

const CV_MODEL = process.env.OPENAI_CV_MODEL || process.env.OPENAI_APPLICATION_MODEL || 'gpt-5-mini'

async function extractText(buffer: Buffer, extension: string): Promise<string> {
  if (extension === 'pdf') {
    const { CanvasFactory } = await import('pdf-parse/worker')
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: new Uint8Array(buffer), CanvasFactory })
    try { return (await parser.getText()).text } finally { await parser.destroy() }
  }
  if (extension === 'docx') {
    const mammoth = await import('mammoth')
    return (await mammoth.extractRawText({ buffer })).value
  }
  throw new Error('Unsupported CV format')
}

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text
  for (const item of payload?.output || []) for (const content of item?.content || []) if (content?.type === 'output_text' && typeof content.text === 'string') return content.text
  return ''
}
function parseJson(text: string) {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const first = stripped.indexOf('{'), last = stripped.lastIndexOf('}')
  if (first >= 0 && last > first) { try { return JSON.parse(stripped.slice(first, last + 1)) } catch {} }
  return null
}
const uniq = (values: unknown, limit = 20) => Array.from(new Set((Array.isArray(values) ? values : []).map(v => String(v).trim()).filter(Boolean))).slice(0, limit)

// Why the AI half did not run, when it did not run. Returned alongside the
// suggestions so the screen can say something a person can act on.
let lastAiFailure = ''

async function aiEnhanceCv(text: string, deterministic: CvSuggestions): Promise<CvSuggestions | null> {
  lastAiFailure = ''
  if (!OPENAI_API_KEY) { lastAiFailure = 'No OpenAI key is set on the server.'; return null }
  const prompt = `You are analysing a CV for Talent House Collective, a spa and wellness recruitment platform.
Rules:
- Extract only evidence genuinely supported by the CV text. Never invent employers, results, qualifications, dates, job titles or responsibilities.
- Do not change the person's current/actual seniority just because they appear ready for progression.
- Identify transferable leadership/commercial evidence that may support a step-up role.
- Keep careerEvidence short, factual and paraphrased. Do not quote personal contact details.
- businessSkills must use only these labels where supported: Reception & Front of House, Revenue Management, Stock Control, Team Leadership, Staff Training, Rota Management, KPI Reporting, Health & Safety, COSHH Management, Budget Management, Client Consultation, Upselling & Retail, Social Media, Event Coordination, Membership Management.
- progressionSignals should explain readiness evidence but must not state that the person automatically qualifies.
- Return JSON only.
Deterministic extraction already found: ${JSON.stringify(deterministic)}
CV text: ${text.slice(0, 18000)}
Return exactly: {"businessSkills":["..."],"careerEvidence":["..."],"progressionSignals":["..."]}`
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', { method:'POST', signal:controller.signal, headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({model:CV_MODEL,reasoning:{effort:'low'},input:prompt,max_output_tokens:1200}) })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('CV AI analysis error', response.status, detail.slice(0, 400))
      lastAiFailure = response.status === 401 ? 'The OpenAI key was rejected.'
        : response.status === 404 ? `The model "${CV_MODEL}" is not available on this account.`
        : response.status === 429 ? 'OpenAI rate limited or the account is out of credit.'
        : `OpenAI answered ${response.status}.`
      return null
    }
    const parsed = parseJson(extractResponseText(await response.json())); if (!parsed) { lastAiFailure = 'The model replied with something that was not JSON.'; return null }
    return { ...deterministic, businessSkills:uniq([...(deterministic.businessSkills||[]),...uniq(parsed.businessSkills)],20), careerEvidence:uniq(parsed.careerEvidence,8), progressionSignals:uniq(parsed.progressionSignals,6), evidence:uniq([...(deterministic.evidence||[]),'AI reviewed transferable leadership and commercial evidence'],20), aiEnhanced:true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('CV AI analysis fallback', message)
    lastAiFailure = /abort/i.test(message)
      ? `The model did not answer within ${Math.round(AI_TIMEOUT_MS / 1000)} seconds.`
      : `The request to OpenAI failed: ${message}`
    return null
  } finally { clearTimeout(timeout) }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies:{ getAll(){return cookieStore.getAll()}, setAll(){} } })
    const { data:{ user } } = await auth.auth.getUser(); if (!user) return NextResponse.json({error:'Unauthorised'},{status:401})
    const body = await req.json().catch(()=>({})); const profileId = typeof body.profileId === 'string' ? body.profileId : ''
    if (!profileId) return NextResponse.json({error:'Profile is required'},{status:400})
    if (body.aiConsent !== true) return NextResponse.json({error:'Please confirm that you want Talent House AI to analyse your CV.'},{status:400})

    const admin=createAdminClient(); const {data:profile}=await admin.from('candidate_profiles').select('user_id, cv_url').eq('id',profileId).single()
    if(!profile||profile.user_id!==user.id)return NextResponse.json({error:'Forbidden'},{status:403}); if(!profile.cv_url)return NextResponse.json({error:'Upload a CV first'},{status:400})
    const fileUrl=new URL(profile.cv_url,'https://whc.local'), bucket=fileUrl.searchParams.get('bucket'), path=fileUrl.searchParams.get('path')
    if(bucket!=='talent-documents'||!path||!path.startsWith(`${user.id}/`)||path.includes('..'))return NextResponse.json({error:'CV storage reference is invalid'},{status:400})
    const extension=path.split('.').pop()?.toLowerCase()||''; if(!['pdf','docx'].includes(extension))return NextResponse.json({error:'For CV analysis, please use a PDF or modern Word .docx file.'},{status:400})
    const {data:file,error}=await admin.storage.from(bucket).download(path); if(error||!file)return NextResponse.json({error:'CV could not be read'},{status:500}); if(file.size>MAX_CV_SIZE)return NextResponse.json({error:'CV is too large to analyse'},{status:400})
    const text=await extractText(Buffer.from(await file.arrayBuffer()),extension); if(text.trim().length<80)return NextResponse.json({error:'Very little readable text was found. If this is a scanned CV, upload a text-based PDF or Word .docx file.'},{status:422})
    const deterministic=analyseCvText(text), suggestions=await aiEnhanceCv(text,deterministic)||deterministic
    try { await admin.from('consent_events').insert({user_id:user.id,consent_type:'ai_cv_analysis',action:'accepted',policy_version:'2026-08',wording:'User requested Talent House AI CV analysis. CV text is processed for suggestions and is not added to the profile without approval.',source:'talent_profile_cv_analysis'}) } catch {}
    // The reason travels with the answer. "AI was unavailable" on its own
    // sends somebody to check a key that was never the problem.
    return NextResponse.json({ suggestions, aiFailure: suggestions.aiEnhanced ? null : (lastAiFailure || null) })
  } catch { return NextResponse.json({error:'CV analysis failed. Please try a different PDF or Word .docx file.'},{status:500}) }
}
