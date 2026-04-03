'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight, ChevronDown, ChevronUp, MapPin, Briefcase, Clock, Mail,
  Target, EyeOff, Star, MessageSquare, Store, Sparkles
} from 'lucide-react'

const partners = ['Fairmont', 'Mandarin Oriental', 'Rosewood', 'Four Seasons', 'Corinthia', 'The Lanesborough', 'Gleneagles', 'ESPA']

const features = [
  { icon: <Sparkles size={20} />, title: 'Specialist Focus', desc: 'Built exclusively for luxury spa, wellness and hospitality.' },
  { icon: <Target size={20} />, title: 'Intelligent Matching', desc: 'Our algorithm connects you with roles that truly fit.' },
  { icon: <EyeOff size={20} />, title: 'Stealth Mode', desc: 'Block employers from seeing your profile. Search confidently.' },
  { icon: <Star size={20} />, title: 'Verified Reviews', desc: 'Transparent feedback from real placements.' },
  { icon: <MessageSquare size={20} />, title: 'Direct Messaging', desc: 'Connect directly with hiring managers. No middlemen.' },
  { icon: <Store size={20} />, title: 'Agency Marketplace', desc: 'Flexible shift work at top properties.' },
]

const faqs = [
  { q: 'Is it free to create a candidate profile?', a: 'Yes. Browse roles, set up alerts and apply without cost. Premium features are available with optional tiers.' },
  { q: 'How does matching work?', a: 'Our algorithm considers your skills, experience, specialisms, location and salary expectations to surface the most relevant opportunities.' },
  { q: 'What is Stealth Mode?', a: 'Block specific employers from viewing your profile. Perfect if you\'re currently employed and exploring discreetly.' },
  { q: 'How much does it cost to post a role?', a: 'Packages range from £150 (Silver) to £250 (Platinum) with increasing visibility and promotion.' },
]

