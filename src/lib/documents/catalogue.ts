import { LIBRARY_PLAN, type PlannedDocument } from './library-plan'
import { POOL_PLAN_ENTRIES } from './pool-plans'
import { RISK_ASSESSMENT_ENTRIES } from './risk-assessment-plans'

// Everything that can be listed and sold, in one list.
//
// The build plan is four hundred and sixty procedures and drives the
// department packs. The pool safety plans are a different shape and a
// different price, and adding them to that list would have offered a
// two-document department pack at seventy-eight pounds.
//
// So they are separate where pricing is concerned and together everywhere a
// buyer looks, because "every document" that quietly omits the two a pool
// operator needs most is a list that misleads by being incomplete.

export function sellableCatalogue(): PlannedDocument[] {
  return [...LIBRARY_PLAN, ...POOL_PLAN_ENTRIES, ...RISK_ASSESSMENT_ENTRIES]
}

export function catalogueEntry(reference: string): PlannedDocument | undefined {
  return sellableCatalogue().find(entry => entry.reference === reference)
}
