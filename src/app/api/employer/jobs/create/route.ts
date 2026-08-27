import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodePostcode } from '@/lib/geo'
import { getRequestUser } from '@/lib/request-user'

const ALLOWED_FIELDS = [
  'job_title', 'job_description', 'job_image_url', 'location', 'location_postcode', 'radius_miles',
  'job_type', 'contract_type', 'required_role_level', 'candidate_scope', 'salary_min', 'salary_max',
  'required_skills', 'required_brands', 'required_qualifications', 'required_systems',
  'preferred_business_skills', 'min_years_experience', 'shift_pattern',
  'offers_accommodation', 'requirements', 'benefits', 'insurance_required',
  'is_agency_role', 'is_residency_role', 'tier', 'is_live', 'status',
] as const

const CANDIDATE_SCOPES = new Set(['same_level', 'step_up', 'emerging', 'open_transferable'])

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const body = await req.json()
  const admin = createAdminClient()
  const { data: employer } = await admin
    .from('employer_profiles')
    .select('id, postcode, latitude, longitude')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!employer) return NextResponse.json({ error: 'Employer profile not found.' }, { status: 404 })

  const payload: Record<string, unknown> = { employer_id: employer.id }
  for (const field of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) payload[field] = body[field]
  }

  if (!String(payload.job_title || '').trim() || !String(payload.location || '').trim()) {
    return NextResponse.json({ error: 'Job title and location are required.' }, { status: 400 })
  }
  if (!['draft', 'pending_payment'].includes(String(payload.status))) {
    return NextResponse.json({ error: 'Invalid job status.' }, { status: 400 })
  }
  if (!CANDIDATE_SCOPES.has(String(payload.candidate_scope || 'step_up'))) payload.candidate_scope = 'step_up'
  payload.is_live = false

  const rolePostcode = String(payload.location_postcode || '').trim()
  let coords: { latitude: number; longitude: number } | null = null
  if (rolePostcode) coords = await geocodePostcode(rolePostcode)
  if (!coords && employer.latitude != null && employer.longitude != null) coords = { latitude: employer.latitude, longitude: employer.longitude }
  if (!coords && employer.postcode) coords = await geocodePostcode(employer.postcode)
  if (coords) { payload.latitude = coords.latitude; payload.longitude = coords.longitude }

  const { data: job, error } = await admin.from('job_listings').insert(payload).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ job })
}
