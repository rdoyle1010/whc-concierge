import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

// The signed-in candidate's manual verification marks (employment,
// qualifications, references, Talent House assessment, manager approval). Read via the
// admin client because candidate_verifications is service-role only; the
// table arrives via a hand-run migration, so a missing table degrades to an
// empty list rather than an error.

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!candidate) return NextResponse.json({ types: [] })

  try {
    const { data: rows, error } = await admin.from('candidate_verifications')
      .select('type').eq('candidate_id', candidate.id)
    if (error) return NextResponse.json({ types: [] })
    return NextResponse.json({ types: (rows || []).map(row => row.type) })
  } catch {
    return NextResponse.json({ types: [] })
  }
}
