import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRequest as requireAdmin, adminRequestUserId } from '@/lib/admin-api-auth'
import { RETENTION_CATEGORIES, RETENTION_EXCLUDED, retentionCutoff } from '@/lib/retention'
import { isInternalApiRequest } from '@/lib/internal-request'

type Admin = ReturnType<typeof createAdminClient>

export type RetentionResult = {
  key: string
  label: string
  period: string
  action: string
  reason: string
  count: number
  note?: string
  error?: string
}

// Nothing here touches agency_bookings, residency_bookings, commercial_purchases,
// course_enrollments, placements or salary_records. Those carry amounts, payment
// references and hire outcomes, and UK company and tax law (Companies Act 2006
// s388 and the Finance Act record-keeping rules) requires them to be kept for
// six years from the end of the relevant accounting period. They are anonymised
// when an account is deleted, never swept on age. See src/lib/retention.ts.

const SCAN_LIMIT = 5000

async function countAndIds(
  run: () => PromiseLike<{ data: { id: string }[] | null; error: { message?: string } | null }>,
): Promise<{ ids: string[]; error?: string }> {
  try {
    const { data, error } = await run()
    if (error) return { ids: [], error: error.message || 'could not be read' }
    return { ids: (data || []).map(row => row.id).filter(Boolean) }
  } catch (scanError: any) {
    return { ids: [], error: scanError?.message || 'could not be read' }
  }
}

async function removeByIds(admin: Admin, table: string, ids: string[]): Promise<string | undefined> {
  if (!ids.length) return undefined
  for (let index = 0; index < ids.length; index += 500) {
    const { error } = await admin.from(table).delete().in('id', ids.slice(index, index + 500))
    if (error) return error.message || 'could not be deleted'
  }
  return undefined
}

/**
 * Work out what falls outside every retention period. `execute: false` is a
 * dry run and touches nothing; `execute: true` performs the deletions.
 */
async function sweep(admin: Admin, execute: boolean): Promise<RetentionResult[]> {
  const now = new Date()
  const results: RetentionResult[] = []

  const record = (key: string, extra: Partial<RetentionResult>) => {
    const category = RETENTION_CATEGORIES.find(item => item.key === key)!
    results.push({
      key: category.key,
      label: category.label,
      period: category.period,
      action: category.action,
      reason: category.reason,
      count: 0,
      ...extra,
    })
  }

  // --- Simple "older than the cutoff" tables -------------------------------
  for (const key of ['analytics_events', 'notifications', 'contact_queries', 'messages'] as const) {
    const cutoff = retentionCutoff(key, now)
    const { ids, error } = await countAndIds(() =>
      admin.from(key).select('id').lt('created_at', cutoff).limit(SCAN_LIMIT))
    const deleteError = execute ? await removeByIds(admin, key, ids) : undefined
    record(key, { count: ids.length, error: error || deleteError })
  }

  // --- Marketing confirmation tokens: consumed or expired, then 30 days ----
  {
    const cutoff = retentionCutoff('marketing_confirmation_tokens', now)
    const consumed = await countAndIds(() =>
      admin.from('marketing_confirmation_tokens').select('id').not('consumed_at', 'is', null).lt('consumed_at', cutoff).limit(SCAN_LIMIT))
    const expired = await countAndIds(() =>
      admin.from('marketing_confirmation_tokens').select('id').lt('expires_at', cutoff).limit(SCAN_LIMIT))
    const ids = Array.from(new Set([...consumed.ids, ...expired.ids]))
    const deleteError = execute ? await removeByIds(admin, 'marketing_confirmation_tokens', ids) : undefined
    record('marketing_confirmation_tokens', { count: ids.length, error: consumed.error || expired.error || deleteError })
  }

  // --- Newsletter confirmation tokens: clear the credential, keep the row --
  // The subscriber row itself carries the consent record, so only the spent
  // token hash and its expiry are removed.
  {
    const cutoff = retentionCutoff('newsletter_confirmation_tokens', now)
    const scan = await countAndIds(() =>
      admin.from('newsletter_subscribers').select('id')
        .not('confirmation_token_hash', 'is', null)
        .lt('confirmation_expires_at', cutoff)
        .limit(SCAN_LIMIT))
    let clearError: string | undefined
    if (execute && scan.ids.length) {
      for (let index = 0; index < scan.ids.length; index += 500) {
        const { error } = await admin.from('newsletter_subscribers')
          .update({ confirmation_token_hash: null, confirmation_expires_at: null })
          .in('id', scan.ids.slice(index, index + 500))
        if (error) { clearError = error.message || 'could not be cleared'; break }
      }
    }
    record('newsletter_confirmation_tokens', { count: scan.ids.length, error: scan.error || clearError })
  }

  // --- Applications: 24 months after the last activity ---------------------
  // updated_at is the activity marker; rows that predate the column fall back
  // to created_at, so both are scanned.
  {
    const cutoff = retentionCutoff('applications', now)
    const byUpdated = await countAndIds(() =>
      admin.from('applications').select('id').not('updated_at', 'is', null).lt('updated_at', cutoff).limit(SCAN_LIMIT))
    const byCreated = await countAndIds(() =>
      admin.from('applications').select('id').is('updated_at', null).lt('created_at', cutoff).limit(SCAN_LIMIT))
    const ids = Array.from(new Set([...byUpdated.ids, ...byCreated.ids]))
    let deleteError: string | undefined
    if (execute && ids.length) {
      // Interviews, offers and platform reviews hang off the application and
      // would otherwise be orphaned.
      for (const child of ['application_interviews', 'application_offers', 'platform_experience_reviews']) {
        for (let index = 0; index < ids.length; index += 500) {
          const { error } = await admin.from(child).delete().in('application_id', ids.slice(index, index + 500))
          if (error) { deleteError = `${child}: ${error.message || 'could not be deleted'}`; break }
        }
        if (deleteError) break
      }
      if (!deleteError) deleteError = await removeByIds(admin, 'applications', ids)
    }
    record('applications', { count: ids.length, error: byUpdated.error || byCreated.error || deleteError })
  }

  // --- Verification rows left behind by closed accounts --------------------
  // The documents themselves go at the moment of deletion; this clears rows
  // whose candidate profile no longer exists and which are over a year old.
  {
    const cutoff = retentionCutoff('verification_rows', now)
    let orphanError: string | undefined
    let orphanCount = 0

    for (const table of ['certificate_submissions', 'candidate_verifications']) {
      try {
        const { data, error } = await admin.from(table).select('id,candidate_id').lt('created_at', cutoff).limit(SCAN_LIMIT)
        if (error) { orphanError = orphanError || `${table}: ${error.message || 'could not be read'}`; continue }
        const rows = (data || []) as { id: string; candidate_id: string | null }[]
        if (!rows.length) continue

        const candidateIds = Array.from(new Set(rows.map(row => row.candidate_id).filter(Boolean))) as string[]
        const live = new Set<string>()
        for (let index = 0; index < candidateIds.length; index += 500) {
          const { data: found, error: liveError } = await admin.from('candidate_profiles')
            .select('id').in('id', candidateIds.slice(index, index + 500))
          if (liveError) { orphanError = orphanError || `${table}: ${liveError.message || 'could not be checked'}`; break }
          for (const row of found || []) live.add(row.id)
        }
        if (orphanError) continue

        const orphanIds = rows.filter(row => !row.candidate_id || !live.has(row.candidate_id)).map(row => row.id)
        orphanCount += orphanIds.length
        if (execute && orphanIds.length) {
          const deleteError = await removeByIds(admin, table, orphanIds)
          if (deleteError) orphanError = orphanError || `${table}: ${deleteError}`
        }
      } catch (tableError: any) {
        orphanError = orphanError || `${table}: ${tableError?.message || 'could not be read'}`
      }
    }

    record('verification_rows', {
      count: orphanCount,
      error: orphanError,
      note: 'Counts certificate_submissions and candidate_verifications rows whose candidate profile no longer exists.',
    })
  }

  return results
}

