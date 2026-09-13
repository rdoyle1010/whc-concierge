import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyseCvText, type CvSuggestions } from '@/lib/cv-analysis'
import { cvReadingConfigured, readCv, type CvReading } from '@/lib/cv-read'

export const runtime = 'nodejs'

const MAX_CV_SIZE = 10 * 1024 * 1024

// Twenty-six, because that is what the host enforces.
//
// This said sixty, and sixty is not a number this platform can ask for: a
// synchronous function is killed at twenty-six seconds whatever the code
// claims. Underneath it the model was given forty-five, so the AI half of
// "Analyse CV with Talent House AI" could not finish even in principle. It
// timed out on essentially every attempt and fell back to plain extraction,
// which on screen read "AI was unavailable" - true, and telling nobody
// anything. The reader it now calls gives up at eighteen, inside the ceiling,
// with time left to answer properly.
export const maxDuration = 26

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

/**
 * The same reader the concierge queue uses, in the professional's own account.
 *
 * It used to be a second, narrower reader on a different provider that added
 * three fields to a deterministic pass. That left a profile at eighty per
 * cent with no headline and no About you, which is exactly the state somebody
 * gives up in, and it meant a person filling in her own profile got a worse
 * reading than one an administrator built for her. There is no version of
 * that which is right.
 *
 * So: one reader, one taxonomy, one set of fields. The deterministic pass
 * stays underneath it as a floor, because it costs nothing and it still finds
 * the obvious when the model cannot be reached at all.
 */
async function aiReadCv(text: string, deterministic: CvSuggestions): Promise<CvSuggestions | null> {
  lastAiFailure = ''
  if (!cvReadingConfigured()) {
    lastAiFailure = 'Talent House AI is not switched on for this deployment.'
    return null
  }

  const result = await readCv({ kind: 'text', text })
  if (!result.ok) { lastAiFailure = result.error; return null }

  const reading: CvReading = result.reading
  const merge = (a: string[] | undefined, b: string[] | undefined, limit: number) =>
    uniq([...(a || []), ...(b || [])], limit)

  return {
    ...deterministic,
    // The reading leads, and the deterministic pass fills its gaps rather
    // than the other way round: one is reading a CV, the other is matching
    // words against a list.
    roleLevel: reading.role_level && reading.role_level !== 'Unknown' ? reading.role_level : deterministic.roleLevel,
    experienceYears: reading.experience_years ?? deterministic.experienceYears,
    services: merge(reading.treatment_skills, deterministic.services, 60),
    productHouses: merge(reading.product_houses, deterministic.productHouses, 40),
    qualifications: merge(reading.qualifications, deterministic.qualifications, 40),
    systems: merge(reading.systems_experience, deterministic.systems, 30),
    businessSkills: merge(reading.business_skills, deterministic.businessSkills, 20),
    careerEvidence: uniq(deterministic.careerEvidence, 8),
    headline: reading.headline,
    bio: reading.bio,
    languages: uniq(reading.languages, 12),
    currentEmployer: reading.current_employer,
    location: reading.location,
    hotelBrands: uniq(reading.hotel_brands, 30),
    gaps: uniq(reading.gaps, 8),
    evidence: uniq([...(deterministic.evidence || []), 'Talent House AI read the whole CV'], 20),
    aiEnhanced: true,
  }
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
    const deterministic=analyseCvText(text), suggestions=await aiReadCv(text,deterministic)||deterministic
    try { await admin.from('consent_events').insert({user_id:user.id,consent_type:'ai_cv_analysis',action:'accepted',policy_version:'2026-08',wording:'User requested Talent House AI CV analysis. CV text is processed for suggestions and is not added to the profile without approval.',source:'talent_profile_cv_analysis'}) } catch {}
    // The reason travels with the answer. "AI was unavailable" on its own
    // sends somebody to check a key that was never the problem.
    return NextResponse.json({ suggestions, aiFailure: suggestions.aiEnhanced ? null : (lastAiFailure || null) })
  } catch { return NextResponse.json({error:'CV analysis failed. Please try a different PDF or Word .docx file.'},{status:500}) }
}
