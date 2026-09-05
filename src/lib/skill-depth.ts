// Every selected skill carries a depth, and nothing else keeps one.
//
// The Skills Wizard asks how good somebody is at each thing and writes it to
// candidate_profiles.skill_proficiencies. The profile page never did - so a
// skill added there arrived with no depth against it, and Skill Depth is a
// scored matching factor.
//
// It was not that the profile page wiped anything. It simply never filled it
// in, so the factor quietly shrank every time somebody edited their skills
// outside the wizard, and vanished entirely for anybody who never used it:
// the matcher drops the factor rather than scoring it zero, which is
// merciful and also means the score is built on less than it appears to be.
//
// Without the second half, a skill removed on the profile page leaves its old
// depth behind, and a profile slowly accumulates opinions about treatments
// somebody no longer offers.

export const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'master'] as const
export type Proficiency = typeof PROFICIENCY_OPTIONS[number]

/** Unset is treated as intermediate: fair, and never wins a role on its own. */
export const DEFAULT_PROFICIENCY: Proficiency = 'intermediate'

export function tidyProficiencies(current: unknown, skills: string[]): Record<string, string> | null {
  const existing: Record<string, string> = current && typeof current === 'object' && !Array.isArray(current)
    ? current as Record<string, string>
    : {}
  const tidy: Record<string, string> = {}
  for (const skill of skills) {
    if (!skill) continue
    const held = existing[skill]
    tidy[skill] = typeof held === 'string' && held.trim() ? held : DEFAULT_PROFICIENCY
  }
  return Object.keys(tidy).length ? tidy : null
}
