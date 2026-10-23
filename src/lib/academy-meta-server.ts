import { ACADEMY } from './academy'
import { courseMeta } from './academy-meta'

// The one piece of course metadata that genuinely needs the catalogue.
//
// It defaults to "every course that exists", which means importing ACADEMY -
// and ACADEMY carries the full text of every lesson. That is fine on a server
// route and ruinous in a browser bundle, so it lives here, apart from the rest
// of academy-meta, and every caller of this is a server route.

const norm = (value: string) => value.trim().toLowerCase()

/**
 * Courses that teach a given skill, matched loosely both ways, the same way the
 * matching engine compares skills.
 */
export function coursesForSkill(skill: string, slugs?: string[]): string[] {
  const key = norm(skill)
  if (!key) return []
  const pool = slugs || ACADEMY.map(c => c.slug)
  return pool.filter(slug => courseMeta(slug).skills.some(s => {
    const candidate = norm(s)
    return candidate === key || candidate.includes(key) || key.includes(candidate)
  }))
}
