import { stageOf, kindOf, KIND_LABEL, STAGE_LABEL, type JourneyStage } from './journey'

// Which titles to put in front of a buyer, out of a hundred and five.
//
// Listing all of them is not selling, it is filing. The first version printed
// every title in catalogue order, so a reception pack opened with "Aftercare
// Email Dispatch and Record" and "Apply Buffers and Setup Times", and a
// hundred and five lines of that reads as tedium rather than as relief. The
// depth is the argument, but the depth is made by saying a hundred and five,
// not by printing a hundred and five.
//
// So a handful are shown, and they are the ones a spa director recognises as
// the thing that went wrong last month: the complaint, the cancellation, the
// screening, the close, the child, the breach. Nobody buys a pack because it
// can mark class attendance.

// Words that mean somebody has been burned by this. Ordered by how much a
// buyer feels them, roughly, because ties are broken by this order.
const WEIGHT: [RegExp, number][] = [
  [/\b(emergency|evacuat|cardiac|drowning|resuscitat)/i, 10],
  [/\b(incident|accident|injur|near.miss)/i, 9],
  [/\b(complaint|escalat|refund|compensat|goodwill)/i, 8],
  [/\b(child|young person|vulnerable|safeguard)/i, 8],
  [/\b(breach|data protection|gdpr|cctv|security)/i, 7],
  [/\b(screening|par.q|consent|allergy|allerg|medical|contraindicat)/i, 7],
  [/\b(cancellation|no.show|arrears|chargeback|dispute)/i, 6],
  [/\b(close|reconcil|banking|float|cash)/i, 5],
  [/\b(legionella|water|chemical|coshh|plant|scald)/i, 6],
  [/\b(fire|first aid|lone work|manual handling)/i, 6],
  [/\b(audit|inspection|compliance|certificat)/i, 5],
  [/\b(handover|briefing|duty manager|opening|closing)/i, 4],
]

// Titles that describe a keystroke. True, necessary, and not why anybody
// spends eight hundred pounds.
const DULL = /\b(email|template|report|note|marking|attendance|buffer|setup time|log.in|printer|receipt)\b/i

function score(title: string): number {
  let points = 0
  for (const [pattern, weight] of WEIGHT) {
    if (pattern.test(title)) { points = Math.max(points, weight); break }
  }
  if (DULL.test(title)) points -= 3
  return points
}

export type Entry = { reference: string; title: string }

/**
 * A representative handful, weighted towards what a buyer feels.
 *
 * Capped at two per stage so a reception pack does not present itself as five
 * ways of cancelling something. A pack that covers the whole visit should
 * look like it does.
 */
export function highlights(entries: Entry[], howMany = 8): Entry[] {
  const ranked = [...entries].sort((a, b) => score(b.title) - score(a.title) || a.title.localeCompare(b.title))
  const perStage = new Map<string, number>()
  const chosen: Entry[] = []

  for (const cap of [2, 4, Infinity]) {
    for (const entry of ranked) {
      if (chosen.length >= howMany) break
      if (chosen.includes(entry)) continue
      const stage = stageOf(entry)
      if ((perStage.get(stage) || 0) >= cap) continue
      perStage.set(stage, (perStage.get(stage) || 0) + 1)
      chosen.push(entry)
    }
    if (chosen.length >= howMany) break
  }
  return chosen
}

/** How a pack is spread across the visit, biggest first, empties dropped. */
export function stageSpread(entries: Entry[]): { stage: JourneyStage; label: string; count: number }[] {
  const counts = new Map<JourneyStage, number>()
  for (const entry of entries) {
    const stage = stageOf(entry) as JourneyStage
    counts.set(stage, (counts.get(stage) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([stage, count]) => ({ stage, label: STAGE_LABEL[stage] || stage, count }))
    .sort((a, b) => b.count - a.count)
}

/** What kinds of thing are in it, as a sentence rather than as headings. */
export function kindSpread(entries: Entry[]): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const kind = kindOf(entry.reference)
    counts.set(kind, (counts.get(kind) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ label: KIND_LABEL[kind] || 'Document', count }))
    .sort((a, b) => b.count - a.count)
}
