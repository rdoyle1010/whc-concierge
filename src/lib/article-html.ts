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
  // This listed the tags the new editor produces and missed the ones older
  // articles were actually written with: <b>, <i> and <br>. Those articles fell
  // through to the plain-text path and printed their own markup at the reader
  // as words. Match anything the sanitiser would allow, not just what the
  // toolbar happens to emit today.
  return /<(p|br|h2|h3|h4|ul|ol|li|blockquote|strong|b|em|i|u|s|a|span)\b/i.test(content || '')
}

// Whether the content carries any structure of its own, or is a run of inline
// markup with newlines doing the work of paragraphs.
const HAS_BLOCKS = /<(p|h2|h3|h4|ul|ol|blockquote)\b/i

/**
 * The stored article as HTML fit to render.
 *
 * Older articles are a mix: bold and line-break tags inline, and newlines where
 * the writer meant a new paragraph. Rendered as-is they collapse into one
 * unbroken slab, which is what the reader was getting. Where there is no block
 * structure, the newlines become paragraphs and the inline markup is kept.
 */
export function toArticleHtml(content: string): string {
  const raw = content || ''
  if (HAS_BLOCKS.test(raw)) return sanitizeArticleHtml(raw)
  const paragraphs = raw
    .split(/\n{1,}/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p>${line}</p>`)
    .join('')
  return sanitizeArticleHtml(paragraphs || raw)
}
