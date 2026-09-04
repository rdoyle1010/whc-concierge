import { createAdminClient } from '@/lib/supabase/admin'

// Behavioural event tracking - the platform's memory of what actually
// happened. Fire-and-forget by design: analytics must never break, slow or
// change the outcome of the request that emits it.
//
// Event names are a controlled vocabulary (see docs/data-dictionary.md);
// add new names there before emitting them here.

export type AnalyticsIds = {
  actorUserId?: string | null
  candidateId?: string | null
  employerId?: string | null
  jobId?: string | null
  applicationId?: string | null
}

export async function trackEvent(
  eventName: string,
  ids: AnalyticsIds = {},
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('analytics_events').insert({
      event_name: eventName,
      actor_user_id: ids.actorUserId || null,
      candidate_id: ids.candidateId || null,
      employer_id: ids.employerId || null,
      job_id: ids.jobId || null,
      application_id: ids.applicationId || null,
      payload,
    })
  } catch {
    // Analytics is best-effort; the table may not exist yet on a fresh
    // environment and that must never fail the caller.
  }
}

// Salary history with provenance - dated rows, never overwritten. Recording
// is also fire-and-forget: a salary record failure never blocks the action
// that produced the salary.
export async function recordSalary(entry: {
  kind: 'expectation' | 'advertised' | 'confirmed' | 'agency_rate'
  source: 'candidate_declared' | 'employer_advertised' | 'employer_confirmed' | 'platform_transaction'
  amountMin?: number | null
  amountMax?: number | null
  period?: 'annual' | 'monthly' | 'daily' | 'hourly'
  candidateId?: string | null
  employerId?: string | null
  jobId?: string | null
  placementId?: string | null
  roleLevel?: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('salary_records').insert({
      kind: entry.kind,
      source: entry.source,
      amount_min: entry.amountMin ?? null,
      amount_max: entry.amountMax ?? null,
      period: entry.period || 'annual',
      candidate_id: entry.candidateId || null,
      employer_id: entry.employerId || null,
      job_id: entry.jobId || null,
      placement_id: entry.placementId || null,
      role_level: entry.roleLevel || null,
    })
  } catch {
    // Best-effort by design.
  }
}
