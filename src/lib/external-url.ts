// A website address somebody typed, made safe to put in an href.
//
// A property saved its website as "www.wellnesshousecollective.co.uk" and the
// page rendered it straight into href. A browser reads an address with no
// scheme as relative, so the link from the Director of Spa role resolved to
// /jobs/www.wellnesshousecollective.co.uk and served "Role not found". The
// property looked broken, on the page where a candidate decides whether to
// apply to them.
//
// It also refuses anything that is not http or https. javascript: and data:
// URLs in an href are how a stored field becomes a script, and an employer
// profile is a field strangers can read.

const SAFE_SCHEME = /^https?:\/\//i
const HAS_ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export function externalUrl(value: unknown): string | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  // A scheme we do not trust is rejected outright rather than repaired. If
  // somebody stored "javascript:...", prefixing https:// would only hide it.
  if (HAS_ANY_SCHEME.test(raw) && !SAFE_SCHEME.test(raw)) return null

  const candidate = SAFE_SCHEME.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // A hostname with no dot is not a website somebody meant to type.
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

/** The address without the scheme or a trailing slash, for showing on screen. */
export function externalUrlLabel(value: unknown): string | null {
  const url = externalUrl(value)
  if (!url) return null
  return url.replace(SAFE_SCHEME, '').replace(/\/$/, '')
}
