import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Building2, Clock, Users, TrendingUp, Star } from 'lucide-react'

export default function ResidencyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Residency Programme</h1>
          <p className="text-white/60 max-w-xl mx-auto">Elite 1–6 month placements at the world&apos;s most iconic wellness properties.</p>
        </div>
      </section>

      <section className="py-20 bg-parchment">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: <Building2 className="text-gold" size={28} />, stat: '50+', label: 'Partner Properties' },
              { icon: <Clock className="text-gold" size={28} />, stat: '1–6', label: 'Month Placements' },
              { icon: <Users className="text-gold" size={28} />, stat: '200+', label: 'Placed Practitioners' },
              { icon: <TrendingUp className="text-gold" size={28} />, stat: '94%', label: 'Return Rate' },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-3">{s.icon}</div>
                <p className="text-2xl font-serif font-bold text-gold">{s.stat}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card mb-12">
            <h2 className="font-serif text-2xl font-bold text-ink mb-6">What You Get</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Direct booking with world-class properties',
                'Competitive rates and accommodation included',
                'Portfolio-building at iconic destinations',
                'Brand partnership and networking opportunities',
                'Dedicated placement support throughout',
                'Verified reviews to boost your profile',
              ].map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <Star size={16} className="text-gold flex-shrink-0" />
                  <span className="text-gray-600 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h3 className="font-serif text-2xl font-semibold text-ink mb-4">Apply for a Residency</h3>
            <p className="text-gray-500 mb-6">Create your free profile to be considered for our exclusive residency placements.</p>
            <Link href="/register/talent" className="btn-primary">Create Your Profile</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
