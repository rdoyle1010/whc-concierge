'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles, Target, EyeOff, Star, MessageSquare, Store,
  ArrowRight, ChevronDown, ChevronUp, Building2, Clock, MapPin,
  Briefcase, Users, TrendingUp, Mail, ArrowUpRight
} from 'lucide-react'

const partners = [
  'Fairmont', 'Mandarin Oriental', 'Rosewood', 'Four Seasons',
  'Corinthia', 'The Lanesborough', 'Gleneagles', 'ESPA'
]

const features = [
  { icon: <Sparkles className="text-gold" size={24} />, title: 'Specialist Focus', desc: 'Built exclusively for luxury spa, wellness and hospitality. We understand your world.' },
  { icon: <Target className="text-gold" size={24} />, title: 'Intelligent Matching', desc: 'Our algorithm connects you with roles and candidates that truly fit — skills, culture and ambition.' },
  { icon: <EyeOff className="text-gold" size={24} />, title: 'Stealth Mode', desc: 'Block specific employers from seeing your profile. Search confidently without risk.' },
  { icon: <Star className="text-gold" size={24} />, title: 'Verified Reviews', desc: 'Transparent feedback from real placements. Make informed decisions about your next move.' },
  { icon: <MessageSquare className="text-gold" size={24} />, title: 'Direct Messaging', desc: 'Connect directly with hiring managers. No recruiters, no middlemen.' },
  { icon: <Store className="text-gold" size={24} />, title: 'Agency Marketplace', desc: 'Find flexible shift work at top properties. Book, confirm and get paid — all in one place.' },
]

const faqs = [
  { q: 'Is it free to create a candidate profile?', a: 'Yes, creating a candidate profile on WHC Concierge is completely free. You can browse roles, set up job alerts, and apply to positions without any cost. Premium features like priority visibility are available with optional subscription tiers.' },
  { q: 'How does the matching algorithm work?', a: 'Our intelligent matching considers your skills, experience, specialisms, location preferences, salary expectations, and career ambitions. It cross-references these with employer requirements to surface the most relevant opportunities.' },
  { q: 'What is Stealth Mode?', a: 'Stealth Mode allows you to block specific employers from viewing your profile. Perfect if you\'re currently employed and want to explore opportunities discreetly.' },
  { q: 'How much does it cost to post a role?', a: 'Role posting packages range from £150 to £250 depending on the tier. Silver gives a standard listing, Gold includes featured placement, and Platinum offers priority matching and social media promotion.' },
]

const tierBadge = (tier: string) => {
  if (tier === 'Platinum') return 'badge-platinum'
  if (tier === 'Gold') return 'badge-gold'
  return 'badge-silver'
}

