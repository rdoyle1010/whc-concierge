import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { isOwnedFileReference } from '@/lib/file-references'
import { createNotification } from '@/lib/notifications'
import { sendNewMessageEmail } from '@/lib/emails'
import { emailAllowed } from '@/lib/notification-prefs'

function containsRestrictedContactDetails(value: string) {
  const text = value || ''
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  const url = /\b(?:https?:\/\/|www\.)\S+/i.test(text)
  const contactApp = /\b(?:whatsapp|telegram|signal|facetime|instagram|facebook|linkedin|snapchat)\b/i.test(text)
  const phoneCandidates = text.match(/(?:\+?\d[\d\s().-]{5,}\d)/g) || []
  const phone = phoneCandidates.some(value => (value.match(/\d/g) || []).length >= 7)
  return email || url || contactApp || phone
}

// Contact details (phone, email, links, contact apps) stay locked until the
// relationship has real commitment behind it: a paid agency booking, a
// confirmed residency, or an application the employer has moved to
// interview stage or beyond. Early conversations - mutual matches,
// shortlists, fresh applications - stay on WHC, which is what protects
// both sides and the platform's fee.
const PROGRESSED_APPLICATION_STATUSES = ['interview', 'offered', 'accepted']

async function getMessagingRelationship(admin: ReturnType<typeof createAdminClient>, senderId: string, recipientId: string) {
  const [{ data: senderRole }, { data: recipientRole }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', senderId).maybeSingle(),
    admin.from('profiles').select('role').eq('id', recipientId).maybeSingle(),
  ])
  if (!recipientRole) return { allowed: false, contactRestricted: false, residencyRestricted: false }
  if (senderRole?.role === 'admin' || recipientRole.role === 'admin') return { allowed: true, contactRestricted: false, residencyRestricted: false }

  const [senderCand, senderEmp, recipientCand, recipientEmp] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', senderId).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', senderId).maybeSingle(),
    admin.from('candidate_profiles').select('id').eq('user_id', recipientId).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', recipientId).maybeSingle(),
  ])

  const candidateId = senderCand.data?.id || recipientCand.data?.id
  const employerId = senderEmp.data?.id || recipientEmp.data?.id
  if (!candidateId || !employerId) return { allowed: false, contactRestricted: false, residencyRestricted: false }

  const [{ data: match }, { data: booking }, { data: paidBooking }, { data: shortlist }, { data: residencyConversation }, { data: confirmedResidency }] = await Promise.all([
    admin.from('matches').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).not('paid_at', 'is', null).limit(1).maybeSingle(),
    admin.from('shortlisted_candidates').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('residency_conversations').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).eq('status', 'open').limit(1).maybeSingle(),
    admin.from('residency_bookings').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).in('status', ['confirmed','completed']).limit(1).maybeSingle(),
  ])

  // A progressed application (interview stage or beyond) on any of this
  // employer's roles unlocks contact details - by then scheduling
  // genuinely needs them.
  let progressed = false
  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employerId)
  const jobIds = (jobs || []).map(job => job.id)
  if (jobIds.length) {
    const [progressedByRole, progressedByJob] = await Promise.all([
      admin.from('applications').select('id').eq('candidate_id', candidateId).in('role_id', jobIds).in('status', PROGRESSED_APPLICATION_STATUSES).limit(1).maybeSingle(),
      admin.from('applications').select('id').eq('candidate_id', candidateId).in('job_id', jobIds).in('status', PROGRESSED_APPLICATION_STATUSES).limit(1).maybeSingle(),
    ])
    progressed = Boolean((!progressedByRole.error && progressedByRole.data) || (!progressedByJob.error && progressedByJob.data))
  }

  const contactUnlocked = Boolean(paidBooking || confirmedResidency || progressed)
  const contactRestricted = !contactUnlocked
  const residencyRestricted = Boolean(residencyConversation && !confirmedResidency)
  if (match || booking || shortlist || residencyConversation) return { allowed: true, contactRestricted, residencyRestricted }

  if (jobIds.length === 0) return { allowed: false, contactRestricted: false, residencyRestricted: false }
  const byRole = await admin.from('applications').select('id')
    .eq('candidate_id', candidateId).in('role_id', jobIds).limit(1).maybeSingle()
  if (!byRole.error && byRole.data) return { allowed: true, contactRestricted, residencyRestricted }
  const byJob = await admin.from('applications').select('id')
    .eq('candidate_id', candidateId).in('job_id', jobIds).limit(1).maybeSingle()
  return { allowed: Boolean(!byJob.error && byJob.data), contactRestricted, residencyRestricted }
}

