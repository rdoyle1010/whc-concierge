import { LEADERSHIP } from './leadership'
import { SUPERVISORY } from './supervisory'
import { TREATMENT } from './treatment'
import { FRONT_OF_HOUSE } from './front-of-house'
import { WET_AND_FITNESS } from './wet-and-fitness'
import { SUPPORT } from './support'
import type { RoleEntry } from './types'

// Twenty-five roles, as a suite.
//
// Sold together rather than one at a time, because a job description on its
// own is a form and a set of them is a structure. The value is in the joins:
// every role says who it reports to and who reports to it, the measures at
// one level are the ones the level above is accountable for, and nothing
// falls between two of them.
//
// Ordered by band rather than alphabetically, so the pack reads as an
// organisation chart rather than as a filing cabinet.

export const ROLE_REGISTER: RoleEntry[] = [
  ...LEADERSHIP,
  ...SUPERVISORY,
  ...TREATMENT,
  ...FRONT_OF_HOUSE,
  ...WET_AND_FITNESS,
  ...SUPPORT,
]

export type { RoleEntry }
