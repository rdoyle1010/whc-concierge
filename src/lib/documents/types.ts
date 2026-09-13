// The shape of an operational document.
//
// Modelled on the SOPs Rebecca already writes for clients, which are the
// benchmark here rather than anything generic: a header block that says who
// wrote it and under whose standards, roles and responsibilities, numbered
// steps each with the standard it has to meet, definitions, cross-references
// to the SOPs either side of it, and a competency sign-off a trainer
// completes with the learner in front of them.
//
// What has been added is the governance a document needs to survive an audit
// rather than merely look like one:
//
//   - An owner and an approver, distinct from the author. Who wrote it and
//     who is accountable for it are different questions and an assessor asks
//     the second one.
//   - A version and a review date. An SOP with no review date is a finding,
//     every time, in every framework.
//   - Why it matters, stated in one line. A procedure nobody understands the
//     purpose of is followed until the first busy Saturday.
//   - How it is measured. She is commercial and so are her clients: a
//     procedure with no measure is an opinion with numbered steps.
//   - What goes wrong. The failures a trainer would name out loud, written
//     down, because they are the actual content of the training.

export type DocumentKind = 'sop' | 'risk-assessment' | 'job-description' | 'policy'

/** Who is accountable, as distinct from who typed it. */
export type Accountability = {
  /** The person who wrote it. */
  author: string
  authorRole?: string
  /** The role that owns the procedure day to day. */
  owner: string
  /** The person who signs it off for use. Left blank until they do. */
  approver?: string
  approvedOn?: string
}

export type Step = {
  /** Short imperative name, shown next to the number. */
  name: string
  /** What the person actually does. */
  action: string
  /** The standard the step has to meet, in a form somebody can audit. */
  standard: string
}

export type Responsibility = {
  role: string
  responsibility: string
}

export type Definition = {
  term: string
  meaning: string
}

export type CrossReference = {
  name: string
  reference: string
}

export type Revision = {
  date: string
  by: string
  description: string
}

export type SopDocument = {
  kind: 'sop'
  /** DEPT-TOPIC-SOP-NNN. Built and checked by reference.ts. */
  reference: string
  title: string
  version: string
  issued: string
  /** When it must next be looked at. An SOP without one is a finding. */
  reviewBy: string

  property: string
  department: string
  operationalStage?: string

  accountability: Accountability

  /** Brand standards, system standards, and ours. */
  governance: string[]

  purpose: string
  scope: string
  equipment: string[]

  /** One line on the cost of not doing it. */
  whyItMatters: string
  /** How anybody knows it is being followed. */
  measuredBy: string[]

  responsibilities: Responsibility[]
  steps: Step[]
  /** The failures a trainer names out loud, written down. */
  commonFailures: string[]
  definitions: Definition[]
  references: CrossReference[]
  revisions: Revision[]
}

export type OperationalDocument = SopDocument

/** Everything a document needs before it is worth handing to a client. */
export function missingFromSop(document: SopDocument): string[] {
  const missing: string[] = []
  const needed: [string, unknown][] = [
    ['a reference number', document.reference],
    ['a title', document.title],
    ['a version', document.version],
    ['an issue date', document.issued],
    ['a review date', document.reviewBy],
    ['the property', document.property],
    ['the department', document.department],
    ['an author', document.accountability?.author],
    ['an owner', document.accountability?.owner],
    ['a purpose', document.purpose],
    ['a scope', document.scope],
    ['a line on why it matters', document.whyItMatters],
  ]
  for (const [label, value] of needed) {
    if (!String(value ?? '').trim()) missing.push(label)
  }
  if (!document.steps?.length) missing.push('at least one step')
  if (!document.responsibilities?.length) missing.push('at least one responsibility')
  if (!document.measuredBy?.length) missing.push('how it is measured')

  // A step with an action and no standard is a description, not a procedure,
  // and it is the single most common way a document like this quietly stops
  // being auditable.
  const unstandardised = (document.steps || []).filter(step => !String(step.standard || '').trim())
  if (unstandardised.length) {
    missing.push(`a standard for ${unstandardised.length === 1 ? 'one step' : `${unstandardised.length} steps`}`)
  }
  return missing
}
