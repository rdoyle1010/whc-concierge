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
  const [brands, enquiries, applications] = await Promise.all([
    admin.from('brand_profiles').select(BRAND_FIELDS)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true }),
    admin.from('brand_enquiries').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('brand_applications').select('*').order('created_at', { ascending: false }).limit(100),
  ])
  if (brands.error) return NextResponse.json({ error: brands.error.message }, { status: 500 })
  // The two inboxes arrive with their migration. Until it runs, the brand list
  // still loads rather than the whole screen failing on a table that is not
  // there yet.
  return NextResponse.json({
    brands: (brands.data || []).map(normaliseBrand),
    enquiries: enquiries.error ? [] : (enquiries.data || []),
    applications: applications.error ? [] : (applications.data || []),
  })
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

  // Turn a brand's own application into a draft page. The brand has already
  // written the hard parts in its own words, so this copies them across rather
  // than asking an administrator to retype somebody else's argument.
  if (action === 'convert_application') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Which application?' }, { status: 400 })
    const { data: application, error: readError } = await admin.from('brand_applications').select('*').eq('id', id).maybeSingle()
    if (readError || !application) return NextResponse.json({ error: 'That application could not be found.' }, { status: 404 })

    const slug = cleanBrandSlug(body.slug || application.brand_name)
    if (!slug) return NextResponse.json({ error: 'That brand name does not make a usable web address. Set one by hand.' }, { status: 400 })
    const { data: clash } = await admin.from('brand_profiles').select('slug').eq('slug', slug).maybeSingle()
    if (clash) return NextResponse.json({ error: `A brand already lives at /brands/${slug}. Give this one a different address.` }, { status: 409 })

    // Deliberately a draft. An application is a pitch, and a pitch goes live
    // when somebody has read it, not when it arrives.
    const draft = normaliseBrand({ ...application, slug, name: application.brand_name, is_published: false })
    const { error: writeError } = await admin.from('brand_profiles').insert(draft)
    if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 })
    await admin.from('brand_applications').update({ status: 'converted', converted_slug: slug }).eq('id', id)
    return NextResponse.json({ success: true, slug })
  }

  if (action === 'set_enquiry_status') {
    const id = String(body.id || '')
    const status = ['new', 'handled', 'closed'].includes(String(body.status)) ? String(body.status) : ''
    if (!id || !status) return NextResponse.json({ error: 'Which enquiry, and what status?' }, { status: 400 })
    const { error } = await admin.from('brand_enquiries').update({ status }).eq('id', id)
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
