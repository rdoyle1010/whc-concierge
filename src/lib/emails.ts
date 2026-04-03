// Email notification templates for WHC Concierge
// Uses Resend API — set RESEND_API_KEY in environment

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@wellnesshousecollective.co.uk>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[Email skipped - no API key] To: ${to}, Subject: ${subject}`)
    return
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

const wrapper = (content: string) => `
  <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <p style="font-size: 16px; font-weight: 600; margin-bottom: 32px;">WHC Concierge</p>
    ${content}
    <p style="margin-top: 40px; font-size: 12px; color: #9CA3AF;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
  </div>
`

export async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail(email, 'Welcome to WHC Concierge', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome, ${name}</p>
    <p style="color: #6B7280;">Thank you for joining WHC Concierge. Your profile is now under review by our team.</p>
    <p style="color: #6B7280;">We'll notify you within 24 hours once your profile has been approved.</p>
  `))
}

export async function sendApprovalEmail(email: string, name: string) {
  await sendEmail(email, 'Your profile is now live', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Great news, ${name}</p>
    <p style="color: #6B7280;">Your WHC Concierge profile has been approved and is now live on the platform.</p>
    <p style="color: #6B7280;">You can now browse roles, receive matches, and connect with properties.</p>
  `))
}

export async function sendRejectionEmail(email: string, name: string, reason: string) {
  await sendEmail(email, 'Your application needs attention', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Hi ${name}</p>
    <p style="color: #6B7280;">Unfortunately we weren't able to approve your profile at this time.</p>
    <p style="color: #6B7280; font-weight: 500;">Reason: ${reason}</p>
    <p style="color: #6B7280;">Please update your profile and resubmit for review.</p>
  `))
}

export async function sendNewMatchEmail(email: string, name: string, matchName: string) {
  await sendEmail(email, 'You have a new match', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">New match, ${name}</p>
    <p style="color: #6B7280;">You have a new match with <strong>${matchName}</strong> on WHC Concierge.</p>
    <p style="color: #6B7280;">Log in to your dashboard to start a conversation.</p>
  `))
}

export async function sendNewMessageEmail(email: string, name: string, senderName: string) {
  await sendEmail(email, `New message from ${senderName}`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">New message</p>
    <p style="color: #6B7280;">You have a new message from <strong>${senderName}</strong>.</p>
    <p style="color: #6B7280;">Log in to your inbox to reply.</p>
  `))
}

export async function sendBookingConfirmedEmail(email: string, name: string, details: string) {
  await sendEmail(email, 'Booking confirmed', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Booking confirmed</p>
    <p style="color: #6B7280;">Your booking has been confirmed: ${details}</p>
  `))
}

export async function sendReviewRequestEmail(email: string, name: string, otherName: string) {
  await sendEmail(email, `How was your experience with ${otherName}?`, wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Leave a review</p>
    <p style="color: #6B7280;">How was your experience with <strong>${otherName}</strong>?</p>
    <p style="color: #6B7280;">Log in to leave a review and help the WHC community.</p>
  `))
}

export async function sendFeaturedExpiringEmail(email: string, name: string) {
  await sendEmail(email, 'Your featured profile expires in 3 days', wrapper(`
    <p style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Featured expiring soon</p>
    <p style="color: #6B7280;">Hi ${name}, your featured profile on WHC Concierge expires in 3 days.</p>
    <p style="color: #6B7280;">Renew now to keep your premium visibility.</p>
  `))
}
