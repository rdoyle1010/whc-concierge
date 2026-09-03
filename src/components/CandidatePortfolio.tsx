import { BadgeCheck, Star } from 'lucide-react'
import type { CareerValueDimension } from '@/lib/career-value'
import { candidateBadges } from '@/lib/verification-badges'

// The candidate portfolio: a private professional portfolio, set in the same
// flat editorial language as the public destination pages - eyebrows, ruled
// lists, serif fact values, generous whitespace. Purely presentational: all
// data arrives through props and every section renders only when it has
// real content.

export type PortfolioAcademyEntry = { course_slug: string; title: string; completed_at: string | null }
export type PortfolioReview = { id: string; rating: number; text?: string | null; created_at?: string | null }

type Props = {
  candidate: any
  academy: PortfolioAcademyEntry[]
  reviews: PortfolioReview[]
  careerValue: CareerValueDimension[]
  manualVerifications?: string[]
}

const asList = (value: any): string[] =>
  Array.isArray(value) ? value.map(item => String(item ?? '').trim()).filter(Boolean) : []

const dedupe = (values: string[]): string[] => {
  const seen = new Set<string>()
  return values.filter(value => {
    const key = value.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function displayName(candidate: any): string {
  const full = String(candidate?.full_name || '').trim()
  if (!full) return 'Talent House professional'
  if (!candidate?.show_first_name_only) return full
  const parts = full.split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

function formatDate(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// career_evidence is stored as free text (one statement per line) but is
// defensive about an array arriving instead.
function evidenceLines(raw: any): string[] {
  if (Array.isArray(raw)) return asList(raw)
  return String(raw || '').split(/\r?\n/).map(line => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
}

function normaliseAwards(raw: any): Array<{ name: string; year: string | null }> {
  if (!Array.isArray(raw)) return []
  return raw.map((item: any) => {
    if (typeof item === 'string' && item.trim()) return { name: item.trim(), year: null }
    if (item && typeof item === 'object') {
      const name = item.name || item.title || item.award
      if (typeof name !== 'string' || !name.trim()) return null
      return { name: name.trim(), year: item.year != null && item.year !== '' ? String(item.year) : null }
    }
    return null
  }).filter(Boolean) as Array<{ name: string; year: string | null }>
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-accent">{children}</p>
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">{children}</p>
}

// Quiet ruled columns, borrowed from the destination page treatment. When a
// proficiency level exists for a row it sits right-aligned against the skill.
function QuietList({ items, levels }: { items: string[]; levels?: Record<string, string> }) {
  return (
    <div className="max-w-4xl">
      <ul className="columns-2 md:columns-3 gap-x-10">
        {items.map(item => {
          const level = levels?.[item]
          return (
            <li key={item} className="break-inside-avoid border-t border-border py-2.5 pr-4 text-[13px] leading-5 text-body">
              {level ? (
                <span className="flex items-baseline justify-between gap-4">
                  <span>{item}</span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[.1em] text-muted">{level}</span>
                </span>
              ) : item}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-x-8 gap-y-1 border-t border-border py-4">
      <dt className="w-44 shrink-0 text-[11px] uppercase tracking-[.12em] text-muted pt-1">{label}</dt>
      <dd className="text-[14px] leading-6 text-ink">{value}</dd>
    </div>
  )
}

export default function CandidatePortfolio({ candidate, academy, reviews, careerValue, manualVerifications = [] }: Props) {
  if (!candidate) return null

  const name = displayName(candidate)
  const availabilityDate = formatDate(candidate.availability_date)
  const availability = candidate.availability_status
    ? `${candidate.availability_status}${availabilityDate ? ` from ${availabilityDate}` : ''}`
    : null
  const heroMeta = [
    candidate.role_level,
    candidate.location,
    availability,
    candidate.experience_years ? `${candidate.experience_years} years experience` : null,
  ].filter(Boolean) as string[]

  const verifications = candidateBadges(candidate, manualVerifications)

  const luxuryBrands = dedupe([...asList(candidate.hotel_brands_worked), ...asList(candidate.product_houses)])
  const evidence = evidenceLines(candidate.career_evidence)
  const awards = normaliseAwards(candidate.awards)

  const teamSize = Number(candidate.team_size_managed) || 0
  const commercialFacts = [
    candidate.revenue_responsibility ? { label: 'Revenue responsibility', value: String(candidate.revenue_responsibility) } : null,
    teamSize > 0 ? { label: 'Largest team led', value: `Team of ${teamSize}` } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const proficiencies: Record<string, string> =
    candidate.skill_proficiencies && typeof candidate.skill_proficiencies === 'object' && !Array.isArray(candidate.skill_proficiencies)
      ? Object.fromEntries(Object.entries(candidate.skill_proficiencies).map(([skill, level]) => [String(skill), String(level ?? '').trim()]).filter(([, level]) => level))
      : {}

  const skillGroups = [
    { label: 'Treatments', items: dedupe(asList(candidate.treatment_skills)) },
    { label: 'Services', items: dedupe(asList(candidate.services_offered)) },
    { label: 'Business skills', items: dedupe(asList(candidate.business_skills)) },
    { label: 'Systems', items: dedupe(asList(candidate.systems_experience)) },
  ].filter(group => group.items.length > 0)

  const qualifications = dedupe(asList(candidate.qualifications))
  const completions = (academy || []).filter(entry => entry.completed_at)

  const languages = asList(candidate.languages)
  const desiredRoles = asList(candidate.desired_roles)
  const employmentTypes = asList(candidate.employment_types_wanted)
  const locationPreferences = asList(candidate.location_preferences)
  const mobilityParts = [
    candidate.willing_to_relocate ? 'Open to relocation' : null,
    candidate.travel_radius_miles ? `Travels up to ${candidate.travel_radius_miles} miles` : null,
    locationPreferences.length ? `Preferred areas: ${locationPreferences.join(', ')}` : null,
  ].filter(Boolean) as string[]

  const preferenceRows = [
    languages.length ? { label: 'Languages', value: languages.join(' · ') } : null,
    desiredRoles.length ? { label: 'Preferred roles', value: desiredRoles.join(' · ') } : null,
    employmentTypes.length ? { label: 'Employment types', value: employmentTypes.join(' · ') } : null,
    mobilityParts.length ? { label: 'Mobility', value: mobilityParts.join(' · ') } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const validReviews = (reviews || []).filter(review => Number(review.rating) >= 1 && Number(review.rating) <= 5)
  const reviewAverage = validReviews.length
    ? Math.round((validReviews.reduce((sum, review) => sum + Number(review.rating), 0) / validReviews.length) * 10) / 10
    : null

  return (
    <div className="bg-white border border-border">
      {/* Hero */}
      <header className="px-6 md:px-10 pt-10 md:pt-14 pb-10">
        <div className="flex flex-col sm:flex-row gap-7 md:gap-10">
          {candidate.profile_image_url && (
            <div className="h-32 w-32 md:h-40 md:w-40 shrink-0 overflow-hidden border border-border bg-surface">
              <img decoding="async" src={candidate.profile_image_url} alt={name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <Eyebrow>Professional portfolio</Eyebrow>
            <h1 className="mt-3 font-serif text-[34px] md:text-[44px] font-semibold leading-[1.05] tracking-[-.02em] text-ink">{name}</h1>
            {candidate.headline && <p className="mt-3 text-[15px] leading-7 text-secondary max-w-2xl">{candidate.headline}</p>}
            {heroMeta.length > 0 && (
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
                {heroMeta.map((item, index) => (
                  <span key={item} className="inline-flex items-center gap-3">
                    {index > 0 && <span className="text-border" aria-hidden>·</span>}
                    {item}
                  </span>
                ))}
              </p>
            )}
            {verifications.length > 0 && (
              <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {verifications.map(badge => badge.key === 'agency_ready' ? (
                  <span key={badge.key} className="inline-flex items-center gap-1.5 bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white">
                    <BadgeCheck size={12} />{badge.label}
                  </span>
                ) : (
                  <span key={badge.key} className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-accent">
                    <BadgeCheck size={12} />{badge.label}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="px-6 md:px-10 pb-10 md:pb-14">
        {/* Career value */}
        {careerValue.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Career value</Eyebrow>
            <p className="mt-3 text-[12px] italic leading-6 text-muted max-w-2xl">Derived from the verified data on this profile, not self-assessed.</p>
            <div className="mt-7 max-w-3xl">
              {careerValue.map(entry => (
                <div key={entry.dimension} className="border-t border-border py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <p className="text-[14px] text-ink">{entry.dimension}</p>
                    <p className="font-serif text-[16px] font-semibold text-accent">{entry.rating}</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{entry.basis}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Professional summary */}
        {candidate.bio && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Professional summary</Eyebrow>
            <p className="mt-6 text-[15px] leading-8 text-body max-w-3xl whitespace-pre-line">{candidate.bio}</p>
          </section>
        )}

        {/* Luxury brands */}
        {luxuryBrands.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Luxury brands</Eyebrow>
            <p className="mt-5 text-[19px] md:text-[22px] font-serif font-semibold text-ink leading-relaxed max-w-3xl">
              {luxuryBrands.join('  ·  ')}
            </p>
          </section>
        )}

        {/* Career evidence */}
        {evidence.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Career evidence</Eyebrow>
            <p className="mt-3 text-[12px] leading-6 text-muted max-w-2xl">Statements drawn from this professional&apos;s own career record.</p>
            <div className="mt-7 max-w-3xl border-l-2 border-accent pl-6 md:pl-8">
              {evidence.map((line, index) => (
                <p key={`${index}-${line.slice(0, 24)}`} className={`py-2.5 text-[14px] leading-7 text-body ${index > 0 ? 'border-t border-border' : ''}`}>{line}</p>
              ))}
            </div>
          </section>
        )}

        {/* Commercial and management */}
        {(commercialFacts.length > 0 || candidate.commercial_experience || awards.length > 0) && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Commercial and management</Eyebrow>
            {commercialFacts.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-4xl">
                {commercialFacts.map(fact => (
                  <div key={fact.label} className="border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-[.14em] text-muted">{fact.label}</p>
                    <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}
            {candidate.commercial_experience && (
              <p className="mt-8 text-[14px] leading-7 text-body max-w-3xl whitespace-pre-line">{candidate.commercial_experience}</p>
            )}
            {awards.length > 0 && (
              <div className="mt-8 max-w-3xl">
                <GroupLabel>Awards</GroupLabel>
                <div className="mt-3">
                  {awards.map((award, index) => (
                    <div key={`${award.name}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border py-3.5">
                      <p className="text-[15px] font-serif font-semibold text-ink">{award.name}</p>
                      {award.year && <p className="text-[13px] text-secondary">{award.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Skill profile */}
        {skillGroups.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Skill profile</Eyebrow>
            {skillGroups.map(group => (
              <div key={group.label} className="mt-8 first-of-type:mt-7">
                <GroupLabel>{group.label}</GroupLabel>
                <div className="mt-3"><QuietList items={group.items} levels={proficiencies} /></div>
              </div>
            ))}
          </section>
        )}

        {/* Qualifications and Academy */}
        {(qualifications.length > 0 || completions.length > 0) && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Qualifications and Academy</Eyebrow>
            {qualifications.length > 0 && (
              <div className="mt-7">
                <GroupLabel>Qualifications</GroupLabel>
                <div className="mt-3"><QuietList items={qualifications} /></div>
              </div>
            )}
            {completions.length > 0 && (
              <div className={qualifications.length > 0 ? 'mt-8 max-w-3xl' : 'mt-7 max-w-3xl'}>
                <GroupLabel>Talent House Academy</GroupLabel>
                <div className="mt-3">
                  {completions.map(entry => {
                    const completed = formatDate(entry.completed_at)
                    return (
                      <div key={entry.course_slug} className="border-t border-border py-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <p className="text-[15px] font-serif font-semibold text-ink">{entry.title}</p>
                          {completed && <p className="text-[12px] text-secondary">{completed}</p>}
                        </div>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-accent">
                          <BadgeCheck size={11} />Talent House Academy - verified completion
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Languages, preferences and mobility */}
        {preferenceRows.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <Eyebrow>Working preferences</Eyebrow>
            <dl className="mt-7 max-w-3xl">
              {preferenceRows.map(row => <FactRow key={row.label} label={row.label} value={row.value} />)}
            </dl>
          </section>
        )}

        {/* Reviews */}
        {validReviews.length > 0 && (
          <section className="border-t border-border py-10 md:py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <Eyebrow>Verified reviews</Eyebrow>
                <p className="mt-3 text-[12px] leading-6 italic text-muted max-w-2xl">
                  Feedback from employers this professional has worked with through Talent House.
                </p>
              </div>
              {reviewAverage != null && (
                <div className="md:text-right shrink-0">
                  <p className="text-[34px] font-serif font-semibold text-ink leading-none">{reviewAverage.toFixed(1)}<span className="text-[15px] text-muted font-sans font-normal"> / 5</span></p>
                  <p className="mt-2 text-[11px] text-muted">{validReviews.length} verified review{validReviews.length === 1 ? '' : 's'}</p>
                </div>
              )}
            </div>
            <div className="mt-9 grid md:grid-cols-2 gap-x-14 gap-y-10">
              {validReviews.slice(0, 4).map(review => (
                <article key={review.id} className="border-t border-border pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={13} className={n <= Number(review.rating) ? 'text-accent' : 'text-border'} fill={n <= Number(review.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-accent"><BadgeCheck size={12} />Verified</span>
                  </div>
                  {review.text && <p className="mt-4 text-[14px] leading-7 text-body">&ldquo;{review.text}&rdquo;</p>}
                  {review.created_at && (
                    <p className="mt-3 text-[11px] text-muted">{new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
