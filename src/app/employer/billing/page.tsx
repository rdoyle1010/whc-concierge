'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, ExternalLink, Briefcase } from 'lucide-react'

export default function EmployerBillingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (!prof) { setLoading(false); return }

      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*')
        .eq('employer_id', prof.id)
        .order('posted_date', { ascending: false })

      const normalizedJobs = (jobs || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        status: j.is_live ? 'active' : 'closed',
      }))
      setListings(normalizedJobs)
      setLoading(false)
    }
    load()
  }, [])

  const handleManagePayment = async () => {
    setRedirecting(true)
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setRedirecting(false)
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error)
      setRedirecting(false)
    }
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="employer"><div className="space-y-4"><div className="skeleton h-12 w-1/3 mb-6" /><div className="skeleton h-64 w-full" /></div></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Billing & Payment</h1>
        <p className="text-[13px] text-muted mt-1">Manage payment methods and view billing history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="dashboard-card">
          <div className="text-muted mb-2"><Briefcase size={16} /></div>
          <p className="text-[24px] font-semibold text-ink">{listings.length}</p>
          <p className="text-[11px] text-muted">Total job posts</p>
        </div>
        <div className="dashboard-card">
          <div className="text-muted mb-2"><CreditCard size={16} /></div>
          <p className="text-[24px] font-semibold text-ink">{listings.filter(l => l.is_live).length}</p>
          <p className="text-[11px] text-muted">Active listings</p>
        </div>
        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-1">Tier</p>
          <p className={`text-[13px] font-medium ${tierClass(profile?.subscription_tier || 'Standard')}`}>
            {profile?.subscription_tier || 'Standard'}
          </p>
        </div>
      </div>

      {/* Payment & Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card lg:col-span-2">
          <p className="text-[14px] font-medium text-ink mb-6">Payment Methods</p>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-neutral-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-ink">Stripe Payment Methods</p>
                <p className="text-[12px] text-muted mt-0.5">Manage your stored payment methods</p>
              </div>
            </div>
            <button
              onClick={handleManagePayment}
              disabled={redirecting}
              className="btn-secondary text-[12px] flex items-center gap-1"
            >
              {redirecting ? 'Redirecting...' : 'Manage'}
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-4">Need Help?</p>
          <p className="text-[13px] text-muted">
            For subscription changes or billing support, contact our team at support@whcconcierge.com
          </p>
        </div>
      </div>

      {/* Job Posting History */}
      <div className="dashboard-card">
        <p className="text-[14px] font-medium text-ink mb-4">Job Posting History</p>
        {listings.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={24} className="mx-auto text-muted mb-2" />
            <p className="text-[13px] text-muted">No job postings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[12px] font-medium text-muted py-3">Job Title</th>
                  <th className="text-left text-[12px] font-medium text-muted py-3">Tier</th>
                  <th className="text-left text-[12px] font-medium text-muted py-3">Posted Date</th>
                  <th className="text-left text-[12px] font-medium text-muted py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(job => (
                  <tr key={job.id} className="border-b border-border hover:bg-neutral-50/50 transition-colors">
                    <td className="text-[13px] text-ink font-medium py-3">{job.title}</td>
                    <td className="text-[13px] py-3">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${tierClass(job.tier || 'Standard')}`}>
                        {job.tier || '—'}
                      </span>
                    </td>
                    <td className="text-[13px] text-muted py-3">
                      {job.posted_date ? new Date(job.posted_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="text-[13px] py-3">
                      <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${job.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>
                        {job.is_live ? 'Live' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
