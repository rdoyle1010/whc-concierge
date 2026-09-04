import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isSectorSelectable, type Taxonomy } from '@/lib/sectors'

// A professional's sectors live in a join table, not on the profile row, so
// they save separately from the rest of the profile form.

async function candidateFor(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('candidate_profiles').select('id').eq('user_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const candidateId = await candidateFor(user.id)
    if (!candidateId) return NextResponse.json({ sectorIds: [] })
    const admin = createAdminClient()
    const { data } = await admin.from('candidate_sectors').select('sector_id').eq('candidate_id', candidateId)
    return NextResponse.json({ sectorIds: (data || []).map(row => row.sector_id) })
  } catch {
    return NextResponse.json({ sectorIds: [] })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const requested: unknown = body?.sectorIds
  if (!Array.isArray(requested)) return NextResponse.json({ error: 'sectorIds must be an array' }, { status: 400 })

  const candidateId = await candidateFor(user.id)
  if (!candidateId) return NextResponse.json({ error: 'Complete your profile first' }, { status: 403 })

  const admin = createAdminClient()
  const [{ data: doors }, { data: sectors }] = await Promise.all([
    admin.from('doors').select('id, slug, label, sort_order, is_live'),
    admin.from('sectors').select('id, slug, label, door_id, sort_order, is_live'),
  ])
  const taxonomy = { doors: doors || [], sectors: sectors || [] } as Taxonomy

  // A dark sector must not be reachable by posting its id directly: the
  // whole point of is_live is that Hospitality sits in the database unusable
  // until it is opened.
  const ids = [...new Set(requested.filter((id): id is string => typeof id === 'string'))]
  const allowed = ids.filter(id => isSectorSelectable(taxonomy, id))
  if (allowed.length !== ids.length) {
    return NextResponse.json({ error: 'One of those sectors is not open yet.' }, { status: 400 })
  }

  // Replace the whole set: the form sends what the profile should now be.
  const { error: clearError } = await admin.from('candidate_sectors').delete().eq('candidate_id', candidateId)
  if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })

  if (allowed.length) {
    const { error } = await admin
      .from('candidate_sectors')
      .insert(allowed.map(sector_id => ({ candidate_id: candidateId, sector_id })))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sectorIds: allowed })
}
