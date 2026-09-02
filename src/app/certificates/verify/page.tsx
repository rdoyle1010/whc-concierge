'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BadgeCheck, Search, ShieldQuestion } from 'lucide-react'

// Public certificate verification: an employer types (or follows) a
// certificate code and sees exactly what WHC Academy issued - or that no
// such certificate exists. This is what makes the certificate worth
// printing on a CV.

function VerifyInner() {
  const params = useSearchParams()
  const [code, setCode] = useState(params.get('code') || '')
  const [result, setResult] = useState<any>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'notfound'>('idle')

  async function verify(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setState('loading')
    try {
      const res = await fetch(`/api/certificates/verify?code=${encodeURIComponent(trimmed)}`)
      const json = await res.json()
      if (res.ok && json.certificate) { setResult(json.certificate); setState('done') }
      else { setResult(null); setState('notfound') }
    } catch { setResult(null); setState('notfound') }
  }

  useEffect(() => {
    const initial = params.get('code')
    if (initial) verify(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-[#f3f0eb]">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#1c1b1a] font-semibold mb-2">WHC Academy</p>
        <h1 className="font-serif text-[32px] font-semibold text-[#1c1b1a] mb-2">Verify a certificate</h1>
        <p className="text-[13.5px] text-[#57534e] leading-relaxed mb-6">Every WHC Academy certificate carries a unique verification code. Enter it below to confirm the certificate is genuine and see exactly what was awarded.</p>

        <div className="flex gap-2 mb-8">
          <input value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') verify(code) }}
            placeholder="e.g. WHC-XXXX-XXXX" aria-label="Certificate verification code" className="input-field flex-1 text-[14px] font-mono" />
          <button type="button" onClick={() => verify(code)} disabled={state === 'loading'} className="btn-primary inline-flex items-center gap-1.5 text-[13px]"><Search size={14} /> {state === 'loading' ? 'Checking...' : 'Verify'}</button>
        </div>

        {state === 'done' && result && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-900 mb-3"><BadgeCheck size={18} /> Genuine WHC Academy certificate</p>
            <div className="space-y-1.5 text-[13.5px] text-emerald-900">
              <p><span className="text-emerald-700">Awarded to:</span> <strong>{result.learner_name}</strong></p>
              <p><span className="text-emerald-700">Course:</span> {result.course_title}</p>
              <p><span className="text-emerald-700">Completed:</span> {new Date(result.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              {result.learning_minutes ? <p><span className="text-emerald-700">Learning time:</span> {result.learning_minutes >= 60 ? `${Math.round(result.learning_minutes / 60 * 10) / 10} hours` : `${result.learning_minutes} minutes`}</p> : null}
              {typeof result.score === 'number' ? <p><span className="text-emerald-700">Assessment:</span> passed at {result.score}%</p> : null}
              <p><span className="text-emerald-700">Certificate ID:</span> <span className="font-mono">{result.code}</span></p>
              <p className="pt-1 text-[12px] text-emerald-700">Issued by WHC Academy, Wellness House Collective.</p>
            </div>
          </div>
        )}

        {state === 'notfound' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-red-800 mb-1"><ShieldQuestion size={17} /> No certificate found</p>
            <p className="text-[13px] text-red-700 leading-relaxed">That code does not match any certificate issued by WHC Academy. Check the code carefully - if it still fails, the certificate is not genuine and we would like to know: contact us through the Contact page.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default function VerifyCertificatePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f3f0eb]" />}><VerifyInner /></Suspense>
}
