'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type BreakdownData = {
  roleLevel: number
  treatmentSkills: number
  brands: number
  qualifications: number
  experience: number
  businessSkills: number
  systems: number
  location: number
  shiftCompatibility: number
  transport: number
  accommodation: number
  proficiencyDepth: number
  profileCompleteness: number
  reviewScore: number
}

const CATEGORIES: { key: keyof BreakdownData; label: string; weight: number }[] = [
  { key: 'roleLevel', label: 'Role Level', weight: 12 },
  { key: 'treatmentSkills', label: 'Treatment Skills', weight: 10 },
  { key: 'proficiencyDepth', label: 'Skill Depth', weight: 8 },
  { key: 'brands', label: 'Product Houses', weight: 8 },
  { key: 'qualifications', label: 'Qualifications', weight: 8 },
  { key: 'location', label: 'Location', weight: 8 },
  { key: 'experience', label: 'Experience', weight: 7 },
  { key: 'businessSkills', label: 'Business Skills', weight: 6 },
  { key: 'systems', label: 'Systems', weight: 5 },
  { key: 'shiftCompatibility', label: 'Shift Fit', weight: 5 },
  { key: 'transport', label: 'Transport', weight: 4 },
  { key: 'accommodation', label: 'Accommodation', weight: 3 },
  { key: 'profileCompleteness', label: 'Profile', weight: 3 },
  { key: 'reviewScore', label: 'Reviews', weight: 3 },
]

function barColour(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#C9A96E'
  if (score >= 40) return '#D97706'
  return '#E5E5E3'
}

function barLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Partial'
  if (score > 0) return 'Low'
  return '\u2014'
}

export default function MatchBreakdown({
  breakdown,
  score,
  label,
  colour,
  compact = false,
}: {
  breakdown: BreakdownData
  score: number
  label: string
  colour: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(!compact)

  // Sort categories by weighted contribution (score × weight), highest first
  const sorted = [...CATEGORIES].sort((a, b) => {
    const aContrib = (breakdown[a.key] || 0) * a.weight
    const bContrib = (breakdown[b.key] || 0) * b.weight
    return bContrib - aContrib
  })

  // Top 3 strengths and weaknesses
  const strengths = sorted.filter(c => (breakdown[c.key] || 0) >= 70).slice(0, 3)
  const gaps = [...CATEGORIES]
    .filter(c => (breakdown[c.key] || 0) < 60)
    .sort((a, b) => (breakdown[a.key] || 0) - (breakdown[b.key] || 0))
    .slice(0, 3)

  if (compact) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-[12px] text-muted hover:text-ink w-full"
        >
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          Match breakdown
          <span className="ml-auto text-[11px] font-semibold" style={{ color }}>{score}% {label}</span>
        </button>

        {open && (
          <div className="mt-3 space-y-1.5 animate-fade-in">
            {sorted.map(cat => {
              const val = breakdown[cat.key] || 0
              return (
                <div key={cat.key} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-[80px] shrink-0 text-right">{cat.label}</span>
                  <div className="flex-1 h-[6px] bg-[#F5F4F2] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${val}%`, backgroundColor: barColour(val) }}
                    />
                  </div>
                  <span className="text-[10px] text-muted w-[28px] text-right">{val}%</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Full layout (for match page expanded view or standalone)
  return (
    <div className="space-y-4">
      {/* Score ring + summary */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#F5F4F2" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="16" fill="none" stroke={colour} strokeWidth="2.5"
              strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-ink">{score}%</span>
        </div>
        <div>
          <p className="text-[14px] font-medium text-ink">{label}</p>
          <p className="text-[12px] text-muted leading-relaxed">
            {strengths.length > 0 && `Strong on ${strengths.map(s => s.label.toLowerCase()).join(', ')}.`}
            {gaps.length > 0 && ` Gaps in ${gaps.map(g => g.label.toLowerCase()).join(', ')}.`}
          </p>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-2">
        {sorted.map(cat => {
          const val = breakdown[cat.key] || 0
          return (
            <div key={cat.key} className="flex items-center gap-2.5">
              <span className="text-[11px] text-muted w-[90px] shrink-0 text-right">{cat.label}</span>
              <div className="flex-1 h-[8px] bg-[#F5F4F2] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${val}%`, backgroundColor: barColour(val) }}
                />
              </div>
              <span className="text-[10px] text-muted w-[52px] text-right">{barLabel(val)}</span>
            </div>
          )
        })}
      </div>

      {/* Weight hint */}
      <p className="text-[10px] text-muted pt-1 border-t border-border">
        Weighted across {CATEGORIES.length} factors. Bars sorted by contribution to your overall score.
      </p>
    </div>
  )
}
