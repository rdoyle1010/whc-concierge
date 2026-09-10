import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { trackEvent } from '@/lib/analytics'
import { notifyAdmins } from '@/lib/notifications'

// The therapist's certificate manager: structured submissions with a review
// lifecycle. Files are uploaded through the existing document upload path;
// this API records what each document IS, so Talent House can review it and employers
// can trust it.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id,certificates_urls').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

  const { data: rows, error } = await admin.from('certificate_submissions')
    .select('id,title,awarding_body,country,year_awarded,document_url,status,review_note,verified_at,created_at')
    .eq('candidate_id', candidate.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ certificates: [], legacy: candidate.certificates_urls || [], unavailable: true })

  // Legacy uploads that have not been given details yet.
  const known = new Set((rows || []).map(row => row.document_url))
  const legacy = (candidate.certificates_urls || []).filter((url: string) => !known.has(url))
  return NextResponse.json({ certificates: rows || [], legacy })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const body = await req.json()
    const title = String(body.title || '').trim()
    const documentUrl = String(body.documentUrl || '').trim()
    if (title.length < 3) return NextResponse.json({ error: 'Please name the qualification (e.g. CIDESCO Diploma in Beauty & Spa Therapy).' }, { status: 400 })
    const validDocument = documentUrl.startsWith('http') || documentUrl.startsWith('/api/files?')
    if (!validDocument) return NextResponse.json({ error: 'Please upload the certificate document first.' }, { status: 400 })
    const year = body.yearAwarded ? parseInt(String(body.yearAwarded), 10) : null
    if (year && (year < 1960 || year > new Date().getFullYear())) return NextResponse.json({ error: 'Please check the year awarded.' }, { status: 400 })

    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,user_id,full_name,certificates_urls').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })

    const { data: row, error } = await admin.from('certificate_submissions').upsert({
      candidate_id: candidate.id,
      title,
      awarding_body: String(body.awardingBody || '').trim() || null,
      country: String(body.country || '').trim() || null,
      year_awarded: year,
      document_url: documentUrl,
      status: 'submitted',
      review_note: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'candidate_id,document_url' })
      .select('id,title,awarding_body,country,year_awarded,document_url,status,review_note,verified_at,created_at').single()
    if (error) return NextResponse.json({ error: 'Could not save the certificate. Please try again.' }, { status: 500 })

    // Keep the legacy list in step so older UI surfaces still see the file.
    const urls: string[] = candidate.certificates_urls || []
    if (!urls.includes(documentUrl)) {
      await admin.from('candidate_profiles').update({ certificates_urls: [...urls, documentUrl] }).eq('id', candidate.id)
    }

    await trackEvent('certificate_submitted', { actorUserId: user.id, candidateId: candidate.id }, { title })

    // A certificate sits at 'submitted' until a person looks at it, and
    // nothing told anybody it had arrived. The professional sees "under
    // review" and waits; the review queue is a page somebody has to remember
    // to open. Verification is the whole promise of the register, so the
    // submission has to reach an administrator rather than wait to be found.
    await notifyAdmins(
      'A certificate is waiting for review',
      `${candidate.full_name || 'A professional'} submitted "${title}" for verification.`,
      '/admin/certificates',
    )
    return NextResponse.json({ success: true, certificate: row })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not save the certificate.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Certificate is required.' }, { status: 400 })
    const admin = createAdminClient()
    const { data: candidate } = await admin.from('candidate_profiles').select('id,certificates_urls').eq('user_id', user.id).maybeSingle()
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 404 })
    const { data: row } = await admin.from('certificate_submissions').select('id,document_url').eq('id', id).eq('candidate_id', candidate.id).maybeSingle()
    if (!row) return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 })
    // Somebody removing a certificate is usually correcting a mistake or
    // taking down a document they did not mean to share. Telling them it is
    // gone while it sits in the review queue is the worst possible answer.
    const { error: deleteError } = await admin.from('certificate_submissions').delete().eq('id', row.id)
    if (deleteError) return NextResponse.json({ error: 'The certificate could not be removed. Please try again.' }, { status: 500 })
    const urls = (candidate.certificates_urls || []).filter((url: string) => url !== row.document_url)
    const { error: listError } = await admin.from('candidate_profiles').update({ certificates_urls: urls }).eq('id', candidate.id)
    if (listError) return NextResponse.json({ error: 'The certificate was removed but your document list could not be updated. Please refresh.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not remove the certificate.' }, { status: 500 })
  }
}
