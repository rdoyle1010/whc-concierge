import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { sendNewMessageEmail } from '@/lib/emails'

function containsRestrictedContactDetails(value: string) {
  const text = value || ''
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
  const url = /\b(?:https?:\/\/|www\.)\S+/i.test(text)
  const contactApp = /\b(?:whatsapp|telegram|signal|facetime|instagram|facebook|linkedin|snapchat)\b/i.test(text)
  const phoneCandidates = text.match(/(?:\+?\d[\d\s().-]{5,}\d)/g) || []
  const phone = phoneCandidates.some(value => (value.match(/\d/g) || []).length >= 7)
  return email || url || contactApp || phone
}

async function getMessagingRelationship(admin: ReturnType<typeof createAdminClient>, senderId: string, recipientId: string) {
  const [{ data: senderRole }, { data: recipientRole }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', senderId).maybeSingle(),
    admin.from('profiles').select('role').eq('id', recipientId).maybeSingle(),
  ])
  if (!recipientRole) return { allowed: false, residencyRestricted: false }
  if (senderRole?.role === 'admin' || recipientRole.role === 'admin') return { allowed: true, residencyRestricted: false }

  const [senderCand, senderEmp, recipientCand, recipientEmp] = await Promise.all([
    admin.from('candidate_profiles').select('id').eq('user_id', senderId).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', senderId).maybeSingle(),
    admin.from('candidate_profiles').select('id').eq('user_id', recipientId).maybeSingle(),
    admin.from('employer_profiles').select('id').eq('user_id', recipientId).maybeSingle(),
  ])

  const candidateId = senderCand.data?.id || recipientCand.data?.id
  const employerId = senderEmp.data?.id || recipientEmp.data?.id
  if (!candidateId || !employerId) return { allowed: false, residencyRestricted: false }

  const [{ data: match }, { data: booking }, { data: shortlist }, { data: residencyConversation }, { data: confirmedResidency }] = await Promise.all([
    admin.from('matches').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('agency_bookings').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('shortlisted_candidates').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).limit(1).maybeSingle(),
    admin.from('residency_conversations').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).eq('status', 'open').limit(1).maybeSingle(),
    admin.from('residency_bookings').select('id').eq('candidate_id', candidateId).eq('employer_id', employerId).in('status', ['confirmed','completed']).limit(1).maybeSingle(),
  ])

  const residencyRestricted = Boolean(residencyConversation && !confirmedResidency)
  if (match || booking || shortlist || residencyConversation) return { allowed: true, residencyRestricted }

  const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', employerId)
  const jobIds = (jobs || []).map(job => job.id)
  if (jobIds.length === 0) return { allowed: false, residencyRestricted: false }
  const byRole = await admin.from('applications').select('id')
    .eq('candidate_id', candidateId).in('role_id', jobIds).limit(1).maybeSingle()
  if (!byRole.error && byRole.data) return { allowed: true, residencyRestricted }
  const byJob = await admin.from('applications').select('id')
    .eq('candidate_id', candidateId).in('job_id', jobIds).limit(1).maybeSingle()
  return { allowed: Boolean(!byJob.error && byJob.data), residencyRestricted }
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

    const admin = createAdminClient()
    const relationship = await getMessagingRelationship(admin, user.id, recipientId)
    if (!relationship.allowed) {
      return NextResponse.json(
        { error: 'Messaging opens after an application, shortlist, match, agency booking or Residency conversation.' },
        { status: 403 },
      )
    }

    if (relationship.residencyRestricted) {
      if (attachmentUrl) {
        return NextResponse.json({ error: 'Attachments are locked until the Residency booking is confirmed.' }, { status: 403 })
      }
      if (typeof content === 'string' && containsRestrictedContactDetails(content)) {
        return NextResponse.json({ error: 'For your protection, phone numbers, email addresses, links and direct-contact details stay hidden until the Residency booking is confirmed.' }, { status: 403 })
      }
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
      if (!alreadyNudged) {
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
