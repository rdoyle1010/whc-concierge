// Languages spoken, with fluency. Never nationality.
//
// Nationality is a protected characteristic under the Equality Act, and putting
// it on a profile that properties browse builds a discrimination route into the
// product - the platform supplying the filter is facilitating it, not only the
// property using it. "Right to work in the UK" is the lawful question and the
// profile already answers it.
//
// Languages is what a property actually needs. A spa with Gulf guests needs
// Arabic; a Cotswolds hotel taking French coach parties needs French. That is a
// genuine occupational requirement, it is lawful to filter on, and no generic
// job board has it.

export type Fluency = 'native' | 'fluent' | 'professional' | 'conversational'

export const FLUENCY_LEVELS: { value: Fluency; label: string; hint: string }[] = [
  { value: 'native', label: 'Native', hint: 'First language' },
  { value: 'fluent', label: 'Fluent', hint: 'Comfortable in any situation, including complex conversation' },
  { value: 'professional', label: 'Professional', hint: 'Confident with guests and colleagues at work' },
  { value: 'conversational', label: 'Conversational', hint: 'Everyday exchanges, simple guest interaction' },
]

export type LanguageSkill = { code: string; label: string; fluency: Fluency }

// The languages that actually come up in luxury spa and hospitality across
// Europe, the Gulf and the destinations WHC places into. Not every language in
// the world: a list somebody scrolls is a list nobody fills in.
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'ro', label: 'Romanian' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'tr', label: 'Turkish' },
  { code: 'el', label: 'Greek' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'cs', label: 'Czech' },
  { code: 'sk', label: 'Slovak' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'lv', label: 'Latvian' },
  { code: 'lt', label: 'Lithuanian' },
  { code: 'th', label: 'Thai' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'yue', label: 'Cantonese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ur', label: 'Urdu' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'id', label: 'Indonesian' },
  { code: 'sw', label: 'Swahili' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'sv', label: 'Swedish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'he', label: 'Hebrew' },
  { code: 'fa', label: 'Farsi' },
]

const BY_CODE = new Map(LANGUAGES.map(language => [language.code, language.label]))
const FLUENCIES = new Set(FLUENCY_LEVELS.map(level => level.value))

export function languageLabel(code: string): string {
  return BY_CODE.get(code) || code
}

/**
 * Whatever is in the database, turned into something safe to render.
 *
 * The column is jsonb, so a row could hold anything - an older shape, a partial
 * write, something typed by hand in the SQL editor. Unknown codes and unknown
 * fluencies are dropped rather than displayed, because a profile claiming a
 * fluency the platform does not define is worse than one claiming nothing.
 */
export function parseLanguageSkills(value: unknown): LanguageSkill[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: LanguageSkill[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const code = String((entry as any).code || '').trim()
    const fluency = String((entry as any).fluency || '').trim() as Fluency
    if (!BY_CODE.has(code) || !FLUENCIES.has(fluency) || seen.has(code)) continue
    seen.add(code)
    out.push({ code, label: languageLabel(code), fluency })
  }
  // Strongest first, so a profile leads with what the speaker is best at.
  const order = FLUENCY_LEVELS.map(level => level.value)
  return out.sort((a, b) => order.indexOf(a.fluency) - order.indexOf(b.fluency))
}

export function fluencyLabel(fluency: Fluency): string {
  return FLUENCY_LEVELS.find(level => level.value === fluency)?.label || fluency
}
