import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_BILLING_IDENTITY, parseBillingIdentity, type BillingIdentity } from '@/lib/billing-identity'

export const BILLING_IDENTITY_KEY = 'billing_identity'

// platform_config.value holds JSON as text, and a value written by hand in the
// SQL editor arrives double-encoded. Accept either rather than depending on
// which route wrote it - the same trap platform-access already fell into.
function decode(value: unknown): unknown {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return {}
  let current: unknown = value
  for (let attempt = 0; attempt < 2; attempt++) {
    if (typeof current !== 'string') break
    try { current = JSON.parse(current) } catch { return {} }
  }
  return current && typeof current === 'object' ? current : {}
}

const read = unstable_cache(
  async (): Promise<BillingIdentity> => {
    try {
      const admin = createAdminClient()
      const { data } = await admin.from('platform_config').select('value').eq('key', BILLING_IDENTITY_KEY).limit(1)
      return parseBillingIdentity(decode(data?.[0]?.value))
    } catch {
      // A document with no seller block is wrong, but a page that will not
      // render at all is worse: the buyer cannot even see what they paid.
      return DEFAULT_BILLING_IDENTITY
    }
  },
  ['billing-identity-v1'],
  { revalidate: 300, tags: ['billing-identity'] },
)

export function getBillingIdentity(): Promise<BillingIdentity> {
  return read()
}
