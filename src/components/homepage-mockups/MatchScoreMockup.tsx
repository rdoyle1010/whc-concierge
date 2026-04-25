const CATEGORIES = [
  { label: 'Treatment Skills', pct: 100 },
  { label: 'Product House Experience', pct: 95 },
  { label: 'Qualifications', pct: 92 },
  { label: 'Location & Travel', pct: 88 },
  { label: 'Availability', pct: 90 },
]

export default function MatchScoreMockup() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] shadow-sm p-5 max-w-sm w-full mx-auto relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent, #C9A96E, transparent)' }}
      />

      <div className="text-center mt-1 mb-5">
        <p className="font-serif text-[44px] leading-none" style={{ color: '#C9A96E' }}>94%</p>
        <p className="text-[11px] tracking-[0.15em] uppercase mt-1.5" style={{ color: '#6B7280' }}>
          Match score
        </p>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between text-[12px] mb-1">
              <span style={{ color: '#374151' }}>{c.label}</span>
              <span className="font-medium tabular-nums" style={{ color: '#1a1a1a' }}>{c.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EEEA' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${c.pct}%`, background: '#C9A96E' }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-center mt-5 pt-4 border-t border-[#F0EEEA]" style={{ color: '#9CA3AF' }}>
        +10 more categories
      </p>
    </div>
  )
}