export default function HomePage() {
  const supabase = createClient()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ properties: 0, roles: 0, candidates: 0 })

  useEffect(() => {
    async function load() {
      // Featured jobs — platinum/gold tier, active
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3)
      setFeaturedJobs(jobs || [])

      // Latest blog posts
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(3)
      setBlogPosts(posts || [])

      // Real stats
      const [propCount, jobCount, candCount] = await Promise.all([
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        properties: propCount.count || 0,
        roles: jobCount.count || 0,
        candidates: candCount.count || 0,
      })
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #0f0f1a 100%)' }}>
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="animate-fade-in-up inline-flex items-center space-x-2 bg-gold/10 border border-gold/20 rounded-full px-5 py-2.5 mb-8">
            <Sparkles size={14} className="text-gold" />
            <span className="text-gold/90 text-sm font-medium tracking-wide">The Home of Luxury Wellness Careers</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[0.95] mb-8 tracking-tight">
            Where Talent Meets{' '}
            <span className="gradient-text-gold italic">Luxury</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Connecting exceptional spa, wellness and hospitality professionals with the world&apos;s finest properties. No recruiters. No middlemen. Just the right match.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/roles/match" className="btn-primary text-lg px-10 py-4 flex items-center space-x-2">
              <span>Start Matching</span>
              <ArrowRight size={20} />
            </Link>
            <Link href="/register/employer" className="btn-ghost text-lg px-10 py-4">
              Post a Role
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up delay-400 grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div>
              <p className="text-4xl md:text-5xl font-serif font-bold gradient-text-gold">{stats.properties || '480'}+</p>
              <p className="text-white/30 text-sm mt-2 tracking-wide uppercase">Properties</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-serif font-bold gradient-text-gold">{stats.roles || '1,200'}+</p>
              <p className="text-white/30 text-sm mt-2 tracking-wide uppercase">Active Roles</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-serif font-bold gradient-text-gold">96%</p>
              <p className="text-white/30 text-sm mt-2 tracking-wide uppercase">Match Rate</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-white/20" size={28} />
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="bg-white border-b border-gray-100/50 py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs text-gray-300 uppercase tracking-[0.25em] mb-10">Trusted by the world&apos;s finest</p>
          <div className="flex items-center justify-center flex-wrap gap-10 md:gap-16">
            {partners.map((name) => (
              <span key={name} className="text-gray-200 font-serif text-xl md:text-2xl font-semibold hover:text-gold transition-colors duration-500 cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-24 md:py-32 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">The Platform</p>
            <h2 className="section-heading mb-5">Why WHC Concierge?</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg font-light">Everything you need to advance your wellness career or find exceptional talent.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((f) => (
              <div key={f.title} className="card group cursor-default">
                <div className="w-12 h-12 bg-gold/8 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold/15 transition-colors duration-500">
                  {f.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED ROLES ===== */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Featured Opportunities</p>
              <h2 className="section-heading">Latest Roles</h2>
            </div>
            <Link href="/jobs" className="hidden md:flex items-center text-gold font-medium hover:text-gold-dark transition-colors">
              View All <ArrowUpRight size={18} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {(featuredJobs.length > 0 ? featuredJobs : [
              { id: '1', title: 'Senior Spa Therapist', location: 'London', salary_min: 32000, salary_max: 38000, tier: 'Platinum', job_type: 'Full-time', employer_profiles: { company_name: 'Corinthia London' } },
              { id: '2', title: 'Spa Manager', location: 'Scotland', salary_min: 45000, salary_max: 55000, tier: 'Gold', job_type: 'Full-time', employer_profiles: { company_name: 'Gleneagles' } },
              { id: '3', title: 'Wellness Practitioner', location: 'London', salary_min: 35000, salary_max: 42000, tier: 'Silver', job_type: 'Full-time', employer_profiles: { company_name: 'Mandarin Oriental' } },
            ]).map((job: any) => (
              <div key={job.id} className="card group border-t-2 border-transparent hover:border-gold/40 p-0 overflow-hidden">
                {/* Card header gradient */}
                <div className="h-32 bg-gradient-to-br from-ink via-navy-light to-ink relative">
                  <div className="absolute inset-0 bg-gold/5" />
                  <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                    <span className={tierBadge(job.tier || 'Silver')}>{job.tier || 'Standard'}</span>
                    <span className="text-white/40 text-xs">{job.job_type}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-ink mb-1 group-hover:text-gold transition-colors duration-300">{job.title}</h3>
                  <p className="text-gold/80 font-medium text-sm mb-4">{job.employer_profiles?.company_name}</p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2"><MapPin size={14} /><span>{job.location}</span></div>
                    <div className="flex items-center space-x-2"><Briefcase size={14} /><span>
                      {job.salary_min && job.salary_max ? `£${(job.salary_min/1000).toFixed(0)}k – £${(job.salary_max/1000).toFixed(0)}k` : 'Competitive'}
                    </span></div>
                  </div>
                  <Link href="/roles/match" className="mt-6 flex items-center text-gold text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                    View Role <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 md:hidden">
            <Link href="/jobs" className="btn-secondary">View All Roles</Link>
          </div>
        </div>
      </section>

      {/* ===== RESIDENCY ===== */}
      <section className="py-24 md:py-32" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Residency Programme</p>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-6">
                Elite Wellness <span className="italic gradient-text-gold">Residencies</span>
              </h2>
              <p className="text-white/40 leading-relaxed mb-10 text-lg font-light">
                Exclusive 1–6 month placements at the world&apos;s most iconic properties. Build your portfolio, expand your network, and elevate your career.
              </p>
              <ul className="space-y-4 mb-10">
                {['Direct booking with top-tier properties', 'Portfolio-building opportunities', 'Brand partnership exposure', 'Competitive rates and accommodation'].map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
                      <Star size={10} className="text-white" />
                    </div>
                    <span className="text-white/60 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/residency" className="btn-primary">Explore Residencies</Link>
            </div>
            <div className="relative">
              <div className="card-dark p-10">
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { icon: <Building2 className="text-gold" size={28} />, stat: '50+', label: 'Partner Properties' },
                    { icon: <Clock className="text-gold" size={28} />, stat: '1–6', label: 'Month Placements' },
                    { icon: <Users className="text-gold" size={28} />, stat: '200+', label: 'Practitioners Placed' },
                    { icon: <TrendingUp className="text-gold" size={28} />, stat: '94%', label: 'Return Rate' },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-4">
                      <div className="mx-auto mb-3">{s.icon}</div>
                      <p className="text-3xl font-serif font-bold gradient-text-gold">{s.stat}</p>
                      <p className="text-white/30 text-xs mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AGENCY MARKETPLACE ===== */}
      <section className="py-24 md:py-32 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="card p-8">
                <div className="space-y-4">
                  {['Shift flexibility on your terms', 'Instant booking confirmation', 'Transparent payment tracking', 'Build your reputation with reviews'].map((item, i) => (
                    <div key={item} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50/80 hover:bg-gold/5 transition-colors duration-300">
                      <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-ink font-medium text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Agency Marketplace</p>
              <h2 className="section-heading mb-6">Flexible Shifts at <span className="italic">Top Properties</span></h2>
              <p className="text-gray-400 leading-relaxed mb-8 text-lg font-light">
                Pick up shifts at premium spas and wellness centres on your schedule. Our marketplace connects freelance practitioners with properties instantly.
              </p>
              <Link href="/agency" className="btn-primary">Browse Agency Shifts</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BLOG PREVIEW ===== */}
      {blogPosts.length > 0 && (
        <section className="py-24 md:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-16">
              <div>
                <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Insights</p>
                <h2 className="section-heading">From the Blog</h2>
              </div>
              <Link href="/blog" className="hidden md:flex items-center text-gold font-medium">
                All Articles <ArrowUpRight size={18} className="ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card group p-0 overflow-hidden">
                  {post.image_url && (
                    <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.category && <span className="text-gold text-xs font-medium uppercase tracking-wider">{post.category}</span>}
                    <h3 className="font-serif text-lg font-semibold text-ink mt-2 mb-2 group-hover:text-gold transition-colors">{post.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{post.excerpt || post.content?.slice(0, 120)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FOUNDER ===== */}
      <section className="py-24 md:py-32 bg-parchment">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
            <span className="text-white font-serif font-bold text-2xl">R</span>
          </div>
          <blockquote className="text-2xl md:text-3xl font-serif text-ink leading-relaxed mb-8 italic">
            &ldquo;WHC Concierge was created by a wellness industry professional who saw first-hand how broken recruitment is in our sector.&rdquo;
          </blockquote>
          <p className="gradient-text-gold font-semibold text-lg">Rebecca Doyle</p>
          <p className="text-gray-400 text-sm">Founder, Wellness House Collective</p>
        </div>
      </section>

      {/* ===== DUAL CTA ===== */}
      <section className="py-24 md:py-32" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-dark p-10 text-center hover:border-white/20 transition-colors duration-500">
              <h3 className="text-3xl font-serif font-bold text-white mb-4">For Candidates</h3>
              <p className="text-white/40 mb-8 font-light">Create your free profile and discover roles at the world&apos;s finest wellness destinations.</p>
              <Link href="/register/talent" className="btn-primary">Create Your Profile</Link>
            </div>
            <div className="card-dark p-10 text-center border-gold/20 hover:border-gold/40 transition-colors duration-500">
              <h3 className="text-3xl font-serif font-bold text-white mb-4">For Employers</h3>
              <p className="text-white/40 mb-8 font-light">Post roles, search specialist talent, and fill vacancies faster than ever before.</p>
              <Link href="/register/employer" className="btn-primary">Post a Role</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 md:py-32 bg-parchment">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-medium uppercase tracking-[0.2em] mb-4">Support</p>
            <h2 className="section-heading">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden transition-shadow hover:shadow-md">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-serif text-lg font-semibold text-ink pr-4">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 animate-fade-in">
                    <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="py-16 bg-white border-t border-gray-100/50">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Mail className="mx-auto text-gold mb-4" size={28} />
          <h3 className="font-serif text-2xl font-semibold text-ink mb-2">Stay in the Loop</h3>
          <p className="text-gray-400 mb-8 text-sm">The latest roles, industry insights and platform updates.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3">
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field flex-1" />
            <button type="submit" className="btn-primary whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
