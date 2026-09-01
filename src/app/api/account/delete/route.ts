import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type Admin = ReturnType<typeof createAdminClient>

// Buckets that hold a person's own files under their user-id folder. The two
// private buckets carry the identity documents (right to work, insurance,
// certificates, CV) and message attachments; site-images additionally holds
// the profile photograph the user uploaded under their own prefix. Employer
// logos and job images live under the employer-profile prefix and are company
// assets, so they are not swept here.
const OWNED_BUCKETS = ['talent-documents', 'message-attachments', 'site-images'] as const

const LIST_PAGE = 100
const REMOVE_CHUNK = 100
const MAX_FOLDER_DEPTH = 6

/**
 * Every object under a folder prefix, recursing into sub-folders. Supabase
 * storage returns folder entries with a null id, which is how a folder is
 * told apart from a file.
 */
async function listObjectPaths(admin: Admin, bucket: string, prefix: string): Promise<string[]> {
  const found: string[] = []

  async function walk(folder: string, depth: number): Promise<void> {
    if (depth > MAX_FOLDER_DEPTH) return
    let offset = 0
    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: LIST_PAGE, offset })
      if (error || !data || data.length === 0) return
      for (const entry of data) {
        const full = folder ? `${folder}/${entry.name}` : entry.name
        if (entry.id) found.push(full)
        else await walk(full, depth + 1)
      }
      if (data.length < LIST_PAGE) return
      offset += data.length
    }
  }

  await walk(prefix, 0)
  return found
}

