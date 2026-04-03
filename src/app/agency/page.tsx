import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Clock, Calendar, CreditCard, Star } from 'lucide-react'

export default function AgencyPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Agency Marketplace</h1>
          <p className="text-white/60 max-w-xl mx-auto">Flexible shift work at premium spas and wellness centres. Work on your terms.</p>
        </div>
      </section>
      <section className="py-20 bg-parchment">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {[
              { icon: <Clock className="text-gold" size={28} />, title: 'Shift Flexibility', desc: 'Choose when and where you work. Pick up shifts that fit your schedule.' },
              { icon: <Calendar className="text-gold" size={28} />, title: 'Instant Booking', desc: 'Book confirmed shifts with a single tap. No waiting for callbacks.' },
              { icon: <CreditCard className="text-gold" size={28} />, title: 'Transparent Pay', desc: 'See exact rates upfront. Track your earnings and payment status.' },
              { icon: <Star className="text-gold" size={28} />, title: 'Build Your Rep', desc: 'Collect verified reviews from every placement. Stand out from the crowd.' },
            ].map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-serif text-xl font-semibold text-ink mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-serif text-2xl font-semibold text-ink mb-4">Ready to start?</h3>
            <div className="flex justify-center gap-4">
              <Link href="/register/talent" className="btn-primary">Join as Talent</Link>
              <Link href="/register/employer" className="btn-secondary">Post Agency Shifts</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
