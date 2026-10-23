'use client'

import { useState } from 'react'
import { PRODUCT_HOUSES, QUALIFICATIONS, ROLE_LEVELS, SYSTEMS } from '@/lib/constants'

// The draft, before it is anybody's profile.
//
// Every field here is editable and nothing is saved until somebody presses the
// button. That is the whole design: a suggestion a person approves is not an
// automated decision about somebody's employment, and this is a regulated
// subject where that distinction is the difference between defensible and not.

export type Reading = {
  full_name: string | null
  headline: string | null
  role_level: string | null
  experience_years: number | null
  bio: string | null
  product_houses: string[]
  systems_experience: string[]
  qualifications: string[]
  treatment_skills: string[]
  business_skills: string[]
  languages: string[]
  current_employer: string | null
  hotel_brands: string[]
  location: string | null
  gaps: string[]
}

export default function CvReadingReview({ reading, onChange, onSave, saving }: {
  reading: Reading
  onChange: (next: Reading) => void
  onSave: () => void
  saving: boolean
}) {
  const [skillText, setSkillText] = useState(reading.treatment_skills.join(', '))
  const [brandText, setBrandText] = useState(reading.hotel_brands.join(', '))
  const [businessText, setBusinessText] = useState(reading.business_skills.join(', '))
  const [languageText, setLanguageText] = useState(reading.languages.join(', '))

  const set = (patch: Partial<Reading>) => onChange({ ...reading, ...patch })

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-[13px] font-semibold text-ink">Read from the CV. Correct anything wrong before saving.</p>
      <p className="mt-1 text-[11.5px] text-muted">
        Nothing is saved until you press the button, and nothing is visible to any property until they say so.
      </p>

      {reading.gaps.length > 0 && (
        <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-amber-900">What the CV does not say</p>
          <ul className="mt-1.5 space-y-1">
            {reading.gaps.map(gap => (
              <li key={gap} className="text-[12px] text-amber-800">{gap}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Text label="Full name" value={reading.full_name} onChange={v => set({ full_name: v })} />
        <Text label="Location" value={reading.location} onChange={v => set({ location: v })} />
        <Text label="Headline" value={reading.headline} onChange={v => set({ headline: v })} full />
        <Text label="Where they work now" value={reading.current_employer} onChange={v => set({ current_employer: v })} />
        <Choice label="Role level" value={reading.role_level} options={[...ROLE_LEVELS]} onChange={v => set({ role_level: v })} />
        <div>
          <label className="block text-[12px] font-semibold text-ink">Years of experience</label>
          <input type="number" min={0} max={60} value={reading.experience_years ?? ''}
            onChange={e => set({ experience_years: e.target.value === '' ? null : Number(e.target.value) })}
            className="input-field mt-1 w-full" />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-[12px] font-semibold text-ink">Bio</label>
        <textarea rows={5} value={reading.bio ?? ''} onChange={e => set({ bio: e.target.value })}
          className="input-field mt-1 w-full text-[13px]" />
      </div>

      <Tags label="Product houses" all={[...PRODUCT_HOUSES]} chosen={reading.product_houses}
        onChange={v => set({ product_houses: v })} />
      <Tags label="Systems" all={[...SYSTEMS]} chosen={reading.systems_experience}
        onChange={v => set({ systems_experience: v })} />
      <Tags label="Qualifications" all={[...QUALIFICATIONS]} chosen={reading.qualifications}
        onChange={v => set({ qualifications: v })} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-[12px] font-semibold text-ink">
            Treatments (comma separated)
            <span className="ml-2 font-normal text-[11px] text-muted">This is what the matching runs on, so it matters most</span>
          </label>
          <input value={skillText}
            onChange={e => { setSkillText(e.target.value); set({ treatment_skills: split(e.target.value) }) }}
            className="input-field mt-1 w-full" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ink">Properties and groups (comma separated)</label>
          <input value={brandText}
            onChange={e => { setBrandText(e.target.value); set({ hotel_brands: split(e.target.value) }) }}
            className="input-field mt-1 w-full" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ink">Business skills (comma separated)</label>
          <input value={businessText}
            onChange={e => { setBusinessText(e.target.value); set({ business_skills: split(e.target.value) }) }}
            className="input-field mt-1 w-full" />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ink">Languages (comma separated)</label>
          <input value={languageText}
            onChange={e => { setLanguageText(e.target.value); set({ languages: split(e.target.value) }) }}
            className="input-field mt-1 w-full" />
        </div>
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
        Photographs, insurance, right to work, rates and availability are not on a CV. Add those in
        their workspace after saving, or leave them for the person to finish.
      </p>

      <button type="button" onClick={onSave} disabled={saving}
        className="btn-primary mt-5 px-5 py-2 text-[13px] disabled:opacity-50">
        {saving ? 'Saving...' : 'Save this to their profile'}
      </button>
    </div>
  )
}

const split = (value: string) =>
  value.split(',').map(part => part.trim()).filter(Boolean)

function Text({ label, value, onChange, full = false }: {
  label: string; value: string | null; onChange: (value: string) => void; full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-[12px] font-semibold text-ink">{label}</label>
      <input value={value ?? ''} onChange={e => onChange(e.target.value)} className="input-field mt-1 w-full" />
    </div>
  )
}

function Choice({ label, value, options, onChange }: {
  label: string; value: string | null; options: string[]; onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-ink">{label}</label>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="input-field mt-1 w-full">
        <option value="">Not known</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

// Shown as the whole vocabulary with the found ones ticked, rather than a list
// of what was found. Seeing that ESPA is not ticked is how somebody remembers
// to ask about it.
function Tags({ label, all, chosen, onChange }: {
  label: string; all: string[]; chosen: string[]; onChange: (value: string[]) => void
}) {
  return (
    <div className="mt-4">
      <label className="block text-[12px] font-semibold text-ink">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {all.map(option => {
          const on = chosen.includes(option)
          return (
            <button key={option} type="button"
              onClick={() => onChange(on ? chosen.filter(value => value !== option) : [...chosen, option])}
              className={`border px-2.5 py-1 text-[11.5px] ${on ? 'border-[#166534] bg-[#f3fbf5] text-[#166534] font-semibold' : 'border-border text-secondary'}`}>
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
