/**
 * The button under each hero slide.
 *
 * Every slide carried the same one: Post a Role. Five different arguments,
 * five different people being spoken to, and one door out of all of them - so
 * a therapist reading "Precision matching, not guesswork" was invited to post
 * a job, and four of the five revenue lines had no way in from the front page
 * at all.
 *
 * A slide can name its own button in the website editor. Where it has not,
 * these are used by position, so the five slides on the site today each get
 * the right door without anybody editing anything. They are defaults, not
 * rules: set a label and a link on a slide and that wins.
 */
export type SlideCta = { label: string; href: string }

export const DEFAULT_SLIDE_CTAS: SlideCta[] = [
  { label: 'Post a role', href: '/register/employer' },
  { label: 'Create your free profile', href: '/register/talent' },
  { label: 'Explore residencies', href: '/residency' },
  { label: 'Visit the Academy', href: '/academy' },
  { label: 'Find a consultant', href: '/consultancy' },
]

export function slideCta(
  slide: { ctaLabel?: string; ctaHref?: string } | undefined,
  index: number,
  fallback: SlideCta,
): SlideCta {
  const label = String(slide?.ctaLabel || '').trim()
  const href = String(slide?.ctaHref || '').trim()
  // Both, or neither. A label with no link is a button that goes nowhere, and
  // a link with no label is a button nobody can read.
  if (label && href) return { label, href }
  return DEFAULT_SLIDE_CTAS[index] || fallback
}
