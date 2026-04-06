import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'
import type { NotificationType } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const { userId, type, title, message, link } = await req.json()
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { error } = await createNotification(userId, type as NotificationType, title, message, link)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
