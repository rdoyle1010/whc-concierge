import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { sendNewMessageEmail } from '@/lib/emails'

// Sends a message from the logged-in user. Service-role write because the
// messages table's client-side RLS policies are unreliable (column drift).
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { recipientId, content, attachmentUrl, attachmentName, attachmentType } = body
    if (!recipientId || (!content && !attachmentUrl)) {
      return NextResponse.json({ error: 'Missing recipient or content' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from('messages').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content || null,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      attachment_type: attachmentType || null,
      read: false,
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify the recipient, linking to the inbox for their role.
    // MUST be awaited: on serverless the function freezes the moment the
    // response returns, so a fire-and-forget insert almost never lands.
    const [{ data: recipProfile }, { data: senderProfile }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', recipientId).maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    ])
    const inbox = recipProfile?.role === 'employer' ? '/employer/messages' : '/talent/messages'
    const senderName = senderProfile?.full_name || 'Someone'
    const preview = content ? (content.length > 80 ? content.slice(0, 80) + '…' : content) : 'Sent you an attachment'
    try {
      await createNotification(recipientId, 'new_message', `New message from ${senderName}`, preview, inbox)
    } catch { /* non-fatal - the message itself was saved */ }

    // Email the recipient too - people who aren't logged in never see the
    // bell. Skipped when they already have an unread message from this sender
    // in the last 30 minutes, so a rapid back-and-forth doesn't send one
    // email per line. All best-effort: never fails the send itself.
    try {
      let alreadyNudged = false
      try {
        const { data: recentUnread } = await admin.from('messages')
          .select('id')
          .eq('sender_id', user.id)
          .eq('recipient_id', recipientId)
          .eq('read', false)
          .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
          .neq('id', data.id)
          .limit(1)
          .maybeSingle()
        alreadyNudged = Boolean(recentUnread)
      } catch { /* throttle check failing must not block the email */ }
      if (!alreadyNudged) {
        const { data: recipUser } = await admin.auth.admin.getUserById(recipientId)
        const recipEmail = recipUser?.user?.email
        if (recipEmail) await sendNewMessageEmail(recipEmail, '', senderName)
      }
    } catch { /* non-fatal - the message itself was saved */ }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
