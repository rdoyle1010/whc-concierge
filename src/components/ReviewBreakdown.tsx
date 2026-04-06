'use client'

import { Star } from 'lucide-react'

const CRITERIA_LABELS: Record<string, string> = {
  professionalism: 'Professionalism',
  punctuality: 'Punctuality',
  communication: 'Communication',
  skillLevel: 'Skill Level',
  reliability: 'Reliability',
  overallExperience: 'Overall Experience',
}

function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function ReviewBreakdown({ criteriaScores }: { criteriaScores: Record<string, number> }) {
  if (!criteriaScores || Object.keys(criteriaScores).length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {Object.entries(criteriaScores).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted truncate">{CRITERIA_LABELS[key] || key}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <MiniStars rating={value} />
            <span className="text-[11px] font-medium text-ink w-3 text-right">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
