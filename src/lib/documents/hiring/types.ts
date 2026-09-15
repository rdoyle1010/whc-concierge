import type { PlanSection } from '../plan-types'

// The instruments of hiring, as distinct from the process of it.
//
// The library already holds the process: requisition and approval, interview
// scheduling, right to work checks, the offer, onboarding scheduling, the
// probation gate, the leaver. Those are the administrative steps and they are
// worth having written down.
//
// None of them makes a hire good. What decides that is what is actually asked
// at interview, how the answer is scored, whether the candidate was watched
// doing the work, and what happened in the first ninety days. Those are the
// documents nobody writes, and they are the reason spa hiring is mostly a
// matter of whether somebody was likeable for forty minutes.
//
// So these are instruments rather than procedures. A question bank, a
// scorecard, a trade test with a marking scheme, a ninety day plan. Each one
// is used in a room with a person in it.

export type HiringEntry = {
  reference: string
  title: string
  department: string
  /** What the instrument is for, in one line. */
  purpose: string
  /** When it comes out, and who holds it. */
  whenToUse: string
  /**
   * Written directly rather than generated from a shape.
   *
   * A question bank, a scorecard and a trade test are genuinely different
   * documents. Forcing one template over all three would produce a scorecard
   * with a purpose statement and a question bank with a signature block.
   */
  sections: PlanSection[]
}
