import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import { isTalentVisibility, visibilityColumns, visibilityFrom } from '@/lib/talent-visibility'

// Who can see her, changed by her.
//
// One route, one mapping from answer to columns, so the registration form and
// the settings screen cannot drift apart about what "discreet" means. Writing
// four columns from three screens is how somebody ends up visible when she
// believes she is not.

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!isTalentVisibility(body.visibility)) {
    return NextResponse.json({ error: 'Choose private, discreet or open.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('candidate_profiles')
    .select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'No professional profile on this account.' }, { status: 404 })

  const { error } = await admin.from('candidate_profiles')
    .update(visibilityColumns(body.visibility)).eq('id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Read it back rather than reporting the write. Telling somebody she is
  // private when she is not is the worst outcome this route has.
  const { data: saved } = await admin.from('candidate_profiles')
    .select('profile_visible, stealth_mode, private_mode').eq('id', profile.id).maybeSingle()
  const actual = visibilityFrom(saved)
  if (actual !== body.visibility) {
    return NextResponse.json({
      error: 'We could not confirm that change. Please try again, and tell us if it keeps happening.',
    }, { status: 500 })
  }

  return NextResponse.json({ success: true, visibility: actual })
}
