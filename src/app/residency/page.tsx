'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Building2, Clock, Users, TrendingUp, Star, ArrowRight, Check, MapPin } from 'lucide-react'

const residencies = [
  { property: 'Corinthia London', location: 'London, UK', duration: '3 months', type: 'Luxury Hotel & Spa', desc: 'Join the award-winning ESPA Life team for a transformative residency in the heart of Whitehall.' },
  { property: 'Gleneagles', location: 'Perthshire, Scotland', duration: '6 months', type: 'Resort & Spa', desc: 'A rare opportunity to work within one of Scotland\'s most prestigious wellness destinations.' },
  { property: 'Mandarin Oriental', location: 'London, UK', duration: '2 months', type: 'Luxury Hotel & Spa', desc: 'Experience world-class spa operations and Eastern-inspired wellness at its finest.' },
]

export default function ResidencyPage() {
  const supabase = createClient()
  const [step, setStep] = useState(0) // 0 = info, 1-3 = application steps
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: '', specialisms: '', motivation: '', availability: '' })
  const [dbResidencies, setDbResidencies] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('residency_profiles').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) setDbResidencies(data)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero — editorial */}
      <section className="relative min-h-[80vh] flex items-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gold/3 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 py-32 relative z-10">
          <div className="max-w-2xl">
            <p className="text-gold text-sm font-medium uppercase tracking-[0.25em] mb-6 animate-fade-in-up">Residency Programme</p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-[0.95] mb-8 animate-fade-in-up delay-100">
              Your Next Chapter in <span className="italic gradient-text-gold">Luxury Wellness</span>
            </h1>
            <p className="text-xl text-white/40 font-light leading-relaxed mb-10 animate-fade-in-up delay-200">
              Elite 1–6 month placements at the world&apos;s most iconic properties. Live and work where others only dream of visiting.
            </p>
            <div className="flex gap-4 animate-fade-in-up delay-300">
              <button onClick={() => setStep(1)} className="btn-primary text-lg px-8 py-4">Apply Now</button>
              <a href="#placements" className="btn-ghost text-lg px-8 py-4">View Placements</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b border-gray-100/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 stagger-children">
          {[
            { icon: <Building2 className="text-gold" size={24} />, stat: '50+', label: 'Partner Properties' },
            { icon: <Clock className="text-gold" size={24} />, stat: '1–6', label: 'Month Placements' },
            { icon: <Users className="text-gold" size={24} />, stat: '200+', label: 'Practitioners Placed' },
            { icon: <TrendingUp className="text-gold" size={24} />, stat: '94%', label: 'Return Rate' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-12 h-12 bg-gold/8 rounded-xl flex items-center justify-center mx-auto mb-3">{s.icon}</div>
              <p className="text-3xl font-serif font-bold gradient-text-gold">{s.stat}</p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Residencies */}
      <section id="placements" className="py-24 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Current Openings</p>
            <h2 className="section-heading">Featured Residencies</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger-children">
            {residencies.map((r) => (
              <div key={r.property} className="card group p-0 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-ink via-navy-light to-ink relative">
                  <div className="absolute inset-0 bg-gold/5" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-gold/60 text-xs uppercase tracking-wider">{r.type}</span>
                    <h3 className="text-2xl font-serif font-bold text-white mt-1">{r.property}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center space-x-1"><MapPin size={14} /><span>{r.location}</span></span>
                    <span className="flex items-center space-x-1"><Clock size={14} /><span>{r.duration}</span></span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{r.desc}</p>
                  <button onClick={() => setStep(1)} className="text-gold text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    Apply for Residency <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">What You Get</p>
            <h2 className="section-heading">Residency Benefits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Direct booking with world-class properties', 'Competitive rates and accommodation included',
              'Portfolio-building at iconic destinations', 'Brand partnership and networking opportunities',
              'Dedicated placement support throughout', 'Verified reviews to boost your profile',
            ].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-5 rounded-2xl bg-gray-50/80 hover:bg-gold/5 transition-colors duration-300">
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-ink font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Modal */}
      {step > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setStep(0)}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-2xl font-bold text-ink mb-2">Apply for Residency</h3>
            <p className="text-gray-400 text-sm mb-6">Step {step} of 3</p>

            {/* Progress */}
            <div className="flex space-x-2 mb-8">
              {[1,2,3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${step >= s ? 'gold-gradient' : 'bg-gray-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" /></div>
                <button onClick={() => setStep(2)} className="btn-primary w-full">Continue</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
                  <input type="text" value={form.experience} onChange={(e) => setForm({...form, experience: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Specialisms</label>
                  <input type="text" value={form.specialisms} onChange={(e) => setForm({...form, specialisms: e.target.value})} className="input-field" placeholder="e.g. Massage, Facials, Yoga" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Availability</label>
                  <input type="text" value={form.availability} onChange={(e) => setForm({...form, availability: e.target.value})} className="input-field" placeholder="e.g. Available from June 2026" /></div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Why do you want a residency?</label>
                  <textarea rows={5} value={form.motivation} onChange={(e) => setForm({...form, motivation: e.target.value})} className="input-field" /></div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                  <button onClick={async () => {
                    setSubmitting(true)
                    await supabase.from('residency_applications').insert({
                      name: form.name,
                      email: form.email,
                      phone: form.phone || null,
                      experience: form.experience || null,
                      specialisms: form.specialisms || null,
                      motivation: form.motivation || null,
                      availability: form.availability || null,
                      status: 'pending',
                    })
                    setSubmitting(false)
                    setStep(0)
                    setForm({ name: '', email: '', phone: '', experience: '', specialisms: '', motivation: '', availability: '' })
                    alert('Application submitted! We\'ll be in touch soon.')
                  }} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
