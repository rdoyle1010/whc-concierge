import { FINDING } from './finding'
import { TRADE_TESTS } from './trade-tests'
import { JOINING } from './joining'
import type { HiringEntry } from './types'

// Twelve instruments, in the order they are used.
//
// Advert, screening call, question bank, scorecard, the three trade tests,
// then pre-boarding, day one, the ninety days, the fairness guide and the
// exit interview.
//
// Deliberately not the process. The library already holds requisition and
// approval, interview scheduling, right to work checks, the offer, onboarding
// scheduling, the probation gate and the leaver process. Those say what has
// to happen. These say what to actually do when you are in the room, which is
// the part that decides whether the hire was any good.

export const HIRING_REGISTER: HiringEntry[] = [
  ...FINDING,
  ...TRADE_TESTS,
  ...JOINING,
]

export type { HiringEntry }
