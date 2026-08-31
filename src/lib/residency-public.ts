export type PublicResidencyProfile = {
  id: string
  reference: string
  title: string | null
  bio: string | null
  primary_specialism: string | null
  secondary_specialisms: string[]
  qualifications: string[]
  brand_experience: string[]
  current_location: string | null
  travel_availability: string | null
  preferred_duration: string | null
  day_rate: number | null
  weekly_rate: number | null
  monthly_rate: number | null
  negotiable: boolean
  available_from: string | null
  years_experience: number | null
  is_featured: boolean
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim())
    : []
}

function scrubContactText(value: unknown, fullName?: string | null) {
  let text = typeof value === 'string' ? value.trim() : ''
  if (!text) return null

  text = text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[contact details protected]')
    .replace(/https?:\/\/\S+|www\.\S+/gi, '[external link protected]')
    .replace(/(^|\s)@[a-z0-9_.-]{2,}/gi, '$1[social handle protected]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone protected]')

  const name = (fullName || '').trim()
  if (name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'the specialist')
    const first = name.split(/\s+/)[0]
    if (first && first.length >= 3) {
      const escapedFirst = first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(new RegExp(`\\b${escapedFirst}\\b`, 'gi'), 'the specialist')
    }
  }

  return text.slice(0, 1200)
}

export function residencyReference(id: string) {
  const compact = String(id || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
  return `R-${compact.slice(-6) || '000000'}`
}

export function toPublicResidencyProfile(row: any): PublicResidencyProfile {
  return {
    id: row.id,
    reference: residencyReference(row.id),
    title: typeof row.title === 'string' ? row.title : null,
    bio: scrubContactText(row.bio || row.description, row.full_name),
    primary_specialism: typeof row.primary_specialism === 'string' ? row.primary_specialism : null,
    secondary_specialisms: safeArray(row.secondary_specialisms || row.services_offered),
    qualifications: safeArray(row.qualifications),
    brand_experience: safeArray(row.brand_experience || row.product_houses),
    current_location: typeof row.current_location === 'string' ? row.current_location : null,
    travel_availability: typeof (row.will_travel_to || row.travel_availability) === 'string' ? (row.will_travel_to || row.travel_availability) : null,
    preferred_duration: typeof (row.preferred_duration || row.duration) === 'string' ? (row.preferred_duration || row.duration) : null,
    day_rate: Number(row.day_rate) > 0 ? Number(row.day_rate) : null,
    weekly_rate: Number(row.weekly_rate) > 0 ? Number(row.weekly_rate) : null,
    monthly_rate: Number(row.monthly_rate) > 0 ? Number(row.monthly_rate) : null,
    negotiable: row.negotiable === true,
    available_from: row.available_from || row.availability_start || null,
    years_experience: Number(row.years_experience) > 0 ? Number(row.years_experience) : null,
    // Featured is honoured only while the paid (or comped) window is open.
    is_featured: row.is_featured === true && (!row.featured_until || new Date(row.featured_until).getTime() > Date.now()),
  }
}
