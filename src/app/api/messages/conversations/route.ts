import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 200

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const requestedLimit = Number(req.nextUrl.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(Math.floor(requestedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT

  const admin = createAdminClient()
  const { data: summaries, error } = await admin.rpc('get_message_conversation_summaries', {
    p_user_id: user.id,
    p_limit: limit,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const partnerIds = Array.from(new Set((summaries || []).map((row: any) => row.partner_id).filter(Boolean)))
  const [candidateProfiles, employerProfiles, currentEmployer] = await Promise.all([
    partnerIds.length
      ? admin.from('candidate_profiles').select('id,user_id,full_name').in('user_id', partnerIds)
      : Promise.resolve({ data: [] as any[] }),
    partnerIds.length
      ? admin.from('employer_profiles').select('user_id,company_name,contact_name,property_name').in('user_id', partnerIds)
      : Promise.resolve({ data: [] as any[] }),
    admin.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle(),
  ])

  const names = new Map<string, string>()
  for (const candidate of candidateProfiles.data || []) {
    if (candidate.user_id && candidate.full_name) names.set(candidate.user_id, candidate.full_name)
  }
  for (const employer of employerProfiles.data || []) {
    if (!employer.user_id || names.has(employer.user_id)) continue
    const name = employer.property_name || employer.company_name || employer.contact_name
    if (name) names.set(employer.user_id, name)
  }

  const hiddenCandidateUserIds = new Set<string>()
  if (currentEmployer.data?.id && (candidateProfiles.data || []).length > 0) {
    const candidateIds = (candidateProfiles.data || []).map((candidate: any) => candidate.id).filter(Boolean)
    const { data: residencyChats } = await admin.from('residency_conversations')
      .select('candidate_id')
      .eq('employer_id', currentEmployer.data.id)
      .in('candidate_id', candidateIds)
      .eq('status', 'open')

    const residencyCandidateIds = Array.from(new Set((residencyChats || []).map((row: any) => row.candidate_id).filter(Boolean)))
    if (residencyCandidateIds.length > 0) {
      const { data: confirmed } = await admin.from('residency_bookings')
        .select('candidate_id')
        .eq('employer_id', currentEmployer.data.id)
        .in('candidate_id', residencyCandidateIds)
        .in('status', ['confirmed', 'completed'])
      const confirmedIds = new Set((confirmed || []).map((row: any) => row.candidate_id))
      for (const candidate of candidateProfiles.data || []) {
        if (residencyCandidateIds.includes(candidate.id) && !confirmedIds.has(candidate.id) && candidate.user_id) {
          hiddenCandidateUserIds.add(candidate.user_id)
          names.set(candidate.user_id, 'Residency Specialist')
        }
      }
    }
  }

  const conversations = (summaries || []).map((row: any) => ({
    partnerId: row.partner_id,
    partnerName: names.get(row.partner_id) || 'Unknown User',
    residencyPrivate: hiddenCandidateUserIds.has(row.partner_id),
    unread: Number(row.unread_count || 0),
    lastMessage: {
      id: row.last_message_id,
      sender_id: row.last_sender_id,
      recipient_id: row.last_recipient_id,
      content: row.last_content,
      attachment_name: row.last_attachment_name,
      created_at: row.last_created_at,
    },
  }))

  return NextResponse.json({ conversations, limit, returned: conversations.length })
}
