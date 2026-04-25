'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, MapPin, Send, Check } from 'lucide-react'
import { contactFormSchema } from '@/lib/validations'

const TYPES = [
  { value: 'general', label: 'General' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'partnership', label: 'Partnership' },
] as const

export default function ContactPage() {
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', type: 'general' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const result = contactFormSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach(i => { errs[i.path[0] as string] = i.message })
      setFieldErrors(errs)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('contact_queries').insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      type: form.type,
      status: 'open',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    fetch('/api/contact-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => {})

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[60px]">
        {/* Hero — matches /pricing and /faq */}
        <section className="pt-28 pb-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Contact</p>
            <h1 className="text-[40px] md:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={{ color: '#1a1a1a' }}>
              Get in touch.
            </h1>
            <p className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto" style={{ color: '#6B7280' }}>
              Questions, partnerships, or feedback — we read every message.
            </p>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Contact info cards */}
            <div className="space-y-5">
              <div className="rounded-2xl p-6" style={{ background: '#F8F7F5', border: '1px solid rgba(201, 169, 110, 0.35)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#FDF6EC' }}>
                  <Mail size={18} style={{ color: '#C9A96E' }} />
                </div>
                <h3 className="text-[15px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Email</h3>
                <a
                  href="mailto:hello@wellnesshousecollective.co.uk"
                  className="text-[13px] hover:underline"
                  style={{ color: '#374151' }}
                >
                  hello@wellnesshousecollective.co.uk
                </a>
              </div>
              <div className="rounded-2xl p-6" style={{ background: '#F8F7F5', border: '1px solid rgba(201, 169, 110, 0.35)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#FDF6EC' }}>
                  <MapPin size={18} style={{ color: '#C9A96E' }} />
                </div>
                <h3 className="text-[15px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Location</h3>
                <p className="text-[13px]" style={{ color: '#374151' }}>United Kingdom</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {sent ? (
                <div className="rounded-2xl p-12 text-center bg-white" style={{ border: '1px solid #E5E5E5' }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: '#FDF6EC' }}
                  >
                    <Check size={28} style={{ color: '#C9A96E' }} />
                  </div>
                  <h3 className="text-[22px] font-medium mb-2" style={{ color: '#1a1a1a' }}>Thank you</h3>
                  <p className="text-[14px] leading-[1.7]" style={{ color: '#6B7280' }}>
                    We&apos;ve received your message and will be in touch shortly.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl p-6 md:p-8 bg-white" style={{ border: '1px solid #E5E5E5' }}>
                  {error && (
                    <div className="bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded-lg mb-6">{error}</div>
                  )}

                  {/* Type selector — pill buttons, gold active */}
                  <div className="flex flex-wrap gap-2 mb-7">
                    {TYPES.map((t) => {
                      const active = form.type === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm({ ...form, type: t.value })}
                          className="px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                          style={
                            active
                              ? { background: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201, 169, 110, 0.5)' }
                              : { background: '#F8F7F5', color: '#6B7280', border: '1px solid transparent' }
                          }
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className={`input-field ${fieldErrors.name ? 'border-red-300' : ''}`}
                        />
                        {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={`input-field ${fieldErrors.email ? 'border-red-300' : ''}`}
                        />
                        {fieldErrors.email
                          ? <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                          : <p className="text-[11px] mt-1.5" style={{ color: '#9CA3AF' }}>We&apos;ll only use this to reply.</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Subject</label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className={`input-field ${fieldErrors.subject ? 'border-red-300' : ''}`}
                      />
                      {fieldErrors.subject && <p className="text-red-500 text-xs mt-1">{fieldErrors.subject}</p>}
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#1a1a1a' }}>Message</label>
                      <textarea
                        rows={6}
                        required
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className={`input-field ${fieldErrors.message ? 'border-red-300' : ''}`}
                      />
                      {fieldErrors.message
                        ? <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>
                        : <p className="text-[11px] mt-1.5" style={{ color: '#9CA3AF' }}>The more detail you share, the faster we can help.</p>}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25 disabled:opacity-50"
                        style={{ backgroundColor: '#C9A96E' }}
                      >
                        <Send size={15} />
                        <span>{loading ? 'Sending…' : 'Send message'}</span>
                      </button>
                    </div>
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
