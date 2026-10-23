import { ROLE_LEVELS, TRAVEL_OPTIONS, AVAILABILITY_STATUSES } from '@/lib/constants'
import { LANGUAGES } from '@/lib/languages'
import type { TalentVisibility } from '@/lib/talent-visibility'

// The handful of things a CV never says.
//
// A CV is a record of what somebody has done. It does not say when they could
// start, whether they would move, what languages they hold, or how much of
// themselves they want a hotel to see. Those are the answers that turn a read
// CV into a profile that looks exactly like one the professional wrote, and
// they are the reason a built profile kept stopping at eighty per cent with
// "About you, Postcode" underneath it.
//
// Eight questions. Five are one tap. It has to be quicker than the form they
// already refused to fill in, or it is the same form with a nicer name.

export type QuestionKind = 'choose' | 'text' | 'number' | 'many'

export type BuildQuestion = {
  key: string
  label: string
  hint?: string
  kind: QuestionKind
  options?: { value: string; label: string }[]
  placeholder?: string
  /** Whether an answer is required before the form will send. */
  required?: boolean
}

const asOptions = (values: readonly (string | { value: string; label: string })[]) =>
  values.map(value => (typeof value === 'string' ? { value, label: value } : { value: value.value, label: value.label }))

export const BUILD_QUESTIONS: BuildQuestion[] = [
  {
    key: 'role_level',
    label: 'What are you now?',
    kind: 'choose',
    options: asOptions(ROLE_LEVELS),
    required: true,
  },
  {
    key: 'experience_years',
    label: 'Years in the industry',
    kind: 'number',
    placeholder: '12',
    required: true,
  },
  {
    key: 'postcode',
    label: 'Your postcode',
    hint: 'Used for distance only. Never shown.',
    kind: 'text',
    placeholder: 'BA1 2LR',
    required: true,
  },
  {
    key: 'availability_status',
    label: 'When could you start somewhere new?',
    kind: 'choose',
    options: asOptions(AVAILABILITY_STATUSES),
    required: true,
  },
  {
    key: 'travel_availability',
    label: 'How far would you go?',
    kind: 'choose',
    options: asOptions(TRAVEL_OPTIONS),
  },
  {
    key: 'languages',
    label: 'Languages you can treat in',
    hint: 'Worth more than most people think, particularly in resort work.',
    kind: 'many',
    // By name, because that is what the profile column holds and what the
    // CV reader writes into it. A code here would sit next to a name there
    // and neither would match the other.
    options: LANGUAGES.slice(0, 24).map(language => ({ value: language.label, label: language.label })),
  },
  {
    key: 'current_employer',
    label: 'Where are you now?',
    hint: 'Hidden from properties unless you say otherwise below.',
    kind: 'text',
    placeholder: 'The Dorchester Spa, London',
  },
  {
    key: 'visibility',
    label: 'How much of you should a hotel see?',
    hint: 'You can change this whenever you like, and it starts wherever you leave it.',
    kind: 'choose',
    options: [
      { value: 'private', label: 'Nothing yet. Show me to nobody until I say so.' },
      { value: 'discreet', label: 'What I can do, but not who I am. No name, no photograph.' },
      { value: 'open', label: 'All of it. I am happy to be found.' },
    ],
    required: true,
  },
]

export const REQUIRED_QUESTIONS = BUILD_QUESTIONS.filter(question => question.required).map(question => question.key)

/** Every key the form is allowed to send, so nothing else is stored. */
export const QUESTION_KEYS = BUILD_QUESTIONS.map(question => question.key)

export type BuildAnswers = Record<string, unknown>

/** Keep only the answers we asked for, in the shape we asked for them. */
export function sanitiseAnswers(input: unknown): BuildAnswers {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const answers: BuildAnswers = {}

  for (const question of BUILD_QUESTIONS) {
    const value = source[question.key]
    if (value === undefined || value === null || value === '') continue

    if (question.kind === 'many') {
      const values = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
        : []
      if (values.length) answers[question.key] = Array.from(new Set(values)).slice(0, 20)
      continue
    }

    if (question.kind === 'number') {
      const number = Number(value)
      if (Number.isFinite(number)) answers[question.key] = Math.min(60, Math.max(0, Math.round(number)))
      continue
    }

    // A choice has to be one of the choices, or it is free text wearing a
    // select's clothes and it makes somebody quietly unmatchable.
    if (question.kind === 'choose') {
      const allowed = (question.options || []).map(option => option.value)
      if (allowed.includes(String(value))) answers[question.key] = String(value)
      continue
    }

    answers[question.key] = String(value).trim().slice(0, 200)
  }

  return answers
}

/** Which required answers are missing, named as the person saw them. */
export function unanswered(answers: BuildAnswers): string[] {
  return BUILD_QUESTIONS
    .filter(question => question.required && !(question.key in answers))
    .map(question => question.label)
}

export function chosenVisibility(answers: BuildAnswers): TalentVisibility {
  const value = String(answers.visibility || '')
  return value === 'open' || value === 'discreet' ? value : 'private'
}

/**
 * The answers, as profile columns.
 *
 * Written the moment the account is made, before anybody reads the CV, so a
 * profile is already part filled in by the time it reaches the queue. The
 * visibility answer is deliberately not here: it goes through
 * visibilityColumns, which is the only thing allowed to turn a preference
 * into those four booleans.
 */
export function answersToProfile(answers: BuildAnswers): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (answers.role_level) row.role_level = answers.role_level
  if (answers.experience_years !== undefined) row.experience_years = answers.experience_years
  if (answers.postcode) {
    row.postcode = answers.postcode
    row.location = answers.postcode
  }
  if (answers.availability_status) row.availability_status = answers.availability_status
  if (answers.travel_availability) row.travel_availability = answers.travel_availability
  if (Array.isArray(answers.languages) && answers.languages.length) row.languages = answers.languages
  if (answers.current_employer) {
    row.current_employer = answers.current_employer
    // Off unless they choose otherwise on their own profile. Somebody's
    // current employer learning they are looking is the single thing this
    // market is most afraid of, and it is not ours to decide.
    row.current_employer_visible = false
  }
  return row
}
