'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, MapPin, ShieldCheck, Utensils, BriefcaseBusiness, BedDouble, FileText, ExternalLink } from 'lucide-react'

const BUCKET = 'property-fact-documents'

function rows(obj: any) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).filter(([,v]) => v !== null && v !== undefined && v !== '' && v !== false)
}

const label = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export default function BeforeYouArrivePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [packs, setPacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: prof } = await supabase.from('candidate_profiles').select('id,full_name').eq('user_id', user.id).maybeSingle()
      setProfile(prof)
      if (prof) {
        const { data } = await supabase.from('booking_arrival_packs').select('*').eq('candidate_id', prof.id).order('generated_at', { ascending: false })
        setPacks(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function acknowledge(id: string) {
    setBusy(id)
    const now = new Date().toISOString()
    const { error } = await supabase.from('booking_arrival_packs').update({ acknowledged_at: now }).eq('id', id)
    if (!error) setPacks(p => p.map(x => x.id === id ? { ...x, acknowledged_at: now } : x))
    setBusy(null)
  }

  async function openDocument(doc: any) {
    if (!doc?.path) return
    setError(''); setOpening(doc.path)
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.path, 60 * 10)
    if (error || !data?.signedUrl) setError('This document could not be opened. Please ask the property to re-upload it if the problem continues.')
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    setOpening(null)
  }

  const Section = ({ icon, title, data }: { icon: React.ReactNode; title: string; data: any }) => {
    const values = rows(data)
    if (!values.length) return null
    return <section className="border-t border-border pt-5 mt-5">
      <div className="flex items-center gap-2 mb-3 text-ink font-medium text-[13px]">{icon}{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {values.map(([k,v]) => <div key={k} className="text-[12px] leading-5"><span className="block text-muted text-[10px] uppercase tracking-[.08em]">{label(k)}</span><span className="text-secondary whitespace-pre-wrap">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}</span></div>)}
      </div>
    </section>
  }

  if (loading) return <DashboardShell role="talent"><div className="skeleton h-72 rounded-md" /></DashboardShell>

  // Once a shift has passed the pack stops being a briefing and becomes a
  // record. Both are worth keeping - a professional going back to the same
  // property wants last time's parking instructions - but a stack of finished
  // shifts on top of tomorrow's is the wrong way round.
  const shiftEnd = (pack: any) => {
    const booking = pack?.snapshot?.booking || {}
    const day = booking.date || booking.end_date || booking.start_date
    if (!day) return null
    const time = String(booking.end_time || '23:59').slice(0, 5)
    const parsed = new Date(`${String(day).slice(0, 10)}T${time}:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const isPast = (pack: any) => {
    const end = shiftEnd(pack)
    return end != null && end.getTime() < Date.now()
  }
  const upcoming = packs.filter(pack => !isPast(pack))
  const past = packs.filter(isPast)

  return <DashboardShell role="talent" userName={profile?.full_name}>
    <div className="max-w-5xl">
      <p className="dashboard-eyebrow">Flexible work</p>
      <h1 className="dashboard-title">Before You Arrive</h1>
      <p className="dashboard-intro max-w-3xl">Everything you need once an Agency shift or Residency placement is accepted - where to go, which door, who to ask for, what to bring. The pack is taken from the property's operational fact file at the moment your booking is accepted, so it is what they told us on the day you were booked.</p>

      {packs.length > 0 && <div className="mt-6 inline-flex border border-border bg-white p-1">
        <button type="button" onClick={() => setShowPast(false)} className={`px-4 py-2 text-[12px] ${!showPast ? 'bg-[#1c1c1c] text-white' : 'text-secondary'}`}>Coming up{upcoming.length > 0 ? ` (${upcoming.length})` : ''}</button>
        <button type="button" onClick={() => setShowPast(true)} className={`px-4 py-2 text-[12px] ${showPast ? 'bg-[#1c1c1c] text-white' : 'text-secondary'}`}>Archive{past.length > 0 ? ` (${past.length})` : ''}</button>
      </div>}

      {error && <div className="mt-5 bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

      {!packs.length ? <div className="dashboard-panel mt-7"><p className="text-[13px] font-medium text-ink">No arrival packs yet.</p><p className="text-[12px] text-muted mt-1">Your first pack will appear here automatically as soon as you accept an Agency shift or a Residency placement.</p></div> : <div className="space-y-6 mt-7">
        {(showPast ? past : upcoming).map(pack => {
          const s = pack.snapshot || {}
          const documents = Array.isArray(s.documents) ? s.documents : []
          return <article key={pack.id} className="dashboard-panel">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[.14em] text-accent">{pack.booking_type === 'residency' ? 'Residency placement' : 'Agency shift'}</p>
                <h2 className="font-serif text-[24px] text-ink mt-1">{s.property?.name || 'Property'}</h2>
                <p className="text-[12px] text-muted mt-1">Generated {new Date(pack.generated_at).toLocaleString('en-GB')}</p>
              </div>
              {pack.acknowledged_at ? <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700"><CheckCircle2 size={14}/> Read & acknowledged</span> : <button onClick={() => acknowledge(pack.id)} disabled={busy === pack.id} className="btn-primary text-[12px] disabled:opacity-50">{busy === pack.id ? 'Saving...' : 'I have read this pack'}</button>}
            </div>

            <Section icon={<MapPin size={15} className="text-accent"/>} title="Getting there" data={s.property} />
            <Section icon={<BriefcaseBusiness size={15} className="text-accent"/>} title="Arrival & shift" data={{ ...(s.arrival || {}), ...(s.booking || {}) }} />
            <Section icon={<Utensils size={15} className="text-accent"/>} title="Welfare & breaks" data={s.welfare} />
            <Section icon={<ShieldCheck size={15} className="text-accent"/>} title="Safety essentials" data={s.safety} />
            <Section icon={<BriefcaseBusiness size={15} className="text-accent"/>} title="Spa operations & commercial expectations" data={s.spa} />

            {documents.length > 0 && <section className="border-t border-border pt-5 mt-5">
              <div className="flex items-center gap-2 mb-3 text-ink font-medium text-[13px]"><FileText size={15} className="text-accent"/>Useful documents</div>
              <div className="space-y-2">
                {documents.map((doc: any, i: number) => <button key={`${doc.path}-${i}`} type="button" onClick={() => openDocument(doc)} disabled={opening === doc.path} className="w-full flex items-center justify-between gap-3 border border-border bg-white px-4 py-3 text-left hover:border-accent disabled:opacity-50">
                  <div className="min-w-0"><p className="text-[12px] font-medium text-ink truncate">{doc.name || 'Document'}</p><p className="text-[10px] text-muted mt-0.5">Secure document from the confirmed property pack</p></div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-accent shrink-0">{opening === doc.path ? 'Opening...' : 'Open'} <ExternalLink size={12}/></span>
                </button>)}
              </div>
            </section>}

            {pack.booking_type === 'residency' && <Section icon={<BedDouble size={15} className="text-accent"/>} title="Residency stay details" data={s.residency} />}
          </article>
        })}
        {(showPast ? past : upcoming).length === 0 && <div className="dashboard-panel">
          <p className="text-[13px] font-medium text-ink">{showPast ? 'Nothing in the archive yet.' : 'No shifts coming up.'}</p>
          <p className="text-[12px] text-muted mt-1">{showPast
            ? 'A pack moves here once its shift has finished.'
            : past.length > 0 ? 'Your finished shifts are in the archive.' : 'Your next pack will appear here as soon as you accept a shift.'}</p>
        </div>}
      </div>}
    </div>
  </DashboardShell>
}
