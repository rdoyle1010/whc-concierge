// What the document is, and what it is not, said on the document itself.
//
// This is the wording that has to be right before a single generator is
// written, and it is here rather than in a template so it cannot be edited
// out of one document and left in another.
//
// The exposure is real and specific. A risk assessment is a legal artefact
// under an employer's own duties, and it is completed by a competent person
// who knows the premises, not by a platform that has read a fact file. A
// document that presents itself as a finished assessment invites a property
// to file it and stop thinking, which is the outcome that gets somebody hurt
// and then gets us named in the aftermath.
//
// So every document says three things: it is a professional template, it
// requires their own review and sign-off, and the named responsible person is
// theirs to write in. The signature block is deliberately empty. An unsigned
// document is obviously unfinished; a pre-signed one is a lie that looks
// tidy.

export const DOCUMENT_STATUS =
  'Professional template. Review, amend and sign off before use.'

export const DOCUMENT_DISCLAIMER =
  'This document is issued as a professional template for the named property to review, amend and adopt. '
  + 'It is not a completed assessment, a certification, or legal or regulatory advice, and it does not '
  + 'discharge any duty owed by the employer. Responsibility for its accuracy, suitability and use rests '
  + 'with the property. It must be reviewed and signed off by a competent person who knows the premises, '
  + 'the equipment and the team, and reviewed again whenever the operation, the systems or the regulations change.'

export const RISK_ASSESSMENT_DISCLAIMER =
  'A risk assessment is a legal document completed by a competent person with knowledge of the premises. '
  + 'This template sets out the hazards, controls and review structure to work from. The hazards listed are '
  + 'a starting point and are not exhaustive: the property must add anything specific to its own building, '
  + 'equipment and team, and record the residual risk it accepts. It is not valid until a named competent '
  + 'person has completed, dated and signed it.'

/** The footer line, on every page, in every document. */
export const DOCUMENT_FOOTER =
  'Prepared through Talent House Collective. Professional template, for review and sign-off by the property.'

/**
 * The wording a document of this kind must carry.
 *
 * A risk assessment carries both: the general statement about what a template
 * is, and the specific one about what a risk assessment legally requires. The
 * general one alone would be technically true and practically inadequate.
 */
export function disclaimersFor(kind: string): string[] {
  return kind === 'risk-assessment'
    ? [DOCUMENT_DISCLAIMER, RISK_ASSESSMENT_DISCLAIMER]
    : [DOCUMENT_DISCLAIMER]
}


// A guide is not a template.
//
// The footer and the badge on every other document say "professional
// template, review and sign off before use", which is exactly right for a
// procedure and wrong for the book explaining how to complete one. A guide
// nobody has to sign, file or adopt should not carry a line telling them to.
export const GUIDE_STATUS = 'Guidance. Nothing here needs completing or signing.'

export const GUIDE_FOOTER =
  'Talent House Collective. Guidance only: it does not form part of your procedures.'

export const GUIDE_KINDS = new Set(['guide', 'training'])

export function statusFor(kind: string): string {
  return GUIDE_KINDS.has(kind) ? GUIDE_STATUS : DOCUMENT_STATUS
}

export function footerFor(kind: string): string {
  return GUIDE_KINDS.has(kind) ? GUIDE_FOOTER : DOCUMENT_FOOTER
}
