'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Briefcase, Star, X, Heart, ArrowLeft, Sparkles, ChevronUp } from 'lucide-react'

const spaPhotos = [
  'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80',
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80',
  'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800&q=80',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80',
  'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80',
]

const sampleJobs = [
  { id: 's1', title: 'Senior Spa Therapist', location: 'London', salary_min: 32000, salary_max: 38000, tier: 'Platinum', job_type: 'Full-time', specialism: 'Massage Therapy', description: 'Join our award-winning ESPA Life team delivering world-class treatments to discerning guests in the heart of Whitehall.', employer_profiles: { company_name: 'Corinthia London', property_type: 'Luxury Hotel & Spa' }, requirements: ['CIDESCO or equivalent qualification', '3+ years luxury spa experience', 'Excellent communication skills'], benefits: ['Staff accommodation', 'Treatment allowance', 'Career progression'] },
  { id: 's2', title: 'Spa Manager', location: 'Perthshire, Scotland', salary_min: 45000, salary_max: 55000, tier: 'Gold', job_type: 'Full-time', specialism: 'Spa Management', description: 'Lead the spa operations team at one of Scotland\'s most prestigious wellness destinations with full P&L responsibility.', employer_profiles: { company_name: 'Gleneagles', property_type: 'Resort & Spa' }, requirements: ['5+ years management experience', 'Revenue management skills', 'Team leadership'], benefits: ['Relocation package', 'Bonus scheme', 'Use of facilities'] },
  { id: 's3', title: 'Wellness Practitioner', location: 'London', salary_min: 35000, salary_max: 42000, tier: 'Silver', job_type: 'Full-time', specialism: 'Holistic Therapy', description: 'Deliver Eastern-inspired wellness rituals and bespoke treatments at our flagship Knightsbridge property.', employer_profiles: { company_name: 'Mandarin Oriental', property_type: 'Luxury Hotel & Spa' }, requirements: ['Holistic therapy qualifications', '2+ years experience'], benefits: ['Meals on duty', 'Uniform provided', 'Training budget'] },
  { id: 's4', title: 'Beauty Therapist', location: 'Mayfair, London', salary_min: 28000, salary_max: 34000, tier: 'Gold', job_type: 'Full-time', specialism: 'Beauty Therapy', description: 'Join our prestigious beauty team delivering premium facial and body treatments to high-profile clients.', employer_profiles: { company_name: 'The Lanesborough', property_type: 'Luxury Hotel & Spa' }, requirements: ['NVQ Level 3 Beauty Therapy', 'Luxury spa experience preferred'], benefits: ['Staff meals', 'Generous tips', 'Product discounts'] },
  { id: 's5', title: 'Yoga Instructor', location: 'Cotswolds', salary_min: 30000, salary_max: 36000, tier: 'Platinum', job_type: 'Full-time', specialism: 'Yoga & Pilates', description: 'Lead daily yoga classes and private sessions at our exclusive countryside wellness retreat surrounded by rolling hills.', employer_profiles: { company_name: 'Soho Farmhouse', property_type: 'Members Club & Spa' }, requirements: ['200hr+ yoga teacher training', 'Multiple style proficiency'], benefits: ['Accommodation included', 'Wellness allowance', 'Membership benefits'] },
  { id: 's6', title: 'Nail Technician', location: 'Edinburgh', salary_min: 25000, salary_max: 30000, tier: 'Silver', job_type: 'Part-time', specialism: 'Nail Technology', description: 'Create stunning nail artistry for our luxury spa guests using premium products in a beautiful Georgian setting.', employer_profiles: { company_name: 'The Balmoral', property_type: 'Luxury Hotel & Spa' }, requirements: ['Nail technology qualification', 'Gel and acrylic proficiency'], benefits: ['Flexible hours', 'Product training', 'Staff rate'] },
]

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

      const { data } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, logo_url, location, property_type)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50)

      // Use real data if available, otherwise sample cards
      setJobs(data && data.length > 0 ? data : sampleJobs)
      setLoading(false)
    }
    load()
  }, [])

  const currentJob = jobs[currentIndex]
  const photoUrl = spaPhotos[currentIndex % spaPhotos.length]

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentJob || swipeDir) return

    setSwipeDir(direction)

    // Save swipe to database
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
          setTimeout(() => setShowMatch(true), 500)
          return
        }
      }
    }

    setTimeout(() => {
      setSwipeDir(null)
      setCurrentIndex((prev) => prev + 1)
      setExpanded(false)
    }, 500)
  }, [currentJob, userId, supabase, swipeDir])

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
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/30 text-sm">Finding your perfect match...</p>
        </div>
      </div>
    )
  }

  // All caught up
  if (currentIndex >= jobs.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <Sparkles size={44} className="text-gold" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-white mb-4">You&apos;re All Caught Up</h2>
          <p className="text-white/40 mb-4 font-light text-lg">You&apos;ve explored all available roles for now.</p>
          <p className="text-white/25 mb-10 text-sm">New roles are added daily. Check back soon or set up alerts.</p>
          <div className="space-y-3">
            <Link href="/talent/dashboard" className="btn-primary block text-center">Go to Dashboard</Link>
            <Link href="/" className="btn-ghost block text-center">Back to Home</Link>
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
          <div className="w-36 h-36 rounded-full gold-gradient flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
            <Heart size={60} className="text-white" fill="white" />
          </div>
          <h2 className="text-5xl font-serif font-bold text-white mb-3">It&apos;s a Match!</h2>
          <p className="text-white/50 mb-2 text-lg">{currentJob?.employer_profiles?.company_name} is interested too</p>
          <p className="gradient-text-gold text-xl font-serif mb-12">{currentJob?.title}</p>
          <div className="space-y-3 max-w-xs mx-auto">
            <Link href="/talent/messages" className="btn-primary block text-center">Send a Message</Link>
            <button onClick={() => { setShowMatch(false); setSwipeDir(null); setCurrentIndex(prev => prev + 1); setExpanded(false) }}
              className="btn-ghost block w-full text-center">Keep Swiping</button>
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
        <p className="text-white/30 text-sm font-medium">{currentIndex + 1} / {jobs.length}</p>
      </div>

      {/* Card Stack */}
      <div className="absolute inset-0 flex items-center justify-center px-4 pt-16 pb-32">
        {/* Background card preview */}
        {jobs[currentIndex + 1] && (
          <div className="absolute w-full max-w-md mx-auto h-[72vh] max-h-[620px] rounded-3xl overflow-hidden scale-[0.92] -translate-y-1 opacity-40">
            <img src={spaPhotos[(currentIndex + 1) % spaPhotos.length]} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        {/* Current card */}
        <div className={`swipe-card relative w-full max-w-md mx-auto h-[72vh] max-h-[620px] rounded-3xl overflow-hidden shadow-2xl shadow-black/50
          ${swipeDir === 'left' ? 'swipe-left' : swipeDir === 'right' ? 'swipe-right' : ''}
        `}>
          {/* Full-bleed photo */}
          <img src={currentJob?.employer_profiles?.logo_url || photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/20" />

          {/* Swipe labels */}
          {swipeDir === 'right' && (
            <div className="absolute top-10 left-6 z-20 border-[3px] border-emerald-400 text-emerald-400 rounded-2xl px-6 py-2 text-2xl font-bold rotate-[-12deg] animate-fade-in tracking-wide">
              INTERESTED
            </div>
          )}
          {swipeDir === 'left' && (
            <div className="absolute top-10 right-6 z-20 border-[3px] border-red-400 text-red-400 rounded-2xl px-6 py-2 text-2xl font-bold rotate-[12deg] animate-fade-in tracking-wide">
              PASS
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between">
            <span className="text-white/40 text-xs uppercase tracking-widest font-medium">
              {currentJob?.employer_profiles?.property_type || 'Luxury Property'}
            </span>
            <span className={tierBadge(currentJob?.tier || 'Silver')}>{currentJob?.tier || 'Standard'}</span>
          </div>

          {/* Content */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-6">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex justify-center mb-3">
              <ChevronUp size={18} className={`text-white/30 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <p className="text-gold text-sm font-medium tracking-wide mb-1">{currentJob?.employer_profiles?.company_name}</p>
            <h2 className="text-3xl font-serif font-bold text-white mb-3 leading-tight">{currentJob?.title}</h2>

            <div className="flex items-center space-x-4 text-white/50 text-sm mb-3">
              <span className="flex items-center space-x-1.5"><MapPin size={14} /><span>{currentJob?.location}</span></span>
              <span className="flex items-center space-x-1.5"><Briefcase size={14} /><span>{currentJob?.job_type}</span></span>
            </div>

            <p className="text-2xl font-serif font-semibold text-white mb-2">
              {currentJob?.salary_min && currentJob?.salary_max
                ? `£${currentJob.salary_min.toLocaleString()} – £${currentJob.salary_max.toLocaleString()}`
                : 'Competitive Salary'}
            </p>

            {currentJob?.specialism && (
              <span className="inline-block text-xs bg-gold/20 text-gold px-3 py-1 rounded-full mb-3">{currentJob.specialism}</span>
            )}

            {/* Expanded details */}
            {expanded && (
              <div className="animate-fade-in space-y-4 mt-3 pt-3 border-t border-white/10">
                {currentJob?.description && (
                  <p className="text-white/50 text-sm leading-relaxed line-clamp-4">{currentJob.description}</p>
                )}
                {currentJob?.requirements?.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Requirements</p>
                    <ul className="space-y-1.5">
                      {currentJob.requirements.slice(0, 3).map((r: string, i: number) => (
                        <li key={i} className="text-white/40 text-sm flex items-start space-x-2">
                          <Star size={10} className="text-gold mt-1 flex-shrink-0" /><span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentJob?.benefits?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentJob.benefits.map((b: string, i: number) => (
                      <span key={i} className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full">{b}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 pt-6 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/90 to-transparent">
        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/15 flex items-center justify-center
                       hover:bg-red-500/20 hover:border-red-400/40 hover:scale-110 transition-all duration-300 group"
          >
            <X size={28} className="text-white/50 group-hover:text-red-400 transition-colors" />
          </button>

          <button
            onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center
                       shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/50 hover:scale-110 transition-all duration-300"
          >
            <Heart size={34} className="text-white" />
          </button>
        </div>
        <p className="text-center text-white/15 text-xs mt-4 tracking-wider">Use arrow keys or buttons to swipe</p>
      </div>
    </div>
  )
}
