const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email skipped - no API key] To: ${to}, Subject: ${subject}`)
    return true
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!response.ok) {
    console.error(`[Advertising email failed ${response.status}] ${await response.text().catch(() => '')}`)
    return false
  }
  return true
}

const wrap = (content: string) => `<div style="font-family:Inter,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 22px;color:#10283b"><p style="font-weight:700">Wellness House Collective</p>${content}<p style="margin-top:36px;font-size:12px;color:#7a858c">WHC Concierge · talent.wellnesshousecollective.co.uk</p></div>`

export async function sendAdvertSubmittedEmail(email: string, brand: string, placement: string, monthlyRate: number) {
  return sendEmail(email, `We received your ${placement} advert`, wrap(`
    <h1 style="font-size:24px">Your campaign is awaiting approval</h1>
    <p>Thank you, ${brand}. Your <strong>${placement}</strong> booking has been received.</p>
    <p><strong>Price:</strong> £${monthlyRate.toFixed(2)} per month. This is a rolling monthly subscription and renews until cancelled.</p>
    <p>Billing begins at checkout. The advert will not appear publicly until WHC has reviewed and approved the creative.</p>
    <p>We aim to review submissions within 2 working days. We will email you again as soon as it is live.</p>
  `))
}

export async function sendAdvertLiveEmail(email: string, brand: string, placement: string, liveDate: string) {
  return sendEmail(email, `Your ${placement} advert is now live`, wrap(`
    <h1 style="font-size:24px">Your campaign is live</h1>
    <p>${brand}, your <strong>${placement}</strong> advert was approved and published on <strong>${liveDate}</strong>.</p>
    <p>Your subscription continues monthly until cancelled. WHC tracks impressions and clicks while the advert is active.</p>
  `))
}

export async function sendAdvertRejectedEmail(email: string, brand: string, placement: string) {
  return sendEmail(email, `Update on your ${placement} advert`, wrap(`
    <h1 style="font-size:24px">Your campaign needs attention</h1>
    <p>${brand}, your <strong>${placement}</strong> creative has not been approved for publication in its current form.</p>
    <p>Please contact WHC so we can agree the required changes. Your advert remains offline.</p>
  `))
}
