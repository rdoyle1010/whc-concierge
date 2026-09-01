// Private documents - CVs, insurance certificates, right-to-work evidence and
// message attachments - live in private storage buckets and are only ever
// addressed through /api/files, which checks the caller before signing a
// short-lived URL.
//
// When a browser posts one of those references back to an API route, the route
// must confirm it is a genuine /api/files reference, for the expected bucket,
// under the caller's own user-id path. Without that check a signed-in user
// could attach or claim somebody else's document simply by posting its path.
export function isOwnedFileReference(value: unknown, userId: string, bucket: string): boolean {
  if (typeof value !== 'string' || !value.startsWith('/api/files?')) return false
  if (!userId || !bucket) return false
  try {
    const url = new URL(value, 'https://whc.local')
    const path = url.searchParams.get('path') || ''
    return url.pathname === '/api/files'
      && url.searchParams.get('bucket') === bucket
      && path.startsWith(`${userId}/`)
      && !path.includes('..')
      && !path.includes('\\')
  } catch {
    return false
  }
}
