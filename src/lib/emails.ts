// Email notification templates for WHC Concierge
// Uses Resend API - set RESEND_API_KEY in environment

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email skipped - no API key] To: ${to}, Subject: ${subject}`)
    return
  }

  try {
    // Log failures loudly - Resend rejections (bad key, unverified domain)
    // otherwise fail in silence and nobody notices for months.
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[Email FAILED ${res.status}] To: ${to}, Subject: ${subject} - ${detail.slice(0, 300)}`)
    }
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

const wrapper = (content: string) => `
  <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">WHC Concierge</p>
    ${content}
    <p style="margin-top: 40px; font-size: 12px; color: #8a949b;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
  </div>
`

export async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail(email, 'Welcome to WHC Concierge', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome, ${name}</p>
    <p style="color: #5a6a76;">Thank you for joining WHC Concierge. Your profile is now under review by our team.</p>
    <p style="color: #5a6a76;">We'll notify you within 24 hours once your profile has been approved.</p>
  `))
}

export async function sendApprovalEmail(email: string, name: string) {
  await sendEmail(email, 'Your profile is now live', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Great news, ${name}</p>
    <p style="color: #5a6a76;">Your WHC Concierge profile has been approved and is now live on the platform.</p>
    <p style="color: #5a6a76;">You can now browse roles, receive matches, and connect with properties.</p>
  `))
}

export async function sendRejectionEmail(email: string, name: string, reason: string) {
  await sendEmail(email, 'Your application needs attention', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Hi ${name}</p>
    <p style="color: #5a6a76;">Unfortunately we weren't able to approve your profile at this time.</p>
    <p style="color: #5a6a76; font-weight: 500;">Reason: ${reason}</p>
    <p style="color: #5a6a76;">Please update your profile and resubmit for review.</p>
  `))
}

export async function sendNewMatchEmail(email: string, name: string, matchName: string) {
  await sendEmail(email, 'You have a new match', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">New match, ${name}</p>
    <p style="color: #5a6a76;">You have a new match with <strong>${matchName}</strong> on WHC Concierge.</p>
    <p style="color: #5a6a76;">Log in to your dashboard to start a conversation.</p>
  `))
}

export async function sendNewMessageEmail(email: string, name: string, senderName: string) {
  await sendEmail(email, `New message from ${senderName}`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">New message</p>
    <p style="color: #5a6a76;">You have a new message from <strong>${senderName}</strong>.</p>
    <p style="color: #5a6a76;">Log in to your inbox to reply.</p>
  `))
}

export async function sendRoleFilledEmail(email: string, name: string, roleTitle: string, propertyName: string, variant: 'filled' | 'closed' = 'filled') {
  const outcome = variant === 'filled' ? 'filled this position' : 'closed this position'
  await sendEmail(email, `${roleTitle} at ${propertyName} has now been ${variant}`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Role update</p>
    <p style="color: #5a6a76;">Hi ${name || 'there'},</p>
    <p style="color: #5a6a76;">Thank you for your interest in <strong>${roleTitle}</strong> at <strong>${propertyName}</strong>. The property has now ${outcome}, so it is no longer accepting applications.</p>
    <p style="color: #5a6a76;">Your profile remains available for other suitable opportunities on WHC Concierge.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/jobs" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Browse current roles</a></p>
  `))
}

export async function sendBookingConfirmedEmail(email: string, name: string, details: string) {
  await sendEmail(email, 'Booking confirmed', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Booking confirmed</p>
    <p style="color: #5a6a76;">Your booking has been confirmed: ${details}</p>
  `))
}

export async function sendReviewRequestEmail(email: string, name: string, otherName: string) {
  await sendEmail(email, `How was your experience with ${otherName}?`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Leave a review</p>
    <p style="color: #5a6a76;">How was your experience with <strong>${otherName}</strong>?</p>
    <p style="color: #5a6a76;">Log in to leave a review and help the WHC community.</p>
  `))
}

export async function sendCourseGiftEmail(email: string, name: string, course: string, awarded: boolean) {
  await sendEmail(email, awarded ? `Certificate awarded - ${course}` : `A course has been unlocked for you - ${course}`, wrapper(awarded ? `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Congratulations, ${name}</p>
    <p style="color: #5a6a76;">Wellness House Collective has awarded you the certificate for <strong>${course}</strong>. It is live on your profile now, visible to every property searching the directory.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/talent/academy" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View your certificate</a></p>
  ` : `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">A gift from WHC, ${name}</p>
    <p style="color: #5a6a76;">Wellness House Collective has enrolled you on <strong>${course}</strong>, with our compliments. Complete the modules, pass the assessment, and the certificate and profile badge are yours.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/talent/academy" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start your course</a></p>
  `))
}

