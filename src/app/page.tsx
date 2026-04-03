'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  Sparkles, Target, EyeOff, Star, MessageSquare, Store,
  ArrowRight, ChevronDown, ChevronUp, Building2, Clock, MapPin,
  Briefcase, Users, TrendingUp, Mail
} from 'lucide-react'

const partners = [
  'Fairmont', 'Mandarin Oriental', 'Rosewood', 'Four Seasons',
  'Corinthia', 'The Lanesborough', 'Gleneagles', 'ESPA'
]

const features = [
  { icon: <Sparkles className="text-gold" size={28} />, title: 'Specialist Focus', desc: 'Built exclusively for the luxury spa, wellness and hospitality sector. We understand your world.' },
  { icon: <Target className="text-gold" size={28} />, title: 'Intelligent Matching', desc: 'Our algorithm connects you with roles and candidates that truly fit — skills, culture and ambition.' },
  { icon: <EyeOff className="text-gold" size={28} />, title: 'Stealth Mode', desc: 'Block specific employers from seeing your profile. Search confidently without compromising your current role.' },
  { icon: <Star className="text-gold" size={28} />, title: 'Verified Reviews', desc: 'Transparent feedback from real placements. Make informed decisions about your next move.' },
  { icon: <MessageSquare className="text-gold" size={28} />, title: 'Direct Messaging', desc: 'Connect directly with hiring managers. No recruiters, no middlemen — just real conversations.' },
  { icon: <Store className="text-gold" size={28} />, title: 'Agency Marketplace', desc: 'Find flexible shift work at top properties. Book, confirm, and get paid — all in one place.' },
]

const featuredJobs = [
  { title: 'Senior Spa Therapist', property: 'Corinthia London', salary: '£32,000 – £38,000', tier: 'Platinum', location: 'London', type: 'Full-time' },
  { title: 'Spa Manager', property: 'Gleneagles', salary: '£45,000 – £55,000', tier: 'Gold', location: 'Scotland', type: 'Full-time' },
  { title: 'Wellness Practitioner', property: 'Mandarin Oriental', salary: '£35,000 – £42,000', tier: 'Silver', location: 'London', type: 'Full-time' },
]

const faqs = [
  { q: 'Is it free to create a candidate profile?', a: 'Yes, creating a candidate profile on WHC Concierge is completely free. You can browse roles, set up job alerts, and apply to positions without any cost. Premium features like priority visibility and advanced matching are available with our optional subscription tiers.' },
  { q: 'How does the matching algorithm work?', a: 'Our intelligent matching algorithm considers your skills, experience, specialisms, location preferences, salary expectations, and career ambitions. It cross-references these with employer requirements to surface the most relevant opportunities — and the most suitable candidates for employers.' },
  { q: 'What is Stealth Mode and how does it protect my privacy?', a: 'Stealth Mode allows you to block specific employers from viewing your profile. This is perfect if you\'re currently employed and want to explore opportunities discreetly. Your blocked employers will never see your profile in search results or candidate lists.' },
  { q: 'How much does it cost to post a role?', a: 'Role posting packages range from £150 to £250 depending on the tier you choose. Silver gives you a standard listing, Gold includes featured placement, and Platinum offers priority matching, social media promotion, and highlighted visibility across the platform.' },
]

