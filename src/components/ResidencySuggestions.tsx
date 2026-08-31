'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

// Matched residency specialists for a residency-flagged job - identity
// protected, ranked by the same matching engine as everything else.

export default function ResidencySuggestions({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[] | null>(null)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && suggestions === null && !loading) {
      setLoading(true)
      try {
        const res = await fetch(`/api/residency/suggested?jobId=${encodeURIComponent(jobId)}`)
        const json = await res.json()
        setSuggestions(res.ok ? (json.suggestions || []) : [])
      } catch { setSuggestions([]) } finally { setLoading(false) }
    }
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8a6d3b] hover:underline">
        <Sparkles size={12} /> {open ? 'Hide matched specialists' : 'View matched residency specialists'}
      </button>
      {open && (
        <div className="mt-2">
          {loading ? <p className="text-[11.5px] text-muted">Matching specialists...</p>
            : !suggestions?.length ? <p className="text-[11.5px] text-muted">No approved residency specialists match this role yet.</p>
            : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map(specialist => (
                  <Link key={specialist.id} href={`/residency/${specialist.id}`} className="inline-flex items-center gap-2 rounded-full border border-[#e2d6b8] bg-[#faf6ec] px-3 py-1.5 text-[11.5px] hover:bg-[#f5eedd]">
                    <span className="font-semibold text-ink">{specialist.primary_specialism || specialist.reference}</span>
                    <span className="text-muted">{specialist.reference}</span>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#0b2f4d]">{specialist.match_score}%</span>
                  </Link>
                ))}
              </div>
            )}
        </div>
      )}
    </div>
  )
}
