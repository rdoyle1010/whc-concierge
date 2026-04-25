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
        <div className="h-12 w-44 rounded-lg bg-[#F0EEEA] animate-pulse" />
        <div className="h-12 w-36 rounded-lg bg-[#F0EEEA] animate-pulse" />
      </div>
    )
  }

  if (auth.loggedIn && auth.role === 'employer') {
    return (
      <div
        className="rounded-lg p-4 text-[13px] max-w-md"
        style={{
          background: '#FDF6EC',
          border: '1px solid rgba(201, 169, 110, 0.4)',
          color: '#374151',
        }}
      >
        You&apos;re signed in as an employer. Sign out to apply as talent.
      </div>
    )
  }

  const applyHref = !auth.loggedIn
    ? `/register/talent?intent=apply&role=${encodeURIComponent(roleId)}`
    : `/talent/dashboard?apply=${encodeURIComponent(roleId)}`

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
    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        href={applyHref}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
        style={{ backgroundColor: '#C9A96E' }}
      >
        Apply for this role <ArrowRight size={16} />
      </Link>
      {!auth.loggedIn ? (
        <Link
          href={`/login?next=${encodeURIComponent(`/jobs/${roleId}`)}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold transition-all bg-white"
          style={{ border: '1px solid #E5E5E5', color: '#1a1a1a' }}
        >
          <Bookmark size={16} /> Save for later
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleSaveClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold transition-all bg-white"
          style={{
            border: `1px solid ${saved ? '#C9A96E' : '#E5E5E5'}`,
            color: saved ? '#C9A96E' : '#1a1a1a',
          }}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Saved' : 'Save for later'}
        </button>
      )}
    </div>
  )
}
