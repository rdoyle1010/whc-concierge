const STATIC_ALLOWED_ORIGINS = [
  'https://talenthousecollective.co.uk',
  'https://whc-concierge.netlify.app',
]

const WHC_DEPLOY_PREVIEW_HOST = /^deploy-preview-\d+--whc-concierge\.netlify\.app$/i

function normaliseOrigin(value?: string | null): string {
  if (!value) return ''
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

export function isWhcDeployPreviewOrigin(value?: string | null): boolean {
  const origin = normaliseOrigin(value)
  if (!origin) return false
  const url = new URL(origin)
  return url.protocol === 'https:' && !url.port && WHC_DEPLOY_PREVIEW_HOST.test(url.hostname)
}

export function getSafeSiteOrigin(
  untrusted?: string | null,
  configuredSiteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const configuredOrigin = normaliseOrigin(configuredSiteUrl)
  const allowedOrigins = new Set([
    ...STATIC_ALLOWED_ORIGINS,
    ...(configuredOrigin ? [configuredOrigin] : []),
  ])
  const candidate = normaliseOrigin(untrusted)

  if (candidate && (allowedOrigins.has(candidate) || isWhcDeployPreviewOrigin(candidate))) {
    return candidate
  }

  return configuredOrigin || STATIC_ALLOWED_ORIGINS[0]
}

export function assertStripeModeMatchesOrigin(
  origin: string,
  stripeSecretKey: string | undefined = process.env.STRIPE_SECRET_KEY,
): void {
  if (isWhcDeployPreviewOrigin(origin) && stripeSecretKey?.startsWith('sk_live_')) {
    throw new Error('Live Stripe payments are disabled on deploy previews. Configure Stripe test keys for the Deploy Preview environment.')
  }
}
