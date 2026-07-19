'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { courseBySlug } from '@/lib/academy'
import { Printer, ArrowLeft } from 'lucide-react'

// The certificate - designed to be printed or saved as PDF and to look
// worth framing. Carries a unique verification code.

export default function CertificatePage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const course = courseBySlug(slug)
  const [loading, setLoading] = useState(true)
  const [enr, setEnr] = useState<any>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/academy')
        if (res.ok) {
          const j = await res.json()
          setName(j.candidate_name || '')
          setEnr((j.enrollments || []).find((e: any) => e.course_slug === slug && e.completed_at) || null)
        }
      } catch { /* renders as unavailable */ }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>

  if (!course || !enr) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Certificate not available - complete the course first.</p>
        <Link href="/talent/academy" className="btn-secondary text-[13px]">Back to the Academy</Link>
      </div>
    )
  }

  const date = new Date(enr.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/talent/academy" className="text-[13px] text-gray-500 hover:text-black inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Academy</Link>
        <button onClick={() => window.print()} className="btn-primary text-[13px] inline-flex items-center gap-2"><Printer size={14} /> Print / Save as PDF</button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 print:py-0">
        <div className="bg-white border-[3px] border-double p-12 md:p-16 text-center" style={{ borderColor: '#C9A96E' }}>
          <p className="font-serif text-[20px] font-semibold text-black leading-none">Wellness House</p>
          <p className="uppercase text-[9px] font-medium tracking-[0.42em] mt-1 mb-10" style={{ color: '#C9A96E' }}>Collective</p>

          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-400 mb-6">Certificate of Completion</p>

          <p className="text-[13px] text-gray-500 mb-2">This certifies that</p>
          <p className="font-serif text-[34px] font-bold text-black capitalize mb-2">{name || 'WHC Professional'}</p>
          <p className="text-[13px] text-gray-500 mb-1">has successfully completed the WHC Academy course</p>
          <p className="font-serif text-[22px] font-semibold text-black mb-8">{course.title}</p>

          <p className="text-[12px] text-gray-500 mb-10">including assessment passed at {enr.quiz_score}% &middot; {date}</p>

          <div className="w-[80px] h-[1px] mx-auto mb-6" style={{ backgroundColor: '#C9A96E' }} />
          <p className="text-[11px] text-gray-400">Verification code: <span className="font-mono text-gray-600">{enr.certificate_code}</span></p>
          <p className="text-[10px] text-gray-400 mt-1">Verify this certificate at talent.wellnesshousecollective.co.uk/verify</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Issued by Wellness House Collective</p>
        </div>
      </div>
    </div>
  )
}
