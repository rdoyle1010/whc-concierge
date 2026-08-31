'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { ROLE_LEVELS } from '@/lib/constants'
import { Award, Check, Clock, Search, ShieldCheck, Users } from 'lucide-react'

type RecruitmentRequest = {
  id: string
  service: 'managed' | 'executive'
  job_title: string
  role_level: string | null
  salary_min: number | null
  salary_max: number | null
  location: string | null
  timeline: string | null
  status: 'new' | 'reviewing' | 'search_active' | 'shortlist_sent' | 'placed' | 'closed'
  created_at: string
}

const STATUS_LABELS: Record<RecruitmentRequest['status'], string> = {
  new: 'Received',
  reviewing: 'Being reviewed',
  search_active: 'Search underway',
  shortlist_sent: 'Shortlist sent',
  placed: 'Placed',
  closed: 'Closed',
}

const STATUS_STYLES: Record<RecruitmentRequest['status'], string> = {
  new: 'bg-blue-50 text-blue-700',
  reviewing: 'bg-amber-50 text-amber-700',
  search_active: 'bg-[#e8eef4] text-[#0b2f4d]',
  shortlist_sent: 'bg-[#0b2f4d] text-white',
  placed: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-secondary',
}

export default function EmployerRecruitmentPage() {
  const [requests, setRequests] = useState<RecruitmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [service, setService] = useState<'managed' | 'executive'>('managed')
  const [jobTitle, setJobTitle] = useState('')
  const [roleLevel, setRoleLevel] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [location, setLocation] = useState('')
  const [timeline, setTimeline] = useState('')
  const [brief, setBrief] = useState('')

  useEffect(() => {
    fetch('/api/employer/recruitment')
      .then(res => res.ok ? res.json() : { requests: [] })
      .then(json => setRequests(json.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function submit() {
    if (submitting) return
    setError(''); setNotice('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/employer/recruitment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, jobTitle, roleLevel, salaryMin, salaryMax, location, timeline, brief }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not send your request.'); return }
      setRequests(current => [json.request, ...current])
      setNotice('Request sent. WHC will come back to you within one working day.')
      setJobTitle(''); setRoleLevel(''); setSalaryMin(''); setSalaryMax(''); setLocation(''); setTimeline(''); setBrief('')
    } catch {
      setError('Could not send your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell role="employer">
      <div className="max-w-3xl">
        <p className="dashboard-eyebrow">Recruitment service</p>
        <h1 className="dashboard-title">Let WHC run the search</h1>
        <p className="dashboard-intro mb-6 max-w-2xl">
          For roles you would rather not run yourself, WHC manages the whole search: we work your brief against the verified
          register, screen for qualifications, brands and commercial fit, and send you a shortlist worth interviewing.
          You pay only on placement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="dashboard-card">
            <ShieldCheck size={18} className="text-[#0b2f4d] mb-2" />
            <p className="text-[13px] font-semibold text-ink mb-1">Pay on placement</p>
            <p className="text-[12px] text-secondary leading-relaxed">12.5% of first-year salary for managed recruitment; 15-20% for executive search. Nothing up front.</p>
          </div>
          <div className="dashboard-card">
            <Award size={18} className="text-[#0b2f4d] mb-2" />
            <p className="text-[13px] font-semibold text-ink mb-1">Replacement guarantee</p>
            <p className="text-[12px] text-secondary leading-relaxed">If the placement leaves within 8 weeks, we run the search again at no charge.</p>
          </div>
          <div className="dashboard-card">
            <Users size={18} className="text-[#0b2f4d] mb-2" />
            <p className="text-[13px] font-semibold text-ink mb-1">Specialist pool</p>
            <p className="text-[12px] text-secondary leading-relaxed">Every candidate comes from the WHC register: spa, wellness and luxury hospitality only.</p>
          </div>
        </div>

        <div className="dashboard-card mb-8">
          <h2 className="font-serif text-lg font-semibold text-ink mb-4">Start a search</h2>

          <div className="inline-flex border border-border rounded-lg overflow-hidden mb-5">
            <button type="button" onClick={() => setService('managed')} className={`px-4 py-2 text-[12px] font-semibold transition-colors ${service === 'managed' ? 'bg-[#0b2f4d] text-white' : 'text-secondary hover:text-ink'}`}>Managed recruitment</button>
            <button type="button" onClick={() => setService('executive')} className={`px-4 py-2 text-[12px] font-semibold transition-colors ${service === 'executive' ? 'bg-[#0b2f4d] text-white' : 'text-secondary hover:text-ink'}`}>Executive search</button>
          </div>
          <p className="text-[12px] text-secondary mb-5">
            {service === 'managed'
              ? 'Therapists, senior therapists, supervisors and spa managers. 12.5% of first-year salary, on placement.'
              : 'Directors and senior leadership. Retained search with a 15-20% fee agreed before we begin.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Role title *</label>
              <input aria-label="Role title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Spa Manager" className="input-field text-[13px] w-full" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Role level</label>
              <select aria-label="Role level" value={roleLevel} onChange={e => setRoleLevel(e.target.value)} className="input-field text-[13px] w-full">
                <option value="">Select...</option>
                {ROLE_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Salary from (£/year)</label>
              <input aria-label="Salary from (£/year)" value={salaryMin} onChange={e => setSalaryMin(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="e.g. 32000" className="input-field text-[13px] w-full" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Salary to (£/year)</label>
              <input aria-label="Salary to (£/year)" value={salaryMax} onChange={e => setSalaryMax(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="e.g. 38000" className="input-field text-[13px] w-full" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Location</label>
              <input aria-label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Mayfair, London" className="input-field text-[13px] w-full" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">When do you need them?</label>
              <input aria-label="When do you need them?" value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g. Within 8 weeks" className="input-field text-[13px] w-full" />
            </div>
          </div>

          <label className="block text-[12px] font-semibold text-ink mb-1.5">The brief *</label>
          <textarea aria-label="The brief" value={brief} onChange={e => setBrief(e.target.value)} rows={5} className="input-field text-[13px] w-full mb-1"
            placeholder="Tell us about the role and your property: treatments and brands, the team they will join, what a great hire looks like, and anything that has made this role hard to fill." />
          <p className="text-[11px] text-muted mb-4">The better the brief, the better the shortlist. A few honest sentences beat a formal job description.</p>

          {error && <p role="alert" className="text-[12.5px] text-red-600 font-medium mb-3">{error}</p>}
          {notice && <p role="status" className="text-[12.5px] text-green-700 font-medium mb-3 inline-flex items-center gap-1.5"><Check size={14} /> {notice}</p>}

          <button type="button" onClick={submit} disabled={submitting} className="btn-primary text-[13px]">
            {submitting ? 'Sending...' : 'Send the brief to WHC'}
          </button>
          <p className="text-[11px] text-muted mt-3">No cost and no commitment at this stage - sending a brief starts a conversation, not a contract.</p>
        </div>

        <div className="dashboard-card">
          <h2 className="font-serif text-lg font-semibold text-ink mb-4">Your search requests</h2>
          {loading ? (
            <p className="text-[13px] text-secondary">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-[13px] text-secondary">No searches yet. Send a brief above and WHC takes it from there.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(request => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink">{request.job_title}{request.role_level ? <span className="font-normal text-secondary"> · {request.role_level}</span> : null}</p>
                    <p className="text-[12px] text-secondary inline-flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} /> {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {request.location ? ` · ${request.location}` : ''}
                      {request.service === 'executive' ? ' · Executive search' : ''}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[request.status]}`}>{STATUS_LABELS[request.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
