'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY, COURSE_PRICE, PUBLIC_COURSE_PRICE, coursePrice, publicCoursePrice } from '@/lib/academy'
import { courseImage } from '@/lib/academy-extras'
import { GraduationCap, Clock, ShieldCheck, X } from 'lucide-react'

// The PUBLIC Academy - anyone in the industry can buy a course and earn a
// certificate without being a member. £15 for guests; members pay £10 (their
// catalogue lives in the dashboard). Guest purchase needs only an email -
// the access link arrives by email after payment.

export default function PublicAcademyPage() {
  const supabase = createClient()
  const [isCandidate, setIsCandidate] = useState(false)
  const [buying, setBuying] = useState<{ slug: string; title: string } | null>(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchased') === 'true') setPurchased(true)
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (data) setIsCandidate(true)
    })
  }, [])

  async function buyAsGuest() {
    if (!buying) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course_public', courseSlug: buying.slug, email, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setBusy(false); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusy(false)
    }
  }

  const categories = Array.from(new Set(ACADEMY.map(c => c.category)))

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3 text-accent">WHC Academy</p>
          <h1 className="font-serif text-[36px] md:text-[44px] font-medium text-ink tracking-tight leading-[1.1] mb-3">Training that gets you booked.</h1>
          <p className="text-[15px] text-secondary max-w-2xl mb-4">
            Short, serious courses written for luxury spa and wellness professionals - consultation, retail, Forbes standards, treatment craft and brand knowledge. Pass the final quiz and earn a verifiable certificate. No membership required.
          </p>
          <p className="text-[13px] text-muted">
            From £10 per course · WHC members pay from £5 in their <Link href={isCandidate ? '/talent/academy' : '/register/talent'} className="text-accent underline">dashboard</Link>, where certificates also appear as profile badges properties can search.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {purchased && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-5 py-4 rounded-xl mb-8">
            <p className="font-medium">Payment received - check your email.</p>
            <p className="text-[13px] mt-0.5">Your course access link is on its way to your inbox (check spam if it hasn&apos;t landed within a few minutes). One tap signs you in - no password needed.</p>
          </div>
        )}

        {categories.map(cat => (
          <div key={cat} className="mb-10">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-gray-400 mb-3">{cat}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ACADEMY.filter(c => c.category === cat).map(course => (
                <div key={course.slug} className="bg-white border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-32 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={courseImage(course.slug)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-serif text-[17px] font-semibold text-ink leading-snug mb-1">{course.title}</h3>
                  <p className="text-[12px] text-gray-500 mb-2">{course.tagline}</p>
                  <p className="text-[11px] text-gray-400 mb-4 inline-flex items-center gap-1"><Clock size={11} /> {course.lessons.length} modules · case studies &amp; assessment · ~{course.minutes} min · certificate</p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <p className="text-[16px] font-semibold text-ink">£{(publicCoursePrice(course) / 100).toFixed(0)}</p>
                    {isCandidate ? (
                      <Link href="/talent/academy" className="btn-primary text-[12px]">£{(coursePrice(course) / 100).toFixed(0)} in your dashboard</Link>
                    ) : (
                      <button onClick={() => { setBuying({ slug: course.slug, title: course.title }); setError('') }} className="btn-primary text-[12px]">Get this course</button>
                    )}
                  </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-white border border-border rounded-xl p-6 flex items-start gap-3 max-w-2xl">
          <ShieldCheck size={18} className="text-accent mt-0.5 shrink-0" />
          <p className="text-[12px] text-gray-500">Every certificate carries a unique code that anyone can check at <Link href="/verify" className="text-accent underline">talent.wellnesshousecollective.co.uk/verify</Link>. Certificates evidence course completion and assessment; they are not a substitute for accredited qualifications or insurance requirements.</p>
        </div>
      </div>

      {/* Guest purchase modal */}
      {buying && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBuying(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2"><GraduationCap size={17} className="text-accent" /> {buying.title}</h2>
              <button onClick={() => setBuying(null)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-[12px] text-gray-500 mb-4">£{(publicCoursePrice(ACADEMY.find(c => c.slug === buying.slug) || { price: undefined }) / 100).toFixed(0)} one-off. After payment your access link arrives by email - one tap and you&apos;re in, no password to set. Certificate issued the moment you pass.</p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field mb-3" />
            {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
            <button onClick={buyAsGuest} disabled={busy || !email.trim()} className="btn-primary w-full disabled:opacity-50">
              {busy ? 'Taking you to payment...' : `Pay £${(publicCoursePrice(ACADEMY.find(c => c.slug === buying.slug) || { price: undefined }) / 100).toFixed(0)} & start`}
            </button>
            <p className="text-[11px] text-muted text-center mt-3">Already a WHC member? <Link href="/login" className="underline">Sign in</Link> and pay the member price instead.</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
