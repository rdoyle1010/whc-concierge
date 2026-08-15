import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Taxonomy management (skills, systems, product houses, certifications,
// hotel brands) - service-role backed so the permissive "any authenticated
// user can rewrite the taxonomy" policies can be revoked.

const TABLES = new Set(['skills', 'systems', 'product_houses', 'certifications', 'hotel_brands'])

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const table = req.nextUrl.searchParams.get('table') || ''
  if (!TABLES.has(table)) return NextResponse.json({ error: 'Unknown table' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from(table).select('*').order('sort_order').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const { table, action } = body
    if (!TABLES.has(table)) return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
    const admin = createAdminClient()

    if (action === 'save') {
      if (body.id) {
        const { error } = await admin.from(table).update(body.data).eq('id', body.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      } else {
        const { error } = await admin.from(table).insert(body.data)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
