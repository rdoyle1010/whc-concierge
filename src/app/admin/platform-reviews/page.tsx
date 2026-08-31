'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Star, RefreshCw, MessageSquareText } from 'lucide-react'

type ReviewItem = {
  id: string
  reviewer_role: 'talent' | 'employer'
  reviewer_name: string
  rating: number
  comment?: string | null
  job_title: string
  hired_at?: string | null
  created_at: string
}

export default function AdminPlatformReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [average, setAverage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'talent' | 'employer'>('all')

  async function load() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/platform-reviews', { cache: 'no-store' }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) setError(body.error || 'Could not load platform reviews.')
    else {
      setItems(body.items || [])
      setAverage(Number(body.average || 0))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => filter === 'all' ? items : items.filter(item => item.reviewer_role === filter), [items, filter])
  const fiveStar = items.filter(item => Number(item.rating) === 5).length
  const withComments = items.filter(item => Boolean(item.comment?.trim())).length

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="dashboard-eyebrow">Reputation & testimonials</p>
        <h1 className="dashboard-title">Platform Reviews</h1>
        <p className="dashboard-intro">Every completed-hire review of Spa Platform and Wellness House Collective, from Talent and property partners, in one place.</p>
      </div>
      <button type="button" onClick={load} disabled={loading} className="btn-secondary inline-flex items-center gap-2 self-start"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Refresh</button>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric label="Total reviews" value={items.length} />
      <Metric label="Average rating" value={items.length ? average.toFixed(1) : '-'} suffix={items.length ? '/5' : ''} />
      <Metric label="Five-star reviews" value={fiveStar} />
      <Metric label="Written testimonials" value={withComments} />
    </div>

    <div className="mb-5 flex flex-wrap gap-2">
      {(['all','talent','employer'] as const).map(value => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold ${filter === value ? 'bg-[#0b2f4d] text-white' : 'border border-border bg-white text-secondary'}`}>{value === 'all' ? 'All reviews' : value === 'talent' ? 'Talent reviews' : 'Property reviews'}</button>)}
    </div>

    {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{error}</div>}
    {loading ? <div className="dashboard-card flex h-52 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"/></div>
    : visible.length === 0 ? <div className="dashboard-card py-16 text-center"><MessageSquareText size={32} className="mx-auto mb-3 text-muted/40"/><p className="text-[13px] text-muted">No platform reviews in this view yet.</p></div>
    : <div className="space-y-4">{visible.map(item => <article key={item.id} className="dashboard-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-semibold text-ink">{item.reviewer_name}</h2>
              <span className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-[#10283b]">{item.reviewer_role === 'talent' ? 'Talent' : 'Property'}</span>
            </div>
            <p className="mt-1 text-[12px] text-muted">Completed placement · {item.job_title}</p>
          </div>
          <div className="text-left md:text-right">
            <div className="flex gap-0.5 md:justify-end">{Array.from({length:5}).map((_, index) => <Star key={index} size={15} className={index < item.rating ? 'fill-[#0b2f4d] text-[#0b2f4d]' : 'text-border'}/>)}</div>
            <p className="mt-1 text-[10px] text-muted">{new Date(item.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</p>
          </div>
        </div>
        {item.comment?.trim() ? <blockquote className="mt-4 rounded-xl border border-[#e3e7eb] bg-[#f5f6f8] px-4 py-4 text-[13px] leading-6 text-secondary">“{item.comment.trim()}”</blockquote> : <p className="mt-4 text-[11px] italic text-muted">Rating submitted without a written comment.</p>}
      </article>)}</div>}
  </DashboardShell>
}

function Metric({ label, value, suffix = '' }: { label: string; value: string | number; suffix?: string }) {
  return <div className="dashboard-card !p-4"><p className="text-[9px] uppercase tracking-[.14em] text-muted">{label}</p><p className="mt-2 text-[24px] font-semibold tracking-[-.03em] text-ink">{value}<span className="ml-1 text-[11px] font-normal text-muted">{suffix}</span></p></div>
}
