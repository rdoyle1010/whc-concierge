'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Activity, Users, Building2, Lightbulb, Clock } from 'lucide-react'

// Who is actually using this.
//
// The only signal the platform had was auth.users.last_sign_in_at, which
// answers a different question badly: a session lasts weeks, so somebody who
// signed in once in July and has worked in the platform every day since still
// reads as one visit in July.
//
// Minutes here are distinct five-minute buckets in which the person was seen,
// not wall-clock time with a tab open. A laptop left running overnight adds
// nothing. That makes the number smaller than a naive one and worth believing.

type Person = {
  userId: string
  role: string
  name: string
  email: string | null
  minutes: number
  views: number
  days: number
  lastSeen: string
}

type Payload = {
  days?: number
  people?: Person[]
  totals?: { people: number; talent: number; employer: number; consultant: number; admin: number; minutes: number }
  unavailable?: boolean
}

const WINDOWS = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
]

function readableMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function ago(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 120) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const ROLE_LABEL: Record<string, string> = {
  talent: 'Talent', employer: 'Hotel / employer', consultant: 'Consultancy', admin: 'Admin', unknown: 'Unknown',
}

export default function AdminActivityPage() {
  const [days, setDays] = useState(1)
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/activity?days=${days}`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : { people: [] })
      .then(setData)
      .catch(() => setData({ people: [] }))
      .finally(() => setLoading(false))
  }, [days])

  const people = (data?.people || []).filter(person => group === 'all' || person.role === group)
  const totals = data?.totals

  const cards = [
    { key: 'all', icon: <Users size={16} />, label: 'Everyone', value: totals?.people ?? 0 },
    { key: 'talent', icon: <Users size={16} />, label: 'Talent', value: totals?.talent ?? 0 },
    { key: 'employer', icon: <Building2 size={16} />, label: 'Hotels', value: totals?.employer ?? 0 },
    { key: 'consultant', icon: <Lightbulb size={16} />, label: 'Consultancy', value: totals?.consultant ?? 0 },
  ]

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-6">
      <p className="dashboard-eyebrow">Engagement</p>
      <h1 className="dashboard-title">Who has been online</h1>
      <p className="dashboard-intro">
        Time here is minutes of actual use, counted in five-minute blocks. A tab left open overnight adds nothing,
        so the figure is smaller than a raw session length and worth believing.
      </p>
    </div>

    <div className="mb-5 flex flex-wrap gap-2">
      {WINDOWS.map(window => <button
        key={window.days}
        type="button"
        onClick={() => setDays(window.days)}
        className={`rounded-full px-4 py-2 text-[12px] transition-colors ${
          days === window.days ? 'bg-[#1c1c1c] text-white' : 'border border-border bg-white text-secondary hover:border-[#1c1c1c]'}`}
      >{window.label}</button>)}
    </div>

    {data?.unavailable ? <div className="dashboard-card">
      <p className="text-[13px] text-amber-700">
        The activity table has not been created yet. Run the user_activity migration and everything from then on
        will be recorded here.
      </p>
    </div> : loading ? <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1c1c1c] border-t-transparent" />
    </div> : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => <button
          key={card.key}
          type="button"
          onClick={() => setGroup(card.key)}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            group === card.key ? 'border-[#1c1c1c] bg-white' : 'border-border bg-[#f1f1f1] hover:border-[#1c1c1c]'}`}
        >
          <div className="flex items-center gap-2 text-muted">{card.icon}<span className="dashboard-eyebrow !text-[9px]">{card.label}</span></div>
          <p className="mt-2 text-[26px] font-semibold leading-none text-ink">{card.value}</p>
        </button>)}
      </div>

      {totals && totals.people > 0 && <p className="mb-4 flex items-center gap-2 text-[12px] text-muted">
        <Clock size={13} />{readableMinutes(totals.minutes)} of use across {totals.people} {totals.people === 1 ? 'person' : 'people'}
      </p>}

      <div className="dashboard-card !p-0 overflow-hidden">
        {people.length === 0 ? <div className="p-8 text-center">
          <Activity size={24} className="mx-auto mb-3 text-muted" />
          <p className="text-[13px] text-muted">
            Nobody recorded in this window. If the platform is live and this stays empty, the migration may not have run.
          </p>
        </div> : <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left">
                {['Person', 'Workspace', 'Time on platform', 'Pages', days > 1 ? 'Days active' : 'Last seen'].map(heading =>
                  <th key={heading} className="dashboard-eyebrow !text-[9px] px-4 py-3 font-medium">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {people.map(person => <tr key={person.userId} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{person.name}</p>
                  {person.email && <p className="text-[11px] text-muted">{person.email}</p>}
                </td>
                <td className="px-4 py-3 text-secondary">{ROLE_LABEL[person.role] || person.role}</td>
                <td className="px-4 py-3 font-medium text-ink">{readableMinutes(person.minutes)}</td>
                <td className="px-4 py-3 text-secondary">{person.views}</td>
                <td className="px-4 py-3 text-secondary">{days > 1 ? `${person.days} of ${days}` : ago(person.lastSeen)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>}
      </div>

      <p className="mt-4 text-[10.5px] leading-4 text-muted">
        Only that somebody was active is recorded, and in which workspace. The pages they opened and the records
        they looked at are not, deliberately: a per-page trail of your own members is surveillance rather than
        analytics, and it is the first thing a data request would ask for.
      </p>
    </>}
  </DashboardShell>
}
