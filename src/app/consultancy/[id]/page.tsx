'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, Star, MapPin, Globe, Linkedin, Send } from 'lucide-react'
import { useDialog } from '@/components/useDialog'
import { BUDGET_BANDS, ENGAGEMENT_TYPES, WORKS_WITH } from '@/lib/consultancy'

const worksWithLabel = (value: string) => WORKS_WITH.find(option => option.value === value)?.label || 'UK'
const engagementLabel = (value: string) => ENGAGEMENT_TYPES.find(type => type.value === value)?.label || value

export default function ConsultancyProfilePage() {
  const params = useParams()
  const id = String(params?.id || '')
  const [profile, setProfile] = useState<any>(null)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', budget_band: '', timeline: '' })
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const dialog = useDialog(() => setOpen(false), 'consultancy-enquiry-heading', { enabled: open })

  useEffect(() => {
    fetch(`/api/consultancy/public?id=${encodeURIComponent(id)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { setProfile(data?.profile || null); setPreview(Boolean(data?.preview)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  async function send() {
    setSending(true); setNotice(null)
    const res = await fetch('/api/consultancy/enquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consultancy_id: id, ...form }),
    })
    const body = await res.json().catch(() => ({}))
    setSending(false)
    if (!res.ok) { setNotice({ kind: 'error', text: body.error || 'Could not send that enquiry.' }); return }
    setNotice({ kind: 'ok', text: 'Sent. They will see it on their dashboard and reply to you directly.' })
    setForm({ subject: '', message: '', budget_band: '', timeline: '' })
    setOpen(false)
  }

  if (loading) return <><Navbar /><main className="max-w-4xl mx-auto px-6 py-24"><div className="skeleton h-64 w-full" /></main><Footer /></>
  if (!profile) return (
    <><Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-ink">This listing is not available</h1>
        <p className="mt-3 text-[14px] text-secondary">It may have been withdrawn, or it is not published yet.</p>
        <Link href="/consultancy" className="btn-secondary mt-8 inline-flex text-[13px]">Back to Consultancy</Link>
      </main><Footer /></>
  )

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-28 pb-12">
          {preview && (
            <div className="mb-6 border border-ink bg-[#f1f1f1] px-4 py-3">
              <p className="text-[13px] font-medium text-ink">Preview - nobody else can see this</p>
              <p className="mt-1 text-[12px] leading-6 text-secondary">
                This is exactly how your listing will read once it is published. Changes you have not saved yet will not
                appear here.{' '}
                <Link href="/talent/consultancy" className="font-semibold text-ink underline">Back to editing</Link>
              </p>
            </div>
          )}
          <Link href="/consultancy" className="text-[13px] text-secondary hover:text-ink inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Consultancy</Link>

          {profile.cover_image_url && (
            <div className="mt-6 aspect-[21/7] overflow-hidden border border-border bg-[#f1f1f1]">
              <img src={profile.cover_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <header className={`border-b border-border pb-8 ${profile.cover_image_url ? 'mt-8' : 'mt-6'}`}>
            {/* The logo sits with the name rather than floating above it: on its
                own it reads as a stray box, and a practice mark means nothing
                separated from the practice it belongs to. */}
            <div className="flex items-start gap-5">
              {profile.logo_url && (
                <div className="hidden h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-white sm:flex">
                  <img src={profile.logo_url} alt={profile.practice_name} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="min-w-0">
                {profile.featured && (
                  <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">
                    <Star size={11} fill="currentColor" /> Featured
                  </p>
                )}
                <h1 className="text-3xl font-semibold text-ink tracking-tight">{profile.practice_name}</h1>
                {profile.headline && <p className="mt-2 text-[15px] leading-7 text-secondary max-w-2xl">{profile.headline}</p>}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
              {profile.contact_name && <span>{profile.contact_name}</span>}
              {profile.based_in && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {profile.based_in}</span>}
              <span>Works {worksWithLabel(profile.works_with)}</span>
              {profile.years_experience ? <span>{profile.years_experience} years in the industry</span> : null}
              {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-ink underline"><Globe size={12} /> Website</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-ink underline"><Linkedin size={12} /> LinkedIn</a>}
            </div>

            {!preview && (
              <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-7 inline-flex items-center gap-2 text-[13px]">
                <Send size={14} /> Contact {profile.practice_name}
              </button>
            )}
            {notice && <p className={`mt-3 text-[12px] ${notice.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
          </header>

          {profile.summary && (
            <section className="py-8 border-b border-border">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">About the practice</h2>
              <p className="mt-3 text-[14px] leading-7 text-body whitespace-pre-line max-w-3xl">{profile.summary}</p>
            </section>
          )}

          {(profile.specialisms || []).length > 0 && (
            <section className="py-8 border-b border-border">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">Specialisms</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.specialisms.map((item: string) => (
                  <span key={item} className="border border-border px-3 py-1.5 text-[12px] text-secondary">{item}</span>
                ))}
              </div>
              {(profile.engagement_types || []).length > 0 && (
                <p className="mt-5 text-[12px] text-muted">
                  Available for {profile.engagement_types.map(engagementLabel).join(', ').toLowerCase()}
                  {profile.day_rate_from ? ` · from £${profile.day_rate_from}/day` : ''}.
                </p>
              )}
            </section>
          )}

          {(profile.projects || []).length > 0 && (
            <section className="py-8">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">Selected work</h2>
              <div className="mt-5 space-y-5">
                {profile.projects.map((project: any, index: number) => (
                  <article key={`${project.title}-${index}`} className="border border-border p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[16px] font-semibold text-ink">{project.title}</h3>
                      <p className="text-[11px] text-muted">{[project.client, project.location, project.year].filter(Boolean).join(' · ')}</p>
                    </div>
                    {project.image_url && (
                      <div className="mt-4 aspect-[16/9] overflow-hidden border border-border bg-[#f1f1f1]">
                        <img src={project.image_url} alt={project.title} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    )}
                    {project.summary && <p className="mt-3 text-[13px] leading-7 text-body whitespace-pre-line">{project.summary}</p>}
                    {project.outcome && (
                      <p className="mt-4 border-l-2 border-ink pl-4 text-[13px] leading-6 text-ink">
                        <span className="font-semibold">Outcome. </span>{project.outcome}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f]/70 p-4" onClick={() => setOpen(false)}>
            <div {...dialog.panelProps} className="w-full max-w-lg bg-white p-6" onClick={event => event.stopPropagation()}>
              <h2 id="consultancy-enquiry-heading" className="text-[18px] font-semibold text-ink">Contact {profile.practice_name}</h2>
              <p className="mt-1.5 text-[12px] leading-6 text-secondary">
                Say what the work is and roughly when. A consultant decides whether to take the call on those two things,
                so a line about each saves you both a week.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="enq-subject" className="eyebrow block mb-1.5">What is it about?</label>
                  <input id="enq-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Pre-opening for a 9-room spa, Q2 2027" className="input-field" />
                </div>
                <div>
                  <label htmlFor="enq-message" className="eyebrow block mb-1.5">The brief *</label>
                  <textarea id="enq-message" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="What you are trying to achieve, where you are now, and what good looks like." className="input-field" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="enq-budget" className="eyebrow block mb-1.5">Budget</label>
                    <select id="enq-budget" value={form.budget_band} onChange={e => setForm({ ...form, budget_band: e.target.value })} className="input-field">
                      <option value="">Prefer not to say</option>
                      {BUDGET_BANDS.map(band => <option key={band.value} value={band.value}>{band.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="enq-timeline" className="eyebrow block mb-1.5">Timing</label>
                    <input id="enq-timeline" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })}
                      placeholder="e.g. Starting March" className="input-field" />
                  </div>
                </div>
              </div>
              {notice?.kind === 'error' && <p className="mt-3 text-[12px] text-red-600">{notice.text}</p>}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-[13px]">Cancel</button>
                <button type="button" onClick={send} disabled={sending || form.message.trim().length < 30} className="btn-primary flex-1 text-[13px] disabled:opacity-50">
                  {sending ? 'Sending...' : 'Send enquiry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