export async function GET(_req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    // GET is always a dry run. It never deletes anything.
    const categories = await sweep(admin, false)

    let lastRun: { ran_at: string; summary: any } | null = null
    try {
      const { data } = await admin.from('retention_runs').select('ran_at,summary').order('ran_at', { ascending: false }).limit(1).maybeSingle()
      lastRun = data || null
    } catch { lastRun = null }

    return NextResponse.json({
      dryRun: true,
      generatedAt: new Date().toISOString(),
      scanLimit: SCAN_LIMIT,
      total: categories.reduce((sum, item) => sum + item.count, 0),
      categories,
      excluded: RETENTION_EXCLUDED,
      lastRun,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// The sweep runs two ways.
//
// An administrator presses the button, and the run is attributed to them.
// Or the nightly scheduled function calls it with the internal secret, and
// the run is attributed to the schedule.
//
// Until now only the first existed, which meant the retention policy - 13
// months for behavioural analytics, 24 for applications and messages, 12 for
// notifications and contact enquiries - applied on the days somebody
// remembered. A period nobody enforces is not a retention period, and the
// privacy policy states these as facts.
export async function POST(req: NextRequest) {
  const scheduled = isInternalApiRequest(req)
  const ranBy = scheduled ? null : await adminRequestUserId()
  if (!scheduled && !ranBy) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const ranAt = new Date().toISOString()
    const categories = await sweep(admin, true)
    const total = categories.reduce((sum, item) => sum + item.count, 0)
    const problems = categories.filter(item => item.error).map(item => `${item.key}: ${item.error}`)

    // A category that filled the scan limit has more waiting, and the run
    // must say so rather than quietly leaving a backlog that never clears.
    const saturated = categories.filter(item => item.count >= SCAN_LIMIT).map(item => item.key)
    const summary = { total, categories, problems, scanLimit: SCAN_LIMIT, saturated, trigger: scheduled ? 'scheduled' : 'admin' }
    let recorded = true
    try {
      // run_by arrives with 20260901140000_data_retention.sql. Before that
      // migration the insert is retried without it, so an unapplied migration
      // costs the attribution and not the audit row.
      const { error } = await admin.from('retention_runs').insert({ ran_at: ranAt, summary, run_by: ranBy })
      if (error && /column/i.test(error.message || '')) {
        const { error: retryError } = await admin.from('retention_runs').insert({ ran_at: ranAt, summary })
        if (retryError) recorded = false
      } else if (error) {
        recorded = false
      }
    } catch { recorded = false }

    if (problems.length) console.error('[retention sweep problems]', problems)

    return NextResponse.json({
      dryRun: false,
      ranAt,
      total,
      categories,
      excluded: RETENTION_EXCLUDED,
      recorded,
      // retention_runs arrives with 20260901140000_data_retention.sql. The
      // sweep still runs before the migration; only the audit row is missing.
      note: recorded ? null : 'The sweep ran, but it could not be logged - run the 20260901140000_data_retention migration to create retention_runs.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
