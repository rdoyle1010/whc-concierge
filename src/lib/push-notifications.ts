import { createAdminClient } from '@/lib/supabase/admin'

type PushPayload = {
  userId: string
  title: string
  message: string
  link?: string
}

export async function sendMobilePush({ userId, title, message, link }: PushPayload) {
  const supabase = createAdminClient()
  const { data: rows, error } = await supabase
    .from('mobile_push_tokens')
    .select('id,expo_push_token')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !rows?.length) return { sent: 0, error }

  const messages = rows.map(row => ({
    to: row.expo_push_token,
    sound: 'default',
    title,
    body: message,
    data: { link: link || '/notifications' },
  }))

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    }
    if (process.env.EXPO_ACCESS_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    })

    const result = await response.json().catch(() => null)
    if (!response.ok) {
      console.error('[Mobile push failed]', response.status, result)
      return { sent: 0, error: result }
    }

    const tickets = Array.isArray(result?.data) ? result.data : []
    const invalidTokenIds = rows
      .filter((row, index) => tickets[index]?.status === 'error' && ['DeviceNotRegistered', 'InvalidCredentials'].includes(tickets[index]?.details?.error))
      .map(row => row.id)

    if (invalidTokenIds.length) {
      await supabase.from('mobile_push_tokens').update({ is_active: false, updated_at: new Date().toISOString() }).in('id', invalidTokenIds)
    }

    return { sent: rows.length - invalidTokenIds.length, error: null }
  } catch (pushError) {
    console.error('[Mobile push failed]', pushError)
    return { sent: 0, error: pushError }
  }
}
