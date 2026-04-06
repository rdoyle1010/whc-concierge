'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TalentBillingPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    load()
  }, [])

  const handleManageSubscription = async () => {
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

  const hasSubscription = profile?.stripe_customer_id && profile?.is_featured

  if (loading) return <DashboardShell role="talent"><div className="space-y-4"><div className="skeleton h-12 w-1/3 mb-6" /><div className="skeleton h-64 w-full" /></div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Billing & Subscription</h1>
        <p className="text-[13px] text-muted mt-1">Manage your subscription and billing settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Subscription Status */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-[14px] font-medium text-ink">
                  {hasSubscription ? 'Featured Profile — Active' : 'Free Plan'}
                </p>
                <p className="text-[12px] text-muted mt-0.5">
                  {hasSubscription ? 'Your profile has premium visibility' : 'No active subscription'}
                </p>
              </div>
            </div>
            {hasSubscription && (
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>

          {hasSubscription && (
            <div className="space-y-3 pb-6 border-b border-border">
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-muted">Monthly price</span>
                <span className="text-ink font-medium">£10/month</span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-muted">Next billing date</span>
                <span className="text-ink font-medium">
                  {profile.featured_until ? new Date(profile.featured_until).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span className="text-muted">Status</span>
                <span className="text-emerald-600 font-medium">Active</span>
              </div>
            </div>
          )}

          <div className="pt-6">
            {hasSubscription ? (
              <button
                onClick={handleManageSubscription}
                disabled={redirecting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ExternalLink size={14} />
                {redirecting ? 'Redirecting...' : 'Manage Subscription'}
              </button>
            ) : (
              <Link href="/talent/upgrade" className="btn-primary w-full flex items-center justify-center gap-2">
                <CreditCard size={14} />
                Upgrade to Featured
              </Link>
            )}
          </div>
        </div>

        {/* Quick Facts */}
        <div className="dashboard-card">
          <p className="text-[14px] font-medium text-ink mb-4">Featured Benefits</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
              <p className="text-[12px] text-muted">Top of search results</p>
            </div>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
              <p className="text-[12px] text-muted">Homepage carousel feature</p>
            </div>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
              <p className="text-[12px] text-muted">Social media promotion</p>
            </div>
            <div className="flex gap-2">
              <div className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />
              <p className="text-[12px] text-muted">Newsletter inclusion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="dashboard-card">
        <p className="text-[14px] font-medium text-ink mb-4">Billing History</p>
        {hasSubscription ? (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-neutral-50/50">
              <div>
                <p className="text-[13px] font-medium text-ink">Featured Profile Subscription</p>
                <p className="text-[11px] text-muted mt-0.5">Renews monthly</p>
              </div>
              <p className="text-[13px] font-semibold text-ink">£10.00</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-border rounded-lg">
            <AlertCircle size={16} className="text-muted shrink-0" />
            <p className="text-[13px] text-muted">Your billing history will appear here once you have an active subscription.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