// The composer needs to know the state of a conversation before the person
// types into it - otherwise the first they learn of the contact-detail lock is
// a 403 on a message they have already written. This returns the same
// relationship the POST enforces, for one recipient, so a client can explain
// the rule up front instead of surprising the user with it.
export async function GET(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    const recipientId = req.nextUrl.searchParams.get('recipientId') || ''
    if (!recipientId) return NextResponse.json({ error: 'Missing recipient' }, { status: 400 })
    if (recipientId === user.id) return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 })

    const relationship = await getMessagingRelationship(createAdminClient(), user.id, recipientId)
    return NextResponse.json({
      allowed: relationship.allowed,
      contactRestricted: relationship.contactRestricted,
      residencyRestricted: relationship.residencyRestricted,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const { recipientId, content, attachmentUrl, attachmentName, attachmentType } = body
    if (!recipientId || (!content && !attachmentUrl)) {
      return NextResponse.json({ error: 'Missing recipient or content' }, { status: 400 })
    }
    if (recipientId === user.id) {
      return NextResponse.json({ error: 'You cannot message yourself' }, { status: 400 })
    }
    if (typeof content === 'string' && content.length > 5000) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
    }

    // Both message composers upload through /api/upload with a path of
    // `${userId}/messages/...` and send back the /api/files reference it
    // returns. Anything else - another person's attachment path, or a raw
    // storage URL - is refused, so a message can never hand its recipient a
    // file the sender does not own.
    if (attachmentUrl && !isOwnedFileReference(attachmentUrl, user.id, 'message-attachments')) {
      return NextResponse.json({ error: 'That attachment does not belong to this account' }, { status: 400 })
    }

    const admin = createAdminClient()
    const relationship = await getMessagingRelationship(admin, user.id, recipientId)
    if (!relationship.allowed) {
      return NextResponse.json(
        { error: 'Messaging opens after an application, shortlist, match, agency booking or Residency conversation.' },
        { status: 403 },
      )
    }

    if (relationship.residencyRestricted && attachmentUrl) {
      return NextResponse.json({ error: 'Attachments are locked until the Residency booking is confirmed.' }, { status: 403 })
    }
    if (relationship.contactRestricted && typeof content === 'string' && containsRestrictedContactDetails(content)) {
      return NextResponse.json({ error: 'To protect both sides, phone numbers, email addresses, links and direct-contact details unlock once there is a confirmed booking or an interview-stage application. Keep the conversation on WHC until then.' }, { status: 403 })
    }

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

    const [{ data: recipProfile }, { data: senderProfile }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', recipientId).maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    ])
    const inbox = recipProfile?.role === 'employer' ? '/employer/messages' : '/talent/messages'
    const senderName = relationship.residencyRestricted ? 'Residency conversation' : (senderProfile?.full_name || 'Someone')
    const preview = content ? (content.length > 80 ? content.slice(0, 80) + '…' : content) : 'Sent you an attachment'
    try {
      await createNotification(recipientId, 'new_message', `New message from ${senderName}`, preview, inbox)
    } catch { }

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
      } catch { }
      // Preference-gated ('application_updates'): the employer-message email
      // nudge respects the recipient's opt-out. The in-app notification above
      // is always created. Fail-open so the message itself is never blocked.
      if (!alreadyNudged && await emailAllowed(admin, recipientId, 'application_updates')) {
        const { data: recipUser } = await admin.auth.admin.getUserById(recipientId)
        const recipEmail = recipUser?.user?.email
        if (recipEmail) await sendNewMessageEmail(recipEmail, '', senderName)
      }
    } catch { }

    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
