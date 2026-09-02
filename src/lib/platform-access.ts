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

// Set once someone joins the list, so the arrival gate stops appearing. It is
// a soft gate rather than a security boundary - the page behind it is public
// and stays in the HTML, which is deliberate: a crawler still reads the site,
// and lifting the gate later costs one setting rather than a re-index.
export const JOINED_COOKIE = 'thc_joined'

// Set when somebody reads the gate and carries on without joining.
//
// The gate began as a dead end: no dismissal, joining the list the only way
// through. That is an intrusive interstitial, which Google penalises on mobile
// as a matter of stated policy, and it cannot be run at the same time as
// chasing rankings. A gate that asks once, takes no for an answer and gets out
// of the way still builds the list and costs nothing in search.
//
// A week, not a year: long enough that browsing the site is not an argument,
// short enough that somebody who comes back next month is asked again.
export const GATE_SEEN_COOKIE = 'thc_gate_seen'

/**
 * True when this visitor should meet the coming-soon sign-up before anything
 * else. Anyone who has joined the list, or holds a valid preview cookie, walks
 * straight past it.
 */
export async function showEntryGate(): Promise<boolean> {
  const access = await readAccess()
  if (!access.closed) return false
  const jar = await cookies()
  if (jar.get(JOINED_COOKIE)?.value === '1') return false
  if (jar.get(GATE_SEEN_COOKIE)?.value === '1') return false
  if (access.previewCode && jar.get(PREVIEW_COOKIE)?.value === access.previewCode) return false
  // Anyone holding a session is past the waiting list by definition. Without
  // this the gate lands on a professional's own settings page and locks it,
  // asking someone who already has an account to join a list about opening.
  //
  // Presence of the cookie is enough and the token is deliberately not
  // verified: this is a soft gate in front of public pages, not an
  // entitlement, and validating it would add an auth round trip to every
  // render of every page on the site.
  if (jar.getAll().some(cookie => /^sb-.*-auth-token(\.\d+)?$/.test(cookie.name))) return false
  return true
}

export async function platformAccess(): Promise<AccessState> {
  return readAccess()
}
