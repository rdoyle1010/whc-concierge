'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, MapPin, Send, Check } from 'lucide-react'
import { contactFormSchema } from '@/lib/validations'

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

    // Fire-and-forget email notification to admin
    fetch('/api/contact-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => {})

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-medium uppercase tracking-[0.25em] mb-4">Contact</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">Get in <span className="italic gradient-text-gold">Touch</span></h1>
          <p className="text-white/40 max-w-xl mx-auto font-light">Questions, feedback, or partnership enquiries — we&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="py-16 bg-parchment">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8 stagger-children">
            <div className="card">
              <div className="w-10 h-10 bg-gold/8 rounded-xl flex items-center justify-center mb-4">
                <Mail size={20} className="text-gold" />
              </div>
              <h3 className="font-serif font-semibold text-ink mb-1">Email</h3>
              <p className="text-sm text-gray-400">hello@wellnesshousecollective.co.uk</p>
            </div>
            <div className="card">
              <div className="w-10 h-10 bg-gold/8 rounded-xl flex items-center justify-center mb-4">
                <MapPin size={20} className="text-gold" />
              </div>
              <h3 className="font-serif font-semibold text-ink mb-1">Location</h3>
              <p className="text-sm text-gray-400">United Kingdom</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="card text-center py-16 animate-fade-in-up">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-ink mb-2">Thank You</h3>
                <p className="text-gray-400">We&apos;ve received your message and will be in touch soon.</p>
              </div>
            ) : (
              <div className="card">
                {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}

                {/* Type selector */}
                <div className="flex gap-2 mb-6">
                  {[{ value: 'general', label: 'General' }, { value: 'complaint', label: 'Complaint' }, { value: 'partnership', label: 'Partnership' }].map((t) => (
                    <button key={t.value} onClick={() => setForm({...form, type: t.value})}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${form.type === t.value ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-gray-50 text-gray-500'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                      <input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className={`input-field ${fieldErrors.name ? 'border-red-300' : ''}`} />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}</div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className={`input-field ${fieldErrors.email ? 'border-red-300' : ''}`} />
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}</div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                    <input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className={`input-field ${fieldErrors.subject ? 'border-red-300' : ''}`} />
                    {fieldErrors.subject && <p className="text-red-500 text-xs mt-1">{fieldErrors.subject}</p>}</div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea rows={6} required value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className={`input-field ${fieldErrors.message ? 'border-red-300' : ''}`} />
                    {fieldErrors.message && <p className="text-red-500 text-xs mt-1">{fieldErrors.message}</p>}</div>
                  <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
                    <Send size={16} /><span>{loading ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
