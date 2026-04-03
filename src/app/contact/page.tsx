'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, connect to email service or Supabase
    setSent(true)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-white/60 max-w-xl mx-auto">Questions, feedback, or partnership enquiries — we&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="py-16 bg-parchment">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0"><Mail size={20} className="text-gold" /></div>
              <div><h3 className="font-serif font-semibold">Email</h3><p className="text-sm text-gray-500">hello@wellnesshousecollective.co.uk</p></div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0"><MapPin size={20} className="text-gold" /></div>
              <div><h3 className="font-serif font-semibold">Location</h3><p className="text-sm text-gray-500">United Kingdom</p></div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="card text-center py-12">
                <h3 className="font-serif text-2xl font-semibold text-ink mb-2">Thank You</h3>
                <p className="text-gray-500">We&apos;ve received your message and will be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label><input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label><input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label><textarea rows={6} required value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="input-field" /></div>
                <button type="submit" className="btn-primary">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
