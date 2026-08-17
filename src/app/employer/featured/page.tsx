'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Check, Crown, Home, Megaphone, Sparkles, Users } from 'lucide-react'

type CommercialSetting = {
  product_key: string
  label: string
  description: string
  price_pence: number
  billing_interval: 'month' | 'year' | 'one_off'
  is_active: boolean
}

function priceLabel(setting: CommercialSetting | null) {
  if (!setting) return 'Loading…'
  const pounds = setting.price_pence / 100
  const amount = Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`
  return `${amount}/${setting.billing_interval === 'year' ? 'year' : 'month'}`
}

export default function EmployerFeaturedPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [setting, setSetting] = useState<CommercialSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: auth }, productRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch('/api/commercial-settings?product=featured_employer', { cache: 'no-store' }),
      ])
      if (auth.user) {
        const { data } = await supabase.from('employer_profiles').select('*').eq('user_id', auth.user.id).maybeSingle()
        setProfile(data)
      }
      if (productRes.ok) {
        const product = await productRes.json()
        setSetting(product.setting || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const isFeatured = useMemo(() => {
    if (!profile?.featured_employer) return false
    if (!profile.featured_until) return true
    return new Date(profile.featured_until).getTime() > Date.now()
  }, [profile])

  async function startCheckout() {
    if (!profile?.id || !setting) return
    setCheckoutLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/featured-employer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId: profile.id, returnUrl: window.location.origin }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not start checkout.')
        setCheckoutLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not start checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return <DashboardShell role="employer"><div className="space-y-4"><div className="skeleton h-12 w-1/3" /><div className="skeleton h-72 w-full" /></div></DashboardShell>
  }

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.property_name || profile?.company_name}>
      <div className="mb-8">
        <p className="dashboard-eyebrow">Visibility</p>
        <h1 className="dashboard-title">Get Featured</h1>
        <p className="dashboard-intro">Put your property in front of approved spa and wellness professionals across WHC Concierge.</p>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="dashboard-card !p-0 overflow-hidden">
          <div className="bg-[#0b2f4d] px-7 py-8 text-white">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[#d4b477]"><Crown size={20} /></div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4b477]">Featured Hotel / Employer</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <h2 className="text-[34px] font-semibold tracking-[-0.03em]">{priceLabel(setting)}</h2>
              <span className="mb-1 text-[12px] text-white/55">cancel through billing</span>
            </div>
            <p className="mt-4 max-w-2xl text-[13px] leading-6 text-white/65">{setting?.description || 'Premium property visibility across WHC Concierge.'}</p>
          </div>

          <div className="grid gap-5 p-7 sm:grid-cols-2">
            {[
              [Home, 'Featured property placement', 'Appear above standard properties in the public property directory with a gold Featured badge.'],
              [Sparkles, 'Homepage exposure', 'Eligible Featured properties appear in a dedicated homepage section for active talent.'],
              [Users, 'Talent announcement', 'Approved Talent receive a one-time in-app and email announcement when your Featured subscription first starts.'],
              [Megaphone, 'Extra role prominence', 'Your property brand is more visible wherever candidates are researching employers and opportunities.'],
            ].map(([Icon, title, copy]: any) => (
              <div key={title} className="rounded-2xl border border-border bg-[#f7f5f0] p-5">
                <Icon size={17} className="mb-3 text-[#9c7a42]" />
                <p className="text-[13px] font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-[12px] leading-5 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-card">
            <p className="dashboard-eyebrow">Your status</p>
            {isFeatured ? (
              <>
                <div className="mt-3 flex items-center gap-2 text-[18px] font-semibold text-ink"><Check size={18} className="text-emerald-600" /> Featured is active</div>
                <p className="mt-2 text-[12px] leading-5 text-muted">{profile?.featured_until ? `Current paid period runs until ${new Date(profile.featured_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Your property is currently featured.'}</p>
                <a href="/employer/billing" className="mt-5 inline-flex items-center gap-1 text-[12px] font-semibold text-[#0b2f4d]">Manage billing <ArrowRight size={13} /></a>
              </>
            ) : (
              <>
                <p className="mt-3 text-[18px] font-semibold text-ink">Standard visibility</p>
                <p className="mt-2 text-[12px] leading-5 text-muted">Upgrade whenever you want. The price shown here is controlled by WHC Admin and is the exact amount sent to Stripe at checkout.</p>
                <button type="button" onClick={startCheckout} disabled={!setting || checkoutLoading} className="mt-5 w-full rounded-xl bg-[#0b2f4d] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#123f64] disabled:opacity-50">
                  {checkoutLoading ? 'Opening secure checkout…' : `Go Featured — ${priceLabel(setting)}`}
                </button>
              </>
            )}
          </div>

          <div className="dashboard-card">
            <p className="text-[13px] font-semibold text-ink">Featured is separate from Preferred Employer</p>
            <p className="mt-2 text-[12px] leading-5 text-muted">Preferred Employer is the annual agency membership/status. Featured Hotel is a marketing and visibility subscription, so you can use either product independently.</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
