'use client'

import { countriesByRegion, DEFAULT_COUNTRY } from '@/lib/countries'

// One select, grouped by region rather than alphabetically, because a list
// that opens on Antigua is a list nobody reads to the bottom of. The markets
// that actually hire - the UK, Europe, the Gulf, the Indian Ocean - sit at the
// top where they belong.

export function CountrySelect({
  value, onChange, id, label, hint, className = '',
}: {
  value: string | null | undefined
  onChange: (code: string) => void
  id: string
  label?: string
  hint?: string
  className?: string
}) {
  return <div className={className}>
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
    <select
      id={id}
      value={value || DEFAULT_COUNTRY}
      onChange={event => onChange(event.target.value)}
      className="input-field"
    >
      {countriesByRegion().map(group => <optgroup key={group.region} label={group.region}>
        {group.countries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
      </optgroup>)}
    </select>
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
}

// Which countries somebody will work in, as opposed to where they live.
//
// This is the field that makes international worth having. A therapist in
// Leeds who would take a season in the Maldives is invisible to that resort
// unless she can say so, and asking every property to guess is how a
// cross-border marketplace fails quietly.
export function CountryMultiSelect({
  values, onChange, label, hint,
}: {
  values: string[]
  onChange: (codes: string[]) => void
  label?: string
  hint?: string
}) {
  const selected = new Set(values || [])
  function toggle(code: string) {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code); else next.add(code)
    onChange(Array.from(next))
  }
  return <div>
    {label && <p className="block text-sm font-medium text-gray-700 mb-1.5">{label}</p>}
    {hint && <p className="mb-3 text-xs text-gray-400">{hint}</p>}
    <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border bg-[#f1f1f1] p-4">
      {countriesByRegion().map(group => <div key={group.region}>
        <p className="dashboard-eyebrow !text-[9px] mb-1.5">{group.region}</p>
        <div className="flex flex-wrap gap-1.5">
          {group.countries.map(country => {
            const on = selected.has(country.code)
            return <button
              key={country.code}
              type="button"
              onClick={() => toggle(country.code)}
              aria-pressed={on}
              className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                on ? 'bg-[#1c1c1c] text-white' : 'border border-border bg-white text-secondary hover:border-[#1c1c1c]'}`}
            >{country.name}</button>
          })}
        </div>
      </div>)}
    </div>
    <p className="mt-2 text-[11px] text-muted">{selected.size ? `${selected.size} selected` : 'None selected - you will only be matched where you live.'}</p>
  </div>
}
