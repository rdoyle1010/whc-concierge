'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MapPin, Briefcase, Star, X, Heart, ArrowLeft, ChevronUp } from 'lucide-react'

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
  { id: 's1', title: 'Senior Spa Therapist', location: 'London', salary_min: 32000, salary_max: 38000, tier: 'Platinum', job_type: 'Full-time', specialism: 'Massage Therapy', description: 'Join our award-winning ESPA Life team delivering world-class treatments to discerning guests.', employer_profiles: { company_name: 'Corinthia London', property_type: 'Luxury Hotel & Spa' }, requirements: ['CIDESCO qualified', '3+ years luxury spa', 'Excellent communication'], benefits: ['Staff accommodation', 'Treatment allowance', 'Career progression'] },
  { id: 's2', title: 'Spa Manager', location: 'Scotland', salary_min: 45000, salary_max: 55000, tier: 'Gold', job_type: 'Full-time', specialism: 'Spa Management', description: 'Lead spa operations at one of Scotland\'s most prestigious wellness destinations.', employer_profiles: { company_name: 'Gleneagles', property_type: 'Resort & Spa' }, requirements: ['5+ years management', 'Revenue management', 'Team leadership'], benefits: ['Relocation package', 'Bonus scheme', 'Use of facilities'] },
  { id: 's3', title: 'Wellness Practitioner', location: 'London', salary_min: 35000, salary_max: 42000, tier: 'Silver', job_type: 'Full-time', specialism: 'Holistic Therapy', description: 'Deliver Eastern-inspired wellness rituals at our flagship Knightsbridge property.', employer_profiles: { company_name: 'Mandarin Oriental', property_type: 'Luxury Hotel & Spa' }, requirements: ['Holistic therapy qualifications', '2+ years experience'], benefits: ['Meals on duty', 'Training budget'] },
  { id: 's4', title: 'Beauty Therapist', location: 'Mayfair, London', salary_min: 28000, salary_max: 34000, tier: 'Gold', job_type: 'Full-time', specialism: 'Beauty Therapy', description: 'Premium facial and body treatments for high-profile clients.', employer_profiles: { company_name: 'The Lanesborough', property_type: 'Luxury Hotel & Spa' }, requirements: ['NVQ Level 3', 'Luxury experience'], benefits: ['Staff meals', 'Product discounts'] },
  { id: 's5', title: 'Yoga Instructor', location: 'Cotswolds', salary_min: 30000, salary_max: 36000, tier: 'Platinum', job_type: 'Full-time', specialism: 'Yoga & Pilates', description: 'Lead daily yoga classes at our exclusive countryside wellness retreat.', employer_profiles: { company_name: 'Soho Farmhouse', property_type: 'Members Club & Spa' }, requirements: ['200hr+ yoga training', 'Multiple styles'], benefits: ['Accommodation included', 'Membership benefits'] },
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
      const { data } = await supabase.from('job_listings').select('*, employer_profiles(company_name, logo_url, location, property_type)').eq('status', 'active').order('created_at', { ascending: false }).limit(50)
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
    if (userId) {
      await supabase.from('swipes').insert({ user_id: userId, target_id: currentJob.id, direction, target_type: 'job' })
      if (direction === 'right') {
        const { data: match } = await supabase.from('matches').select('id').eq('job_id', currentJob.id).eq('candidate_id', userId).single()
        if (match) { setTimeout(() => setShowMatch(true), 400); return }
      }
    }
    setTimeout(() => { setSwipeDir(null); setCurrentIndex(prev => prev + 1); setExpanded(false) }, 400)
  }, [currentJob, userId, supabase, swipeDir])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') handleSwipe('left'); if (e.key === 'ArrowRight') handleSwipe('right') }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleSwipe])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4" /><p className="text-neutral-400 text-sm">Loading roles...</p></div>
    </div>
  )

  if (currentIndex >= jobs.length) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <p className="text-6xl mb-6">&#10024;</p>
        <h2 className="text-3xl font-bold text-black mb-3">You&apos;re all caught up</h2>
        <p className="text-neutral-400 mb-10">You&apos;ve seen all available roles. New roles are added daily.</p>
        <div className="space-y-3">
          <Link href="/talent/dashboard" className="btn-primary block text-center">Go to Dashboard</Link>
          <Link href="/" className="btn-ghost block text-center">Back to Home</Link>
        </div>
      </div>
    </div>
  )

  if (showMatch) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center animate-match-pop">
        <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart size={40} className="text-white" fill="white" />
        </div>
        <h2 className="text-4xl font-bold text-black mb-2">It&apos;s a Match</h2>
        <p className="text-neutral-400 mb-1">{currentJob?.employer_profiles?.company_name}</p>
        <p className="text-black text-lg font-medium mb-10">{currentJob?.title}</p>
        <div className="space-y-3 max-w-xs mx-auto">
          <Link href="/talent/messages" className="btn-primary block text-center">Send a Message</Link>
          <button onClick={() => { setShowMatch(false); setSwipeDir(null); setCurrentIndex(prev => prev + 1); setExpanded(false) }} className="btn-ghost block w-full text-center">Keep Browsing</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-100 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-neutral-400 hover:text-black text-sm flex items-center space-x-1 transition-colors"><ArrowLeft size={16} /><span>Back</span></Link>
        <p className="text-black font-semibold text-sm">WHC Concierge</p>
        <p className="text-neutral-300 text-sm">{currentIndex + 1} / {jobs.length}</p>
      </div>

      {/* Card */}
      <div className="pt-14 flex items-center justify-center min-h-screen px-4 pb-28">
        {/* Background card */}
        {jobs[currentIndex + 1] && (
          <div className="absolute w-full max-w-md h-[70vh] max-h-[580px] bg-neutral-100 scale-[0.94] translate-y-2 opacity-30" />
        )}

        <div className={`swipe-card relative w-full max-w-md h-[70vh] max-h-[580px] bg-white border border-neutral-200 overflow-hidden shadow-sm
          ${swipeDir === 'left' ? 'swipe-left' : swipeDir === 'right' ? 'swipe-right' : ''}`}>
          {/* Photo */}
          <div className="h-[45%] relative overflow-hidden">
            <img src={currentJob?.employer_profiles?.logo_url || photoUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4">
              <span className={`text-xs font-medium px-3 py-1 ${
                currentJob?.tier === 'Platinum' ? 'bg-black text-white' : currentJob?.tier === 'Gold' ? 'bg-neutral-700 text-white' : 'bg-white text-neutral-600 border border-neutral-200'
              }`}>{currentJob?.tier || 'Standard'}</span>
            </div>
            <div className="absolute top-4 right-4 text-xs text-white/80 bg-black/30 px-2 py-1">{currentJob?.employer_profiles?.property_type || 'Luxury Property'}</div>

            {/* Swipe labels */}
            {swipeDir === 'right' && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><span className="text-emerald-600 text-2xl font-bold border-2 border-emerald-500 px-6 py-2 rotate-[-8deg]">INTERESTED</span></div>}
            {swipeDir === 'left' && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><span className="text-red-500 text-2xl font-bold border-2 border-red-500 px-6 py-2 rotate-[8deg]">PASS</span></div>}
          </div>

          {/* Content */}
          <div className="h-[55%] p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <p className="text-neutral-400 text-xs tracking-wider uppercase mb-1">{currentJob?.employer_profiles?.company_name}</p>
              <h2 className="text-2xl font-bold text-black mb-2">{currentJob?.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-neutral-400 mb-3">
                <span className="flex items-center space-x-1"><MapPin size={13} /><span>{currentJob?.location}</span></span>
                <span className="flex items-center space-x-1"><Briefcase size={13} /><span>{currentJob?.job_type}</span></span>
              </div>
              <p className="text-xl font-semibold text-black mb-2">
                {currentJob?.salary_min && currentJob?.salary_max ? `£${currentJob.salary_min.toLocaleString()} – £${currentJob.salary_max.toLocaleString()}` : 'Competitive Salary'}
              </p>
              {currentJob?.specialism && <span className="inline-block text-xs border border-neutral-200 text-neutral-500 px-3 py-1 mb-2">{currentJob.specialism}</span>}

              {/* Expand toggle */}
              <button onClick={() => setExpanded(!expanded)} className="flex items-center text-xs text-neutral-400 hover:text-black mt-2 transition-colors">
                <ChevronUp size={14} className={`mr-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />{expanded ? 'Less' : 'More details'}
              </button>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-3 animate-fade-in">
                  {currentJob?.description && <p className="text-neutral-400 text-sm leading-relaxed">{currentJob.description}</p>}
                  {currentJob?.requirements?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Requirements</p>
                      <ul className="space-y-1">{currentJob.requirements.map((r: string, i: number) => <li key={i} className="text-neutral-400 text-sm flex items-start space-x-2"><span className="w-1 h-1 bg-black rounded-full mt-2 flex-shrink-0" /><span>{r}</span></li>)}</ul>
                    </div>
                  )}
                  {currentJob?.benefits?.length > 0 && (
                    <div className="flex flex-wrap gap-2">{currentJob.benefits.map((b: string, i: number) => <span key={i} className="text-xs bg-neutral-100 text-neutral-500 px-2.5 py-1">{b}</span>)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-8 pt-4 bg-gradient-to-t from-neutral-50 to-transparent">
        <div className="flex items-center justify-center space-x-8">
          <button onClick={() => handleSwipe('left')}
            className="w-14 h-14 border border-neutral-300 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all group">
            <X size={24} className="text-neutral-400 group-hover:text-red-500" />
          </button>
          <button onClick={() => handleSwipe('right')}
            className="w-16 h-16 bg-black flex items-center justify-center hover:bg-neutral-800 transition-colors">
            <Heart size={28} className="text-white" />
          </button>
        </div>
        <p className="text-center text-neutral-300 text-xs mt-3">Arrow keys or buttons to swipe</p>
      </div>
    </div>
  )
}
