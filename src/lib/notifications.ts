import { createAdminClient } from '@/lib/supabase/admin'
import { sendSmsIfOptedIn } from '@/lib/sms'

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

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId, type, title, message, link: link || null, is_read: false,
  })

  // Every talent-side platform notification can also create a short SMS alert.
  // The SMS deliberately contains no private employer/rate/interview detail;
  // sendSms normalises it into an action-led "you have an update" message.
  // A few flows already send their own SMS immediately after creating the
  // notification, so skip those here to avoid duplicate texts.
  if (!error && !alreadyHasDedicatedSms(title)) {
    try {
      const { data: candidate } = await supabase
        .from('candidate_profiles')
        .select('phone,sms_opt_in')
        .eq('user_id', userId)
        .maybeSingle()

      if (candidate?.phone) {
        await sendSmsIfOptedIn({
          to: candidate.phone,
          optedIn: candidate.sms_opt_in,
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
    .eq('user_id', userId) // only the owner can mark their notification read
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
