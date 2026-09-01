import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  const user = await adminRequestUser()
  return user ? { user, admin: createAdminClient() } : null
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const { data, error } = await auth.admin.from('commercial_settings')
      .select('product_key,label,description,price_pence,billing_interval,is_active,updated_at')
      .order('label')
    if (error) throw error
    return NextResponse.json({ rows: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load pricing' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const body = await req.json()
    const productKey = String(body.product_key || '').trim()
    const label = String(body.label || '').trim()
    const description = String(body.description || '').trim()
    const pricePence = Number(body.price_pence)
    const billingInterval = String(body.billing_interval || '')
    const isActive = body.is_active !== false

    if (!productKey || !label || !Number.isInteger(pricePence) || pricePence < 0) {
      return NextResponse.json({ error: 'Invalid product pricing' }, { status: 400 })
    }
    if (!['month', 'year', 'one_off'].includes(billingInterval)) {
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 })
    }

    const { data, error } = await auth.admin.from('commercial_settings').upsert({
      product_key: productKey,
      label,
      description,
      price_pence: pricePence,
      billing_interval: billingInterval,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_key' }).select().single()
    if (error) throw error
    return NextResponse.json({ setting: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not save pricing' }, { status: 500 })
  }
}
