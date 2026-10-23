'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { LANGUAGES, FLUENCY_LEVELS, parseLanguageSkills, fluencyLabel, type Fluency, type LanguageSkill } from '@/lib/languages'

// Languages spoken, with fluency. Never nationality.
//
// A property with Gulf guests needs Arabic; a Cotswolds hotel taking French
// coach parties needs French. That is a genuine occupational requirement and
// lawful to ask about. Nationality is a protected characteristic and answers a
// question nobody is allowed to ask - the profile already carries right to
// work, which is the lawful version of what an employer actually needs to know.

export default function LanguagePicker({
  value, onChange,
}: { value: unknown; onChange: (skills: LanguageSkill[]) => void }) {
  const skills = useMemo(() => parseLanguageSkills(value), [value])
  const [code, setCode] = useState('')
  const [fluency, setFluency] = useState<Fluency>('fluent')

  const taken = new Set(skills.map(skill => skill.code))
  const available = LANGUAGES.filter(language => !taken.has(language.code))

  function add() {
    if (!code) return
    const language = LANGUAGES.find(item => item.code === code)
    if (!language) return
    onChange([...skills, { code: language.code, label: language.label, fluency }])
    setCode('')
  }

  return (
    <div>
      {skills.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {skills.map(skill => (
            <li key={skill.code} className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-[12px]">
              <span className="font-medium text-ink">{skill.label}</span>
              <span className="text-muted">{fluencyLabel(skill.fluency)}</span>
              <button
                type="button" aria-label={`Remove ${skill.label}`}
                onClick={() => onChange(skills.filter(item => item.code !== skill.code))}
                className="text-muted hover:text-ink"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="language-code">Language</label>
        <select id="language-code" value={code} onChange={event => setCode(event.target.value)} className="input-field flex-1">
          <option value="">Add a language...</option>
          {available.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
        </select>

        <label className="sr-only" htmlFor="language-fluency">Fluency</label>
        <select id="language-fluency" value={fluency} onChange={event => setFluency(event.target.value as Fluency)} className="input-field sm:w-52">
          {FLUENCY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
        </select>

        <button type="button" onClick={add} disabled={!code} className="btn-secondary inline-flex items-center justify-center gap-1.5 text-[12px] disabled:opacity-40">
          <Plus size={13} /> Add
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-muted">
        {FLUENCY_LEVELS.map(level => `${level.label}: ${level.hint}`).join(' · ')}
      </p>
    </div>
  )
}
