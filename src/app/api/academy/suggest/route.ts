import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createNotification } from '@/lib/notifications'
import { getAcademyCourseBySlug } from '@/lib/academy-catalog-server'

// Employer nudge: "we'd book you more with this training". Sends the
// candidate a notification and an inbox message naming the property and the
// course - warm demand generation for the Academy, useful signal for the
// therapist.

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Please log in' }, { status: 401 })

    const admin = createAdminClient()
    const { data: emp } = await admin.from('employer_profiles')
      .select('id, company_name, property_name').eq('user_id', user.id).maybeSingle()
    if (!emp) return NextResponse.json({ error: 'Only employers can suggest training' }, { status: 403 })

    const body = await req.json()
    const course = await getAcademyCourseBySlug(String(body.courseSlug || ''), false)
    if (!course) return NextResponse.json({ error: 'Unknown course' }, { status: 400 })

    const { data: cand } = await admin.from('candidate_profiles')
      .select('id, user_id, full_name').eq('id', String(body.candidateId || '')).maybeSingle()
    if (!cand?.user_id) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

    const empName = emp.property_name || emp.company_name || 'A property'
    const message = `${empName} has suggested a WHC Academy course for you: ${course.title}. Properties can filter the agency directory by Academy certificates, so completing it makes you directly bookable for shifts like theirs. Find it under Academy in your dashboard (£10, certificate included).`

    try {
      await createNotification(cand.user_id, 'general', `${empName} suggested a course for you`, message, '/talent/academy')
    } catch { /* non-fatal */ }
    try {
      await admin.from('messages').insert({
        sender_id: user.id,
        recipient_id: cand.user_id,
        content: message,
        read: false,
      })
    } catch { /* non-fatal */ }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
