import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'

// WHC Verified - the candidate side. Therapists submit their insurance
// certificate (with expiry date) and qualification documents; WHC checks them
// in the admin desk and awards the badge. Docs upload via /api/upload to the
// talent-documents bucket first; this route records the submission.

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function GET() {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles')
      .select('id, whc_verified, whc_verified_at, verification_status, verification_docs, verification_notes, insurance_expiry_date, insurance_document_url, has_insurance')
      .eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })
    return NextResponse.json({ verification: cand })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: cand } = await admin.from('candidate_profiles')
      .select('id, full_name, verification_status').eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const body = await req.json()
    const docs = Array.isArray(body.docs)
      ? body.docs.filter((d: any) => d && typeof d.url === 'string').slice(0, 10)
          .map((d: any) => ({ name: String(d.name || 'Document').slice(0, 120), url: String(d.url) }))
      : []
    const expiry = String(body.insurance_expiry_date || '')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
      return NextResponse.json({ error: 'Please give your insurance expiry date - we chase renewals so your badge never lapses silently.' }, { status: 400 })
    }
    if (new Date(expiry).getTime() < Date.now()) {
      return NextResponse.json({ error: 'That insurance expiry date is in the past - please upload a current certificate.' }, { status: 400 })
    }
    if (docs.length === 0 && !body.insurance_document_url) {
      return NextResponse.json({ error: 'Please upload at least your insurance certificate.' }, { status: 400 })
    }

    const update: Record<string, any> = {
      verification_status: 'pending',
      verification_docs: docs,
      insurance_expiry_date: expiry,
      insurance_chased_at: null,
    }
    if (body.insurance_document_url) {
      update.insurance_document_url = String(body.insurance_document_url)
      update.has_insurance = true
    }
    const { error } = await admin.from('candidate_profiles').update(update).eq('id', cand.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Tell the admins there's a verification to review - best effort
    try {
      const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin').limit(5)
      for (const a of admins || []) {
        await createNotification(a.id, 'general', 'Verification submitted',
          `${cand.full_name || 'A therapist'} has submitted documents for WHC Verified review.`, '/admin/verification')
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
