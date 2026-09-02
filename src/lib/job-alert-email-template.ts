export function jobAlertEmailHtml({ firstName, jobTitle, propertyName, matchScore, location, salary }: {
  firstName: string; jobTitle: string; propertyName: string; matchScore: number; location?: string; salary?: string
}): string {
  const scoreColour = matchScore >= 90 ? '#16A34A' : matchScore >= 75 ? '#1D4ED8' : '#555555'
  const scoreLabel = matchScore >= 90 ? 'Perfect Match' : matchScore >= 75 ? 'Strong Match' : 'Good Match'

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f0eb; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f0eb;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

        <tr><td style="background: linear-gradient(145deg, #0f0e0d, #1c1b1a); border-radius: 12px 12px 0 0; padding: 40px 40px 32px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(28,27,26, 0.6);">New Role Alert</p>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #555555; letter-spacing: -0.5px;">WHC Concierge</h1>
        </td></tr>

        <tr><td style="background-color: #FFFFFF; padding: 40px;">
          <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1c1b1a;">Hi ${firstName}, a new role matches your profile</h2>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.7; color: #3a3835;">A role has just been posted that aligns with your skills and experience.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; margin-bottom: 24px;">
            <tr><td style="padding: 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #8c8781; width: 90px; vertical-align: top;">Role</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1c1b1a; font-weight: 500;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #8c8781; vertical-align: top;">Property</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1c1b1a; font-weight: 500;">${propertyName}</td>
                </tr>
                ${location ? `<tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #8c8781; vertical-align: top;">Location</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1c1b1a;">${location}</td>
                </tr>` : ''}
                ${salary ? `<tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #8c8781; vertical-align: top;">Salary</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #1c1b1a; font-weight: 500;">${salary}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #8c8781; vertical-align: top;">Match</td>
                  <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: ${scoreColour};">${matchScore}% &mdash; ${scoreLabel}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://talent.wellnesshousecollective.co.uk/roles/match" style="display: inline-block; padding: 14px 32px; background-color: #1c1b1a; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">View This Role</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="background-color: #fafafa; border-radius: 0 0 12px 12px; padding: 28px 40px; border-top: 1px solid #e0dad2;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #8c8781;">Wellness House Collective</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #8c8781;">United Kingdom &middot; <a href="mailto:rebecca.whc@outlook.com" style="color: #555555; text-decoration: none;">rebecca.whc@outlook.com</a></p>
          <p style="margin: 0; font-size: 11px; color: #d9d9d9;">You received this because job alerts are enabled on your WHC Concierge profile. Manage alerts in your <a href="https://talent.wellnesshousecollective.co.uk/talent/settings" style="color: #555555; text-decoration: none;">settings</a>.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
