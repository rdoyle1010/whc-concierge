import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminRequestUser } from '@/lib/admin-api-auth'

// Doors, sectors and Agency rate cards. Read here rather than through the
// public route because an administrator needs the dark rows too, and because
// nothing writes to these tables through RLS: a rate card decides what a
// shift is worth, so every write goes through this route on the service role.

async function requireAdmin() {
  return adminRequestUser()
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: doors }, { data: sectors }, { data: rateCards }] = await Promise.all([
    admin.from('doors').select('id, slug, label, sort_order, is_live').order('sort_order'),
    admin.from('sectors').select('id, slug, label, door_id, sort_order, is_live').order('sort_order'),
    admin.from('agency_rate_cards').select('sector_id, min_hourly_rate, platform_fee_pct, min_shift_minutes'),
  ])

  return NextResponse.json({
    doors: doors || [],
    sectors: sectors || [],
    rateCards: rateCards || [],
  })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  try {
    if (body.action === 'set_door_live') {
      if (typeof body.id !== 'string' || typeof body.is_live !== 'boolean') {
        return NextResponse.json({ error: 'id and is_live are required' }, { status: 400 })
      }
      const { error } = await admin.from('doors').update({ is_live: body.is_live }).eq('id', body.id)
      if (error) throw new Error(error.message)
    } else if (body.action === 'set_sector_live') {
      if (typeof body.id !== 'string' || typeof body.is_live !== 'boolean') {
        return NextResponse.json({ error: 'id and is_live are required' }, { status: 400 })
      }
      // Opening a sector for Agency work without a rate card would leave the
      // shift with no floor and no fee, so it gets today's spa values until
      // an administrator sets its own.
      if (body.is_live) {
        const { data: existing } = await admin
          .from('agency_rate_cards').select('sector_id').eq('sector_id', body.id).maybeSingle()
        if (!existing) {
          await admin.from('agency_rate_cards').insert({ sector_id: body.id })
        }
      }
      const { error } = await admin.from('sectors').update({ is_live: body.is_live }).eq('id', body.id)
      if (error) throw new Error(error.message)
    } else if (body.action === 'save_rate_card') {
      const rate = Number(body.min_hourly_rate)
      const fee = Number(body.platform_fee_pct)
      const minutes = Number(body.min_shift_minutes)
      if (typeof body.sector_id !== 'string') {
        return NextResponse.json({ error: 'sector_id is required' }, { status: 400 })
      }
      // The database enforces these too. Refusing here means the admin sees a
      // sentence rather than a constraint violation.
      if (!Number.isFinite(rate) || rate <= 0) {
        return NextResponse.json({ error: 'The minimum hourly rate must be more than zero.' }, { status: 400 })
      }
      if (!Number.isFinite(fee) || fee < 0 || fee > 100) {
        return NextResponse.json({ error: 'The platform fee must be between 0 and 100 per cent.' }, { status: 400 })
      }
      if (!Number.isInteger(minutes) || minutes <= 0) {
        return NextResponse.json({ error: 'The minimum shift must be a whole number of minutes above zero.' }, { status: 400 })
      }
      const { error } = await admin.from('agency_rate_cards').upsert({
        sector_id: body.sector_id,
        min_hourly_rate: rate,
        platform_fee_pct: fee,
        min_shift_minutes: minutes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'sector_id' })
      if (error) throw new Error(error.message)
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'That change could not be saved.' }, { status: 500 })
  }

  // The public jobs page caches its results, so a door going live has to
  // clear that cache or the new sector's roles stay invisible for a minute.
  try { revalidateTag('public-jobs', 'max') } catch { /* cache tag is best-effort */ }

  return NextResponse.json({ ok: true })
}
