import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const KEYS = [
  'newsletter_popup_enabled',
  'newsletter_popup_heading',
  'newsletter_popup_text',
  'newsletter_popup_button',
  'newsletter_popup_delay_seconds',
  'newsletter_popup_frequency_days',
]

const defaults = {
  enabled: true,
  heading: 'The best of wellness, in your inbox.',
  text: 'Jobs, industry insight, Academy updates and opportunities from Wellness House Collective.',
  button: 'Join the newsletter',
  delaySeconds: 6,
  frequencyDays: 14,
}

function valueOf(value: any) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin.from('platform_config').select('key,value').in('key', KEYS)
  const map = new Map((data || []).map((row: any) => [row.key, valueOf(row.value)]))
  const delay = Number(map.get('newsletter_popup_delay_seconds') || defaults.delaySeconds)
  const frequency = Number(map.get('newsletter_popup_frequency_days') || defaults.frequencyDays)
  return NextResponse.json({
    enabled: (map.get('newsletter_popup_enabled') || 'true') === 'true',
    heading: map.get('newsletter_popup_heading') || defaults.heading,
    text: map.get('newsletter_popup_text') || defaults.text,
    button: map.get('newsletter_popup_button') || defaults.button,
    delaySeconds: Number.isFinite(delay) ? Math.min(Math.max(delay, 0), 60) : defaults.delaySeconds,
    frequencyDays: Number.isFinite(frequency) ? Math.min(Math.max(frequency, 1), 90) : defaults.frequencyDays,
  }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}
