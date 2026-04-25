'use client'

import { useState } from 'react'

const TALENT_STEPS = [
  { num: '01', title: 'Create Your Profile', desc: 'Build a detailed profile with your skills, qualifications, product house experience, and career preferences.' },
  { num: '02', title: 'Get Matched', desc: 'Our intelligent algorithm scores you against live roles — weighted by role level, brand knowledge, location, and more.' },
  { num: '03', title: 'Land Your Role', desc: 'Apply with a single tap, message employers directly, and secure your next position at a prestigious property.' },
]

const EMPLOYER_STEPS = [
  { num: '01', title: 'Post a Role', desc: 'Create a detailed listing with required skills, product houses, qualifications, and location. Set your tier for maximum visibility.' },
  { num: '02', title: 'Review Matches', desc: 'Our matching engine surfaces the best candidates — ranked by fit, with full breakdowns so you can compare with confidence.' },
  { num: '03', title: 'Hire with Confidence', desc: 'Shortlist, message, and connect with verified professionals. Every candidate profile is reviewed before going live.' },
]

export default function HomepageHowItWorks() {
  const [view, setView] = useState<'talent' | 'employer'>('talent')
  const steps = view === 'talent' ? TALENT_STEPS : EMPLOYER_STEPS

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-1 mb-10">
        <button type="button" onClick={() => setView('talent')}
          className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${view === 'talent' ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink'}`}>
          For Talent
        </button>
        <button type="button" onClick={() => setView('employer')}
          className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all ${view === 'employer' ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink'}`}>
          For Employers
        </button>
      </div>

      {/* Steps — vertically stacked */}
      <div className="flex flex-col gap-8">
        {steps.map((step) => (
          <div key={step.num} className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: '#C9A96E' }}>
              <span className="text-[14px] font-semibold" style={{ color: '#C9A96E' }}>{step.num}</span>
            </div>
            <div className="pt-2">
              <h3 className="text-[17px] font-medium text-ink mb-2">{step.title}</h3>
              <p className="text-[14px] text-secondary leading-[1.7]">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
