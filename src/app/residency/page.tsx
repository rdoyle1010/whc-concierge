'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { MapPin, Clock, Check, X } from 'lucide-react'

// Residencies loaded from database — no hardcoded fallback data

export default function ResidencyPage() {
  const supabase = createClient()
  const [step, setStep] = useState(0)
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
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[75vh]">
          <div className="flex items-center px-6 sm:px-12 lg:px-16 xl:px-24 py-20">
            <div className="max-w-lg">
              <p className="text-neutral-400 text-xs tracking-widest uppercase mb-4">Residency Programme</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-tight leading-[1.05] mb-6">Your next chapter in luxury wellness</h1>
              <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">Elite 1–6 month placements at the world&apos;s most iconic properties. Live and work where others only dream of visiting.</p>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="btn-primary">Apply Now</button>
                <a href="#placements" className="btn-secondary">View Placements</a>
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=80&auto=format&fit=crop" alt="Luxury wellness" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ n: '1–6', l: 'Month Placements' }, { n: 'UK & Europe', l: 'Locations' }, { n: '5-Star', l: 'Properties' }].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-3xl font-bold text-black">{s.n}</p>
              <p className="text-neutral-400 text-xs tracking-widest uppercase mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Placements */}
      <section id="placements" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Current Openings</p>
            <h2 className="text-4xl font-bold text-black tracking-tight">Featured Residencies</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
            {dbResidencies.length > 0 ? dbResidencies.map((r: any) => (
              <div key={r.id} className="border border-neutral-200 hover:border-neutral-400 transition-colors">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-black mb-2">{r.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-4">
                    {r.duration && <span className="flex items-center space-x-1"><Clock size={13} /><span>{r.duration}</span></span>}
                    {r.travel_availability && <span>{r.travel_availability}</span>}
                  </div>
                  {r.description && <p className="text-neutral-400 text-sm leading-relaxed mb-4">{r.description}</p>}
                  {r.day_rate && <p className="text-sm font-medium text-black mb-4">From £{r.day_rate}/day</p>}
                  <button type="button" onClick={() => setStep(1)} className="text-black text-sm font-medium hover:underline">Apply &rarr;</button>
                </div>
              </div>
            )) : (
              <div className="lg:col-span-3 text-center py-12">
                <p className="text-muted text-[14px] mb-4">No residency placements available yet.</p>
                <Link href="/residency/create" className="btn-primary inline-block">List your residency availability</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-14">
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">What You Get</p>
            <h2 className="text-4xl font-bold text-black tracking-tight">Residency Benefits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Direct booking with world-class properties', 'Competitive rates and accommodation included', 'Portfolio-building at iconic destinations', 'Brand partnership and networking opportunities', 'Dedicated placement support throughout', 'Verified reviews to boost your profile'].map((item) => (
              <div key={item} className="flex items-center space-x-4 p-5 bg-white border border-neutral-200">
                <span className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0" />
                <span className="text-sm text-black">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Modal */}
      {step > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setStep(0)}>
          <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Apply for Residency</h3>
              <button onClick={() => setStep(0)} className="text-neutral-300 hover:text-black"><X size={20} /></button>
            </div>

            {/* Progress */}
            <div className="flex space-x-2 mb-8">
              {[1,2,3].map((s) => <div key={s} className={`h-1 flex-1 ${step >= s ? 'bg-black' : 'bg-neutral-200'}`} />)}
            </div>
            <p className="text-neutral-400 text-sm mb-6">Step {step} of 3</p>

            {step === 1 && (
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Full Name *</label><input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" /></div>
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" /></div>
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Phone</label><input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" /></div>
                <button onClick={() => setStep(2)} className="btn-primary w-full">Continue</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Years of Experience</label><input type="text" value={form.experience} onChange={(e) => setForm({...form, experience: e.target.value})} className="input-field" /></div>
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Specialisms</label><input type="text" value={form.specialisms} onChange={(e) => setForm({...form, specialisms: e.target.value})} className="input-field" placeholder="e.g. Massage, Facials, Yoga" /></div>
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Availability</label><input type="text" value={form.availability} onChange={(e) => setForm({...form, availability: e.target.value})} className="input-field" placeholder="e.g. Available from June 2026" /></div>
                <div className="flex gap-3"><button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button><button onClick={() => setStep(3)} className="btn-primary flex-1">Continue</button></div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Why do you want a residency?</label><textarea rows={5} value={form.motivation} onChange={(e) => setForm({...form, motivation: e.target.value})} className="input-field" /></div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                  <button onClick={async () => {
                    setSubmitting(true)
                    await supabase.from('residency_applications').insert({ name: form.name, email: form.email, phone: form.phone || null, experience: form.experience || null, specialisms: form.specialisms || null, motivation: form.motivation || null, availability: form.availability || null, status: 'pending' })
                    setSubmitting(false); setStep(0)
                    setForm({ name: '', email: '', phone: '', experience: '', specialisms: '', motivation: '', availability: '' })
                    alert('Application submitted!')
                  }} disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button>
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
