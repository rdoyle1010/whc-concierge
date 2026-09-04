import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// The public taxonomy: doors and sectors for the post-a-role form, the
// profile editor and the jobs filters. Dark rows are returned too, because an
// administrator editing them needs to see them and a role already attached to
// one still has to render its label; every caller decides what to offer using
// the helpers in lib/sectors, which read is_live.

export const revalidate = 300

export async function GET() {
  try {
    const admin = createAdminClient()
    const [{ data: doors, error: doorError }, { data: sectors, error: sectorError }] = await Promise.all([
      admin.from('doors').select('id, slug, label, sort_order, is_live').order('sort_order'),
      admin.from('sectors').select('id, slug, label, door_id, sort_order, is_live').order('sort_order'),
    ])

    // A failed read and a genuinely empty table both used to come back as an
    // empty taxonomy, and the post-a-role form read that as "no sector needed"
    // - so it hid a required field and let the insert fail on a NOT NULL
    // constraint the person posting could do nothing about. The two cases are
    // now distinguishable, and nothing is cached until the read succeeds.
    if (doorError || sectorError) {
      console.error('Taxonomy read failed:', doorError?.message || sectorError?.message)
      return NextResponse.json(
        { doors: [], sectors: [], unavailable: true },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { doors: doors || [], sectors: sectors || [] },
      {
        // An empty taxonomy is never cached. Caching one for five minutes is
        // how a momentary blip becomes five minutes of nobody being able to
        // post a role.
        headers: (doors || []).length
          ? { 'Cache-Control': 'public, max-age=60, s-maxage=300' }
          : { 'Cache-Control': 'no-store' },
      },
    )
  } catch (error: any) {
    console.error('Taxonomy read threw:', error?.message || error)
    return NextResponse.json(
      { doors: [], sectors: [], unavailable: true },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
