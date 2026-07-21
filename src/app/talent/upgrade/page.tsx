'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { FEATURED_PROFILE_PRICE } from '@/lib/constants'
import { Star, Check, Sparkles } from 'lucide-react'

// Go Featured - £10/month featured profile subscription. This page is also
// the Stripe return URL for the featured_profile checkout (?success=true /
// ?cancelled=true), so it must read the query string.

export default function UpgradePage() {
  return (
    <Suspense fallback={<DashboardShell role="talent"><div className="skeleton h-64 w-full" /></DashboardShell>}>
      <UpgradeContent />
    </Suspense>
  )
}

const BENEFITS = [
  'Top of search results when properties browse talent',
  'Featured in the homepage carousel',
  'Social media promotion by Wellness House Collective',
  'Inclusion in the WHC newsletter to employers',
]

function UpgradeContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const cancelled = searchParams.get('cancelled') === 'true'

  const [profileId, setProfileId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agency/settings')
        if (res.ok) {
          const s = await res.json()
          setProfileId(s.settings?.profile_id || null)
        }
      } catch { /* the button will explain */ }
    }
    load()
  }, [])

  async function goFeatured() {
    if (busy) return
    if (!profileId) { setError('Complete your profile first, then go featured.'); return }
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'featured_profile', candidateId: profileId, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) {
        setError(j.error || 'Could not start the payment - please try again.')
        setBusy(false)
        return
      }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusy(false)
    }
  }

  return (
    <DashboardShell role="talent">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={22} className="text-accent" />
          <h1 className="text-2xl font-serif font-bold text-ink">Go Featured</h1>
        </div>
        <p className="text-[13px] text-gray-500 mb-6 max-w-xl">
          Put your profile in front of the properties that matter. Featured profiles sit at the top of every search and carry the gold star employers look for.
        </p>

        {success && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            Payment received - your profile is now featured. It can take a minute or two to appear; manage your subscription any time from Billing.
          </div>
        )}
        {cancelled && (
          <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg mb-4">
            Checkout cancelled - you have not been charged. You can go featured whenever you are ready.
          </div>
        )}
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="dashboard-card mb-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Star size={20} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-ink">Featured Profile</p>
                <p className="text-[12px] text-muted mt-0.5">Cancel any time from Billing</p>
              </div>
            </div>
            <p className="text-[20px] font-semibold text-ink">
              £{(FEATURED_PROFILE_PRICE / 100).toFixed(0)}<span className="text-[12px] text-muted font-normal">/month</span>
            </p>
          </div>

          <div className="space-y-2.5 mb-6">
            {BENEFITS.map(benefit => (
              <div key={benefit} className="flex gap-2.5">
                <Check size={15} className="text-accent mt-0.5 shrink-0" />
                <p className="text-[13px] text-secondary">{benefit}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={goFeatured}
            disabled={busy}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy ? 'Taking you to payment...' : `Go Featured - £${(FEATURED_PROFILE_PRICE / 100).toFixed(0)}/month`}
          </button>
        </div>

        <p className="text-[11px] text-muted">
          Billed monthly through Stripe. Your featured placement starts as soon as payment completes and renews automatically until you cancel.
        </p>
      </div>
    </DashboardShell>
  )
}
