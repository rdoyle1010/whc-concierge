// The blocks that go inside a newsletter: featured members, and a paid sponsor.
//
// These live here rather than in the send route because the preview was
// rendering something else entirely - a grey box with names joined by dots,
// while the real send built proper cards. So the preview could not be trusted,
// and a featured member looked broken when it was only unseen. One renderer,
// used by both.

const SITE = 'https://talenthousecollective.co.uk'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// An image or link in an email that leaves as javascript: or data: is a
// problem in somebody else's inbox, where nothing of ours can intervene.
export function safeHttpUrl(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : ''
  } catch { return '' }
}

export type FeaturedCard = { image: string; title: string; subtitle: string; href: string }

export function featuredCard({ image, title, subtitle, href }: FeaturedCard): string {
  const safeImage = safeHttpUrl(image)
  const initial = escapeHtml(title).charAt(0) || 'T'
  return `<a href="${escapeHtml(safeHttpUrl(href) || SITE)}" style="display:block;padding:14px;border:1px solid #e5e5e5;border-radius:12px;text-decoration:none;margin-bottom:10px;background:#fff">`
    + `<table role="presentation" cellpadding="0" cellspacing="0"><tr>`
    + `<td width="52" style="padding-right:14px">`
    + (safeImage
      ? `<img src="${escapeHtml(safeImage)}" width="52" height="52" style="border-radius:50%;object-fit:cover;display:block" alt="">`
      : `<div style="width:52px;height:52px;border-radius:50%;background:#1c1c1c;color:#fff;text-align:center;line-height:52px;font-weight:600">${initial}</div>`)
    + `</td><td>`
    + `<span style="display:block;font-weight:600;color:#1c1c1c;font-size:14px">${escapeHtml(title)}</span>`
    + `<span style="display:block;font-size:12px;color:#555555;margin-top:2px">${escapeHtml(subtitle)}</span>`
    + `</td></tr></table></a>`
}

export function featuredBlock(cards: FeaturedCard[]): string {
  if (!cards.length) return ''
  return `<div style="margin:28px 0">`
    + `<p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555555;font-weight:600;margin:0 0 12px">Featured this week</p>`
    + cards.map(featuredCard).join('')
    + `</div>`
}

export type Sponsor = {
  name?: string | null
  logo_url?: string | null
  headline?: string | null
  text?: string | null
  url?: string | null
}

/**
 * A paid brand placement.
 *
 * Labelled "Sponsored" without exception. UK advertising rules require paid
 * placement to be obviously identifiable, and a newsletter that blurs the line
 * between an editorial recommendation and a paid one spends the trust that
 * makes the placement worth buying in the first place.
 */
export function sponsorBlock(sponsor: Sponsor | null | undefined): string {
  if (!sponsor) return ''
  const name = String(sponsor.name || '').trim()
  const headline = String(sponsor.headline || '').trim()
  const text = String(sponsor.text || '').trim()
  if (!name || (!headline && !text)) return ''

  const logo = safeHttpUrl(sponsor.logo_url)
  const url = safeHttpUrl(sponsor.url)
  return `<div style="margin:30px 0;border:1px solid #e5e5e5;border-radius:14px;overflow:hidden">`
    + `<div style="background:#f1f1f1;padding:8px 16px;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:#555555;font-weight:700">Sponsored &middot; ${escapeHtml(name)}</div>`
    + `<div style="padding:20px 18px;background:#fff">`
    + (logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}" height="34" style="display:block;height:34px;width:auto;margin-bottom:14px">` : '')
    + (headline ? `<p style="margin:0 0 8px;font-size:17px;line-height:1.35;font-weight:650;color:#1c1c1c">${escapeHtml(headline)}</p>` : '')
    + (text ? `<p style="margin:0;font-size:14px;line-height:1.7;color:#465761">${escapeHtml(text)}</p>` : '')
    + (url
      ? `<div style="margin-top:16px"><a href="${escapeHtml(url)}" rel="nofollow sponsored" style="display:inline-block;background:#1c1c1c;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:13px;font-weight:650">Find out more</a></div>`
      : '')
    + `</div></div>`
}
