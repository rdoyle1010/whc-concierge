import { createAdminClient } from '@/lib/supabase/admin'
import { sendSmsIfOptedIn } from '@/lib/sms'
import { sendMobilePush } from '@/lib/push-notifications'

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'profile_approved'
  | 'job_application'
  | 'review_received'
  | 'general'

function alreadyHasDedicatedSms(title: string): boolean {
  const value = title.toLowerCase()
  return (
    value.includes('interview invitation') ||
    value.includes('first interview') ||
    value.includes('second interview') ||
    value.includes('final interview') ||
    value.includes('shortlisted') ||
    value.includes('job offer') ||
    value.includes('urgent: shift offer')
  )
}

function notificationRequiresAction(type: NotificationType, title: string, link?: string): boolean {
  const value = `${title} ${link || ''}`.toLowerCase()
  if (type === 'new_message' || type === 'job_application') return true
  return (
    value.includes('interview') ||
    value.includes('offer') ||
    value.includes('shortlist') ||
    value.includes('action required') ||
    value.includes('respond') ||
    value.includes('shift offer') ||
    value.includes('/agency') ||
    value.includes('/applications') ||
    value.includes('/messages')
  )
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link: link || null,
    is_read: false,
    requires_action: notificationRequiresAction(type, title, link),
  })

  if (!error) {
    try {
      await sendMobilePush({ userId, title, message, link })
    } catch (pushError) {
      console.error('[Notification push failed]', pushError)
    }
  }

  if (!error && !alreadyHasDedicatedSms(title)) {
    try {
      const [{ data: candidate }, { data: employer }] = await Promise.all([
        supabase.from('candidate_profiles').select('phone,sms_opt_in').eq('user_id', userId).maybeSingle(),
        supabase.from('employer_profiles').select('contact_phone,sms_opt_in').eq('user_id', userId).maybeSingle(),
      ])

      const recipient = candidate?.phone
        ? { phone: candidate.phone, optedIn: candidate.sms_opt_in }
        : employer?.contact_phone
          ? { phone: employer.contact_phone, optedIn: employer.sms_opt_in }
          : null

      if (recipient) {
        await sendSmsIfOptedIn({
          to: recipient.phone,
          optedIn: recipient.optedIn,
          body: `${title}. ${message}`,
        })
      }
    } catch (smsError) {
      console.error('[Notification SMS failed]', smsError)
    }
  }

  return { error }
}

export async function getUnreadCount(userId: string) {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return count || 0
}

export async function markAsRead(notificationId: string, userId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
  return { error }
}

export async function markAllRead(userId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  return { error }
}

// Money that needs a person to look at it.
//
// Some failures cannot be resolved in code - a payment that arrives for a
// booking that was already paid, a chargeback on a shift that is queued for
// payout, a Stripe payout that bounces. Each of those is a real amount of
// real money in the wrong place, and the only honest response is to put it
// in front of an administrator rather than write a line to a log nobody
// reads. Best-effort by design: alerting must never be the reason a webhook
// fails.
export async function notifyAdmins(title: string, message: string, link?: string) {
  try {
    const supabase = createAdminClient()
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (!admins || admins.length === 0) return
    await Promise.allSettled(
      admins.map((row: any) => createNotification(row.id, 'general', title, message, link)),
    )
  } catch (error) {
    console.error('[Admin alert failed]', error)
  }
}
