'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Banknote, BookOpen, BriefcaseBusiness, CreditCard, Megaphone, RefreshCw, Sparkles } from 'lucide-react'

function pounds(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format((Number(pence || 0)) / 100)
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/revenue', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load revenue data.')
      setData(json)
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return <DashboardShell role="admin" userName="Admin">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7">
      <div>
        <p className="dashboard-eyebrow">Commercial performance</p>
        <h1 className="dashboard-title">Revenue</h1>
        <p className="dashboard-intro">A clear view of money recorded by WHC and the recurring value currently booked across the platform.</p>
      </div>
      <button type="button" onClick={load} disabled={loading} className="btn-secondary inline-flex items-center gap-2 text-[12px]"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </div>

    {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

    {loading && !data ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div> : data && <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Metric icon={<Banknote size={18} />} label="Recorded WHC revenue this month" value={pounds(data.recorded_revenue_pence)} note="Academy payments + Agency platform fees currently recorded in the database." emphasis />
        <Metric icon={<CreditCard size={18} />} label="Agency gross processed" value={pounds(data.agency.gross_pence)} note={`${data.agency.paid_bookings} paid booking${data.agency.paid_bookings === 1 ? '' : 's'} this month`} />
        <Metric icon={<Megaphone size={18} />} label="Advertising booked MRR" value={pounds(data.advertising.booked_mrr_pence)} note={`${data.advertising.live_adverts} paid, approved live advert${data.advertising.live_adverts === 1 ? '' : 's'}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <section className="dashboard-card">
          <div className="flex items-center gap-2 mb-5"><BookOpen size={17} className="text-accent" /><h2 className="text-[16px] font-semibold text-ink">Academy & Agency</h2></div>
          <div className="grid grid-cols-2 gap-3">
            <SmallMetric label="Academy revenue" value={pounds(data.academy.revenue_pence)} note={`${data.academy.paid_enrolments} paid enrolments`} />
            <SmallMetric label="WHC Agency revenue" value={pounds(data.agency.platform_revenue_pence)} note="Platform fees recorded this month" />
          </div>
        </section>

        <section className="dashboard-card">
          <div className="flex items-center gap-2 mb-5"><Sparkles size={17} className="text-accent" /><h2 className="text-[16px] font-semibold text-ink">Recurring products</h2></div>
          <div className="grid grid-cols-2 gap-3">
            <SmallMetric label="Featured Talent" value={String(data.subscriptions.featured_talent_active)} note="Active profiles" />
            <SmallMetric label="Agency Talent" value={String(data.subscriptions.agency_talent_active)} note="Active listings" />
            <SmallMetric label="Preferred Employers" value={String(data.subscriptions.preferred_employers_active)} note="Active memberships" />
            <SmallMetric label="Featured Employers" value={String(data.subscriptions.featured_employers_active)} note={`${pounds(data.subscriptions.featured_employer_mrr_pence)} configured MRR`} />
          </div>
        </section>
      </div>

      <section className="dashboard-card mb-6">
        <div className="flex items-center gap-2 mb-4"><BriefcaseBusiness size={17} className="text-accent" /><h2 className="text-[16px] font-semibold text-ink">Recruitment revenue tracking</h2></div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div><p className="text-[24px] font-semibold text-ink">{data.jobs.posted_this_month}</p><p className="text-[12px] text-muted">jobs posted this month</p></div>
          <p className="max-w-2xl text-[12px] leading-6 text-secondary">Job adverts currently do not store a reliable payment transaction against each listing, so I am deliberately not calling these postings revenue. The next finance upgrade should add one central Stripe transaction ledger so every job advert, subscription and renewal can be reconciled as real cash received.</p>
        </div>
      </section>

      <div className="rounded-xl border border-[#e6dfd3] bg-[#fbf8f1] px-4 py-3 text-[11px] leading-5 text-[#6f614d]">{data.note}</div>
    </>}
  </DashboardShell>
}

function Metric({ icon, label, value, note, emphasis = false }: { icon: React.ReactNode; label: string; value: string; note: string; emphasis?: boolean }) {
  return <div className={`dashboard-card ${emphasis ? 'ring-1 ring-accent/20' : ''}`}><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1e7] text-accent mb-4">{icon}</div><p className="text-[10px] uppercase tracking-[0.12em] text-muted">{label}</p><p className="text-[27px] font-semibold tracking-tight text-ink mt-1">{value}</p><p className="text-[11px] leading-5 text-muted mt-2">{note}</p></div>
}

function SmallMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-border bg-[#faf9f6] p-4"><p className="text-[10px] uppercase tracking-[0.1em] text-muted">{label}</p><p className="text-[20px] font-semibold text-ink mt-1">{value}</p><p className="text-[11px] text-muted mt-1">{note}</p></div>
}
