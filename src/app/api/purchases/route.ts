import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { JOB_TIERS } from '@/lib/constants'

// Job adverts are ledgered by tier, and the tier names are not in the
// commercial settings table - so their labels come from the tier list that
// priced them.
function jobTierLabel(productKey: string): string {
  const tier = productKey.startsWith('job_') ? productKey.slice(4) : ''
  const match = Object.keys(JOB_TIERS).find(key => key.toLowerCase() === tier)
  if (!match) return ''
  const label = JOB_TIERS[match as keyof typeof JOB_TIERS].label
  // The tier label carries its own price ("Standard Job - £149"); the receipt
  // shows what was actually paid, so the price is stripped from the name.
  return label.split(' - ')[0]
}

// A buyer's own payment history, and the source of every receipt they can
// print. The ledger already holds what actually left their account, including
// any discount applied at checkout - which is the number a finance team
// reconciles against, and not the list price the billing page used to show.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('commercial_purchases')
    .select('id, product_key, amount_pence, status, metadata, created_at, stripe_payment_intent')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = data || []
  const keys = Array.from(new Set(rows.map(row => row.product_key).filter(Boolean)))
  const labels = new Map<string, string>()
  if (keys.length) {
    const { data: settings } = await admin.from('commercial_settings').select('product_key, label, description').in('product_key', keys)
    for (const setting of settings || []) labels.set(setting.product_key, setting.label)
  }

  return NextResponse.json({
    purchases: rows.map(row => ({
      id: row.id,
      productKey: row.product_key,
      // The stored key is the fallback so a product retired from the settings
      // table still prints something a human can read on an old receipt.
      label: labels.get(row.product_key) || jobTierLabel(row.product_key) || row.product_key.replace(/_/g, ' '),
      amount: (row.amount_pence || 0) / 100,
      status: row.status,
      paidAt: row.created_at,
      poNumber: typeof row.metadata?.po_number === 'string' ? row.metadata.po_number : '',
      reference: `THC-${String(row.id).slice(0, 8).toUpperCase()}`,
    })),
  })
}
