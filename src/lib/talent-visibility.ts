// How visible a professional is, decided by her and nobody else.
//
// The platform used to answer this on her behalf. Registration wrote
// profile_visible: true and left Private Career Mode off, so a therapist was
// fully discoverable by name from the second she signed up, having never been
// asked and never been told. In an industry where every spa director knows
// every other spa director, that is not a settings default. It is the thing
// the market is most afraid of, done silently.
//
// So it is a question on the registration form now, private is the answer
// until she says otherwise, and this file is the only place that turns an
// answer into columns. Three screens read it and one route writes it; if they
// disagree about what "discreet" means, somebody's name ends up somewhere she
// did not agree to.

export type TalentVisibility = 'private' | 'discreet' | 'open'

export const DEFAULT_VISIBILITY: TalentVisibility = 'private'

export type VisibilityColumns = {
  profile_visible: boolean
  stealth_mode: boolean
  private_mode: boolean
  private_hide_photo: boolean
}

/**
 * The columns behind each answer.
 *
 * profile_visible and stealth_mode are both honoured for the private state
 * because different routes read different ones: search checks both, the
 * employer directory checks only profile_visible, and the brief builder only
 * stealth_mode. Setting both means no route can be the one that leaks her.
 */
export function visibilityColumns(state: TalentVisibility): VisibilityColumns {
  if (state === 'open') {
    return { profile_visible: true, stealth_mode: false, private_mode: false, private_hide_photo: false }
  }
  if (state === 'discreet') {
    // Findable by what she can do. Her name, her photograph and her CV stay
    // hers until she accepts an introduction.
    return { profile_visible: true, stealth_mode: false, private_mode: true, private_hide_photo: true }
  }
  return { profile_visible: false, stealth_mode: true, private_mode: true, private_hide_photo: true }
}

/** The answer a set of columns represents, for a screen that has to show it back. */
export function visibilityFrom(profile: {
  profile_visible?: boolean | null
  stealth_mode?: boolean | null
  private_mode?: boolean | null
} | null | undefined): TalentVisibility {
  if (!profile) return DEFAULT_VISIBILITY
  // Postgres nulls are the trap here: `null = false` is null, not true, so a
  // column nobody has written must be read deliberately rather than compared.
  // An account created before any of this existed has profile_visible true
  // and private_mode null, and that is genuinely "open" - it is what
  // employers have been seeing.
  if (profile.profile_visible === false || profile.stealth_mode === true) return 'private'
  if (profile.private_mode === true) return 'discreet'
  return 'open'
}

export function isTalentVisibility(value: unknown): value is TalentVisibility {
  return value === 'private' || value === 'discreet' || value === 'open'
}

/** What each answer means, in her language rather than the database's. */
export const VISIBILITY_COPY: Record<TalentVisibility, { label: string; detail: string }> = {
  private: {
    label: 'Private',
    detail: 'Nobody can find you. Your record is yours: the Academy, Good to Know, events and everything else stays open. Change this whenever you like.',
  },
  discreet: {
    label: 'Discreet',
    detail: 'Properties can find you by what you can do, but see only your first name and initial. No photograph, no CV, and nobody learns who you are until you accept an introduction.',
  },
  open: {
    label: 'Open',
    detail: 'Your full profile is visible to verified properties, and they can approach you directly. Best if you are actively looking and not worried about who knows.',
  },
}
