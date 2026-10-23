'use client'

import { useEffect, useState } from 'react'
import type { Taxonomy } from '@/lib/sectors'

// Doors and sectors change rarely and are needed by three separate forms, so
// one request per page load is shared between them.

const EMPTY: Taxonomy = { doors: [], sectors: [] }

let cached: Taxonomy | null = null
let inflight: Promise<Taxonomy | null> | null = null

export function useTaxonomy(): { taxonomy: Taxonomy; loading: boolean } {
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(cached || EMPTY)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) { setTaxonomy(cached); setLoading(false); return }
    if (!inflight) {
      inflight = fetch('/api/sectors')
        .then(response => (response.ok ? response.json() : null))
        .catch(() => null)
    }
    let active = true
    inflight.then(data => {
      if (!active) return
      if (data?.doors && data?.sectors) { cached = data; setTaxonomy(data) }
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { taxonomy, loading }
}