export async function POST(_req: NextRequest) {
  try {
    // Verify caller is authenticated
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const admin = createAdminClient()

    // One failing step must never abort the deletion. Anything that could not
    // be removed is collected and reported back so the person is told the
    // truth about what is left, and so WHC can finish it by hand.
    const failures: string[] = []
    const anonymised: string[] = []
    let filesRemoved = 0

    async function step(label: string, run: () => PromiseLike<{ error?: { message?: string } | null }>) {
      try {
        const { error } = await run()
        if (error) failures.push(`${label}: ${error.message || 'database error'}`)
      } catch (stepError: any) {
        failures.push(`${label}: ${stepError?.message || 'unexpected error'}`)
      }
    }

    // Anonymisation is reported separately: if the column is still NOT NULL
    // because the retention migration has not run yet, the record is listed as
    // one that could not be anonymised rather than silently destroyed.
    async function anonymise(label: string, run: () => PromiseLike<{ error?: { message?: string } | null }>) {
      try {
        const { error } = await run()
        if (error) failures.push(`${label} could not be anonymised: ${error.message || 'database error'}`)
        else anonymised.push(label)
      } catch (stepError: any) {
        failures.push(`${label} could not be anonymised: ${stepError?.message || 'unexpected error'}`)
      }
    }

    // Get user role to determine which tables to clean
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role

    // -----------------------------------------------------------------------
    // 1. Stored files. This runs first, while the account still exists, so a
    //    later database failure cannot leave a passport or BRP scan behind.
    // -----------------------------------------------------------------------
    for (const bucket of OWNED_BUCKETS) {
      try {
        const paths = await listObjectPaths(admin, bucket, user.id)
        for (let index = 0; index < paths.length; index += REMOVE_CHUNK) {
          const chunk = paths.slice(index, index + REMOVE_CHUNK)
          const { error } = await admin.storage.from(bucket).remove(chunk)
          if (error) failures.push(`${bucket}: ${error.message || 'could not delete files'}`)
          else filesRemoved += chunk.length
        }
      } catch (bucketError: any) {
        failures.push(`${bucket}: ${bucketError?.message || 'could not list files'}`)
      }
    }

    // -----------------------------------------------------------------------
    // 2. Candidate data.
    // -----------------------------------------------------------------------
    if (role === 'candidate' || role === 'talent') {
      const { data: candProfile } = await admin
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (candProfile) {
        const cid = candProfile.id

        // Applications and everything hanging off them.
        let applicationIds: string[] = []
        try {
          const { data: apps } = await admin.from('applications').select('id').eq('candidate_id', cid)
          applicationIds = (apps || []).map((row: any) => row.id)
        } catch { /* the application delete below still runs */ }

        if (applicationIds.length > 0) {
          await step('interview records', () => admin.from('application_interviews').delete().in('application_id', applicationIds))
          await step('offer records', () => admin.from('application_offers').delete().in('application_id', applicationIds))
          await step('platform experience reviews', () => admin.from('platform_experience_reviews').delete().in('application_id', applicationIds))
        }

        // Remove taxonomy joins
        await step('skills', () => admin.from('candidate_skills').delete().eq('candidate_id', cid))
        await step('systems', () => admin.from('candidate_systems').delete().eq('candidate_id', cid))
        await step('product houses', () => admin.from('candidate_product_houses').delete().eq('candidate_id', cid))
        await step('certifications', () => admin.from('candidate_certifications').delete().eq('candidate_id', cid))
        await step('hotel brands', () => admin.from('candidate_hotel_brands').delete().eq('candidate_id', cid))

        // Remove applications, swipes, matches
        await step('applications', () => admin.from('applications').delete().eq('candidate_id', cid))
        await step('swipes you made', () => admin.from('swipes').delete().eq('swiper_id', user.id))
        await step('swipes about you', () => admin.from('swipes').delete().eq('target_id', cid).eq('target_type', 'candidate'))
        await step('matches', () => admin.from('matches').delete().eq('candidate_id', cid))
        await step('saved jobs', () => admin.from('saved_jobs').delete().eq('candidate_id', cid))
        await step('blocked employers', () => admin.from('profile_blocks').delete().eq('candidate_id', cid))
        await step('employer shortlists', () => admin.from('shortlisted_candidates').delete().eq('candidate_id', cid))

        // Verification and assessment evidence
        await step('certificate submissions', () => admin.from('certificate_submissions').delete().eq('candidate_id', cid))
        await step('verification records', () => admin.from('candidate_verifications').delete().eq('candidate_id', cid))
        await step('assessment attempts', () => admin.from('assessment_attempts').delete().eq('candidate_id', cid))
        await step('arrival packs', () => admin.from('booking_arrival_packs').delete().eq('candidate_id', cid))
        await step('behavioural analytics', () => admin.from('analytics_events').delete().eq('candidate_id', cid))
        await step('residency conversations', () => admin.from('residency_conversations').delete().eq('candidate_id', cid))
        await step('residency profile', () => admin.from('residency_profiles').delete().eq('candidate_profile_id', cid))

        // Financial and statutory records survive with the person removed.
        await anonymise('Agency booking records', () => admin.from('agency_bookings').update({ candidate_id: null }).eq('candidate_id', cid))
        await anonymise('Residency booking records', () => admin.from('residency_bookings').update({ candidate_id: null }).eq('candidate_id', cid))
        await anonymise('Academy enrolment records', () => admin.from('course_enrollments').update({ candidate_id: null }).eq('candidate_id', cid))
        await anonymise('Placement records', () => admin.from('placements').update({ candidate_id: null }).eq('candidate_id', cid))
        await anonymise('Salary records', () => admin.from('salary_records').update({ candidate_id: null }).eq('candidate_id', cid))

        // Remove the candidate profile
        await step('candidate profile', () => admin.from('candidate_profiles').delete().eq('id', cid))
      }

      await step('residency applications', () => admin.from('residency_applications').delete().eq('user_id', user.id))
    }

    // -----------------------------------------------------------------------
    // 3. Employer data.
    // -----------------------------------------------------------------------
    if (role === 'employer') {
      const { data: empProfile } = await admin
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (empProfile) {
        const eid = empProfile.id
        const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', eid)
        const jobIds = (jobs || []).map(j => j.id)

        if (jobIds.length > 0) {
          let applicationIds: string[] = []
          try {
            const { data: apps } = await admin.from('applications').select('id').in('role_id', jobIds)
            applicationIds = (apps || []).map((row: any) => row.id)
          } catch { /* the application delete below still runs */ }

          if (applicationIds.length > 0) {
            await step('interview records', () => admin.from('application_interviews').delete().in('application_id', applicationIds))
            await step('offer records', () => admin.from('application_offers').delete().in('application_id', applicationIds))
            await step('platform experience reviews', () => admin.from('platform_experience_reviews').delete().in('application_id', applicationIds))
          }

          await step('job skills', () => admin.from('job_required_skills').delete().in('job_id', jobIds))
          await step('job preferred skills', () => admin.from('job_preferred_skills').delete().in('job_id', jobIds))
          await step('job systems', () => admin.from('job_required_systems').delete().in('job_id', jobIds))
          await step('job product houses', () => admin.from('job_required_product_houses').delete().in('job_id', jobIds))
          await step('job certifications', () => admin.from('job_required_certifications').delete().in('job_id', jobIds))
          await step('applications received', () => admin.from('applications').delete().in('role_id', jobIds))
          // Swipes are keyed to the job that was on screen, not to the employer.
          await step('swipes on your roles', () => admin.from('swipes').delete().in('context_job_id', jobIds))
          await step('job listings', () => admin.from('job_listings').delete().eq('employer_id', eid))
        }

        await step('swipes you made', () => admin.from('swipes').delete().eq('swiper_id', user.id))
        await step('shortlisted candidates', () => admin.from('shortlisted_candidates').delete().eq('employer_id', eid))
        await step('matches', () => admin.from('matches').delete().eq('employer_id', eid))
        await step('arrival packs', () => admin.from('booking_arrival_packs').delete().eq('employer_id', eid))
        await step('behavioural analytics', () => admin.from('analytics_events').delete().eq('employer_id', eid))
        await step('residency conversations', () => admin.from('residency_conversations').delete().eq('employer_id', eid))

        // Financial and statutory records survive with the property removed.
        await anonymise('Agency booking records', () => admin.from('agency_bookings').update({ employer_id: null }).eq('employer_id', eid))
        await anonymise('Residency booking records', () => admin.from('residency_bookings').update({ employer_id: null }).eq('employer_id', eid))
        await anonymise('Placement records', () => admin.from('placements').update({ employer_id: null }).eq('employer_id', eid))
        await anonymise('Salary records', () => admin.from('salary_records').update({ employer_id: null }).eq('employer_id', eid))

        await step('employer profile', () => admin.from('employer_profiles').delete().eq('id', eid))
      }
    }

    // -----------------------------------------------------------------------
    // 4. Tables keyed to the account itself, whatever the role.
    // -----------------------------------------------------------------------
    await step('messages', () => admin.from('messages').delete().or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`))
    await step('reviews', () => admin.from('reviews').delete().or(`reviewer_id.eq.${user.id},reviewee_id.eq.${user.id}`))
    await step('platform experience reviews', () => admin.from('platform_experience_reviews').delete().eq('reviewer_user_id', user.id))
    await step('notifications', () => admin.from('notifications').delete().eq('user_id', user.id))
    await step('behavioural analytics', () => admin.from('analytics_events').delete().eq('actor_user_id', user.id))
    await step('mobile push tokens', () => admin.from('mobile_push_tokens').delete().eq('user_id', user.id))
    if (user.email) {
      const email = user.email
      await step('newsletter subscription', () => admin.from('newsletter_subscribers').delete().eq('email', email))
    }
    await anonymise('Purchase records', () => admin.from('commercial_purchases').update({ user_id: null }).eq('user_id', user.id))
    await anonymise('Residency booking records', () => admin.from('residency_bookings').update({ created_by: null }).eq('created_by', user.id))

    // Remove profiles row
    await step('account profile', () => admin.from('profiles').delete().eq('id', user.id))

    // Finally, delete the auth user. Privacy preferences, the consent ledger
    // and any marketing confirmation tokens cascade away with it.
    let authDeleted = true
    try {
      const { error } = await admin.auth.admin.deleteUser(user.id)
      if (error) { authDeleted = false; failures.push(`sign-in account: ${error.message}`) }
    } catch (authError: any) {
      authDeleted = false
      failures.push(`sign-in account: ${authError?.message || 'unexpected error'}`)
    }

    if (failures.length) console.error('[account deletion incomplete]', user.id, failures)

    const uniqueAnonymised = Array.from(new Set(anonymised))
    const message = authDeleted
      ? 'Your account has been deleted.'
      : 'Your data has been removed, but the sign-in account itself could not be closed automatically. WHC has been alerted and will close it by hand.'

    return NextResponse.json({
      success: authDeleted,
      message,
      filesRemoved,
      // Said plainly rather than buried: financial and statutory records are
      // kept, with the link to the person removed.
      retained: uniqueAnonymised.length
        ? {
            note: 'These records were anonymised rather than deleted. UK company and tax law requires WHC to keep the amounts and dates for six years, so the money and the dates remain but they are no longer linked to you.',
            records: uniqueAnonymised,
          }
        : null,
      incomplete: failures.length ? failures : null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
