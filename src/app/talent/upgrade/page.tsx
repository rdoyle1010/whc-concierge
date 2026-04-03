'use client'

import { useState, useEffect } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Star, TrendingUp, Users, Megaphone, Check } from 'lucide-react'

const features = [
  { icon: <TrendingUp size={20} />, title: 'Top of Search Results', desc: 'Appear first when employers search for talent.' },
  { icon: <Users size={20} />, title: 'Homepage Carousel', desc: 'Featured in the talent spotlight on the homepage.' },
  { icon: <Megaphone size={20} />, title: 'Social Media Feature', desc: 'Promoted across our social channels.' },
  { icon: <Star size={20} />, title: 'Newsletter Inclusion', desc: 'Featured in our weekly employer newsletter.' },
]

export default function TalentUpgradePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [featuredCount, setFeaturedCount] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      const { count } = await supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }).eq('is_featured', true)
      setFeaturedCount(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'featured_profile', candidateId: profile?.id, returnUrl: window.location.origin }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setCheckoutLoading(false)
  }

  const slotsAvailable = Math.max(0, 10 - featuredCount)

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-black mb-2">Feature Your Profile</h1>
        <p className="text-neutral-400 mb-8">Stand out from the crowd with premium visibility.</p>

        {profile?.is_featured ? (
          <div className="bg-neutral-50 border border-neutral-200 p-8 text-center">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4"><Star size={20} /></div>
            <h3 className="text-xl font-bold text-black mb-2">You&apos;re Featured</h3>
            <p className="text-neutral-400 text-sm">
              Your profile is featured until {profile.featured_until ? new Date(profile.featured_until).toLocaleDateString() : 'your subscription ends'}.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((f) => (
                <div key={f.title} className="bg-white border border-neutral-200 p-5">
                  <div className="text-neutral-400 mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-black text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-neutral-400">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-black text-white p-8 text-center">
              <p className="text-3xl font-bold mb-1">£20<span className="text-lg font-normal text-white/50">/month</span></p>
              <p className="text-white/50 text-sm mb-1">{slotsAvailable} of 10 featured slots available</p>
              <p className="text-white/30 text-xs mb-6">Cancel anytime. No long-term commitment.</p>
              {slotsAvailable > 0 ? (
                <button onClick={handleCheckout} disabled={checkoutLoading} className="bg-white text-black px-8 py-3 text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50">
                  {checkoutLoading ? 'Redirecting...' : 'Feature My Profile — £20/month'}
                </button>
              ) : (
                <p className="text-white/50 text-sm">All featured slots are currently taken. Check back soon.</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
