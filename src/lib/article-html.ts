import sanitizeHtml from 'sanitize-html'

// Journal articles are written in a rich text editor and rendered on a public
// page, so what an editor produces and what a reader receives must be two
// different things. This is the gap between them.
//
// The allowlist is deliberately narrower than the editor's toolbar rather than
// wider: anything the toolbar cannot produce has no business arriving, and
// anything pasted in from Word, a website or an email is stripped to the same
// small set. No script, no style attributes, no iframes, no event handlers, no
// inline colour beyond the brand palette below.
//
// This uses a maintained sanitiser rather than a hand-written one on purpose.
// Parsing HTML safely is a solved problem that is very easy to get wrong, and
// getting it wrong here means script injection on every article page.

// The colours a writer may apply. A free colour picker in body copy wrecks a
// premium brand within about three articles; these are the accents that belong
// to it, and anything else is dropped back to the default ink.
export const ARTICLE_COLOURS = [
  { label: 'Default', value: '' },
  { label: 'Charcoal', value: '#1c1c1c' },
  { label: 'Muted grey', value: '#6b6b6b' },
  { label: 'Success green', value: '#287548' },
  { label: 'Alert red', value: '#b3261e' },
] as const

const ALLOWED_COLOURS = new Set(
  ARTICLE_COLOURS.map(colour => colour.value).filter(Boolean).map(value => value.toLowerCase()),
)

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty || '', {
    allowedTags: [
      'p', 'br',
      'h2', 'h3', 'h4',
      'strong', 'b', 'em', 'i', 'u', 's',
      'ul', 'ol', 'li',
      'blockquote',
      'a',
      'span',
    ],
    allowedAttributes: {
      // target and rel are added by transformTags below; without them here
      // the transform adds them and the allowlist strips them straight back off.
      a: ['href', 'title', 'target', 'rel'],
      span: ['style'],
    },
    // Only http, https and mailto. No javascript:, no data:.
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    // A link from an article to somewhere else should not hand that site a
    // handle on this one, and should not pass reputation to it either.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
      }),
    },
    allowedStyles: {
      span: {
        // Only a colour, and only one of ours. sanitize-html matches the value
        // against these patterns, so anything else in the attribute is dropped.
        color: [...ALLOWED_COLOURS].map(value => new RegExp(`^${value}$`, 'i')),
      },
    },
    // An empty paragraph is how a writer makes a gap; keep it.
    nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
  })
}

/**
 * True when the stored content is rich text rather than the plain paragraphs
 * every article was written in before the editor existed. Articles written
 * either way have to keep rendering.
 */
export function isRichArticle(content: string): boolean {
  return /<(p|h2|h3|h4|ul|ol|blockquote|strong|em|u|s|a|span)\b/i.test(content || '')
}
