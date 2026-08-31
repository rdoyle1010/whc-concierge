'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { courseTitle } from '@/lib/academy'
import { ShieldCheck, ShieldX } from 'lucide-react'

// Certificate lookup by code. RLS only exposes COMPLETED enrolments, so a
// hit here is proof of a passed course - nothing else is reachable.

export default function VerifyResultPage() {
  const params = useParams()
  const code = decodeURIComponent(Array.isArray(params?.code) ? params.code[0] : (params?.code as string) || '').toUpperCase()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [cert, setCert] = useState<any>(null)
  const [name, setName] = useState('')
  const [courseName, setCourseName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('course_enrollments')
          .select('course_slug, completed_at, candidate_id, certificate_code')
          .eq('certificate_code', code)
          .not('completed_at', 'is', null)
          .maybeSingle()
        if (data) {
          setCert(data)
          setCourseName(courseTitle(data.course_slug))
          fetch(`/api/academy/catalog?slug=${encodeURIComponent(data.course_slug)}`)
            .then(response => response.ok ? response.json() : null)
            .then(json => { if (json?.course?.title) setCourseName(json.course.title) })
            .catch(() => {})
          const { data: cand } = await supabase.from('candidate_profiles')
            .select('full_name').eq('id', data.candidate_id).maybeSingle()
          setName(cand?.full_name || '')
        }
      } catch { /* shown as not found */ }
      setLoading(false)
    }
    if (code) load()
  }, [code])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-[76px]">
        <div className="bg-white border border-border rounded-2xl p-10 max-w-md w-full text-center">
          {loading ? (
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          ) : cert ? (
            <>
              <ShieldCheck size={36} className="mx-auto text-green-600 mb-4" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-green-700 font-semibold mb-3">Certificate verified</p>
              <p className="font-serif text-[22px] font-bold text-ink capitalize mb-1">{name || 'WHC Professional'}</p>
              <p className="text-[14px] text-gray-600 mb-1">{courseName || cert.course_slug}</p>
              <p className="text-[12px] text-secondary mb-4">
                Completed {new Date(cert.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-muted font-mono mb-6">{cert.certificate_code}</p>
              <p className="text-[11px] text-muted">Issued by Wellness House Collective. This certificate evidences completion of a WHC Academy course and its assessment.</p>
            </>
          ) : (
            <>
              <ShieldX size={36} className="mx-auto text-red-500 mb-4" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-red-600 font-semibold mb-3">Not found</p>
              <p className="text-[14px] text-gray-600 mb-6">No certificate matches the code <span className="font-mono">{code}</span>. Check the code and try again - or treat the certificate with caution.</p>
              <Link href="/verify" className="btn-secondary text-[13px] inline-block">Try another code</Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
