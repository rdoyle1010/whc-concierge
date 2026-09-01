import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Admin = ReturnType<typeof createAdminClient>

// Buckets that hold a person's own files under their user-id folder. The
// export lists them; it never streams the bytes, because a subject access
// response is a document, not a download bundle.
const OWNED_BUCKETS = ['talent-documents', 'message-attachments', 'site-images'] as const
const LIST_PAGE = 100
const MAX_FOLDER_DEPTH = 6

/**
 * Run a query and never let a missing table, missing column or permission
 * error break a subject access response. A section that could not be read is
 * recorded in _meta.unavailable so the answer is honest about the gap rather
 * than quietly short.
 */
async function section<T>(
  into: Record<string, any>,
  key: string,
  unavailable: string[],
  run: () => PromiseLike<{ data: T | null; error: { message?: string } | null }>,
): Promise<T | null> {
  try {
    const { data, error } = await run()
    if (error) { unavailable.push(`${key}: ${error.message || 'could not be read'}`); into[key] = []; return null }
    into[key] = data ?? []
    return data ?? null
  } catch (sectionError: any) {
    unavailable.push(`${key}: ${sectionError?.message || 'could not be read'}`)
    into[key] = []
    return null
  }
}

type StoredFile = { bucket: string; path: string; size_bytes: number | null; uploaded_at: string | null }

async function listStoredFiles(admin: Admin, bucket: string, prefix: string): Promise<StoredFile[]> {
  const found: StoredFile[] = []

  async function walk(folder: string, depth: number): Promise<void> {
    if (depth > MAX_FOLDER_DEPTH) return
    let offset = 0
    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: LIST_PAGE, offset })
      if (error || !data || data.length === 0) return
      for (const entry of data) {
        const full = folder ? `${folder}/${entry.name}` : entry.name
        if (entry.id) {
          found.push({
            bucket,
            path: full,
            size_bytes: (entry.metadata as any)?.size ?? null,
            uploaded_at: entry.created_at || (entry.metadata as any)?.lastModified || null,
          })
        } else {
          await walk(full, depth + 1)
        }
      }
      if (data.length < LIST_PAGE) return
      offset += data.length
    }
  }

  await walk(prefix, 0)
  return found
}

