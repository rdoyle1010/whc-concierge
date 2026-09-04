import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const token = String(body.expoPushToken || '').trim()
  if (!token || !token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
    return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await admin.from('mobile_push_tokens').upsert({
    user_id: user.id,
    expo_push_token: token,
    platform: body.platform || null,
    device_name: body.deviceName || null,
    app_version: body.appVersion || null,
    is_active: true,
    updated_at: now,
  }, { onConflict: 'expo_push_token', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: 'Could not register this device for notifications.' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const token = String(body.expoPushToken || '').trim()
  if (!token) return NextResponse.json({ success: true })

  const admin = createAdminClient()
  await admin.from('mobile_push_tokens').update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('expo_push_token', token).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}