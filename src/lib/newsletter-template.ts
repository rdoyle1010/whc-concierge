export type NewsletterTemplateData = {
  name?: string | null
  preheader?: string | null
  content?: string | null
  header_image_url?: string | null
  body_image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  footer_text?: string | null
  layout_style?: string | null
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeUrl(value: unknown) {
  const raw = String(value ?? '').trim()
  return /^https?:\/\//i.test(raw) ? raw : ''
}

function renderBody(content: string) {
  return escapeHtml(content)
    .split(/\n{2,}/)
    .map(block => `<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#465761">${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export function renderNewsletterHtml(
  data: NewsletterTemplateData,
  opts: { unsubscribeUrl?: string; featuredHtml?: string; test?: boolean } = {},
) {
  const title = escapeHtml(data.name || 'News from Wellness House Collective')
  const preheader = escapeHtml(data.preheader || '')
  const headerImage = safeUrl(data.header_image_url)
  const bodyImage = safeUrl(data.body_image_url)
  const ctaUrl = safeUrl(data.cta_url)
  const ctaLabel = escapeHtml(data.cta_label || '')
  const footer = escapeHtml(data.footer_text || 'Better matches. Better careers. Better teams.')
  const featuredHtml = opts.featuredHtml || ''
  const layout = data.layout_style || 'editorial'
  const maxWidth = layout === 'feature' ? 680 : 620
  const body = renderBody(String(data.content || ''))

  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f6f8;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;color:#1c1b1a">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f8;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:${maxWidth}px;background:#ffffff;border:1px solid #e5e5e5;border-radius:20px;overflow:hidden">
        <tr><td style="background:#1c1b1a;padding:26px 30px;color:#fff">
          <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#b9c8d3">Wellness House Collective</div>
          <div style="font-size:25px;line-height:1.15;font-weight:650;margin-top:10px">${title}</div>
        </td></tr>
        ${headerImage ? `<tr><td><img src="${escapeHtml(headerImage)}" alt="" width="100%" style="display:block;width:100%;height:auto;max-height:340px;object-fit:cover"></td></tr>` : ''}
        <tr><td style="padding:${layout === 'simple' ? '30px' : '36px 34px'}">
          ${body}
          ${bodyImage ? `<div style="margin:28px 0"><img src="${escapeHtml(bodyImage)}" alt="" width="100%" style="display:block;width:100%;height:auto;border-radius:14px"></div>` : ''}
          ${featuredHtml}
          ${ctaUrl && ctaLabel ? `<div style="margin:30px 0 8px"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#1c1b1a;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-size:13px;font-weight:650">${ctaLabel}</a></div>` : ''}
        </td></tr>
        <tr><td style="background:#f7f7f7;border-top:1px solid #e5e5e5;padding:24px 30px;font-size:11px;line-height:1.65;color:#73818a">
          <div style="font-weight:600;color:#4d4d4d;margin-bottom:7px">Wellness House Collective</div>
          <div>${footer}</div>
          <div style="margin-top:10px">talent.wellnesshousecollective.co.uk</div>
          ${opts.test
            ? `<div style="margin-top:10px;font-weight:700">TEST MESSAGE - not a live marketing send.</div>`
            : opts.unsubscribeUrl
              ? `<div style="margin-top:10px">You are receiving this optional email because you confirmed your WHC marketing or newsletter preference. <a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#4d4d4d">Unsubscribe</a> · <a href="https://talent.wellnesshousecollective.co.uk/privacy" style="color:#4d4d4d">Privacy policy</a></div>`
              : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
