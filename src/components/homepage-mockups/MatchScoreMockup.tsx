const CATEGORIES = [
  { label: 'Treatment Skills', pct: 100 },
  { label: 'Product House Experience', pct: 95 },
  { label: 'Qualifications', pct: 92 },
  { label: 'Location & Travel', pct: 88 },
  { label: 'Availability', pct: 90 },
]

export default function MatchScoreMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#dddddd] shadow-sm p-5 max-w-sm w-full mx-auto relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: '#1c1c1c' }}
      />

      <div className="text-center mt-1 mb-5">
        <p className="font-serif text-[44px] leading-none" style={{ color: '#1c1c1c' }}>94%</p>
        <p className="text-[11px] tracking-[0.15em] uppercase mt-1.5" style={{ color: '#555555' }}>
          Match score
        </p>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span style={{ color: '#555555' }}>{c.label}</span>
              <span className="font-medium tabular-nums" style={{ color: '#1c1c1c' }}>{c.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f1f1' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${c.pct}%`, background: '#1c1c1c' }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-center mt-5 pt-4 border-t border-[#dddddd]" style={{ color: '#555555' }}>
        +10 more categories
      </p>
    </div>
  )
}
