'use client'

import { useState, useEffect } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { JOB_TIERS } from '@/lib/constants'
import { Check } from 'lucide-react'

const tiers = [
  { key: 'Bronze', price: '£150', days: 30, features: ['30-day listing', 'Basic matching', 'Applicant tracking'] },
  { key: 'Silver', price: '£200', days: 60, features: ['60-day listing', 'Enhanced matching', 'Priority support', 'Applicant tracking'] },
  { key: 'Gold', price: '£225', days: 75, features: ['75-day listing', 'Advanced matching', 'Featured placement', 'Priority support', 'Direct messaging'] },
  { key: 'Platinum', price: '£250', days: 90, features: ['90-day listing', 'Priority matching', 'Homepage featuring', 'Social media promotion', 'Dedicated support', 'Full analytics'] },
]

export default function PostRolePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [selectedTier, setSelectedTier] = useState('Silver')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  const handleCheckout = async () => {
    if (!profile) return
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'job_posting', tier: selectedTier, employerId: profile.id, returnUrl: window.location.origin }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setCheckoutLoading(false)
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-bold text-black mb-2">Post a Role</h1>
      <p className="text-neutral-400 mb-8">Choose a package to list your vacancy.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tiers.map((tier) => (
          <div key={tier.key} onClick={() => setSelectedTier(tier.key)}
            className={`border p-6 cursor-pointer transition-all ${selectedTier === tier.key ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
            <h3 className="font-bold text-black mb-1">{tier.key}</h3>
            <p className="text-2xl font-bold text-black">{tier.price}</p>
            <p className="text-xs text-neutral-400 mb-4">{tier.days} days</p>
            <ul className="space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center space-x-2 text-xs text-neutral-500">
                  <Check size={12} className="text-black flex-shrink-0" /><span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button onClick={handleCheckout} disabled={checkoutLoading || !profile}
        className="btn-primary disabled:opacity-50">
        {checkoutLoading ? 'Redirecting to payment...' : `Continue with ${selectedTier} — ${tiers.find(t => t.key === selectedTier)?.price}`}
      </button>
    </DashboardShell>
  )
}
