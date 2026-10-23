// Geocoding and real distance calculation.
//
// UK postcodes go to postcodes.io - free, no key, ONS-backed and precise to
// the street. Everywhere else goes to Nominatim on the town and country,
// which is the right resolution abroad anyway: a hotel in the Maldives is not
// found by postcode, and nobody commutes to it.
//
// Coordinates are cached on the profile rows (latitude/longitude), so a
// location is geocoded once when it changes, not once per search. That keeps
// the volume low enough to stay well inside Nominatim's usage policy.

import { COUNTRIES, countryCode, comparableLocations } from './countries'

export interface LatLng { latitude: number; longitude: number }

// Geocode a full or partial UK postcode. Returns null rather than throwing -
// callers treat "couldn't geocode" as "distance unknown", never as an error.
export async function geocodePostcode(raw: string | null | undefined): Promise<LatLng | null> {
  if (!raw) return null
  const pc = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!pc) return null
  try {
    // Try as a full postcode first
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`)
    if (res.ok) {
      const j = await res.json()
      if (j?.result?.latitude != null) return { latitude: j.result.latitude, longitude: j.result.longitude }
    }
    // Fall back to outcode (district), e.g. "BS1" or "SW1A"
    const outcode = pc.match(/^[A-Z]{1,2}\d[A-Z\d]?/)?.[0]
    if (outcode) {
      const res2 = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`)
      if (res2.ok) {
        const j2 = await res2.json()
        if (j2?.result?.latitude != null) return { latitude: j2.result.latitude, longitude: j2.result.longitude }
      }
    }
    return null
  } catch {
    return null
  }
}

// Great-circle distance in miles (haversine).
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.761 // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Distance between two profile-shaped objects, or null if either lacks coords.
//
// Null across a border as well, and that is the point rather than a shortcut.
// The haversine is happy to tell you a therapist in Leeds is 3,412 miles from
// a resort in the Maldives, and every consumer of this number treats it as a
// commute: radius filters, "within travel distance" badges, agency shortlists
// sorted nearest-first. A cross-border figure is not a small number, it is a
// meaningless one, so it is not produced at all. Same-country matching is
// scored on relocation instead, which is the decision that actually gets made.
export function profileDistanceMiles(
  a: { latitude?: number | null; longitude?: number | null; location_country?: string | null; country?: string | null },
  b: { latitude?: number | null; longitude?: number | null; location_country?: string | null; country?: string | null },
): number | null {
  if (a?.latitude == null || a?.longitude == null || b?.latitude == null || b?.longitude == null) return null
  if (!comparableLocations(a.location_country ?? a.country, b.location_country ?? b.country)) return null
  return distanceMiles(
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude },
  )
}

// Geocode a location anywhere.
//
// UK postcodes keep the precise path they have always had. Everywhere else,
// what the platform holds is a town and a country, which Nominatim resolves
// well enough for "same city" and "same region" - the only questions distance
// is asked abroad.
export async function geocodeLocation(
  location: string | null | undefined,
  country?: string | null,
): Promise<LatLng | null> {
  const code = countryCode(country)
  const text = String(location || '').trim()
  if (!code || code === 'GB') {
    const uk = await geocodePostcode(text)
    // A UK row can hold a town rather than a postcode. Falling through to the
    // global lookup means "Harrogate" still places somebody on the map instead
    // of leaving them off every distance-aware list on the platform.
    if (uk || !text) return uk
    return nominatim(`${text}, United Kingdom`)
  }
  if (!text) {
    // The country alone is better than nothing: it puts a listing in the right
    // part of the world for a region filter, and a search by country works.
    const named = countryNameFor(code)
    return named ? nominatim(named) : null
  }
  const named = countryNameFor(code)
  return nominatim(named ? `${text}, ${named}` : text)
}

function countryNameFor(code: string): string | null {
  return COUNTRIES.find(country => country.code === code)?.name || null
}

// Nominatim asks for a real User-Agent and no more than one request a second.
// Geocoding happens on save, not on search, so the natural rate is far under
// that - but a failure here must never surface as an error to the person
// saving their profile, so it fails to null like everything else in this file.
async function nominatim(query: string): Promise<LatLng | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'TalentHouseCollective/1.0 (https://talenthousecollective.co.uk)',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    })
    if (!res.ok) return null
    const payload = await res.json().catch(() => null)
    const first = Array.isArray(payload) ? payload[0] : null
    if (!first?.lat || !first?.lon) return null
    const latitude = Number(first.lat)
    const longitude = Number(first.lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    return { latitude, longitude }
  } catch {
    return null
  }
}
