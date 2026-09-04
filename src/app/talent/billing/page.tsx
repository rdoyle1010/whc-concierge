'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, ExternalLink, AlertCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { AGENCY_LISTING_TIERS, FEATURED_PROFILE_PRICE, TALENT_MEMBERSHIPS } from '@/lib/constants'

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

  // Paid memberships are written by /api/commercial/confirm as membership_tier
  // + membership_stripe_customer_id - is_featured is a separate one-off product.
  const membershipTier = (profile?.membership_tier === 'standard' || profile?.membership_tier === 'pro') && profile?.membership_stripe_customer_id
    ? (profile.membership_tier as 'standard' | 'pro')
    : null
  const membership = membershipTier ? TALENT_MEMBERSHIPS[membershipTier] : null
  // A featured placement is only active until featured_until passes - a row
  // without the field is treated as still active.
  const featuredUntil = profile?.featured_until
  const isFeatured = Boolean(profile?.is_featured) && (featuredUntil == null || new Date(featuredUntil).getTime() > Date.now())
  const residencyMember = Boolean(profile?.residency_member)
  const hasSubscription = Boolean(membership) || isFeatured || residencyMember

  if (loading) return <DashboardShell role="talent"><div className="space-y-4"><div className="skeleton h-12 w-1/3 mb-6" /><div className="skeleton h-64 w-full" /></div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="mb-8">
        <p className="dashboard-eyebrow">Account</p>
        <h1 className="dashboard-title">Billing &amp; Subscription</h1>
        <p className="dashboard-intro">Manage your membership, featured placement and billing settings.</p>
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
                  {membership ? `${membership.label} - Active` : isFeatured ? 'Featured Profile - Active' : residencyMember ? 'Residency Membership - Active' : 'Free Plan'}
                </p>
                <p className="text-[12px] text-muted mt-0.5">
                  {membership
                    ? 'Manage or cancel your membership through the billing portal below.'
                    : isFeatured ? 'Your profile has premium visibility'
                      : residencyMember ? 'Manage or cancel your Residency membership through the billing portal below.'
                        : 'No active subscription'}
                </p>
              </div>
            </div>
            {hasSubscription && (
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>

          {hasSubscription && (
            <div className="space-y-3 pb-6 border-b border-border">
              {membership && (
                <>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted">Monthly price</span>
                    <span className="text-ink font-medium">£{(membership.price / 100).toFixed(2)}/month</span>
                  </div>
                  {profile.membership_renews_at && (
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-muted">Renews</span>
                      <span className="text-ink font-medium">
                        {new Date(profile.membership_renews_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              )}
              {isFeatured && (
                <>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted">Featured Profile</span>
                    <span className="text-ink font-medium">£{(FEATURED_PROFILE_PRICE / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted">Featured until</span>
                    <span className="text-ink font-medium">
                      {profile.featured_until ? new Date(profile.featured_until).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </span>
                  </div>
                </>
              )}
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
              <div className="space-y-2">
                <Link href="/talent/membership" className="btn-primary w-full flex items-center justify-center gap-2">
                  <CreditCard size={14} />
                  See membership plans
                </Link>
                {/* Featured buys visibility, not Interview Ready credits.
                    Leading with it sent anybody hunting for credits to the one
                    product that does not include them. */}
                <Link href="/talent/upgrade" className="btn-secondary w-full flex items-center justify-center gap-2">
                  Or feature my profile
                </Link>
              </div>
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

      {/* Agency Register listing */}
      <div className="dashboard-card mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-ink">
                {profile?.agency_available
                  ? `Agency Register - ${profile?.agency_tier === 'featured' ? AGENCY_LISTING_TIERS.featured.label : AGENCY_LISTING_TIERS.basic.label} plan`
                  : 'Agency Register - Not listed'}
              </p>
              <p className="text-[12px] text-muted mt-0.5">
                {profile?.agency_available
                  ? profile?.agency_listed_until
                    ? `${profile?.agency_tier === 'featured' ? AGENCY_LISTING_TIERS.featured.display : AGENCY_LISTING_TIERS.basic.display} · renews ${new Date(profile.agency_listed_until).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`
                    : 'No charge for your listing.'
                  : `Join from ${AGENCY_LISTING_TIERS.basic.display} to receive agency shift offers.`}
              </p>
            </div>
          </div>
          {profile?.agency_available && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />}
        </div>
        <div className="pt-5">
          {profile?.agency_available ? (
            profile?.agency_listed_until ? (
              <button onClick={handleManageSubscription} disabled={redirecting}
                className="btn-secondary w-full flex items-center justify-center gap-2">
                <ExternalLink size={14} />
                {redirecting ? 'Redirecting...' : 'Manage Agency Subscription'}
              </button>
            ) : (
              <Link href="/talent/agency/settings" className="btn-secondary w-full flex items-center justify-center gap-2">
                Agency Settings
              </Link>
            )
          ) : (
            <Link href="/talent/agency/settings" className="btn-primary w-full flex items-center justify-center gap-2">
              <Zap size={14} />
              Join the Agency Register
            </Link>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="dashboard-card">
        <p className="text-[14px] font-medium text-ink mb-4">Billing History</p>
        <div className="flex items-center gap-3 p-4 bg-neutral-50 border border-border rounded-lg">
          <AlertCircle size={16} className="text-muted shrink-0" />
          <p className="text-[13px] text-muted">Payments appear here after checkout.</p>
        </div>
      </div>
    </DashboardShell>
  )
}
