import { marketingUnsubscribeUrl, newsletterUnsubscribeUrl } from '@/lib/privacy-consent'

// Who may be sent marketing, resolved once.
//
// The newsletter route worked this out correctly and privately: confirmed
// consent on privacy_preferences, the standalone newsletter list where the
// audience allows it, deduplicated by address, each with its own one-click
// unsubscribe. Events needed the same answer, and a second copy of consent
// logic is how one of them ends up sending to somebody who opted out.

export type Recipient = { email: string; unsubscribe: string }

export type ConsentedAudience = {
  recipients: Recipient[]
  /** People with an address who have not confirmed consent. Counted, never sent to. */
  excludedWithoutConsent: number
}

export type AudienceScope = 'all' | 'candidates' | 'employers'

export async function consentedRecipients(
  admin: any,
  scope: AudienceScope,
  opts: { includeNewsletterList?: boolean } = {},
): Promise<ConsentedAudience> {
  let query = admin.from('profiles').select('id,email,role').not('email', 'is', null)
  if (scope === 'candidates') query = query.eq('role', 'candidate')
  if (scope === 'employers') query = query.eq('role', 'employer')
  const { data: profiles } = await query

  const ids = (profiles || []).map((row: any) => row.id)
  const { data: optIns } = ids.length
    ? await admin.from('privacy_preferences').select('user_id').in('user_id', ids).eq('marketing_email_status', 'confirmed')
    : { data: [] as any[] }

  const allowed = new Set((optIns || []).map((row: any) => row.user_id))
  const excludedWithoutConsent = (profiles || []).filter((row: any) => row.email && !allowed.has(row.id)).length

  const fromProfiles: Recipient[] = (profiles || [])
    .filter((row: any) => row.email && allowed.has(row.id))
    .map((row: any) => ({ email: row.email, unsubscribe: marketingUnsubscribeUrl(row.id) }))

  // The standalone list is people with no account, so it only belongs in a
  // send aimed at everybody.
  let fromNewsletter: Recipient[] = []
  if (opts.includeNewsletterList && scope === 'all') {
    const { data: standalone } = await admin.from('newsletter_subscribers').select('id,email').eq('status', 'confirmed')
    fromNewsletter = (standalone || []).map((row: any) => ({ email: row.email, unsubscribe: newsletterUnsubscribeUrl(row.id) }))
  }

  const unique = new Map<string, Recipient>()
  for (const recipient of [...fromProfiles, ...fromNewsletter]) {
    if (recipient.email) unique.set(String(recipient.email).toLowerCase(), recipient)
  }

  return { recipients: Array.from(unique.values()), excludedWithoutConsent }
}
