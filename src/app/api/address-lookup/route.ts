import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.GETADDRESS_API_KEY
const BASE = 'https://api.getAddress.io'

function clean(value: unknown) {
  return String(value || '').trim()
}

export async function GET(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({
        error: 'Address lookup is not configured yet.',
        code: 'NOT_CONFIGURED',
      }, { status: 503 })
    }

    const postcode = clean(req.nextUrl.searchParams.get('postcode')).toUpperCase()
    const id = clean(req.nextUrl.searchParams.get('id'))

    if (id) {
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

    const response = await fetch(`${BASE}/autocomplete/${encodeURIComponent(postcode)}?api-key=${encodeURIComponent(API_KEY)}&all=true&show-postcode=true`, {
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload) {
      return NextResponse.json({ error: 'No addresses were found for that postcode.' }, { status: response.status || 404 })
    }

    const suggestions = Array.isArray(payload.suggestions)
      ? payload.suggestions.map((item: any) => ({ id: clean(item.id), address: clean(item.address) })).filter((item: any) => item.id && item.address)
      : []

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Address lookup failed', error?.message || error)
    return NextResponse.json({ error: 'Address lookup is temporarily unavailable.' }, { status: 500 })
  }
}
