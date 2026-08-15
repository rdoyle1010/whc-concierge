import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Public directory data is explicitly selected and shaped here. Never expose
// candidate_profiles.select('*') to an anonymous browser: that table also
// contains CVs, telephone numbers, documents and exact coordinates.
const SAFE_FIELDS = [
  'id', 'user_id', 'full_name', 'profile_image_url', 'role_level', 'headline',
  'bio', 'experience_years', 'location', 'postcode', 'services_offered',
  'product_houses', 'qualifications', 'systems_experience', 'review_score',
  'review_count', 'whc_verified', 'has_insurance', 'availability_status',
  'travel_availability', 'travel_radius_miles', 'hourly_rate', 'day_rate_min',
  'day_rate_max', 'agency_tier', 'is_featured', 'latitude', 'longitude',
  'created_at',
].join(',')

function outwardCode(value: unknown) {
  const clean = String(value || '').trim().toUpperCase().replace(/\s+/g, ' ')
  if (!clean) return null
  const parts = clean.split(' ')
  return parts.length > 1 ? parts[0] : clean
}

function publicCandidate(row: any) {
  return {
    ...row,
    // Only an approximate point is needed to rank by distance. Two decimal
    // places avoids publishing a therapist's precise home coordinate.
    latitude: typeof row.latitude === 'number' ? Math.round(row.latitude * 100) / 100 : null,
    longitude: typeof row.longitude === 'number' ? Math.round(row.longitude * 100) / 100 : null,
    postcode: outwardCode(row.postcode),
  }
}

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const id = req.nextUrl.searchParams.get('id')
  let query = admin.from('candidate_profiles')
    .select(SAFE_FIELDS)
    .eq('approval_status', 'approved')
    .eq('agency_available', true)

  if (id) query = query.eq('id', id)
  const { data, error } = await query
    .order('is_featured', { ascending: false })
    .order('review_score', { ascending: false })

  if (error) return NextResponse.json({ error: 'Directory unavailable' }, { status: 500 })
  const candidates = (data || []).map(publicCandidate)
  if (id && candidates.length === 0) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json(id ? { candidate: candidates[0] } : { candidates })
}
