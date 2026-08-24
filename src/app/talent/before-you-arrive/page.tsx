'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, MapPin, ShieldCheck, Utensils, BriefcaseBusiness, BedDouble } from 'lucide-react'

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
    const { error } = await supabase.from('booking_arrival_packs').update({ acknowledged_at: new Date().toISOString() }).eq('id', id)
    if (!error) setPacks(p => p.map(x => x.id === id ? { ...x, acknowledged_at: new Date().toISOString() } : x))
    setBusy(null)
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

  return <DashboardShell role="talent" userName={profile?.full_name}>
    <div className="max-w-5xl">
      <p className="dashboard-eyebrow">Flexible work</p>
      <h1 className="dashboard-title">Before You Arrive</h1>
      <p className="dashboard-intro max-w-3xl">Everything you need once an Agency shift or Residency placement is confirmed. The pack is taken from the property's operational fact file at the point your booking is confirmed.</p>

      {!packs.length ? <div className="dashboard-panel mt-7"><p className="text-[13px] font-medium text-ink">No confirmed arrival packs yet.</p><p className="text-[12px] text-muted mt-1">Your first pack will appear here automatically after a booking is confirmed.</p></div> : <div className="space-y-6 mt-7">
        {packs.map(pack => {
          const s = pack.snapshot || {}
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
            {pack.booking_type === 'residency' && <Section icon={<BedDouble size={15} className="text-accent"/>} title="Residency stay details" data={s.residency} />}
          </article>
        })}
      </div>}
    </div>
  </DashboardShell>
}