export async function sendCourseAccessEmail(email: string, name: string, course: string, link: string) {
  await sendEmail(email, `Your WHC Academy course is ready - ${course}`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome to the Academy, ${name}</p>
    <p style="color: #5a6a76;">Thank you for your purchase. Your course <strong>${course}</strong> is ready - the button below signs you straight in, no password needed.</p>
    <p style="margin-top: 24px;"><a href="${link}" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start your course</a></p>
    <p style="color: #5a6a76; margin-top: 24px; font-size: 13px;">Complete the lessons, pass the final quiz (80%), and your certificate is issued instantly with a unique verification code. A free WHC profile has been created for you - complete it any time to be visible to five-star properties hiring on the platform.</p>
  `))
}

export async function sendVerificationResultEmail(email: string, name: string, verified: boolean, reason: string | null) {
  await sendEmail(email, verified ? 'You are WHC Verified' : 'Your verification needs attention', wrapper(verified ? `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Congratulations, ${name}</p>
    <p style="color: #5a6a76;">Your insurance and qualifications checked out. The <strong>WHC Verified</strong> badge now shows on your profile and in the agency directory - properties consistently choose verified therapists first.</p>
    <p style="color: #5a6a76;">We'll remind you before your insurance expires so the badge never lapses.</p>
  ` : `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Hi ${name}</p>
    <p style="color: #5a6a76;">We couldn't verify your documents this time.</p>
    ${reason ? `<p style="color: #5a6a76; font-weight: 500;">Reason: ${reason}</p>` : ''}
    <p style="color: #5a6a76;">Update your documents and resubmit from your Verification page - it only takes a minute.</p>
  `))
}

export async function sendInsuranceExpiryEmail(email: string, name: string, expiryDate: string, lapsed: boolean) {
  await sendEmail(email, lapsed ? 'Your WHC Verified badge has lapsed' : 'Your insurance is about to expire', wrapper(lapsed ? `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Hi ${name}</p>
    <p style="color: #5a6a76;">Your insurance expired on <strong>${expiryDate}</strong>, so your WHC Verified badge has been paused. Properties can still book you, but the badge is a real edge - especially for urgent cover.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/talent/verification" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upload your new certificate</a></p>
  ` : `
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Hi ${name}</p>
    <p style="color: #5a6a76;">Your insurance certificate expires on <strong>${expiryDate}</strong>. Upload your renewal now and your WHC Verified badge carries straight on - no gap, no fuss.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/talent/verification" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upload renewal</a></p>
  `))
}

export async function sendAgencyOfferEmail(
  email: string,
  name: string,
  opts: { propertyName: string; shiftDate: string; rate: number; hours?: number | null; urgent?: boolean; expiresAt?: string | null }
) {
  const totalLine = opts.hours ? ` (${opts.hours} hours - £${opts.rate * opts.hours} total)` : ''
  const subject = opts.urgent
    ? `URGENT: shift offer for TODAY from ${opts.propertyName}`
    : `New agency shift offer from ${opts.propertyName}`
  const expiryLine = opts.expiresAt
    ? `<p style="color: #B45309; font-weight: 500;">This offer expires at ${new Date(opts.expiresAt).toLocaleString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })} - respond quickly to secure it.</p>`
    : ''
  await sendEmail(email, subject, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${opts.urgent ? 'Urgent cover needed today' : 'New shift offer'}</p>
    <p style="color: #5a6a76;">Hi ${name}, <strong>${opts.propertyName}</strong> has offered you an agency shift on <strong>${opts.shiftDate}</strong> at <strong>£${opts.rate}/hour</strong>${totalLine}.</p>
    ${expiryLine}
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/talent/agency" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View &amp; respond</a></p>
  `))
}

export async function sendFeaturedExpiringEmail(email: string, name: string) {
  await sendEmail(email, 'Your featured profile expires in 3 days', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Featured expiring soon</p>
    <p style="color: #5a6a76;">Hi ${name}, your featured profile on WHC Concierge expires in 3 days.</p>
    <p style="color: #5a6a76;">Renew now to keep your premium visibility.</p>
  `))
}

export async function sendFeaturedTalentEmail(email: string, employerName: string, talentName: string, headline: string) {
  await sendEmail(email, `Featured talent: ${talentName}`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">New featured professional</p>
    <p style="color: #5a6a76;">Hi ${employerName || 'there'}, <strong>${talentName}</strong>${headline ? ` - ${headline}` : ''} is now featured on WHC Concierge.</p>
    <p style="color: #5a6a76;">View their profile, check their experience against your live roles and add them to your shortlist.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/employer/candidates" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View featured talent</a></p>
  `))
}

// Generic agency booking update (accept / counter / decline / cover not
// filled) - the outbound offer itself has its own richer sender above.
export async function sendAgencyUpdateEmail(email: string, name: string, subject: string, line: string, link = '/') {
  await sendEmail(email, subject, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${subject}</p>
    <p style="color: #5a6a76;">Hi ${name},</p>
    <p style="color: #5a6a76;">${line}</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk${link}" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View &amp; respond</a></p>
  `))
}

export async function sendReferralRewardEmail(email: string, name: string) {
  await sendEmail(email, 'You have earned a free month', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Thank you, ${name}</p>
    <p style="color: #5a6a76;">Someone you referred has just joined WHC Concierge, so you have earned a referral reward.</p>
    <p style="color: #5a6a76;">A free month will be applied to your next paid listing automatically - nothing to do on your end.</p>
    <p style="margin-top: 24px;"><a href="https://talent.wellnesshousecollective.co.uk/employer/dashboard" style="display: inline-block; background: #0b2f4d; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View your dashboard</a></p>
  `))
}
