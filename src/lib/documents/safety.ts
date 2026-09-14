// The documents that are not like the others.
//
// Her own build plan puts it plainly: life safety before elegance. Thermal
// emergency response, fire evacuation, the pool safety operating procedure,
// COSHH, medical emergency, biohazard. These are the documents an inspector
// asks for first and the ones where being wrong is not a commercial problem.
//
// A drafted procedure is a starting structure for every document in the
// library. For these it is only ever that. The evacuation route, the muster
// point, the plant room, the chemical store and the person who holds the
// pool operator qualification are facts about one building, and nothing that
// has read a fact file knows them. So these carry a different bar: the draft
// is marked, the screen says why, and signing one off takes an explicit
// statement that a competent person has checked it against the premises.
//
// Deliberately generous about what counts. A false positive costs one extra
// tick box. A false negative is a fire procedure nobody checked.

const SIGNALS = [
  'emergency', 'evacuat', 'fire', 'alarm', 'first aid', 'medical', 'resus',
  'defibrillat', 'drowning', 'rescue', 'lifeguard', 'psop', 'pool safety',
  'thermal', 'sauna', 'steam', 'plant room', 'chemical', 'coshh', 'chlorine',
  'legionella', 'water quality', 'biohazard', 'blood', 'spillage', 'sharps',
  'infection', 'contamination', 'electrical', 'gas', 'lone work', 'lockdown',
  'incident', 'accident', 'riddor', 'safeguard', 'missing person', 'security',
  'anaphyla', 'contraindication', 'allergy', 'injur',
]

/**
 * Whether this document decides whether somebody gets hurt.
 *
 * Reads the title and the reference together: REC-FIRE-EVAC-SOP-012 is
 * obvious from the reference alone, and "Guest Collapse in the Relaxation
 * Room" is obvious only from the title.
 */
export function isLifeSafety(input: { title?: string | null; reference?: string | null; department?: string | null }): boolean {
  const haystack = `${input.title || ''} ${input.reference || ''}`.toLowerCase()
  if (SIGNALS.some(signal => haystack.includes(signal))) return true

  // Every pool and thermal procedure, regardless of what it is called. The
  // operation of a commercial pool is regulated from the first day it opens
  // and there is no such thing as a low-stakes document about one.
  const department = String(input.department || '').toLowerCase()
  return department.includes('pool')
}

export const LIFE_SAFETY_WARNING =
  'This is a life safety document. The draft is a starting structure only: the evacuation route, the muster '
  + 'point, the plant room, the chemical store and the people who hold the relevant qualifications are facts '
  + 'about one building, and nothing that has read a fact file knows them. It must be checked against the '
  + 'premises by a competent person before it is signed off, and it must never be issued to a property on the '
  + 'strength of the draft alone.'

/** What she is confirming when she signs one of these off. */
export const LIFE_SAFETY_CONFIRMATION =
  'A competent person has checked this against the actual premises, equipment and team.'
