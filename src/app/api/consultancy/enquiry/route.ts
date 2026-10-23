import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { createNotification } from '@/lib/notifications'
import { BUDGET_BANDS } from '@/lib/consultancy'

// A hotel enquiring about a consultant.
//
// This is the moment the directory earns its place, so it is recorded as an
// enquiry in its own right and not only as a message: it is the evidence the
// product works, and later the thing a consultant pays to receive more of.
//
// The enquiry, the notification and the counter are written by the service
// role together. A message that arrives with no enquiry behind it, or a
// counter that moves without a message, would each be worse than neither.

const BUDGET_VALUES = new Set<string>(BUDGET_BANDS.map(band => band.value))
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 10

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in to contact a consultant.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const message = String(body.message || '').trim()
  if (message.length < 30) {
    return NextResponse.json({ error: 'Please say a little about the work - at least a sentence or two. A consultant cannot answer "hello".' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: consultancy } = await admin.from('consultancy_profiles')
    .select('id, user_id, practice_name, enquiry_count')
    .eq('id', String(body.consultancy_id || ''))
    .eq('is_live', true).eq('approval_status', 'approved')
    .maybeSingle()
  if (!consultancy) return NextResponse.json({ error: 'That listing is no longer available.' }, { status: 404 })
  if (consultancy.user_id === user.id) {
    return NextResponse.json({ error: 'This is your own listing.' }, { status: 400 })
  }

  // A directory with an open contact form is a directory that gets used to
  // spray every consultant on it. Ten an hour is far above honest use.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await admin.from('consultancy_enquiries')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', user.id).gte('created_at', since)
  if ((count || 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ error: 'That is a lot of enquiries in one go. Try again a little later.' }, { status: 429 })
  }

  const { data: employer } = await admin.from('employer_profiles')
    .select('id, company_name, property_name').eq('user_id', user.id).maybeSingle()

  const { data: enquiry, error } = await admin.from('consultancy_enquiries').insert({
    consultancy_id: consultancy.id,
    employer_id: employer?.id || null,
    from_user_id: user.id,
    property_name: employer?.property_name || employer?.company_name || null,
    subject: String(body.subject || '').trim().slice(0, 200) || null,
    message: message.slice(0, 4000),
    budget_band: BUDGET_VALUES.has(String(body.budget_band)) ? String(body.budget_band) : null,
    timeline: String(body.timeline || '').trim().slice(0, 200) || null,
    status: 'new',
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Counted with a fresh read rather than an increment expression, because
  // Supabase cannot express one - and a lost count here is a display number,
  // not money.
  await admin.from('consultancy_profiles')
    .update({ enquiry_count: Number(consultancy.enquiry_count || 0) + 1 })
    .eq('id', consultancy.id)

  const from = employer?.property_name || employer?.company_name || 'A property'
  try {
    await createNotification(
      consultancy.user_id, 'general',
      `New consultancy enquiry from ${from}`,
      message.length > 100 ? `${message.slice(0, 100)}…` : message,
      '/talent/consultancy',
    )
  } catch { /* the enquiry is saved either way and shows on their dashboard */ }

  return NextResponse.json({ success: true, id: enquiry.id })
}
