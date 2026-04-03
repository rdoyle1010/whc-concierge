'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Briefcase, Star, X, Heart, ArrowLeft, Sparkles, ChevronUp } from 'lucide-react'

export default function SwipeMatchPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      // Get jobs user hasn't swiped on yet
      let query = supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, logo_url, location, property_type)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      const { data } = await query
      setJobs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const currentJob = jobs[currentIndex]

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentJob) return

    setSwipeDir(direction)

    // Save swipe
    if (userId) {
      await supabase.from('swipes').insert({
        user_id: userId,
        target_id: currentJob.id,
        direction,
        target_type: 'job',
      })

      // Check for mutual match on right swipe
      if (direction === 'right') {
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .eq('job_id', currentJob.id)
          .eq('candidate_id', userId)
          .single()

        if (match) {
          setTimeout(() => setShowMatch(true), 400)
        }
      }
    }

    setTimeout(() => {
      setSwipeDir(null)
      setCurrentIndex((prev) => prev + 1)
      setExpanded(false)
    }, 400)
  }, [currentJob, userId, supabase])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleSwipe('left')
      if (e.key === 'ArrowRight') handleSwipe('right')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSwipe])

  const tierBadge = (tier: string) => {
    if (tier === 'Platinum') return 'badge-platinum'
    if (tier === 'Gold') return 'badge-gold'
    return 'badge-silver'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="animate-spin w-10 h-10 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  // All caught up
  if (currentIndex >= jobs.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center mx-auto mb-8 animate-float">
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">You&apos;re All Caught Up</h2>
          <p className="text-white/40 mb-10 font-light">You&apos;ve seen all available roles. Check back soon for new opportunities.</p>
          <div className="space-y-4">
            <Link href="/talent/dashboard" className="btn-primary block">Go to Dashboard</Link>
            <Link href="/" className="btn-ghost block">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  // Match animation overlay
  if (showMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="text-center animate-match-pop">
          <div className="w-32 h-32 rounded-full gold-gradient flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
            <Heart size={56} className="text-white" fill="white" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-white mb-3">It&apos;s a Match!</h2>
          <p className="text-white/50 mb-4">{currentJob?.employer_profiles?.company_name} is interested too</p>
          <p className="text-gold text-lg font-serif mb-10">{currentJob?.title}</p>
          <div className="space-y-3 max-w-xs mx-auto">
            <Link href="/talent/messages" className="btn-primary block">Send a Message</Link>
            <button onClick={() => { setShowMatch(false); setCurrentIndex(prev => prev + 1) }} className="btn-ghost block w-full">
              Keep Swiping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </Link>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
            <span className="text-white font-serif font-bold text-sm">W</span>
          </div>
        </div>
        <p className="text-white/30 text-sm">{currentIndex + 1} / {jobs.length}</p>
      </div>

      {/* Card Stack */}
      <div className="absolute inset-0 flex items-center justify-center px-4 pt-16 pb-32">
        {/* Next card preview */}
        {jobs[currentIndex + 1] && (
          <div className="absolute w-full max-w-md mx-auto h-[70vh] max-h-[600px] rounded-3xl bg-white/5 border border-white/5 scale-95 -translate-y-2" />
        )}

        {/* Current card */}
        <div className={`swipe-card relative w-full max-w-md mx-auto h-[70vh] max-h-[600px] rounded-3xl overflow-hidden shadow-2xl
          ${swipeDir === 'left' ? 'swipe-left' : swipeDir === 'right' ? 'swipe-right' : ''}
        `}>
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-navy-light to-ink">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          </div>

          {/* Swipe indicators */}
          {swipeDir === 'right' && (
            <div className="absolute top-8 left-8 z-20 border-4 border-green-400 text-green-400 rounded-xl px-6 py-2 text-2xl font-bold rotate-[-15deg] animate-fade-in">
              INTERESTED
            </div>
          )}
          {swipeDir === 'left' && (
            <div className="absolute top-8 right-8 z-20 border-4 border-red-400 text-red-400 rounded-xl px-6 py-2 text-2xl font-bold rotate-[15deg] animate-fade-in">
              PASS
            </div>
          )}

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
            {/* Tier badge */}
            <div className="absolute top-6 right-6">
              <span className={tierBadge(currentJob?.tier || 'Silver')}>{currentJob?.tier || 'Standard'}</span>
            </div>

            {/* Property info */}
            <div className="absolute top-6 left-6">
              <p className="text-white/50 text-xs uppercase tracking-wider">
                {currentJob?.employer_profiles?.property_type || 'Luxury Property'}
              </p>
            </div>

            <div className={`transition-all duration-300 ${expanded ? 'mb-0' : ''}`}>
              {/* Expand button */}
              <button onClick={() => setExpanded(!expanded)} className="w-full flex justify-center mb-4">
                <ChevronUp size={20} className={`text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>

              <p className="text-gold text-sm font-medium mb-1">{currentJob?.employer_profiles?.company_name}</p>
              <h2 className="text-3xl font-serif font-bold text-white mb-3">{currentJob?.title}</h2>

              <div className="flex items-center space-x-4 text-white/50 text-sm mb-4">
                <span className="flex items-center space-x-1"><MapPin size={14} /><span>{currentJob?.location}</span></span>
                <span className="flex items-center space-x-1"><Briefcase size={14} /><span>{currentJob?.job_type}</span></span>
              </div>

              <p className="text-xl font-serif font-semibold text-white mb-4">
                {currentJob?.salary_min && currentJob?.salary_max
                  ? `£${currentJob.salary_min.toLocaleString()} – £${currentJob.salary_max.toLocaleString()}`
                  : 'Competitive Salary'}
              </p>

              {/* Expanded details */}
              {expanded && (
                <div className="animate-fade-in space-y-3 mb-4">
                  {currentJob?.specialism && (
                    <span className="inline-block text-xs bg-gold/20 text-gold px-3 py-1 rounded-full">{currentJob.specialism}</span>
                  )}
                  {currentJob?.description && (
                    <p className="text-white/40 text-sm leading-relaxed line-clamp-4">{currentJob.description}</p>
                  )}
                  {currentJob?.requirements?.length > 0 && (
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Requirements</p>
                      <ul className="space-y-1">
                        {currentJob.requirements.slice(0, 3).map((r: string, i: number) => (
                          <li key={i} className="text-white/40 text-sm flex items-center space-x-2">
                            <Star size={10} className="text-gold" /><span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentJob?.benefits?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentJob.benefits.slice(0, 4).map((b: string, i: number) => (
                        <span key={i} className="text-xs bg-white/10 text-white/50 px-2.5 py-1 rounded-full">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 pt-4 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/80 to-transparent">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center
                       hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-300 group"
          >
            <X size={28} className="text-white/60 group-hover:text-red-400 transition-colors" />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center
                       shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 hover:scale-105 transition-all duration-300"
          >
            <Heart size={32} className="text-white" />
          </button>
        </div>
        <p className="text-center text-white/20 text-xs mt-4">Use arrow keys or buttons to swipe</p>
      </div>
    </div>
  )
}
