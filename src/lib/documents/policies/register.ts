import { SAFETY_POLICIES } from './safety'
import { GUEST_POLICIES } from './guests'
import { COMMERCIAL_POLICIES } from './commercial'
import { PEOPLE_POLICIES } from './people'
import type { PolicyEntry } from './types'

// Twenty policies, as a suite.
//
// Ordered safety, guests, money, people: the order a property would be asked
// for them in, which is also roughly the order of what it costs to be without
// one.
//
// What is deliberately not here: disciplinary and grievance procedures. They
// are the documents most likely to be tested in front of a tribunal, they
// turn on jurisdiction and on the individual contract, and a template bought
// off a website is the wrong way to hold one. A spa should take those from an
// employment adviser. Saying so is worth more than selling a version of them,
// and a pack that quietly included them would be selling the buyer a risk
// dressed as a convenience.

export const POLICY_REGISTER: PolicyEntry[] = [
  ...SAFETY_POLICIES,
  ...GUEST_POLICIES,
  ...COMMERCIAL_POLICIES,
  ...PEOPLE_POLICIES,
]

export type { PolicyEntry }
