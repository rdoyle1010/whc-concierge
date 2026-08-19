import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function findProfile(userId: string) {
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id,phone,sms_opt_in').eq('user_id', userId).maybeSingle()
  if (candidate) return { kind: 'candidate' as const, table: 'candidate_profiles' as const, profile: candidate }
  const { data: employer } = await admin.from('employer_profiles').select('id,contact_phone,sms_opt_in').eq('user_id', userId).maybeSingle()
  if (employer) return { kind: 'employer' as const, table: 'employer_profiles' as const, profile: employer }
  return null
}

export async function GET() {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const found = await findProfile(user.id)
  if (!found) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  const phone = found.kind === 'candidate' ? found.profile.phone : found.profile.contact_phone
  return NextResponse.json({ optIn: Boolean(found.profile.sms_opt_in), phone: phone || '', profileType: found.kind })
}

export async function POST(req: NextRequest) {
  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { optIn } = await req.json().catch(() => ({ optIn: null }))
  if (typeof optIn !== 'boolean') return NextResponse.json({ error: 'Choose whether to receive SMS alerts.' }, { status: 400 })

  const found = await findProfile(user.id)
  if (!found) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
  const phone = found.kind === 'candidate' ? found.profile.phone : found.profile.contact_phone
  if (optIn && !phone) return NextResponse.json({ error: 'Add a mobile number to your profile before enabling SMS alerts.' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from(found.table).update({ sms_opt_in: optIn }).eq('id', found.profile.id)
  if (error) return NextResponse.json({ error: 'Could not save SMS preference.' }, { status: 500 })

  return NextResponse.json({ success: true, optIn, phone: phone || '' })
}