export default function HomePage() {
  const supabase = createClient()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [stats, setStats] = useState({ properties: 0, roles: 0, candidates: 0 })

  useEffect(() => {
    async function load() {
      const { data: jobs } = await supabase.from('job_listings').select('*, employer_profiles(company_name)').eq('status', 'active').order('created_at', { ascending: false }).limit(3)
      setFeaturedJobs(jobs || [])
      const { data: posts } = await supabase.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(3)
      setBlogPosts(posts || [])
      const [p, j, c] = await Promise.all([
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
      ])
      setStats({ properties: p.count || 0, roles: j.count || 0, candidates: c.count || 0 })
    }
    load()
  }, [])

  const sampleJobs = [
    { id: '1', title: 'Senior Spa Therapist', location: 'London', salary_min: 32000, salary_max: 38000, tier: 'Platinum', job_type: 'Full-time', employer_profiles: { company_name: 'Corinthia London' } },
    { id: '2', title: 'Spa Manager', location: 'Scotland', salary_min: 45000, salary_max: 55000, tier: 'Gold', job_type: 'Full-time', employer_profiles: { company_name: 'Gleneagles' } },
    { id: '3', title: 'Wellness Practitioner', location: 'London', salary_min: 35000, salary_max: 42000, tier: 'Silver', job_type: 'Full-time', employer_profiles: { company_name: 'Mandarin Oriental' } },
  ]
  const displayJobs = featuredJobs.length > 0 ? featuredJobs : sampleJobs

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
          {/* Left — text */}
          <div className="flex items-center px-6 sm:px-12 lg:px-16 xl:px-24 py-20">
            <div className="max-w-xl">
              <p className="text-neutral-400 text-sm tracking-widest uppercase mb-6 animate-fade-in-up">Luxury Wellness Careers</p>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-[1.02] tracking-tight mb-8 animate-fade-in-up delay-100">
                Where talent meets opportunity
              </h1>
              <p className="text-neutral-400 text-lg font-light leading-relaxed mb-10 max-w-md animate-fade-in-up delay-200">
                Connecting exceptional spa, wellness and hospitality professionals with the world&apos;s finest properties.
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-in-up delay-300">
                <Link href="/roles/match" className="btn-primary px-8 py-3.5">Start Matching</Link>
                <Link href="/register/employer" className="btn-secondary px-8 py-3.5">Post a Role</Link>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-10 mt-16 animate-fade-in-up delay-400">
                <div><p className="text-3xl font-bold text-black">{stats.properties || '480'}+</p><p className="text-neutral-400 text-xs tracking-widest uppercase mt-1">Properties</p></div>
                <div><p className="text-3xl font-bold text-black">{stats.roles || '1,200'}+</p><p className="text-neutral-400 text-xs tracking-widest uppercase mt-1">Active Roles</p></div>
                <div><p className="text-3xl font-bold text-black">96%</p><p className="text-neutral-400 text-xs tracking-widest uppercase mt-1">Match Rate</p></div>
              </div>
            </div>
          </div>

          {/* Right — image */}
          <div className="hidden lg:block relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=80&auto=format&fit=crop"
              alt="Luxury spa"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-neutral-100/10" />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-14 border-y border-neutral-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center flex-wrap gap-10 md:gap-16">
            {partners.map((name) => (
              <span key={name} className="text-neutral-200 text-lg font-semibold tracking-wide hover:text-neutral-400 transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-xl mb-16">
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">The Platform</p>
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight leading-tight">Why WHC Concierge</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-8 hover:bg-neutral-50 transition-colors">
                <div className="text-neutral-300 mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-black mb-2">{f.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Roles */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Opportunities</p>
              <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">Latest Roles</h2>
            </div>
            <Link href="/jobs" className="hidden md:flex items-center text-black text-sm font-medium hover:underline">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {displayJobs.map((job: any) => (
              <div key={job.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-medium px-3 py-1 ${
                    job.tier === 'Platinum' ? 'bg-black text-white' : job.tier === 'Gold' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}>{job.tier || 'Standard'}</span>
                  <span className="text-neutral-400 text-xs">{job.job_type}</span>
                </div>
                <h3 className="text-xl font-semibold text-black mb-1">{job.title}</h3>
                <p className="text-neutral-500 text-sm mb-4">{job.employer_profiles?.company_name}</p>
                <div className="space-y-1.5 text-sm text-neutral-400 mb-6">
                  <p className="flex items-center space-x-2"><MapPin size={14} /><span>{job.location}</span></p>
                  <p className="flex items-center space-x-2"><Briefcase size={14} /><span>
                    {job.salary_min && job.salary_max ? `£${(job.salary_min/1000).toFixed(0)}k – £${(job.salary_max/1000).toFixed(0)}k` : 'Competitive'}
                  </span></p>
                </div>
                <Link href="/roles/match" className="text-black text-sm font-medium flex items-center hover:underline">
                  View Role <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Residency */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Residency Programme</p>
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight leading-tight mb-6">Elite wellness residencies</h2>
            <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">
              Exclusive 1–6 month placements at the world&apos;s most iconic properties. Build your portfolio and elevate your career.
            </p>
            <ul className="space-y-3 mb-10">
              {['Direct booking with top-tier properties', 'Portfolio-building opportunities', 'Competitive rates and accommodation', 'Brand partnership exposure'].map((item) => (
                <li key={item} className="flex items-center space-x-3 text-sm text-neutral-500">
                  <span className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/residency" className="btn-primary">Explore Residencies</Link>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[{ n: '50+', l: 'Properties' }, { n: '1–6', l: 'Months' }, { n: '200+', l: 'Placed' }, { n: '94%', l: 'Return Rate' }].map((s) => (
              <div key={s.l} className="bg-neutral-50 p-8 text-center">
                <p className="text-3xl font-bold text-black">{s.n}</p>
                <p className="text-neutral-400 text-xs tracking-widest uppercase mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1">
            <div className="space-y-3">
              {['Shift flexibility on your terms', 'Instant booking confirmation', 'Transparent payment tracking', 'Build your reputation with reviews'].map((item, i) => (
                <div key={item} className="flex items-center space-x-4 p-5 bg-white border border-neutral-200">
                  <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-black">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Agency Marketplace</p>
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight leading-tight mb-6">Flexible shifts at top properties</h2>
            <p className="text-neutral-400 text-lg font-light leading-relaxed mb-8">
              Pick up shifts at premium spas and wellness centres on your schedule.
            </p>
            <Link href="/agency" className="btn-primary">Browse Agency Shifts</Link>
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {blogPosts.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Insights</p>
                <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">From the Blog</h2>
              </div>
              <Link href="/blog" className="hidden md:flex items-center text-black text-sm font-medium hover:underline">All Articles <ArrowRight size={16} className="ml-1" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card group p-0 overflow-hidden">
                  {post.image_url ? (
                    <div className="aspect-[16/10] bg-neutral-100 overflow-hidden">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : <div className="aspect-[16/10] bg-neutral-100" />}
                  <div className="p-6">
                    {post.category && <p className="text-neutral-400 text-xs tracking-widest uppercase mb-2">{post.category}</p>}
                    <h3 className="text-lg font-semibold text-black mb-2 group-hover:underline">{post.title}</h3>
                    <p className="text-neutral-400 text-sm line-clamp-2">{post.excerpt || post.content?.slice(0, 120)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Founder */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <blockquote className="text-2xl md:text-3xl font-light text-black leading-relaxed mb-8">
            &ldquo;WHC Concierge was created by a wellness industry professional who saw first-hand how broken recruitment is in our sector.&rdquo;
          </blockquote>
          <p className="text-black font-semibold">Rebecca Doyle</p>
          <p className="text-neutral-400 text-sm">Founder, Wellness House Collective</p>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-50 p-12 text-center">
            <h3 className="text-2xl font-bold text-black mb-3">For Candidates</h3>
            <p className="text-neutral-400 text-sm mb-8 max-w-sm mx-auto">Create your free profile and discover roles at the world&apos;s finest wellness destinations.</p>
            <Link href="/register/talent" className="btn-primary">Create Your Profile</Link>
          </div>
          <div className="bg-black p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">For Employers</h3>
            <p className="text-white/50 text-sm mb-8 max-w-sm mx-auto">Post roles, search specialist talent, and fill vacancies faster than ever.</p>
            <Link href="/register/employer" className="bg-white text-black px-6 py-3 text-sm font-medium tracking-wide hover:bg-neutral-100 transition-colors inline-block">Post a Role</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-14">
            <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Support</p>
            <h2 className="text-4xl font-bold text-black tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-neutral-200">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left">
                  <span className="text-base font-medium text-black pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-neutral-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-neutral-400 flex-shrink-0" />}
                </button>
                {openFaq === i && <p className="pb-6 text-neutral-400 text-sm leading-relaxed">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 border-t border-neutral-200">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold text-black mb-2">Stay in the loop</h3>
          <p className="text-neutral-400 text-sm mb-6">The latest roles, industry insights and platform updates.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-0">
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field flex-1 border-r-0" />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
