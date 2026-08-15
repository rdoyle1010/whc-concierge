import { createHmac, timingSafeEqual } from 'node:crypto'

export type RegistrationRole = 'talent' | 'employer'

type RegistrationProof = {
  sub: string
  role: RegistrationRole
  email: string
  exp: number
}

const PROOF_LIFETIME_SECONDS = 15 * 60

function proofSecret() {
  const secret = process.env.REGISTRATION_PROOF_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Registration proof secret is not configured')
  return secret
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function sign(payload: string) {
  return createHmac('sha256', proofSecret()).update(`whc-registration-v1.${payload}`).digest('base64url')
}

export function createRegistrationProof(input: { userId: string; role: RegistrationRole; email: string }) {
  const payload: RegistrationProof = {
    sub: input.userId,
    role: input.role,
    email: input.email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + PROOF_LIFETIME_SECONDS,
  }
  const encoded = encode(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function verifyRegistrationProof(
  token: unknown,
  expected?: { userId?: string; role?: RegistrationRole },
): RegistrationProof | null {
  if (typeof token !== 'string' || token.length > 2048) return null
  const [encoded, signature, extra] = token.split('.')
  if (!encoded || !signature || extra) return null

  const expectedSignature = sign(encoded)
  const supplied = Buffer.from(signature)
  const wanted = Buffer.from(expectedSignature)
  if (supplied.length !== wanted.length || !timingSafeEqual(supplied, wanted)) return null

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as RegistrationProof
    if (!parsed.sub || !parsed.email || !['talent', 'employer'].includes(parsed.role)) return null
    if (!Number.isInteger(parsed.exp) || parsed.exp < Math.floor(Date.now() / 1000)) return null
    if (expected?.userId && parsed.sub !== expected.userId) return null
    if (expected?.role && parsed.role !== expected.role) return null
    return parsed
  } catch {
    return null
  }
}

function text(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function optionalNumber(value: unknown, min: number, max: number) {
  if (value === '' || value === null || value === undefined) return null
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return null
  return Math.min(max, Math.max(min, Math.round(number)))
}

function textArray(value: unknown, maxItems = 100, maxLength = 120) {
  if (!Array.isArray(value)) return null
  const values = value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim().slice(0, maxLength))
    .filter(Boolean)
  return values.length ? Array.from(new Set(values)).slice(0, maxItems) : null
}

export function isOwnedRegistrationDocumentUrl(value: unknown, userId: string) {
  if (typeof value !== 'string' || !value.startsWith('/api/files?')) return false
  try {
    const url = new URL(value, 'https://whc.local')
    const path = url.searchParams.get('path') || ''
    return url.pathname === '/api/files'
      && url.searchParams.get('bucket') === 'talent-documents'
      && path.startsWith(`${userId}/`)
      && !path.includes('..')
      && !path.includes('\\')
  } catch {
    return false
  }
}

export function sanitiseTalentRegistration(input: unknown, userId: string) {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const cvUrl = isOwnedRegistrationDocumentUrl(source.cv_url, userId) ? source.cv_url as string : null
  const insuranceUrl = isOwnedRegistrationDocumentUrl(source.insurance_document_url, userId)
    ? source.insurance_document_url as string
    : null
  const certificateUrls = Array.isArray(source.certificates_urls)
    ? source.certificates_urls
      .filter(value => isOwnedRegistrationDocumentUrl(value, userId))
      .slice(0, 12) as string[]
    : []

  const row: Record<string, unknown> = {
    user_id: userId,
    full_name: text(source.full_name, 160),
    phone: text(source.phone, 40),
    postcode: text(source.postcode, 20),
    location: text(source.postcode || source.location, 120),
    has_car: source.has_car === true,
    role_level: text(source.role_level, 120),
    bio: text(source.bio, 4000),
    headline: text(source.headline, 240),
    experience_years: optionalNumber(source.experience_years, 0, 80),
    day_rate_min: optionalNumber(source.day_rate_min, 0, 10000),
    day_rate_max: optionalNumber(source.day_rate_max, 0, 10000),
    availability_status: text(source.availability_status, 80),
    services_offered: textArray(source.services_offered),
    product_houses: textArray(source.product_houses),
    qualifications: textArray(source.qualifications),
    systems_experience: textArray(source.systems_experience),
    travel_availability: text(source.travel_availability, 80),
    travel_radius_miles: optionalNumber(source.travel_radius_miles, 0, 10000),
    has_insurance: source.has_insurance === true && Boolean(insuranceUrl),
    insurance_document_url: insuranceUrl,
    cv_url: cvUrl,
    certificates_urls: certificateUrls.length ? certificateUrls : null,
    agreed_terms: source.agreed_terms === true,
    approval_status: 'pending',
  }

  let score = 0
  if (row.full_name) score += 10
  if (row.phone) score += 5
  if (row.role_level) score += 15
  if (row.bio) score += 10
  if (row.headline) score += 5
  if ((row.services_offered as string[] | null)?.length) score += 15
  if ((row.product_houses as string[] | null)?.length) score += 10
  if ((row.qualifications as string[] | null)?.length) score += 15
  if (cvUrl) score += 10
  if (row.has_insurance) score += 5
  row.profile_completion_score = score

  return row
}

export function sanitiseEmployerRegistration(input: unknown, userId: string, verifiedEmail: string) {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const companyName = text(source.company_name || source.property_name, 200)
  return {
    user_id: userId,
    company_name: companyName,
    property_name: companyName,
    contact_name: text(source.contact_name, 160),
    contact_email: verifiedEmail.trim().toLowerCase(),
    contact_phone: text(source.contact_phone, 40),
    website: text(source.website, 500),
    location: text(source.location || source.postcode, 160),
    postcode: text(source.postcode, 20),
    company_type: text(source.company_type, 120),
    about_text: text(source.about_text, 4000),
    product_houses_used: textArray(source.product_houses_used),
    systems_used: textArray(source.systems_used),
    num_treatment_rooms: optionalNumber(source.num_treatment_rooms, 0, 10000),
    team_size: optionalNumber(source.team_size, 0, 100000),
    work_email: text(source.work_email, 320),
    agreed_terms: source.agreed_terms === true,
    approval_status: 'pending',
  }
}
