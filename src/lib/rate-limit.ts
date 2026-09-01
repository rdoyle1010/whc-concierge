import { createAdminClient } from '@/lib/supabase/admin'

type RateLimitEntry = { count: number; resetAt: number }

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Clean up expired entries every 60 seconds. Unref'd so the timer never
// holds a process open on its own - a serverless invocation should be free to
// finish, and a test run should be free to exit.
const sweep = setInterval(() => {
  const now = Date.now()
  stores.forEach(store => {
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key)
    })
  })
}, 60_000)
if (typeof (sweep as any)?.unref === 'function') (sweep as any).unref()

export function rateLimit(
  storeName: string,
  { windowMs, maxRequests }: { windowMs: number; maxRequests: number },
) {
  if (!stores.has(storeName)) stores.set(storeName, new Map())
  const store = stores.get(storeName)!

  return {
    check(ip: string): { success: boolean; remaining: number; resetTime: number } {
      const now = Date.now()
      const entry = store.get(ip)

      if (!entry || now > entry.resetAt) {
        store.set(ip, { count: 1, resetAt: now + windowMs })
        return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs }
      }

      if (entry.count >= maxRequests) {
        return { success: false, remaining: 0, resetTime: entry.resetAt }
      }

      entry.count++
      return { success: true, remaining: maxRequests - entry.count, resetTime: entry.resetAt }
    },
  }
}

// Who is calling.
//
// The old version took the leftmost value of X-Forwarded-For, which is
// whatever the caller put there. On an edge that appends rather than
// replaces, that made every limit in the codebase defeatable by rotating one
// header - so the throttle only ever slowed down honest traffic.
//
// Netlify sets x-nf-client-connection-ip to the real peer address, which no
// caller can forge. Where that is absent the RIGHTMOST forwarded hop is the
// one the trusted proxy wrote; the leftmost is the one the client chose.
export function getClientIp(req: Request): string {
  const netlify = req.headers.get('x-nf-client-connection-ip')
  if (netlify) return netlify.trim()

  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded.split(',').map(hop => hop.trim()).filter(Boolean)
    if (hops.length) return hops[hops.length - 1]
  }
  return 'unknown'
}

// A limit that survives a cold start.
//
// The in-memory limiter above is a module-level Map, and on Netlify Functions
// that means one counter per container. A limit that resets whenever a new
// container spins up is not much of a limit, and the sign-in endpoint - which
// had no limit at all - deserves better than that.
//
// This keeps the counters in the database, so every instance sees the same
// number. It fails OPEN: if the table is missing or the read fails, the
// request is allowed. A rate limiter must never be the reason nobody can sign
// in, and the in-memory limiter still applies underneath as a floor.
export type ShotResult = { allowed: boolean; retryAfterSeconds: number; remaining: number }

const ALLOWED: ShotResult = { allowed: true, retryAfterSeconds: 0, remaining: 1 }

export async function consumeRateLimit(
  bucket: string,
  key: string,
  { windowMs, maxRequests }: { windowMs: number; maxRequests: number },
): Promise<ShotResult> {
  if (!key) return ALLOWED
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString()

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_bucket: bucket,
      p_key: key,
      p_window_start: windowStart,
      p_max: maxRequests,
    })
    if (error) return ALLOWED
    const count = Number(data)
    if (!Number.isFinite(count)) return ALLOWED
    if (count > maxRequests) {
      const resetAt = Math.floor(now / windowMs) * windowMs + windowMs
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)), remaining: 0 }
    }
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, maxRequests - count) }
  } catch {
    return ALLOWED
  }
}

/**
 * Both limiters at once: the per-container one as an immediate floor, and the
 * shared one as the real ceiling. Returns null when the caller may proceed.
 */
export async function enforceRateLimit(
  req: Request,
  bucket: string,
  { windowMs, maxRequests, key }: { windowMs: number; maxRequests: number; key?: string },
): Promise<{ retryAfterSeconds: number } | null> {
  const identity = key || getClientIp(req)
  const local = rateLimit(bucket, { windowMs, maxRequests }).check(identity)
  if (!local.success) {
    return { retryAfterSeconds: Math.max(1, Math.ceil((local.resetTime - Date.now()) / 1000)) }
  }
  const shared = await consumeRateLimit(bucket, identity, { windowMs, maxRequests })
  return shared.allowed ? null : { retryAfterSeconds: shared.retryAfterSeconds }
}
