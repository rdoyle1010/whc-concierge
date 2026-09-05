import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { renderCandidateCvPdf, type CandidateCv, type CvCertificate } from '@/lib/candidate-cv-pdf'

// A professional's own CV, from their own profile.
//
// Cookie or bearer, so the app can offer it too. Nobody else's CV is
// reachable from here: the profile is looked up by the signed-in user id and
// there is no id to pass in, because a downloadable document keyed on
// somebody else's id is how a CV, a photograph and a location leak.

export const maxDuration = 30

const list = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(v => String(v ?? '').trim()).filter(Boolean)
  const single = String(value ?? '').trim()
  return single ? [single] : []
}

/** Awards are stored loosely: strings from old rows, objects from the editor. */
function normaliseAwards(raw: unknown): Array<{ name: string; year: string | null }> {
  if (!Array.isArray(raw)) return []
  return raw.map((item: any) => {
    if (typeof item === 'string' && item.trim()) return { name: item.trim(), year: null }
    if (item && typeof item === 'object') {
      const name = item.name || item.title || item.award
      if (typeof name !== 'string' || !name.trim()) return null
      return { name: name.trim(), year: item.year != null && item.year !== '' ? String(item.year) : null }
    }
    return null
  }).filter(Boolean) as Array<{ name: string; year: string | null }>
}

function titleFromSlug(slug: string) {
  return slug.split('-').map(word => word ? word[0].toUpperCase() + word.slice(1) : '').join(' ').trim()
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Complete your profile first.' }, { status: 404 })

  const name = String(candidate.full_name || '').trim()
  if (!name) return NextResponse.json({ error: 'Add your name to your profile before downloading a CV.' }, { status: 400 })

  // Only completed courses, and only ones with a code. A certificate on a CV
  // that cannot be checked is worth less than no certificate at all.
  let certificates: CvCertificate[] = []
  try {
    const { data: rows } = await admin.from('course_enrollments')
      .select('course_slug, completed_at, certificate_code')
      .eq('candidate_id', candidate.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(30)
    certificates = (rows || [])
      .filter((row: any) => row.certificate_code)
      .map((row: any) => ({
        title: titleFromSlug(String(row.course_slug || '')),
        code: row.certificate_code,
        completed: row.completed_at
          ? new Date(row.completed_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
          : null,
      }))
  } catch {
    // A missing table is not a reason to withhold somebody's CV.
    certificates = []
  }

  const cv: CandidateCv = {
    fullName: name,
    headline: candidate.headline || null,
    bio: candidate.bio || null,
    roleLevel: candidate.role_level || null,
    yearsExperience: Number(candidate.years_experience ?? candidate.experience_years ?? 0) || null,
    location: candidate.location || null,
    photo: candidate.profile_image_url || null,
    verified: Boolean(candidate.whc_verified),
    services: list(candidate.services_offered),
    treatments: list(candidate.treatment_skills),
    productHouses: list(candidate.product_houses),
    systems: list(candidate.systems_experience),
    qualifications: list(candidate.qualifications),
    businessSkills: list(candidate.business_skills ?? candidate.preferred_business_skills),
    languages: list(candidate.languages),
    awards: normaliseAwards(candidate.awards),
    certificates,
  }

  try {
    const pdf = await renderCandidateCvPdf(cv)
    const safeName = name.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/\s+/g, '-') || 'Professional'
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}-Talent-House-CV.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: any) {
    console.error('[Candidate CV] PDF generation failed:', error?.message)
    return NextResponse.json({ error: 'Could not build your CV - please try again.' }, { status: 500 })
  }
}
