type RateLimitEntry = { count: number; resetAt: number }

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  stores.forEach(store => {
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key)
    })
  })
}, 60_000)

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

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return '127.0.0.1'
}
