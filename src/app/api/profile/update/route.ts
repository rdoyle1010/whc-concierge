import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { profileId, data } = await req.json()
    if (!profileId || !data) return NextResponse.json({ error: 'Missing profileId or data' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.from('candidate_profiles').update(data).eq('id', profileId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
