'use client'

// Universal search - one quiet bar across jobs, people, properties, courses
// and intelligence. Expands from a search icon; results arrive from
// /api/search, already privacy-gated for the signed-in viewer.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

type ResultType = 'job' | 'person' | 'employer' | 'course' | 'article' | 'agency'

interface SearchResult {
  type: ResultType
  title: string
  subtitle: string
  href: string
}

const GROUP_ORDER: ResultType[] = ['job', 'person', 'employer', 'course', 'article', 'agency']

const GROUP_LABELS: Record<ResultType, string> = {
  job: 'Jobs',
  person: 'People',
  employer: 'Employers',
  course: 'Courses',
  article: 'Intelligence',
  agency: 'Agency',
}

export default function UniversalSearch({ variant, onNavigate }: { variant: 'navbar' | 'dashboard'; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const router = useRouter()

  const dark = variant === 'navbar'

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setSearched(false)
    setLoading(false)
    setActiveIndex(-1)
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, close])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearched(false)
      setLoading(false)
      setActiveIndex(-1)
      abortRef.current?.abort()
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed.slice(0, 80))}`, { signal: controller.signal })
        const json = response.ok ? await response.json() : { results: [] }
        if (controller.signal.aborted) return
        setResults(Array.isArray(json.results) ? json.results : [])
        setSearched(true)
        setLoading(false)
        setActiveIndex(-1)
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setResults([])
          setSearched(true)
          setLoading(false)
        }
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const navigateTo = useCallback((result: SearchResult) => {
    close()
    onNavigate?.()
    router.push(result.href)
  }, [close, onNavigate, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(index => (index + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(index => (index <= 0 ? results.length - 1 : index - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = results[activeIndex] ?? results[0]
      if (target) navigateTo(target)
    }
  }

  const showPanel = open && query.trim().length >= 2

  // Group results for display while keeping the flat index for keyboard nav.
  const grouped = GROUP_ORDER
    .map(type => ({ type, items: results.map((result, index) => ({ result, index })).filter(({ result }) => result.type === type) }))
    .filter(group => group.items.length > 0)

  if (!open) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search the platform"
          className={`flex h-9 w-9 items-center justify-center transition-colors ${dark ? 'text-white/70 hover:text-white' : 'border border-border bg-white text-secondary hover:border-[#6e6a66] hover:text-ink'}`}
        >
          <Search size={16} />
        </button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative max-lg:static">
      <div className="max-lg:fixed max-lg:inset-x-0 max-lg:top-0 max-lg:z-[80] max-lg:border-b max-lg:border-border max-lg:bg-white max-lg:p-3 max-lg:shadow-[0_18px_48px_rgba(28,27,26,.14)]">
        <div className={`flex h-9 items-center gap-2 border px-3 max-lg:border-border max-lg:bg-white ${dark ? 'border-white/25 bg-white/[0.07]' : 'border-border bg-white'}`}>
          <Search size={14} className={`shrink-0 max-lg:text-muted ${dark ? 'text-white/55' : 'text-muted'}`} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={80}
            placeholder="Search roles, people, properties..."
            aria-label="Search roles, people, properties, courses and articles"
            aria-expanded={showPanel}
            role="combobox"
            aria-controls="universal-search-results"
            className={`w-[190px] bg-transparent text-[13px] outline-none transition-[width] duration-150 max-lg:w-full max-lg:text-ink max-lg:placeholder:text-muted lg:w-[230px] lg:focus:w-[260px] ${dark ? 'text-white placeholder:text-white/45' : 'text-ink placeholder:text-muted'}`}
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className={`shrink-0 transition-colors max-lg:text-muted max-lg:hover:text-ink ${dark ? 'text-white/55 hover:text-white' : 'text-muted hover:text-ink'}`}
          >
            <X size={14} />
          </button>
        </div>

        {showPanel && (
          <div
            id="universal-search-results"
            role="listbox"
            className="fade-in z-[80] border border-border bg-white shadow-[0_18px_48px_rgba(28,27,26,.14)] max-lg:mt-2 max-lg:max-h-[calc(100vh-120px)] max-lg:overflow-y-auto lg:absolute lg:right-0 lg:top-[calc(100%+10px)] lg:max-h-[70vh] lg:w-[400px] lg:overflow-y-auto"
          >
            {loading && !searched ? (
              <div className="px-4 py-4" aria-hidden="true">
                {[0, 1, 2].map(row => (
                  <div key={row} className="mb-3 last:mb-0">
                    <div className="h-3 w-2/3 animate-pulse bg-surface" />
                    <div className="mt-1.5 h-2.5 w-2/5 animate-pulse bg-surface" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 && searched ? (
              <p className="px-4 py-5 text-[12.5px] leading-5 text-secondary">
                No results for that yet - try a role, a property or a skill.
              </p>
            ) : (
              grouped.map(group => (
                <div key={group.type} className="border-b border-border last:border-b-0">
                  <p className="px-4 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
                    {GROUP_LABELS[group.type]}
                  </p>
                  {group.items.map(({ result, index }) => (
                    <Link
                      key={`${result.type}-${index}`}
                      href={result.href}
                      role="option"
                      aria-selected={index === activeIndex}
                      onClick={() => { close(); onNavigate?.() }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`block px-4 py-2.5 transition-colors ${index === activeIndex ? 'bg-surface' : 'hover:bg-surface'}`}
                    >
                      <span className="block truncate text-[13px] font-medium text-ink">{result.title}</span>
                      {result.subtitle && <span className="mt-0.5 block truncate text-[11px] text-muted">{result.subtitle}</span>}
                    </Link>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
