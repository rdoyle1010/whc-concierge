export function approvalEmailHtml({ applicantName, jobTitle, propertyName }: {
  applicantName: string; jobTitle: string; propertyName: string
}): string {
  const firstName = applicantName.split(' ')[0] || applicantName
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #F5F4F2; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F4F2;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <tr><td style="background: linear-gradient(145deg, #0a0a14, #1a1a2e); border-radius: 12px 12px 0 0; padding: 40px 40px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(201, 169, 110, 0.6);">Great News</p>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #C9A96E; letter-spacing: -0.5px;">WHC Concierge</h1>
        </td></tr>

        <tr><td style="background-color: #FFFFFF; padding: 40px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1a1a1a;">Congratulations, ${firstName}</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4B5563;">Your application has been shortlisted. Here are the details:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
            <tr><td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; width: 90px; vertical-align: top;">Role</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; vertical-align: top;">Property</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${propertyName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; vertical-align: top;">Status</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #16A34A; font-weight: 600;">Shortlisted</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">What happens next</p>
          <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.7; color: #4B5563;">The employer would like to take your application further. They&rsquo;ll be in touch shortly to arrange next steps. Keep an eye on your messages and notifications.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://talent.wellnesshousecollective.co.uk/talent/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">View Your Applications</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background-color: #F9FAFB; border-radius: 0 0 12px 12px; padding: 28px 40px; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF;">Wellness House Collective</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #9CA3AF;">United Kingdom &middot; <a href="mailto:rebecca.whc@outlook.com" style="color: #C9A96E; text-decoration: none;">rebecca.whc@outlook.com</a></p>
          <p style="margin: 0; font-size: 11px; color: #D1D5DB;">You received this email because you applied for a role on WHC Concierge.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function rejectionEmailHtml({ applicantName, jobTitle, propertyName }: {
  applicantName: string; jobTitle: string; propertyName: string
}): string {
  const firstName = applicantName.split(' ')[0] || applicantName
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #F5F4F2; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F4F2;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <tr><td style="background: linear-gradient(145deg, #0a0a14, #1a1a2e); border-radius: 12px 12px 0 0; padding: 40px 40px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(201, 169, 110, 0.6);">Application Update</p>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #C9A96E; letter-spacing: -0.5px;">WHC Concierge</h1>
        </td></tr>

        <tr><td style="background-color: #FFFFFF; padding: 40px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1a1a1a;">Hi ${firstName}</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #4B5563;">Thank you for your interest in the following role:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border-radius: 8px; margin-bottom: 24px;">
            <tr><td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; width: 90px; vertical-align: top;">Role</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #9CA3AF; vertical-align: top;">Property</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${propertyName}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: #4B5563;">After careful consideration, the employer has decided not to progress your application at this time.</p>
          <p style="margin: 0 0 32px; font-size: 14px; line-height: 1.7; color: #4B5563;">New roles are added regularly &mdash; keep your profile updated to be matched with future opportunities. Your skills and experience are valued in the wellness community.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://talent.wellnesshousecollective.co.uk/roles" style="display: inline-block; padding: 14px 32px; background-color: #1a1a1a; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">Browse New Roles</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background-color: #F9FAFB; border-radius: 0 0 12px 12px; padding: 28px 40px; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #9CA3AF;">Wellness House Collective</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #9CA3AF;">United Kingdom &middot; <a href="mailto:rebecca.whc@outlook.com" style="color: #C9A96E; text-decoration: none;">rebecca.whc@outlook.com</a></p>
          <p style="margin: 0; font-size: 11px; color: #D1D5DB;">You received this email because you applied for a role on WHC Concierge.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
