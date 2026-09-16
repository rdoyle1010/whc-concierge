'use client'

import { useEffect, useState } from 'react'
// The defaults come from the values file, not from public-page-content.
// That module builds the zod schemas these types are inferred from, so
// importing a default through it pulled the whole of zod into this page:
// 62KB gzipped, to render copy that is already in the HTML. Types are
// erased at compile time, so `import type` from it stays free.
import { DEFAULT_PUBLIC_PAGES_CONTENT } from '@/lib/public-page-content-values'
import type { PublicPageContent } from '@/lib/public-page-content'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, MapPin, Send, Check } from 'lucide-react'
import { CONTACT_EMAIL } from '@/lib/contact'

const TYPES = [
  { value: 'general', label: 'General' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'certification', label: 'Certification help' },
] as const

export default function ContactPage() {
  // Header wording, hers to change without a deploy. The code default is
  // the same words, so nothing flickers while the real one loads.
  const [cms, setCms] = useState<PublicPageContent>(DEFAULT_PUBLIC_PAGES_CONTENT.pages['contact'])
  useEffect(() => {
    const draft = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pagePreview') === 'draft' ? '&draft=1' : ''
    fetch(`/api/public/page-content?slug=contact${draft}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.page) setCms(data.page) })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', type: 'general' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setFieldErrors({})

    // zod is loaded when somebody submits, not when the page opens.
    //
    // The schema was a static import, which put the whole of zod - 61KB
    // gzipped - into every visit to the contact page, to check five fields on
    // a form most visitors never submit. The rules and the wording of every
    // error are unchanged; they simply arrive with the press of the button.
    // The server validates this again regardless, which is where it counts.
    const { contactFormSchema } = await import('@/lib/validations')
    const result = contactFormSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { errs[i.path[0] as string] = i.message })
      setFieldErrors(errs); setLoading(false); return
    }
    const { createClient } = await import('@/lib/supabase/client')
    const { error: insertError } = await createClient().from('contact_queries').insert({
      name: form.name, email: form.email,
      subject: form.subject || null,
      type: form.type || 'general',
      message: form.message,
      status: 'open',
    })
    if (insertError) { setError(insertError.message); setLoading(false); return }
    fetch('/api/contact-notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).catch(() => {})
    setSent(true); setLoading(false)
  }

  return (
    <div className="public-page">
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        <section className="public-hero py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="public-eyebrow mb-4">{cms.hero.eyebrow}</p>
            <h1 className="public-title mb-4">{cms.hero.heading}</h1>
            <p className="public-intro max-w-2xl mx-auto">{cms.hero.text}</p>
          </div>
        </section>

        <section className="py-14 md:py-20 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="space-y-5">
              <div className="public-panel p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#ede8df]"><Mail size={18} className="text-accent" /></div>
                <h3 className="text-[15px] font-semibold text-ink mb-1.5">Email</h3>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[13px] text-secondary hover:text-ink hover:underline">{CONTACT_EMAIL}</a>
              </div>
              <div className="public-panel p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-[#ede8df]"><MapPin size={18} className="text-accent" /></div>
                <h3 className="text-[15px] font-semibold text-ink mb-1.5">Location</h3>
                <p className="text-[13px] text-secondary">United Kingdom</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              {sent ? (
                <div role="status" className="public-panel p-12 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#ede8df]"><Check size={28} className="text-accent" /></div>
                  <h3 className="text-[22px] font-semibold text-ink mb-2">Thank you</h3>
                  <p className="text-[14px] leading-7 text-secondary">We&apos;ve received your message and will be in touch shortly.</p>
                </div>
              ) : (
                <div className="public-panel p-6 md:p-8">
                  {error && <div role="alert" className="bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded-xl mb-6">{error}</div>}
                  <div className="flex flex-wrap gap-2 mb-7">
                    {TYPES.map((t) => {
                      const active = form.type === t.value
                      return <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })} className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border ${active ? 'bg-[#ede8df] text-accent border-accent/40' : 'bg-surface text-secondary border-transparent hover:border-border'}`}>{t.label}</button>
                    })}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Name" error={fieldErrors.name}><input type="text" required aria-label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`input-field ${fieldErrors.name ? 'border-red-300' : ''}`} /></Field>
                      <Field label="Email" error={fieldErrors.email} help="We'll only use this to reply."><input type="email" required aria-label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={`input-field ${fieldErrors.email ? 'border-red-300' : ''}`} /></Field>
                    </div>
                    <Field label="Subject" error={fieldErrors.subject}><input type="text" required aria-label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={`input-field ${fieldErrors.subject ? 'border-red-300' : ''}`} /></Field>
                    <Field label="Message" error={fieldErrors.message} help="The more detail you share, the faster we can help."><textarea rows={6} required aria-label="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`input-field ${fieldErrors.message ? 'border-red-300' : ''}`} /></Field>
                    <div className="pt-2"><button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"><Send size={15} /><span>{loading ? 'Sending…' : 'Send message'}</span></button></div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Field({ label, error, help, children }: { label: string; error?: string; help?: string; children: React.ReactNode }) {
  return <div><label className="block text-[12px] font-semibold text-ink mb-1.5">{label}</label>{children}{error ? <p className="text-red-500 text-xs mt-1">{error}</p> : help ? <p className="text-[11px] mt-1.5 text-muted">{help}</p> : null}</div>
}
