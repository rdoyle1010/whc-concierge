import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'

const API_KEY = process.env.GETADDRESS_API_KEY
const BASE = 'https://api.getAddress.io'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

function clean(value: unknown) {
  return String(value || '').trim()
}

function osmId(payload: { address: string; postcode: string; latitude: string; longitude: string }) {
  return `osm:${Buffer.from(JSON.stringify(payload)).toString('base64url')}`
}

function parseOsmId(id: string) {
  try {
    if (!id.startsWith('osm:')) return null
    return JSON.parse(Buffer.from(id.slice(4), 'base64url').toString('utf8')) as {
      address: string
      postcode: string
      latitude: string
      longitude: string
    }
  } catch {
    return null
  }
}

async function nominatimSuggestions(postcode: string, propertyName: string) {
  const queries = [
    propertyName ? `${propertyName}, ${postcode}, UK` : '',
    `${postcode}, UK`,
  ].filter(Boolean)

  for (const query of queries) {
    const url = `${NOMINATIM}?format=jsonv2&addressdetails=1&countrycodes=gb&limit=8&q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'SpaPlatform/1.0 (https://talent.wellnesshousecollective.co.uk)',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    })
    const payload = await response.json().catch(() => [])
    if (!response.ok || !Array.isArray(payload) || !payload.length) continue

    const suggestions = payload.map((item: any) => {
      const address = clean(item.display_name)
      const foundPostcode = clean(item.address?.postcode || postcode).toUpperCase()
      return {
        id: osmId({
          address,
          postcode: foundPostcode,
          latitude: clean(item.lat),
          longitude: clean(item.lon),
        }),
        address,
      }
    }).filter((item: any) => item.address)

    if (suggestions.length) return suggestions
  }

  return []
}

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req as unknown as Request, 'address-lookup', { windowMs: 60_000, maxRequests: 12 })
  if (limited) return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } })

  try {
    const postcode = clean(req.nextUrl.searchParams.get('postcode')).toUpperCase()
    const propertyName = clean(req.nextUrl.searchParams.get('propertyName'))
    const id = clean(req.nextUrl.searchParams.get('id'))

    if (id) {
      const osm = parseOsmId(id)
      if (osm) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${osm.latitude},${osm.longitude}`)}`
        return NextResponse.json({
          address: osm.address,
          postcode: osm.postcode,
          latitude: Number(osm.latitude),
          longitude: Number(osm.longitude),
          mapUrl,
        })
      }

      if (!API_KEY) return NextResponse.json({ error: 'Could not load that address.' }, { status: 400 })

      const response = await fetch(`${BASE}/get/${encodeURIComponent(id)}?api-key=${encodeURIComponent(API_KEY)}`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload) {
        return NextResponse.json({ error: 'Could not load that address.' }, { status: response.status || 502 })
      }

      const parts = Array.isArray(payload.formatted_address)
        ? payload.formatted_address.map((part: unknown) => clean(part)).filter(Boolean)
        : [payload.line_1, payload.line_2, payload.line_3, payload.town_or_city, payload.county].map(clean).filter(Boolean)
      const fullAddress = [...parts, clean(payload.postcode)].filter(Boolean).join(', ')
      const mapUrl = payload.latitude != null && payload.longitude != null
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${payload.latitude},${payload.longitude}`)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

      return NextResponse.json({
        address: fullAddress,
        postcode: clean(payload.postcode),
        town: clean(payload.town_or_city),
        county: clean(payload.county),
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        mapUrl,
      })
    }

    if (!postcode || postcode.length < 5 || postcode.length > 9) {
      return NextResponse.json({ error: 'Enter a valid UK postcode.' }, { status: 400 })
    }

    if (API_KEY) {
      const response = await fetch(`${BASE}/autocomplete/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(API_KEY)}&all=true&show-postcode=true`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)
      if (response.ok && payload) {
        const suggestions = Array.isArray(payload.suggestions)
          ? payload.suggestions.map((item: any) => ({ id: clean(item.id), address: clean(item.address) })).filter((item: any) => item.id && item.address)
          : []
        if (suggestions.length) return NextResponse.json({ suggestions })
      }
    }

    const suggestions = await nominatimSuggestions(postcode, propertyName)
    if (!suggestions.length) return NextResponse.json({ error: 'No address was found for that postcode. You can still type the address manually.' }, { status: 404 })

    return NextResponse.json({ suggestions, source: 'openstreetmap' })
  } catch (error: any) {
    console.error('Address lookup failed', error?.message || error)
    return NextResponse.json({ error: 'Address lookup is temporarily unavailable.' }, { status: 500 })
  }
}
