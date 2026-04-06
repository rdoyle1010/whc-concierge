'use client'

import { calculateProfileStrength, PROFILE_FIELDS } from '@/lib/profile-strength'
import { Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const STEP_MAP: Record<string, number> = {
  full_name: 1, email: 1, phone: 1, role_level: 1, experience: 1, bio: 1,
  transport_method: 2, location_preferences: 2, shift_preferences: 2,
  treatment_skills: 3, business_skills: 4, systems: 5, product_houses: 6,
  qualifications: 7, brands: 8, photo: 1,
}

export default function ProfileStrength({ profile }: { profile: any }) {
  const { score, missing, nudge } = calculateProfileStrength(profile)

  const colour = score >= 80 ? '#22C55E' : score >= 50 ? '#C9A96E' : '#E5E5E3'

  // Build quick-link buttons for incomplete sections
  const missingSteps = new Map<number, string>()
  for (const field of PROFILE_FIELDS) {
    if (missing.includes(field.label)) {
      const step = STEP_MAP[field.key] || 1
      if (!missingSteps.has(step)) missingSteps.set(step, field.label)
    }
  }

  const STEP_LABELS: Record<number, string> = {
    1: 'Basic Info', 2: 'Logistics', 3: 'Treatment Skills', 4: 'Business Skills',
    5: 'Systems', 6: 'Product Houses', 7: 'Qualifications', 8: 'Brand Experience',
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-medium text-ink">Profile Strength</p>
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#F5F4F2" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={colour} strokeWidth="3" strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-ink">{score}%</span>
        </div>
      </div>

      {/* Nudge */}
      <p className="text-[12px] text-secondary leading-relaxed mb-4">{nudge}</p>

      {/* Checklist */}
      <div className="space-y-1.5 mb-4">
        {PROFILE_FIELDS.map(f => {
          const done = !missing.includes(f.label)
          return (
            <div key={f.key} className="flex items-center gap-2">
              {done ? <Check size={12} className="text-success shrink-0" /> : <div className="w-3 h-3 border border-border rounded-sm shrink-0" />}
              <span className={`text-[12px] ${done ? 'text-muted line-through' : 'text-ink'}`}>{f.label}</span>
              <span className="text-[10px] text-muted ml-auto">{f.weight}%</span>
            </div>
          )
        })}
      </div>

      {/* Quick links to incomplete sections */}
      {missingSteps.size > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          {Array.from(missingSteps.entries()).slice(0, 3).map(([step, _label]) => (
            <Link key={step} href={`/talent/onboarding?step=${step}`}
              className="text-[11px] font-medium text-accent bg-[#FDF6EC] border border-accent/20 px-2.5 py-1 rounded-full hover:bg-accent/10 transition-colors flex items-center gap-1">
              {STEP_LABELS[step] || `Step ${step}`} <ArrowRight size={10} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
