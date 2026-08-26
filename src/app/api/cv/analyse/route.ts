import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyseCvText, type CvSuggestions } from '@/lib/cv-analysis'

export const runtime = 'nodejs'

const MAX_CV_SIZE = 10 * 1024 * 1024
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
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

async function aiEnhanceCv(text: string, deterministic: CvSuggestions): Promise<CvSuggestions | null> {
  if (!OPENAI_API_KEY) return null
  const prompt = `You are analysing a CV for Wellness House Collective, a spa and wellness recruitment platform.
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
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const response = await fetch('https://api.openai.com/v1/responses', { method:'POST', signal:controller.signal, headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({model:CV_MODEL,reasoning:{effort:'low'},input:prompt,max_output_tokens:1200}) })
    if (!response.ok) { console.error('CV AI analysis error', response.status); return null }
    const parsed = parseJson(extractResponseText(await response.json())); if (!parsed) return null
    return { ...deterministic, businessSkills:uniq([...(deterministic.businessSkills||[]),...uniq(parsed.businessSkills)],20), careerEvidence:uniq(parsed.careerEvidence,8), progressionSignals:uniq(parsed.progressionSignals,6), evidence:uniq([...(deterministic.evidence||[]),'AI reviewed transferable leadership and commercial evidence'],20), aiEnhanced:true }
  } catch (error) { console.error('CV AI analysis fallback', error instanceof Error ? error.message : error); return null } finally { clearTimeout(timeout) }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies:{ getAll(){return cookieStore.getAll()}, setAll(){} } })
    const { data:{ user } } = await auth.auth.getUser(); if (!user) return NextResponse.json({error:'Unauthorised'},{status:401})
    const body = await req.json().catch(()=>({})); const profileId = typeof body.profileId === 'string' ? body.profileId : ''
    if (!profileId) return NextResponse.json({error:'Profile is required'},{status:400})
    if (body.aiConsent !== true) return NextResponse.json({error:'Please confirm that you want WHC AI to analyse your CV.'},{status:400})

    const admin=createAdminClient(); const {data:profile}=await admin.from('candidate_profiles').select('user_id, cv_url').eq('id',profileId).single()
    if(!profile||profile.user_id!==user.id)return NextResponse.json({error:'Forbidden'},{status:403}); if(!profile.cv_url)return NextResponse.json({error:'Upload a CV first'},{status:400})
    const fileUrl=new URL(profile.cv_url,'https://whc.local'), bucket=fileUrl.searchParams.get('bucket'), path=fileUrl.searchParams.get('path')
    if(bucket!=='talent-documents'||!path||!path.startsWith(`${user.id}/`)||path.includes('..'))return NextResponse.json({error:'CV storage reference is invalid'},{status:400})
    const extension=path.split('.').pop()?.toLowerCase()||''; if(!['pdf','docx'].includes(extension))return NextResponse.json({error:'For CV analysis, please use a PDF or modern Word .docx file.'},{status:400})
    const {data:file,error}=await admin.storage.from(bucket).download(path); if(error||!file)return NextResponse.json({error:'CV could not be read'},{status:500}); if(file.size>MAX_CV_SIZE)return NextResponse.json({error:'CV is too large to analyse'},{status:400})
    const text=await extractText(Buffer.from(await file.arrayBuffer()),extension); if(text.trim().length<80)return NextResponse.json({error:'Very little readable text was found. If this is a scanned CV, upload a text-based PDF or Word .docx file.'},{status:422})
    const deterministic=analyseCvText(text), suggestions=await aiEnhanceCv(text,deterministic)||deterministic
    try { await admin.from('consent_events').insert({user_id:user.id,consent_type:'ai_cv_analysis',action:'accepted',policy_version:'2026-08',wording:'User requested WHC AI CV analysis. CV text is processed for suggestions and is not added to the profile without approval.',source:'talent_profile_cv_analysis'}) } catch {}
    return NextResponse.json({suggestions})
  } catch { return NextResponse.json({error:'CV analysis failed. Please try a different PDF or Word .docx file.'},{status:500}) }
}