const tierColors: Record<string, string> = {
  Platinum: 'bg-purple-100 text-purple-700',
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-gray-100 text-gray-600',
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-ink overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/70 to-ink" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(201, 168, 76, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(201, 168, 76, 0.1) 0%, transparent 50%)'
          }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-2 mb-8">
            <Sparkles size={16} className="text-gold" />
            <span className="text-gold text-sm font-medium">The Home of Luxury Wellness Careers</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6">
            The Specialist Careers Platform for{' '}
            <span className="text-gold">Luxury Wellness</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connecting exceptional spa, wellness and hospitality professionals with the world&apos;s finest properties. No recruiters. No middlemen. Just the right match.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/jobs" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
              <span>Browse Roles</span>
              <ArrowRight size={20} />
            </Link>
            <Link href="/register/employer" className="btn-secondary text-lg px-8 py-4 !text-white !border-white/30 hover:!bg-white/10 hover:!text-white">
              Post a Role
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-gold">480+</p>
              <p className="text-white/50 text-sm mt-1">Properties</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-gold">1,200+</p>
              <p className="text-white/50 text-sm mt-1">Active Roles</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-serif font-bold text-gold">96%</p>
              <p className="text-white/50 text-sm mt-1">Match Rate</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-white/30" size={32} />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-b border-gray-100 py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-gray-400 uppercase tracking-widest mb-8">Trusted by the world&apos;s finest properties</p>
          <div className="flex items-center justify-center flex-wrap gap-8 md:gap-16">
            {partners.map((name) => (
              <span key={name} className="text-gray-300 font-serif text-xl md:text-2xl font-semibold hover:text-gold transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Why WHC Concierge?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Everything you need to advance your wellness career or find exceptional talent — in one specialist platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow group">
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-gold/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Opportunities */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Featured Opportunities</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Hand-picked roles at the world&apos;s most prestigious wellness destinations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredJobs.map((job) => (
              <div key={job.title} className="card hover:shadow-lg transition-all group cursor-pointer border-t-4 border-t-gold/30 hover:border-t-gold">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tierColors[job.tier]}`}>
                    {job.tier}
                  </span>
                  <span className="text-xs text-gray-400">{job.type}</span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink mb-2 group-hover:text-gold transition-colors">{job.title}</h3>
                <p className="text-gold font-medium mb-4">{job.property}</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase size={14} />
                    <span>{job.salary}</span>
                  </div>
                </div>
                <Link href="/jobs" className="mt-6 flex items-center text-gold text-sm font-medium group-hover:translate-x-1 transition-transform">
                  View Role <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/jobs" className="btn-primary">View All Roles</Link>
          </div>
        </div>
      </section>

      {/* Residency Programme */}
      <section className="py-20 md:py-28 bg-ink text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-gold text-sm font-medium uppercase tracking-widest">Residency Programme</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">Elite Wellness Residencies</h2>
              <p className="text-white/70 leading-relaxed mb-8">
                Our exclusive 1–6 month residency placements offer practitioners the chance to work at the world&apos;s most iconic properties. Build your portfolio, expand your network, and elevate your career.
              </p>
              <ul className="space-y-4 mb-10">
                {['Direct booking with top-tier properties', 'Portfolio-building opportunities', 'Brand partnership exposure', 'Competitive rates and accommodation'].map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <Star size={12} className="text-gold" />
                    </div>
                    <span className="text-white/80 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/residency" className="btn-primary">Explore Residencies</Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl p-10 border border-gold/10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4">
                    <Building2 className="mx-auto text-gold mb-3" size={32} />
                    <p className="text-2xl font-serif font-bold text-gold">50+</p>
                    <p className="text-white/50 text-sm">Partner Properties</p>
                  </div>
                  <div className="text-center p-4">
                    <Clock className="mx-auto text-gold mb-3" size={32} />
                    <p className="text-2xl font-serif font-bold text-gold">1–6</p>
                    <p className="text-white/50 text-sm">Month Placements</p>
                  </div>
                  <div className="text-center p-4">
                    <Users className="mx-auto text-gold mb-3" size={32} />
                    <p className="text-2xl font-serif font-bold text-gold">200+</p>
                    <p className="text-white/50 text-sm">Placed Practitioners</p>
                  </div>
                  <div className="text-center p-4">
                    <TrendingUp className="mx-auto text-gold mb-3" size={32} />
                    <p className="text-2xl font-serif font-bold text-gold">94%</p>
                    <p className="text-white/50 text-sm">Return Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agency Marketplace */}
      <section className="py-20 md:py-28 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="space-y-4">
                  {['Shift flexibility on your terms', 'Instant booking confirmation', 'Transparent payment tracking', 'Build your reputation with reviews'].map((item, i) => (
                    <div key={item} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gold/5 transition-colors">
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
              <span className="text-gold text-sm font-medium uppercase tracking-widest">Agency Marketplace</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-ink mt-4 mb-6">Flexible Shifts at Top Properties</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Pick up shifts at premium spas and wellness centres on your schedule. Our marketplace connects freelance therapists and practitioners with properties that need cover — instantly.
              </p>
              <Link href="/agency" className="btn-primary">Browse Agency Shifts</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-serif font-bold text-2xl">R</span>
          </div>
          <blockquote className="text-2xl md:text-3xl font-serif text-ink leading-relaxed mb-8">
            &ldquo;WHC Concierge was created by a wellness industry professional who saw first-hand how broken recruitment is in our sector. We built this platform to change that — for good.&rdquo;
          </blockquote>
          <p className="text-gold font-medium">Rebecca Doyle</p>
          <p className="text-gray-400 text-sm">Founder, Wellness House Collective</p>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-20 md:py-28 bg-ink">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">For Candidates</h3>
              <p className="text-white/60 mb-8">Create your free profile and discover roles at the world&apos;s finest wellness destinations.</p>
              <Link href="/register/talent" className="btn-primary">Create Your Profile</Link>
            </div>
            <div className="bg-gold/10 backdrop-blur border border-gold/20 rounded-2xl p-10 text-center">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">For Employers</h3>
              <p className="text-white/60 mb-8">Post roles, search specialist talent, and fill vacancies faster than ever before.</p>
              <Link href="/register/employer" className="btn-primary">Post a Role</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-parchment">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="section-heading text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-serif text-lg font-semibold text-ink pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={20} className="text-gold flex-shrink-0" /> : <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Mail className="mx-auto text-gold mb-4" size={32} />
          <h3 className="font-serif text-2xl font-semibold text-ink mb-3">Stay in the Loop</h3>
          <p className="text-gray-500 mb-8">Get the latest roles, industry insights and platform updates delivered to your inbox.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
