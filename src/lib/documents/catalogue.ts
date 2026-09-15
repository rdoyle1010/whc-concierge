import { LIBRARY_PLAN, type PlannedDocument } from './library-plan'
import { REGISTER_INDEX } from './catalogue-index'

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

// The register-written documents come from catalogue-index, not from the plan
// modules that build them. Reading them from the plan modules pulled every
// finished document into the browser bundle along with its title, which is a
// long way of publishing the thing being sold. catalogue-index carries the
// listing fields and nothing else, and a test keeps it honest.

export function sellableCatalogue(): PlannedDocument[] {
  return [...LIBRARY_PLAN, ...REGISTER_INDEX]
}

export function catalogueEntry(reference: string): PlannedDocument | undefined {
  return sellableCatalogue().find(entry => entry.reference === reference)
}
