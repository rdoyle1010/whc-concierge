import type { SopDocument } from './types'

// The square brackets, and why they stay.
//
// A drafted procedure writes [muster point], [duty manager contact] or
// [discrepancy escalation time] wherever the answer is a fact about one
// building. That is deliberate: inventing a muster point for a spa nobody has
// walked round is the one thing a document like this must never do, and an
// assessor reading a confidently wrong evacuation route is the worst day this
// platform could cause.
//
// But a locked PDF full of brackets is homework with no pencil. So every
// distinct bracket becomes a form field in the PDF, which anybody can type
// into with the free Adobe Reader, save and print. No licence, no Word, no
// asking us to change it for them.
//
// The field name is the slug of the label, which matters more than it looks:
// two fields sharing a name in a PDF form share a value, so [property name]
// appearing on nine pages is typed once and fills everywhere. That is the
// difference between a form somebody completes and a form somebody abandons.

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'field'; label: string; name: string }

// Deliberately narrow: no newlines, no nesting, and a length cap, so a stray
// bracket in prose cannot swallow the rest of a paragraph and turn it into a
// form field.
const PLACEHOLDER = /\[([^\[\]\n]{1,80})\]/g

/** A PDF form field name. Same label anywhere means the same field. */
export function fieldName(label: string): string {
  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return slug ? `f_${slug}` : 'f_field'
}

/** Split a string into the words around its placeholders and the placeholders. */
export function splitPlaceholders(value: string): Segment[] {
  const source = String(value ?? '')
  const segments: Segment[] = []
  let last = 0

  PLACEHOLDER.lastIndex = 0
  for (let match = PLACEHOLDER.exec(source); match; match = PLACEHOLDER.exec(source)) {
    if (match.index > last) segments.push({ kind: 'text', text: source.slice(last, match.index) })
    const label = match[1].trim()
    segments.push({ kind: 'field', label, name: fieldName(label) })
    last = match.index + match[0].length
  }
  if (last < source.length) segments.push({ kind: 'text', text: source.slice(last) })

  return segments.length ? segments : [{ kind: 'text', text: source }]
}

export function hasPlaceholder(value: string): boolean {
  PLACEHOLDER.lastIndex = 0
  return PLACEHOLDER.test(String(value ?? ''))
}

export type Placeholder = { label: string; name: string; count: number }

/**
 * Every distinct thing this document needs the property to tell it.
 *
 * Ordered by where it first appears, so the completion page at the front
 * reads in the same order as the document behind it. Counted, because
 * "appears four times" is the sentence that gets somebody to fill it in.
 */
export function placeholdersIn(document: Partial<SopDocument>): Placeholder[] {
  const found = new Map<string, Placeholder>()

  const scan = (value: unknown) => {
    if (typeof value === 'string') {
      for (const segment of splitPlaceholders(value)) {
        if (segment.kind !== 'field') continue
        const existing = found.get(segment.name)
        if (existing) existing.count += 1
        else found.set(segment.name, { label: segment.label, name: segment.name, count: 1 })
      }
      return
    }
    if (Array.isArray(value)) { for (const item of value) scan(item) ; return }
    if (value && typeof value === 'object') { for (const item of Object.values(value)) scan(item) }
  }

  // In reading order, deliberately, rather than whatever order the keys
  // happen to sit in. The completion page at the front is only useful if it
  // runs in the same order as the document behind it.
  scan(document.property)
  scan(document.department)
  scan(document.accountability)
  scan(document.purpose)
  scan(document.scope)
  scan(document.whyItMatters)
  scan(document.equipment)
  scan(document.responsibilities)
  scan(document.steps)
  scan(document.measuredBy)
  scan(document.commonFailures)
  scan(document.definitions)
  scan(document.governance)
  scan(document.references)

  return Array.from(found.values())
}
