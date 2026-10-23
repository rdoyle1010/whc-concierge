// Who is taking a course, and how far they have got.
//
// Both answers used to be worked out inline in the admin route, and both were
// wrong in the same quiet way: when the code could not answer, it produced
// something that looked like an answer. Every learner on the Academy screen
// was called "Therapist" - not a missing name, a failed lookup wearing the
// costume of a job title, with nothing on the screen to say so.
//
// Pulled out here so the decisions can be tested on their own. Nothing in this
// module may reach the database; it is given what was found and decides what
// that means.

export type LearnerRecord = { full_name?: string | null } | null | undefined

/**
 * What to call a learner.
 *
 * Four different situations, and they must read as four different things.
 * Collapsing them into one plausible-sounding word is exactly the bug this
 * replaces: a broken query and a nameless account looked identical, so sixteen
 * people appeared under a single name and the screen said nothing was wrong.
 */
export function learnerName(candidateId: string | null | undefined, candidate: LearnerRecord): string {
  const name = String(candidate?.full_name || '').trim()
  if (name) return name
  // Erasure detaches records rather than destroying them, so an enrolment can
  // outlive the person. That is a fact worth showing, not a gap to fill.
  if (!candidateId) return 'Account deleted'
  // The id points at a profile that is not there. Say so: it is a data
  // problem, and dressing it up as a person hides it.
  if (!candidate) return 'Account not found'
  return 'Name not given'
}

/** Whether the label above is a real person's name rather than a stand-in. */
export function isRealLearnerName(candidate: LearnerRecord): boolean {
  return Boolean(String(candidate?.full_name || '').trim())
}

export type LessonProgress = {
  done: number
  total: number
  percent: number
  /** Index of the first lesson not ticked off, or -1 when every one is done. */
  nextIndex: number
}

/**
 * How far through the modules somebody is.
 *
 * progress is a { lessonIndex: true } map. Counting its keys was close enough
 * to right to survive, but a key set to false counted as a completed lesson
 * and an index beyond the end of a shortened course counted as well, so a
 * learner could read 6 of 5.
 */
export function lessonProgress(progress: unknown, total: number): LessonProgress {
  const map = progress && typeof progress === 'object' && !Array.isArray(progress) ? progress as Record<string, unknown> : {}
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0
  let done = 0
  let nextIndex = -1
  for (let index = 0; index < safeTotal; index++) {
    if (map[String(index)]) done++
    else if (nextIndex < 0) nextIndex = index
  }
  return { done, total: safeTotal, percent: safeTotal ? Math.round((done / safeTotal) * 100) : 0, nextIndex }
}

/**
 * The candidate ids worth looking up.
 *
 * candidate_id is nullable since erasure began detaching records, and one null
 * in a PostgREST .in() list rejects the entire query. That is how a single
 * deleted account took the names off every other learner on the screen.
 */
export function learnerIdsToLookUp(enrolments: Array<{ candidate_id?: string | null }>): string[] {
  const ids = new Set<string>()
  for (const enrolment of enrolments || []) {
    const id = enrolment?.candidate_id
    if (typeof id === 'string' && id.trim()) ids.add(id)
  }
  return Array.from(ids)
}
