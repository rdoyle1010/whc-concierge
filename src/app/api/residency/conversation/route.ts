import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: 'Missing residency listing' }, { status: 400 })

    const admin = createAdminClient()
    const [{ data: listing }, { data: employer }] = await Promise.all([
      admin.from('residency_profiles').select('id,user_id,candidate_profile_id,primary_specialism').eq('id', listingId).maybeSingle(),
      admin.from('employer_profiles').select('id,user_id').eq('user_id', user.id).maybeSingle(),
    ])

    if (!listing || !listing.user_id || !listing.candidate_profile_id) {
      return NextResponse.json({ error: 'Residency specialist is unavailable' }, { status: 404 })
    }
    if (!employer) {
      return NextResponse.json({ error: 'Only employer accounts can start a residency conversation' }, { status: 403 })
    }
    if (listing.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 })
    }

    const { data: conversation, error } = await admin.from('residency_conversations')
      .upsert({
        residency_profile_id: listing.id,
        candidate_id: listing.candidate_profile_id,
        employer_id: employer.id,
        started_by: user.id,
        status: 'open',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'residency_profile_id,employer_id' })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: existingMessage } = await admin.from('messages')
      .select('id')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${listing.user_id}),and(sender_id.eq.${listing.user_id},recipient_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()

    if (!existingMessage) {
      await admin.from('messages').insert({
        sender_id: user.id,
        recipient_id: listing.user_id,
        content: `I'd like to discuss a possible ${listing.primary_specialism || 'wellness'} residency.`,
        read: false,
      })
    }

    try {
      await createNotification(
        listing.user_id,
        'new_message',
        'New Residency conversation',
        'A property would like to discuss a possible residency with you.',
        '/talent/messages'
      )
    } catch { }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      recipientId: listing.user_id,
      redirect: `/employer/messages?to=${listing.user_id}`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unable to start conversation' }, { status: 500 })
  }
}
