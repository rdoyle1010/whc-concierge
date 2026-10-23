import { NextRequest, NextResponse } from 'next/server'
import { isValidShareCode, normaliseShareCode } from '@/lib/right-to-work'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { isOwnedFileReference } from '@/lib/file-references'

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
      .select('id, whc_verified, whc_verified_at, verification_status, verification_docs, verification_notes, insurance_expiry_date, insurance_document_url, has_insurance, right_to_work_uk, right_to_work_ireland, right_to_work_status, right_to_work_document_url, right_to_work_expiry_date, right_to_work_verified_at, right_to_work_notes, right_to_work_method, right_to_work_share_code, right_to_work_dob')
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
      .select('id, full_name, verification_status, insurance_document_url, right_to_work_document_url')
      .eq('user_id', user.id).maybeSingle()
    if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })

    const body = await req.json()

    // Verification documents are uploaded through /api/upload to
    // `${user.id}/verification/...` in the private talent-documents bucket,
    // which returns the /api/files reference stored here. Accepting a
    // free-form string would let one professional file another person's
    // identity evidence - or any URL at all - against their own record.
    const ownDocument = (value: unknown) => isOwnedFileReference(value, user.id, 'talent-documents')

    const docs = Array.isArray(body.docs)
      ? body.docs.filter((d: any) => d && typeof d.url === 'string').slice(0, 10)
          .map((d: any) => ({ name: String(d.name || 'Document').slice(0, 120), url: String(d.url) }))
      : []
    if (docs.some((doc: { url: string }) => !ownDocument(doc.url))) {
      return NextResponse.json({ error: 'One of those documents is not a file you uploaded - please upload it again.' }, { status: 400 })
    }
    if (body.right_to_work_document_url && !ownDocument(body.right_to_work_document_url)) {
      return NextResponse.json({ error: 'That right-to-work document is not a file you uploaded - please upload it again.' }, { status: 400 })
    }
    if (body.insurance_document_url && !ownDocument(body.insurance_document_url)) {
      return NextResponse.json({ error: 'That insurance certificate is not a file you uploaded - please upload it again.' }, { status: 400 })
    }

    const rightToWorkUk = Boolean(body.right_to_work_uk)
    const rightToWorkIreland = Boolean(body.right_to_work_ireland)
    if (!rightToWorkUk && !rightToWorkIreland) {
      return NextResponse.json({ error: 'Please confirm whether you have the right to work in the UK, Ireland, or both.' }, { status: 400 })
    }

    // A share code is the professional's half of the check. Supplying it does
    // not verify anything - an administrator still has to open the Home Office
    // page and record what it said - so nothing here touches the verified
    // status, and a resubmission puts the record back into review.
    const method = ['share_code', 'passport', 'idsp'].includes(String(body.right_to_work_method))
      ? String(body.right_to_work_method)
      : 'share_code'
    const shareCode = normaliseShareCode(String(body.right_to_work_share_code || ''))
    const rightToWorkDob = body.right_to_work_dob ? String(body.right_to_work_dob).slice(0, 10) : null
    if (method === 'share_code') {
      if (!isValidShareCode(shareCode)) {
        return NextResponse.json({ error: 'A share code is nine letters and numbers, from gov.uk/prove-right-to-work.' }, { status: 400 })
      }
      if (!rightToWorkDob || !/^\d{4}-\d{2}-\d{2}$/.test(rightToWorkDob) || Number.isNaN(Date.parse(rightToWorkDob)) || Date.parse(rightToWorkDob) >= Date.now()) {
        return NextResponse.json({ error: 'Please give your date of birth - the Home Office needs it to show the result.' }, { status: 400 })
      }
    }

    // The document is only required where a document is the method. A share
    // code submission has nothing to upload, and demanding one here would
    // reject a valid check that the form has already accepted.
    const rightToWorkUrl = body.right_to_work_document_url ? String(body.right_to_work_document_url) : cand.right_to_work_document_url
    if (method !== 'share_code' && !rightToWorkUrl) {
      return NextResponse.json({ error: 'Please upload evidence of your right to work.' }, { status: 400 })
    }

    const rightToWorkExpiry = body.right_to_work_expiry_date ? String(body.right_to_work_expiry_date) : null
    if (rightToWorkExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(rightToWorkExpiry)) {
      return NextResponse.json({ error: 'Please use a valid right-to-work expiry date.' }, { status: 400 })
    }

    const hasInsurance = Boolean(body.has_insurance)
    let insuranceExpiry: string | null = null
    let insuranceUrl: string | null = null
    if (hasInsurance) {
      insuranceExpiry = String(body.insurance_expiry_date || '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(insuranceExpiry)) {
        return NextResponse.json({ error: 'Please give the expiry date for your insurance.' }, { status: 400 })
      }
      if (new Date(insuranceExpiry).getTime() < Date.now()) {
        return NextResponse.json({ error: 'That insurance expiry date is in the past - please upload a current certificate.' }, { status: 400 })
      }
      insuranceUrl = body.insurance_document_url ? String(body.insurance_document_url) : cand.insurance_document_url
      if (!insuranceUrl) return NextResponse.json({ error: 'Please upload your insurance certificate, or choose that you do not currently hold insurance.' }, { status: 400 })
    }

    const update: Record<string, any> = {
      verification_status: 'pending',
      verification_docs: docs,
      right_to_work_uk: rightToWorkUk,
      right_to_work_ireland: rightToWorkIreland,
      right_to_work_status: 'pending',
      right_to_work_document_url: rightToWorkUrl,
      right_to_work_method: method,
      right_to_work_share_code: method === 'share_code' ? (shareCode || null) : null,
      right_to_work_dob: method === 'share_code' ? rightToWorkDob : null,
      // The status and verified date were already reset above: a resubmission
      // returns the record to the queue rather than leaving a stale approval
      // against a code nobody has looked at. The outcome has to go with them,
      // or a new code inherits the last one's answer.
      right_to_work_check_outcome: null,
      right_to_work_expiry_date: rightToWorkExpiry,
      right_to_work_verified_at: null,
      right_to_work_notes: null,
      has_insurance: hasInsurance,
      insurance_document_url: hasInsurance ? insuranceUrl : null,
      insurance_expiry_date: hasInsurance ? insuranceExpiry : null,
      insurance_chased_at: null,
    }

    const { error } = await admin.from('candidate_profiles').update(update).eq('id', cand.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin').limit(5)
      for (const a of admins || []) {
        await createNotification(a.id, 'general', 'Verification submitted',
          `${cand.full_name || 'A professional'} has submitted right-to-work and verification documents for review.`, '/admin/verification')
      }
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
