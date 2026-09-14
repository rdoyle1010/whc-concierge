// The numbering scheme, in one place.
//
// REC-FOLLOWUP-SOP-043. Department, topic, kind, number. It is the thing
// every other document points at, it appears in cross-references, training
// records and audit trails, and once a client has filed it under that number
// it can never quietly change. So it is built here, checked here, and never
// assembled by hand in a template where a stray space would go unnoticed
// until somebody could not find the document it referred to.

export const DEPARTMENT_CODES: Record<string, string> = {
  Reception: 'REC',
  Therapy: 'THR',
  Treatments: 'THR',
  Management: 'MGT',
  Housekeeping: 'HSK',
  Retail: 'RET',
  Maintenance: 'MNT',
  Wet: 'WET',
  Fitness: 'FIT',
  Kitchen: 'KIT',
  'Health and Safety': 'HSE',
  'Front of House': 'FOH',
  'Back of House': 'BOH',
}

export const KIND_CODES: Record<string, string> = {
  sop: 'SOP',
  'risk-assessment': 'RA',
  'job-description': 'JD',
  policy: 'POL',
  // A checklist is not a procedure. The opening and closing safety checks are
  // CHK in the real library because somebody works down them with a pen,
  // which is a different document from one somebody is trained against.
  checklist: 'CHK',
}

const TOPIC_MAX = 12

/** A topic code from a plain title: letters only, upper case, short. */
export function topicCode(title: string): string {
  const cleaned = String(title || '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    // Words that carry no meaning in a code and eat the character budget.
    .filter(word => !['and', 'the', 'of', 'for', 'a', 'an', 'to', 'in', 'on', 'at'].includes(word.toLowerCase()))

  if (!cleaned.length) return 'GEN'

  const first = cleaned[0].toUpperCase()
  if (cleaned.length === 1) return first.slice(0, TOPIC_MAX)

  // Two words joined, which is what reads best on a header and what the
  // existing numbering already does: FOLLOWUP, REVIEWMGMT.
  //
  // But only if both words survive whole. Cutting the pair to the character
  // limit produced THR-TREATMENTROO-SOP-007, which is a reference somebody
  // has to read aloud down a phone and type into a training record. One whole
  // word beats two and a half every time.
  const pair = first + cleaned[1].toUpperCase()
  return pair.length <= TOPIC_MAX ? pair : first.slice(0, TOPIC_MAX)
}

export function departmentCode(department: string): string {
  const named = DEPARTMENT_CODES[String(department || '').trim()]
  if (named) return named
  const letters = String(department || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
  return letters.slice(0, 3) || 'GEN'
}

/**
 * Build a reference. The sequence number is supplied by the caller, because
 * it belongs to the property's own register rather than to this function.
 */
export function buildReference(input: {
  department: string
  title: string
  kind: keyof typeof KIND_CODES
  sequence: number
}): string {
  const kind = KIND_CODES[input.kind] || 'DOC'
  const number = String(Math.max(1, Math.floor(input.sequence))).padStart(3, '0')
  return `${departmentCode(input.department)}-${topicCode(input.title)}-${kind}-${number}`
}

// One topic segment was the wrong assumption.
//
// The real library uses as many as it needs:
// FIN-CASH-DISCREPANCY-CLOSE-SOP-317, REC-OVERRIDE-AVAIL-SOP-070. Checked
// against the four hundred and seventy documents already planned, the first
// version of this pattern rejected four hundred and fifty-one of them. It
// would have refused to approve almost the entire library, and it would have
// done it one document at a time, months from now, with no clue that the
// validator rather than the document was wrong.
//
// buildReference still makes short ones, because a reference it invents
// should be readable. This accepts what the house already writes.
// Departments run to six letters (MAINT, ASSET), topics to five segments,
// and the kind can be a checklist. Every one of these was found by running
// the pattern against the four hundred and sixty documents that already
// exist rather than by imagining what a reference might look like.
// NOP, EAP, GDE and TRG join the list because they are kinds of document,
// not a new
// naming convention. The two halves of a safety operating procedure, and the
// two guides that come with them, are
// filed and cross-referenced exactly like everything else, and a validator
// that rejects them is a validator written before they existed.
const PATTERN = /^[A-Z]{2,6}(?:-[A-Z0-9]{2,16}){1,5}-(SOP|RA|JD|POL|CHK|NOP|EAP|SSW|GDE|TRG)-\d{2,4}$/

export function isValidReference(value: unknown): boolean {
  return typeof value === 'string' && value.length <= 60 && PATTERN.test(value)
}
