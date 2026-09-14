import { sendTransactionalEmail } from '@/lib/send-email'
import { packBySlug, formatPrice, VAT_NOTE } from './pricing'
import { LIBRARY_PLAN } from './library-plan'
import { DOCUMENT_STATUS } from './status'

// The only thing the buyer actually receives.
//
// There is no account, so this email is the product delivery, the receipt and
// the access link in one. If it does not arrive, somebody has paid and has
// nothing, which is why the caller treats a failure here as a failed delivery
// rather than a missing notification.

export async function sendStandardsReceiptEmail(input: {
  to: string
  name: string | null
  packSlug: string | null
  reference: string | null
  amountPence: number
  libraryUrl: string
}): Promise<boolean> {
  const pack = input.packSlug ? packBySlug(input.packSlug) : null
  const single = input.reference ? LIBRARY_PLAN.find(entry => entry.reference === input.reference) : null

  const what = pack
    ? `${pack.name}, ${pack.count} documents`
    : single
      ? `${single.title} (${single.reference})`
      : 'your documents'

  const greeting = input.name ? `Thank you, ${input.name.split(' ')[0]}` : 'Thank you'

  const result = await sendTransactionalEmail({
    to: input.to,
    subject: `Your documents are ready: ${pack ? pack.name : single?.title || 'Talent House Collective'}`,
    kind: 'notification',
    html: `
  <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">Talent House Collective</p>
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${greeting}</p>
    <p style="color: #555555;">You have bought <strong>${what}</strong> for ${formatPrice(input.amountPence)}. ${VAT_NOTE}</p>

    <p style="margin: 28px 0;">
      <a href="${input.libraryUrl}"
         style="display: inline-block; background: #1c1c1c; color: #ffffff; text-decoration: none;
                padding: 14px 24px; font-size: 15px; font-weight: 600;">Open your library</a>
    </p>

    <p style="color: #555555;">
      That link is your library. Keep this email: there is no password and no account to sign into, and the link
      is the only way back to it. Every document downloads as a PDF you can type into with the free Adobe Reader.
    </p>

    <p style="color: #555555; margin-top: 24px;">
      Each document has a page at the front listing what your property needs to fill in. Type each entry once and
      it fills in wherever it appears.
    </p>

    <p style="color: #555555; border-left: 3px solid #dddddd; padding-left: 14px; margin-top: 28px;">
      ${DOCUMENT_STATUS} Anything concerning life safety must be checked against your building by a competent
      person and signed off before it is issued to anybody.
    </p>

    <p style="margin-top: 40px; font-size: 12px; color: #8c8c8c;">
      Talent House Collective &middot; talenthousecollective.co.uk
    </p>
  </div>`,
  })

  return result.ok
}
