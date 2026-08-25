'use client'

type Item = readonly [string, string]

const LARGE_FIELDS = new Set([
  'directions','worker_should_bring','break_policy','fire_emergency_basics',
  'health_safety_acknowledgement','treatment_protocols','guest_service_standards',
  'property_rules','residency_programme_brief','residency_other_notes',
])

export default function PropertyFactFileSection({
  title,
  intro,
  items,
  form,
  onChange,
}: {
  title: string
  intro: string
  items: readonly Item[]
  form: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <section className="dashboard-panel mb-6">
      <h2 className="dashboard-section-title">{title}</h2>
      <p className="text-[12px] text-muted mt-1 mb-5 max-w-3xl">{intro}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(([key, label]) => (
          <div key={key} className={LARGE_FIELDS.has(key) ? 'md:col-span-2' : ''}>
            <label className="block text-[11px] font-medium text-ink mb-1.5">{label}</label>
            {LARGE_FIELDS.has(key) ? (
              <textarea
                rows={3}
                className="input-field text-[13px] resize-y"
                value={form[key] || ''}
                onChange={e => onChange(key, e.target.value)}
              />
            ) : (
              <input
                className="input-field text-[13px]"
                value={form[key] ?? ''}
                onChange={e => onChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
