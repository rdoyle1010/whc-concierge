const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'Talent House Collective <noreply@mail.wellnesshousecollective.co.uk>'

export async function sendFeaturedEmployerEmail(email: string, talentName: string, propertyName: string, location: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email skipped - no API key] Featured property to ${email}`)
    return
  }

  const subject = `Featured property: ${propertyName}`
  const html = `
    <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <p style="font-size:16px;font-weight:600;margin-bottom:32px;">Talent House Collective</p>
      <p style="font-size:24px;font-weight:700;margin-bottom:16px;">A featured property to discover</p>
      <p style="color:#57534e;">Hi ${talentName || 'there'}, <strong>${propertyName}</strong>${location ? ` in ${location}` : ''} is now featured on Talent House Collective.</p>
      <p style="color:#57534e;">Explore the property, view its live opportunities and decide whether it could be your next move.</p>
      <p style="margin-top:24px;"><a href="https://talenthousecollective.co.uk/properties" style="display:inline-block;background:#1c1b1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View featured properties</a></p>
      <p style="margin-top:40px;font-size:12px;color:#8c8781;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[Featured employer email FAILED ${res.status}] ${detail.slice(0, 300)}`)
    }
  } catch (error) {
    console.error('Featured employer email failed:', error)
  }
}
