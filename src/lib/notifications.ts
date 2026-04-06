import { createAdminClient } from '@/lib/supabase/admin'

export type NotificationType =
  | 'new_match'
  | 'new_message'
  | 'profile_approved'
  | 'job_application'
  | 'review_received'
  | 'general'

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

export async function markAsRead(notificationId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
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
