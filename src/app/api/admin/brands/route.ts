import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_REFUSAL_MESSAGE, adminRequestOutcome } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { BRAND_FIELDS, cleanBrandSlug, normaliseBrand, validateBrand } from '@/lib/brand-profiles'

// Brand pages, from the admin side. Reads every brand including drafts; the
// public page reads only published ones through the anon key, where the RLS
// policy makes a draft genuinely invisible rather than merely unlinked.

export async function GET() {
  const { user, refusal } = await adminRequestOutcome()
  if (!user) return NextResponse.json({ error: ADMIN_REFUSAL_MESSAGE[refusal] }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('brand_profiles')
    .select(BRAND_FIELDS)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ brands: (data || []).map(normaliseBrand) })
}

export async function POST(req: NextRequest) {
  const { user, refusal } = await adminRequestOutcome()
  if (!user) return NextResponse.json({ error: ADMIN_REFUSAL_MESSAGE[refusal] }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || 'save')
  const admin = createAdminClient()

  if (action === 'delete') {
    const slug = cleanBrandSlug(body.slug)
    if (!slug) return NextResponse.json({ error: 'Which brand?' }, { status: 400 })
    const { error } = await admin.from('brand_profiles').delete().eq('slug', slug)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action !== 'save') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const brand = normaliseBrand(body.brand)
  const problem = validateBrand(brand)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  const { error } = await admin.from('brand_profiles').upsert({ ...brand, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, slug: brand.slug })
}
