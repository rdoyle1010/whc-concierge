'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = { roleId: string }

type AuthState =
  | { loading: true }
  | { loading: false; loggedIn: false }
  | { loading: false; loggedIn: true; role: 'talent' | 'employer' | 'admin' | null }

export default function JobApplyButtons({ roleId }: Props) {
  const [auth, setAuth] = useState<AuthState>({ loading: true })
  const [saved, setSaved] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        setAuth({ loading: false, loggedIn: false })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return

      setAuth({
        loading: false,
        loggedIn: true,
        role: (profile?.role as 'talent' | 'employer' | 'admin' | null) ?? null,
      })

      try {
        const res = await fetch('/api/saved-jobs')
        if (!res.ok) return
        const d = await res.json()
        if (cancelled) return
        const set = new Set<string>((d.saved || []).map((s: { job_id: string }) => s.job_id))
        setSaved(set.has(roleId))
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [roleId])

  if (auth.loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="h-12 w-44 rounded-lg bg-[#f1f1f1] animate-pulse" />
        <div className="h-12 w-36 rounded-lg bg-[#f1f1f1] animate-pulse" />
      </div>
    )
  }

  if (auth.loggedIn && auth.role === 'employer') {
    return (
      <div
        className="rounded-lg p-4 text-[13px] max-w-md"
        style={{
          background: '#f1f1f1',
          border: '1px solid rgba(28,28,28, 0.4)',
          color: '#374151',
        }}
      >
        You&apos;re signed in as an employer. Sign out to apply as talent.
      </div>
    )
  }

  const applyHref = `/register/talent?intent=apply&role=${encodeURIComponent(roleId)}`

  const handleApplyClick = async () => {
    if (applying) return
    setApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/applications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: roleId }),
      })
      const d = await res.json().catch(() => ({}))

      if (res.ok) {
        window.location.href = '/talent/applications?review=draft'
        return
      }

      if (res.status === 409 && d.applicationId) {
        window.location.href = '/talent/applications'
        return
      }

      setError(d.error || 'Could not start your application - please try again.')
    } catch {
      setError('Could not start your application - please try again.')
    }
    setApplying(false)
  }

  const handleSaveClick = async () => {
    if (!auth.loggedIn) return
    const next = !saved
    setSaved(next)
    try {
      const res = await fetch('/api/saved-jobs', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: roleId }),
      })
      if (!res.ok) setSaved(!next)
    } catch {
      setSaved(!next)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-3 max-w-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
      {!auth.loggedIn ? (
        <Link
          href={applyHref}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#555555]/25"
          style={{ backgroundColor: '#555555' }}
        >
          Apply for this role <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={applying}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#555555]/25 disabled:opacity-70"
          style={{ backgroundColor: '#555555' }}
        >
          {applying ? 'Preparing application...' : 'Review application'} <ArrowRight size={16} />
        </button>
      )}
      {!auth.loggedIn ? (
        <Link
          href={`/login?next=${encodeURIComponent(`/jobs/${roleId}`)}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold transition-all bg-white"
          style={{ border: '1px solid #E5E5E5', color: '#1c1c1c' }}
        >
          <Bookmark size={16} /> Save for later
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleSaveClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold transition-all bg-white"
          style={{
            border: `1px solid ${saved ? '#555555' : '#E5E5E5'}`,
            color: saved ? '#555555' : '#1c1c1c',
          }}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Saved' : 'Save for later'}
        </button>
      )}
      </div>
    </div>
  )
}
