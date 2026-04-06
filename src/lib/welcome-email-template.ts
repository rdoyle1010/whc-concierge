export function welcomeEmailHtml({ firstName, userType, dashboardUrl }: {
  firstName: string
  userType: 'talent' | 'employer'
  dashboardUrl: string
}): string {
  const isTalent = userType === 'talent'

  const ctaText = isTalent ? 'Complete Your Profile' : 'Post Your First Role'
  const mainMessage = isTalent
    ? 'You\'ve joined the UK\'s premier platform for luxury spa and wellness professionals. Complete your profile to get matched with premium roles at five-star properties.'
    : 'You\'ve joined the UK\'s premier platform for luxury spa and wellness recruitment. Post your first role and discover vetted wellness professionals ready to join your team.'

  const nextSteps = isTalent
    ? [
        'Build your profile with skills, qualifications, and brand experience',
        'Get matched with roles that fit your expertise',
        'Connect directly with luxury properties and spas',
      ]
    : [
        'Post a role and reach qualified wellness professionals',
        'Browse vetted candidates with verified skills and experience',
        'Use our matching engine to find the perfect fit',
      ]

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #F5F4F2; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F4F2;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <!-- Header -->
        <tr><td style="background: linear-gradient(145deg, #0a0a14, #1a1a2e); border-radius: 12px 12px 0 0; padding: 40px 40px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(201, 169, 110, 0.6);">Welcome to</p>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #C9A96E; letter-spacing: -0.5px;">WHC Concierge</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background-color: #FFFFFF; padding: 40px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1a1a1a;">Hello, ${firstName}</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4B5563;">${mainMessage}</p>

          <!-- Next steps -->
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">Your next steps</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
            ${nextSteps.map((step, i) => `
            <tr><td style="padding: 8px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
              <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; background-color: #FDF6EC; color: #C9A96E; border-radius: 50%; font-size: 11px; font-weight: 600; margin-right: 10px; vertical-align: middle;">${i + 1}</span>
              ${step}
            </td></tr>`).join('')}
          </table>

          <!-- CTA -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">${ctaText}</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color: #F9FAFB; border-radius: 0 0 12px 12px; padding: 28px 40px; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF;">Wellness House Collective</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #9CA3AF;">United Kingdom &middot; <a href="mailto:rebecca.whc@outlook.com" style="color: #C9A96E; text-decoration: none;">rebecca.whc@outlook.com</a></p>
          <p style="margin: 0; font-size: 11px; color: #D1D5DB;">You received this email because you created an account on WHC Concierge. To stop receiving emails, you can delete your account from your settings page.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
