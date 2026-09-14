import type { Accountability, CrossReference, Revision } from './types'

// A plan, as opposed to a procedure.
//
// An SOP is a sequence of steps, each with a standard somebody can audit. A
// Normal Operating Procedure for a pool is not that shape at all: most of it
// is a statement of facts about one building - the dimensions, the depths,
// the bather load, who supervises and from where - and the rest is a set of
// arrangements. An Emergency Action Plan is a third shape again: an ordered
// list of who does what, in the first ninety seconds, for each kind of
// emergency.
//
// Forcing either into the SOP shape would produce a document that looks like
// a procedure and reads like a form, which is how a pool ends up with a
// beautifully typeset NOP that its lifeguards cannot use.
//
// So: sections, each of which is one of four things. Facts the property must
// state, actions in order, plain paragraphs, or a table. Between them they
// cover the NOP, the EAP, a policy and a safe system of work, which is four
// products from one shape rather than four shapes to keep in step.

export type PlanKind = 'nop' | 'eap' | 'policy' | 'safe-system' | 'risk-assessment' | 'guide' | 'training'

/**
 * One thing the property has to state.
 *
 * Almost always blank when it leaves us. The length of a pool, the depth at
 * the shallow end, the position of the emergency stop, the person holding the
 * pool plant qualification: these are the document. Writing a plausible value
 * into one would be the single most dangerous thing this platform could do,
 * so every one of these becomes a form field in the PDF and nothing else.
 */
export type Fact = {
  label: string
  /** Set only where a value is genuinely ours to state, which is rarely. */
  value?: string
  /** A line of guidance under the box: units, a legal minimum, a norm. */
  hint?: string
  /** Needs more than a line. Renders as a taller box. */
  long?: boolean
}

/** Who does what, in the order it happens. */
export type PlanAction = {
  /** Short imperative name. */
  name: string
  /** What is actually done. */
  action: string
  /** The role that does it. Blank where the property must decide. */
  by: string
}

/**
 * One hazard, and everything about it we are entitled to state.
 *
 * The hazard, who it hurts, and the controls a competent operation would
 * expect to find are general: they hold in any spa with a pool, and stating
 * them is the value of the document.
 *
 * The likelihood, the severity and the score that follows are not, and they
 * are never set here. A risk rating is a judgement made by a competent person
 * who has stood in the room, and a pre-scored assessment is a property filing
 * somebody else's opinion of its own building. It is also the one document in
 * this library with a legal life of its own: an assessment nobody assessed,
 * signed by somebody who only read it, is the failure that ends up in front
 * of a coroner.
 *
 * So the controls are offered as things to verify rather than asserted as
 * being in place, and every number is a blank.
 */
export type Hazard = {
  hazard: string
  whoIsAtRisk: string
  /** Controls a competent operation would expect. Ticked only once seen. */
  controlsToVerify: string[]
  /** What makes this one worse in a spa than the general case. */
  note?: string
}

export type PlanTable = {
  columns: string[]
  rows: string[][]
  /** Every cell in these columns is a form field rather than text. */
  fillable?: boolean
}

export type PlanSection = {
  /**
   * Which part of the document this belongs to.
   *
   * A hundred-page operating procedure with a flat list of sixty headings is
   * a hundred pages nobody navigates. Parts give it a spine, a contents page
   * that means something, and a way for a spa manager to hand one section to
   * one team without printing the rest.
   */
  part?: string
  heading: string
  intro?: string
  paragraphs?: string[]
  bullets?: string[]
  facts?: Fact[]
  actions?: PlanAction[]
  hazards?: Hazard[]
  /** Prints the five by five matrix and the colour bands. */
  riskMatrix?: boolean
  table?: PlanTable
  /** Printed on its own page. Used for each emergency in an EAP. */
  ownPage?: boolean
  /** Marks a section a competent person must complete against the building. */
  mustBeChecked?: boolean
}

export type PlanDocument = {
  kind: PlanKind
  reference: string
  title: string
  version: string
  issued: string
  reviewBy: string

  property: string
  department: string

  accountability: Accountability
  governance: string[]

  /** One paragraph on what this document is and who it is for. */
  summary: string
  scope: string

  /**
   * The framework this is written to, named plainly.
   *
   * An assessor expects to see it and a document that dances around it reads
   * as evasive. What is never done is citing a section number or telling a
   * property what the law requires of them: this states what the framework
   * covers, and the property confirms what applies to them and where.
   *
   * It carries a jurisdiction warning for the same reason. These are written
   * to United Kingdom practice. Sold to a spa in another country, half of it
   * is the wrong framework, and a document that does not say so is one that
   * gets relied on anyway.
   */
  legalFramework?: { name: string; covers: string }[]

  sections: PlanSection[]
  references: CrossReference[]
  revisions: Revision[]
}

/** The parts of a document, in the order their sections first appear. */
export function partsOf(document: PlanDocument): { part: string; headings: string[] }[] {
  const parts: { part: string; headings: string[] }[] = []
  for (const section of document.sections || []) {
    const name = section.part || ''
    const existing = parts.find(entry => entry.part === name)
    if (existing) existing.headings.push(section.heading)
    else parts.push({ part: name, headings: [section.heading] })
  }
  return parts
}

export const PLAN_KIND_LABEL: Record<PlanKind, string> = {
  nop: 'Normal Operating Procedure',
  eap: 'Emergency Action Plan',
  policy: 'Policy',
  'safe-system': 'Safe System of Work',
  'risk-assessment': 'Risk Assessment',
  guide: 'Guide',
  training: 'Training Guide',
}

/** Everything a plan needs before it is worth handing to a property. */
export function missingFromPlan(document: PlanDocument): string[] {
  const missing: string[] = []
  const needed: [string, unknown][] = [
    ['a reference number', document.reference],
    ['a title', document.title],
    ['a version', document.version],
    ['an issue date', document.issued],
    ['a review date', document.reviewBy],
    ['a summary', document.summary],
    ['a scope', document.scope],
    ['an owner', document.accountability?.owner],
  ]
  for (const [label, value] of needed) {
    if (!String(value ?? '').trim()) missing.push(label)
  }
  if (!document.sections?.length) missing.push('at least one section')

  // A section with a heading and nothing under it is a heading, and a plan
  // made of headings passes a glance and fails the first time somebody needs
  // it at seven in the morning.
  const empty = (document.sections || []).filter(section =>
    !section.paragraphs?.length && !section.bullets?.length
    && !section.facts?.length && !section.actions?.length && !section.hazards?.length && !section.table)
  if (empty.length) {
    missing.push(`content under ${empty.length === 1 ? 'one empty heading' : `${empty.length} empty headings`}`)
  }

  return missing
}

/** How many things this plan asks the property to state. */
/** Every hazard in the document, in order. */
export function hazardsInPlan(document: PlanDocument): Hazard[] {
  return (document.sections || []).flatMap(section => section.hazards || [])
}

export function factsInPlan(document: PlanDocument): number {
  return (document.sections || []).reduce((total, section) => {
    const fromTable = section.table?.fillable ? section.table.rows.length * section.table.columns.length : 0
    // Seven per hazard: likelihood, severity, score, level, further controls,
    // who owns it and by when. None of them ours to answer.
    const fromHazards = (section.hazards?.length || 0) * 7
    return total + (section.facts?.length || 0) + fromTable + fromHazards
  }, 0)
}
