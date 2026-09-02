import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Before launch the shop window stays lit and the doors stay shut: every
// public page, the Journal, Intelligence and the Academy remain visible, but
// nobody can sign in or register until Rebecca opens them.
//
// The check runs in a server layout rather than in the page, because a page
// that renders and then hides itself has already shipped the form to the
// browser. Admin sign-in is never gated - closing the doors must not lock the
// owner out of her own platform.

export const PREVIEW_COOKIE = 'thc_preview'

// platform_config.value is a json column, so a value written by hand in the
// SQL editor arrives as the JSON string "closed" while one written by the
// admin form arrives already parsed. Accept either rather than depending on
// which route set it.
export function readConfigString(value: unknown): string {
  if (typeof value !== 'string') return value == null ? '' : String(value).trim()
  const trimmed = value.trim()
  if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return String(JSON.parse(trimmed)).trim() } catch { return trimmed.slice(1, -1).trim() }
  }
  return trimmed
}

const readAccess = unstable_cache(
  async () => {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('platform_config')
        .select('key, value')
        .in('key', ['platform_access', 'platform_preview_code'])
      const map = new Map((data || []).map(row => [row.key, readConfigString(row.value)]))
      return {
        closed: map.get('platform_access')?.toLowerCase() === 'closed',
        previewCode: map.get('platform_preview_code') || '',
      }
    } catch {
      // Fail open. A database wobble should not close the platform to
      // everyone; the doors are shut deliberately, never by accident.
      return { closed: false, previewCode: '' }
    }
  },
  ['platform-access-v1'],
  { revalidate: 30, tags: ['platform-access'] },
)

export type AccessState = { closed: boolean; previewCode: string }

/**
 * True when this visitor should be shown the closed-doors panel instead of
 * the sign-in or registration form. A valid preview cookie always passes, so
 * a hotel being given a walkthrough sees the real thing.
 */
export async function doorsClosedFor(): Promise<boolean> {
  const access = await readAccess()
  if (!access.closed) return false
  if (!access.previewCode) return true
  const jar = await cookies()
  return jar.get(PREVIEW_COOKIE)?.value !== access.previewCode
}

export async function platformAccess(): Promise<AccessState> {
  return readAccess()
}
