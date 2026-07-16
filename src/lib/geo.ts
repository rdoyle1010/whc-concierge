// UK postcode geocoding + real distance calculation.
//
// Uses postcodes.io - the free, no-key, ONS-backed UK postcode API.
// Coordinates are cached on the profile rows (latitude/longitude), so we
// geocode once per postcode change, not per search.

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
export function profileDistanceMiles(
  a: { latitude?: number | null; longitude?: number | null },
  b: { latitude?: number | null; longitude?: number | null },
): number | null {
  if (a?.latitude == null || a?.longitude == null || b?.latitude == null || b?.longitude == null) return null
  return distanceMiles(
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude },
  )
}
