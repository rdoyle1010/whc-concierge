// Notification preference enforcement for outbound email and SMS.
//
// In-app notifications (src/lib/notifications.ts) are ALWAYS created -
// preferences govern only what reaches the user's inbox and phone.
//
// emailAllowed is deliberately FAIL-OPEN: if the privacy_preferences row is
// missing, the column is null, or the read errors, the email sends. A
// preference lookup must never silently kill transactional mail - only an
// explicit opt-out (column === false) suppresses a send.

export type EmailCategory =
  | 'job_alerts'
  | 'application_updates'
  | 'booking_updates'
  | 'academy_updates'
  | 'product_news'

const CATEGORY_COLUMN: Record<EmailCategory, string> = {
  job_alerts: 'job_alerts_email',
  application_updates: 'application_updates_email',
  booking_updates: 'booking_updates_email',
  academy_updates: 'academy_updates_email',
  product_news: 'product_news_email',
}

/**
 * True unless the user has explicitly turned this email category off in
 * privacy_preferences. Pass the service-role (admin) Supabase client.
 * Best-effort: any failure returns true so the main action never breaks.
 */
export async function emailAllowed(admin: any, userId: string | null | undefined, category: EmailCategory): Promise<boolean> {
  if (!userId) return true
  try {
    const column = CATEGORY_COLUMN[category]
    const { data, error } = await admin
      .from('privacy_preferences')
      .select(column)
      .eq('user_id', userId)
      .maybeSingle()
    if (error || !data) return true // no row / read failure = default allow
    return (data as Record<string, unknown>)[column] !== false
  } catch {
    return true
  }
}

/**
 * SMS is opt-in only: a candidate must have ticked sms_opt_in AND have a
 * phone number on file. Unlike email there is no fail-open - texting someone
 * who has not consented is worse than a missed text.
 */
export function smsAllowed(candidate: { sms_opt_in?: boolean | null; phone?: string | null } | null | undefined): boolean {
  return Boolean(candidate?.sms_opt_in && candidate?.phone)
}
