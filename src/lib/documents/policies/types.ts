// A policy, as content rather than as layout.
//
// A policy is not a procedure. A procedure says how something is done; a
// policy says what the property's position is and who decides. Most spa
// policies fail by being one or the other badly: a page of principles nobody
// can act on, or a procedure with the word policy at the top.
//
// So every one of these carries a position stated in plain sentences, the
// rules that follow from it, who is accountable for what, and what happens
// when it is breached. The last is the part usually missing, and it is the
// part that decides whether a policy is a document or a decoration.
//
// What is never done here is telling a property what the law requires of
// them. These state a position a competent operation would hold and leave the
// property to confirm it against their own obligations and their own advice.

export type PolicyEntry = {
  reference: string
  title: string
  department: string
  group: 'Safety and compliance' | 'Guests and treatments' | 'Money and bookings' | 'People'
  /** Why the policy exists, in one line. */
  purpose: string
  /** Who it binds. Usually wider than the team. */
  appliesTo: string
  /**
   * The position, in plain sentences.
   *
   * This is the part that is actually the policy. Written so that somebody
   * can read it once and know what the property will and will not do.
   */
  position: string[]
  /** What follows from the position, grouped so it can be found. */
  rules: { area: string; items: string[] }[]
  /** Who is accountable for what, as roles rather than names. */
  responsibilities: { role: string; duty: string }[]
  /** What must be written down, and kept. */
  records: string[]
  /**
   * What happens when it is breached.
   *
   * The part usually missing, and the part that decides whether a policy is a
   * document or a decoration.
   */
  breach: string[]
  /** What forces a review before the annual one. */
  reviewTriggers: string[]
}
