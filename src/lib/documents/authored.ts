import { QUARTER_ONE_DRAFTS } from './quarter-one'
import { THE_LAST_SIX } from './the-last-six'

// Everything written by hand rather than drafted, in one place.
//
// It started as nine. Then six more came back from the model without steps,
// twice, inside a function the host kills at twenty-six seconds, and each of
// those six held a department pack off the shelf on its own. A document that
// cannot be finished by drafting is finished by writing it.
//
// One list, because two lists drift: the button counts from here, the route
// writes from here, and the test that says every one of them is complete
// enough to sign reads from here.

export const AUTHORED_DRAFTS = { ...QUARTER_ONE_DRAFTS, ...THE_LAST_SIX }

/** References we hold written content for, so a caller can say how many. */
export function authoredReferences(): string[] {
  return Object.keys(AUTHORED_DRAFTS)
}

export const AUTHORED_COUNT = Object.keys(AUTHORED_DRAFTS).length
