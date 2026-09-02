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
    const [{ data: doors }, { data: sectors }] = await Promise.all([
      admin.from('doors').select('id, slug, label, sort_order, is_live').order('sort_order'),
      admin.from('sectors').select('id, slug, label, door_id, sort_order, is_live').order('sort_order'),
    ])
    return NextResponse.json(
      { doors: doors || [], sectors: sectors || [] },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
    )
  } catch {
    // The taxonomy tables arrive with the Phase 0 migration. Until it is run,
    // an empty taxonomy lets every form fall back rather than break.
    return NextResponse.json({ doors: [], sectors: [] })
  }
}
