'use client'

// Explained match for signed-in talent on a role page. Not a mystery
// percentage: what aligns, where the honest gaps are, and what genuinely
// strengthens an application. Renders nothing for signed-out visitors,
// employers, or anyone without a candidate profile.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  roleLevel: 'Career level',
  treatmentSkills: 'Treatment skills',
  brands: 'Product house experience',
  qualifications: 'Qualifications',
  experience: 'Experience',
  businessSkills: 'Leadership and business skills',
  systems: 'Booking systems',
  location: 'Location',
  salaryFit: 'Salary alignment',
  availability: 'Availability',
  proficiencyDepth: 'Skill depth',
  profileCompleteness: 'Profile completeness',
}

type CourseSuggestion = { skill: string; slug: string | null; title: string | null }
type MatchData = {
  score: number
  label: string
  breakdown: Record<string, number>
  matchingSkills: string[]
  missingRequiredSkills: string[]
  mode: string
  courseSuggestions?: CourseSuggestion[]
}

export default function JobMatchPanel({ jobId }: { jobId: string }) {
  const [data, setData] = useState<MatchData | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/talent/job-match?job=${encodeURIComponent(jobId)}`)
        if (!res.ok) return
        const body = await res.json()
        if (active && typeof body.score === 'number' && body.breakdown) setData(body)
      } catch { /* signed out or offline: show nothing */ }
    })()
    return () => { active = false }
  }, [jobId])

  if (!data) return null

  const entries = Object.entries(data.breakdown)
    .filter(([key, value]) => CATEGORY_LABELS[key] && typeof value === 'number' && value >= 0)
  const strengths = entries.filter(([, value]) => value >= 70).sort((a, b) => b[1] - a[1])
  const gaps = entries.filter(([, value]) => value < 60).sort((a, b) => a[1] - b[1]).slice(0, 4)
  const gapKeys = new Set(gaps.map(([key]) => key))
  const suggestions = data.courseSuggestions || []

  const actions: React.ReactNode[] = []
  if ((gapKeys.has('treatmentSkills') || data.missingRequiredSkills.length > 0) && suggestions.length > 0) {
    for (const suggestion of suggestions) {
      actions.push(<li key={`skill-${suggestion.skill}`}>
        Add {suggestion.skill} to your profile if you have it{suggestion.slug && suggestion.title ? <>, or take <Link href={`/talent/academy/${suggestion.slug}`} className="font-semibold text-[#0b2f4d] underline">{suggestion.title}</Link> in the Academy</> : null}.
      </li>)
    }
  }
  if (gapKeys.has('qualifications')) actions.push(<li key="qualifications">
    <Link href="/talent/profile" className="font-semibold text-[#0b2f4d] underline">Add your qualifications</Link> and have your certificates <Link href="/talent/verification" className="font-semibold text-[#0b2f4d] underline">verified</Link>. Verified credentials carry real weight with employers.
  </li>)
  if (gapKeys.has('proficiencyDepth')) actions.push(<li key="proficiencyDepth">
    <Link href="/talent/profile" className="font-semibold text-[#0b2f4d] underline">Complete your skill proficiency levels</Link> so this employer can see the depth behind each skill.
  </li>)
  if (gapKeys.has('brands')) actions.push(<li key="brands">
    Add the product houses you have trained with to <Link href="/talent/profile" className="font-semibold text-[#0b2f4d] underline">your profile</Link>. Brand training you already hold may be the missing piece here.
  </li>)
  if (gapKeys.has('profileCompleteness')) actions.push(<li key="profileCompleteness">
    <Link href="/talent/profile" className="font-semibold text-[#0b2f4d] underline">Complete your profile</Link>. Employers see more of your story when there is more story to see.
  </li>)
  if (gapKeys.has('location')) actions.push(<li key="location">
    This role sits outside your usual travel range. That is a fact worth weighing honestly, not something to work around.
  </li>)
  if (gapKeys.has('salaryFit')) actions.push(<li key="salaryFit">
    The advertised salary sits below your stated expectation. Only you can judge whether the wider package closes that gap.
  </li>)
  if (gapKeys.has('experience')) actions.push(<li key="experience">
    The employer asked for more years of experience than your profile shows. Evidence of real responsibility can count for a lot, but be straightforward about where you are.
  </li>)

  return <div className="border border-[#e5e5e5] bg-white p-5">
    <p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Your match with this role</p>
    <div className="flex items-baseline gap-3 mt-3">
      <span className="text-[44px] leading-none font-semibold tracking-[-.03em] text-[#0b2f4d]">{data.score}%</span>
      <span className="text-[13px] font-semibold text-[#10283b]">{data.label}</span>
    </div>

    {strengths.length > 0 && <div className="mt-5 border-t border-[#e5e5e5] pt-4">
      <p className="text-[10px] uppercase tracking-[.14em] font-semibold text-[#10283b]">Strong alignment</p>
      <ul className="mt-2 space-y-1.5">
        {strengths.map(([key]) => <li key={key} className="text-[12px] leading-5 text-[#4d4d4d] pl-3 border-l-2 border-[#0b2f4d]">{CATEGORY_LABELS[key]}</li>)}
      </ul>
    </div>}

    {gaps.length > 0 && <div className="mt-5 border-t border-[#e5e5e5] pt-4">
      <p className="text-[10px] uppercase tracking-[.14em] font-semibold text-[#10283b]">Potential gaps</p>
      <ul className="mt-2 space-y-1.5">
        {gaps.map(([key]) => <li key={key} className="text-[12px] leading-5 text-[#4d4d4d] pl-3 border-l-2 border-[#c7ced3]">{CATEGORY_LABELS[key]}</li>)}
      </ul>
    </div>}

    {actions.length > 0 && <div className="mt-5 border-t border-[#e5e5e5] pt-4">
      <p className="text-[10px] uppercase tracking-[.14em] font-semibold text-[#10283b]">How to strengthen your application</p>
      <ul className="mt-2 space-y-2 text-[12px] leading-5 text-[#4d4d4d] list-none">{actions}</ul>
      <p className="text-[11px] leading-5 text-[#7d8990] mt-3">Honest development, not box-ticking: only add skills and experience you genuinely hold.</p>
    </div>}
  </div>
}