export async function GET(_req: NextRequest) {
  // Authenticate
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const unavailable: string[] = []

  // Determine role
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = profile?.role || 'talent'

  const exportData: Record<string, any> = {
    _meta: {
      exportDate: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      role,
      platform: 'WHC Concierge',
      url: 'https://talent.wellnesshousecollective.co.uk',
      note: 'This is the personal data WHC holds about this account. No section is capped or truncated.',
      unavailable,
    },
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
    },
  }

  // ---------------------------------------------------------------------
  // Privacy, consent and communication preferences - held on every account.
  // ---------------------------------------------------------------------
  await section(exportData, 'privacy_preferences', unavailable, () =>
    admin.from('privacy_preferences').select('*').eq('user_id', user.id))
  await section(exportData, 'consent_events', unavailable, () =>
    admin.from('consent_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }))
  await section(exportData, 'newsletter_subscriptions', unavailable, () =>
    admin.from('newsletter_subscribers')
      .select('id,email,status,source,consent_wording,consent_policy_version,requested_at,confirmed_at,subscribed_at,unsubscribed_at,created_at,updated_at')
      .eq('email', user.email || ''))
  await section(exportData, 'mobile_push_tokens', unavailable, () =>
    admin.from('mobile_push_tokens').select('*').eq('user_id', user.id))

  if (role === 'candidate' || role === 'talent' || role === 'admin') {
    // Candidate profile
    const { data: cp } = await admin.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    exportData.candidate_profile = cp || null

    if (cp) {
      // Applications
      const apps = await section<any[]>(exportData, 'applications', unavailable, () => admin
        .from('applications')
        .select('*, job_listings(job_title, location, employer_profiles(company_name))')
        .eq('candidate_id', cp.id)
        .order('created_at', { ascending: false }))

      const applicationIds = (apps || []).map((row: any) => row.id).filter(Boolean)
      if (applicationIds.length) {
        await section(exportData, 'application_interviews', unavailable, () =>
          admin.from('application_interviews').select('*').in('application_id', applicationIds).order('created_at', { ascending: false }))
        await section(exportData, 'application_offers', unavailable, () =>
          admin.from('application_offers').select('*').in('application_id', applicationIds).order('created_at', { ascending: false }))
      } else {
        exportData.application_interviews = []
        exportData.application_offers = []
      }

      // Saved jobs
      await section(exportData, 'saved_jobs', unavailable, () => admin
        .from('saved_jobs')
        .select('*, job_listings(job_title, location)')
        .eq('candidate_id', cp.id))

      // Profile blocks
      await section(exportData, 'profile_blocks', unavailable, () => admin
        .from('profile_blocks')
        .select('*, employer_profiles:blocked_employer_id(company_name)')
        .eq('candidate_id', cp.id))

      // The taxonomy joins - the structured skills profile WHC matches on,
      // which is personal data in its own right.
      await section(exportData, 'candidate_skills', unavailable, () =>
        admin.from('candidate_skills').select('*').eq('candidate_id', cp.id))
      await section(exportData, 'candidate_systems', unavailable, () =>
        admin.from('candidate_systems').select('*').eq('candidate_id', cp.id))
      await section(exportData, 'candidate_product_houses', unavailable, () =>
        admin.from('candidate_product_houses').select('*').eq('candidate_id', cp.id))
      await section(exportData, 'candidate_certifications', unavailable, () =>
        admin.from('candidate_certifications').select('*').eq('candidate_id', cp.id))
      await section(exportData, 'candidate_hotel_brands', unavailable, () =>
        admin.from('candidate_hotel_brands').select('*').eq('candidate_id', cp.id))

      // Verification and compliance evidence
      await section(exportData, 'certificate_submissions', unavailable, () =>
        admin.from('certificate_submissions').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'candidate_verifications', unavailable, () =>
        admin.from('candidate_verifications').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))

      // Bookings, Academy and outcomes
      await section(exportData, 'agency_bookings', unavailable, () =>
        admin.from('agency_bookings').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'residency_bookings', unavailable, () =>
        admin.from('residency_bookings').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'booking_arrival_packs', unavailable, () =>
        admin.from('booking_arrival_packs').select('*').eq('candidate_id', cp.id).order('generated_at', { ascending: false }))
      await section(exportData, 'course_enrollments', unavailable, () =>
        admin.from('course_enrollments').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'assessment_attempts', unavailable, () =>
        admin.from('assessment_attempts').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'placements', unavailable, () =>
        admin.from('placements').select('*').eq('candidate_id', cp.id).order('hired_at', { ascending: false }))
      await section(exportData, 'salary_records', unavailable, () =>
        admin.from('salary_records').select('*').eq('candidate_id', cp.id).order('recorded_at', { ascending: false }))
      await section(exportData, 'matches', unavailable, () =>
        admin.from('matches').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
      await section(exportData, 'shortlisted_by_employers', unavailable, () =>
        admin.from('shortlisted_candidates').select('*').eq('candidate_id', cp.id).order('created_at', { ascending: false }))
    }

    // Reviews received
    await section(exportData, 'reviews_received', unavailable, () =>
      admin.from('reviews').select('*').eq('reviewee_id', user.id).order('created_at', { ascending: false }))

    // Reviews given
    await section(exportData, 'reviews_given', unavailable, () =>
      admin.from('reviews').select('*').eq('reviewer_id', user.id).order('created_at', { ascending: false }))
  }

  if (role === 'employer') {
    // Employer profile
    const { data: ep } = await admin.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
    exportData.employer_profile = ep || null

    if (ep) {
      // Job listings
      const jobs = await section<any[]>(exportData, 'job_listings', unavailable, () =>
        admin.from('job_listings').select('*').eq('employer_id', ep.id).order('posted_date', { ascending: false }))

      // Applications received
      const jobIds = (jobs || []).map((j: any) => j.id).filter(Boolean)
      if (jobIds.length > 0) {
        const received = await section<any[]>(exportData, 'applications_received', unavailable, () => admin
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('role_id', jobIds)
          .order('created_at', { ascending: false }))

        const applicationIds = (received || []).map((row: any) => row.id).filter(Boolean)
        if (applicationIds.length) {
          await section(exportData, 'application_interviews', unavailable, () =>
            admin.from('application_interviews').select('*').in('application_id', applicationIds).order('created_at', { ascending: false }))
          await section(exportData, 'application_offers', unavailable, () =>
            admin.from('application_offers').select('*').in('application_id', applicationIds).order('created_at', { ascending: false }))
        } else {
          exportData.application_interviews = []
          exportData.application_offers = []
        }
      } else {
        exportData.applications_received = []
        exportData.application_interviews = []
        exportData.application_offers = []
      }

      // Shortlisted candidates
      await section(exportData, 'shortlisted_candidates', unavailable, () => admin
        .from('shortlisted_candidates')
        .select('*, candidate_profiles(full_name)')
        .eq('employer_id', ep.id))

      await section(exportData, 'agency_bookings', unavailable, () =>
        admin.from('agency_bookings').select('*').eq('employer_id', ep.id).order('created_at', { ascending: false }))
      await section(exportData, 'residency_bookings', unavailable, () =>
        admin.from('residency_bookings').select('*').eq('employer_id', ep.id).order('created_at', { ascending: false }))
      await section(exportData, 'booking_arrival_packs', unavailable, () =>
        admin.from('booking_arrival_packs').select('*').eq('employer_id', ep.id).order('generated_at', { ascending: false }))
      await section(exportData, 'placements', unavailable, () =>
        admin.from('placements').select('*').eq('employer_id', ep.id).order('hired_at', { ascending: false }))
      await section(exportData, 'salary_records', unavailable, () =>
        admin.from('salary_records').select('*').eq('employer_id', ep.id).order('recorded_at', { ascending: false }))
      await section(exportData, 'matches', unavailable, () =>
        admin.from('matches').select('*').eq('employer_id', ep.id).order('created_at', { ascending: false }))
    }

    // Reviews given
    await section(exportData, 'reviews_given', unavailable, () =>
      admin.from('reviews').select('*').eq('reviewer_id', user.id))
  }

  // ---------------------------------------------------------------------
  // Held on every account, whatever the role. No caps: a capped subject
  // access response is a partial one.
  // ---------------------------------------------------------------------
  await section(exportData, 'messages_sent', unavailable, () =>
    admin.from('messages').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }))
  await section(exportData, 'messages_received', unavailable, () =>
    admin.from('messages').select('*').eq('recipient_id', user.id).order('created_at', { ascending: false }))
  await section(exportData, 'notifications', unavailable, () =>
    admin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }))
  await section(exportData, 'swipes', unavailable, () =>
    admin.from('swipes').select('*').eq('swiper_id', user.id).order('swiped_at', { ascending: false }))
  await section(exportData, 'platform_experience_reviews', unavailable, () =>
    admin.from('platform_experience_reviews').select('*').eq('reviewer_user_id', user.id).order('created_at', { ascending: false }))

  // The behavioural profile WHC keeps server-side: job views, candidate
  // profile views and other recorded activity. Retained for 13 months.
  await section(exportData, 'analytics_events', unavailable, () =>
    admin.from('analytics_events').select('*').eq('actor_user_id', user.id).order('created_at', { ascending: false }))

  // ---------------------------------------------------------------------
  // Stored files. Listed, not streamed - the bytes stay where they are and
  // can be downloaded from the profile pages.
  // ---------------------------------------------------------------------
  const documents: StoredFile[] = []
  for (const bucket of OWNED_BUCKETS) {
    try {
      documents.push(...await listStoredFiles(admin, bucket, user.id))
    } catch (fileError: any) {
      unavailable.push(`documents (${bucket}): ${fileError?.message || 'could not be listed'}`)
    }
  }
  exportData.documents = {
    note: 'The files WHC stores for this account. The files themselves are not included in this export - download them from your profile and verification pages, where each one is already linked.',
    count: documents.length,
    files: documents,
  }

  const date = new Date().toISOString().split('T')[0]
  const filename = `whc-data-export-${user.id}-${date}.json`

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
