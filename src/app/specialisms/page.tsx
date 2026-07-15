import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const specialisms = [
  { name: 'Massage Therapy', desc: 'Swedish, deep tissue, hot stone, sports massage, and specialist bodywork techniques.' },
  { name: 'Beauty Therapy', desc: 'Facials, skin treatments, waxing, tinting, and advanced beauty services.' },
  { name: 'Spa Management', desc: 'Operations, team leadership, revenue management, and guest experience.' },
  { name: 'Wellness Coaching', desc: 'Lifestyle coaching, stress management, sleep optimisation, and wellness programmes.' },
  { name: 'Yoga & Pilates', desc: 'Group classes, private instruction, reformer Pilates, and mindfulness sessions.' },
  { name: 'Aesthetic Treatments', desc: 'Non-surgical aesthetics, laser treatments, skin rejuvenation, and body contouring.' },
  { name: 'Nutritional Therapy', desc: 'Dietary planning, detox programmes, functional nutrition, and wellness cuisine.' },
  { name: 'Holistic Therapy', desc: 'Reiki, crystal healing, sound therapy, and integrative wellness approaches.' },
  { name: 'Fitness Training', desc: 'Personal training, group fitness, strength conditioning, and functional movement.' },
  { name: 'Ayurveda', desc: 'Traditional Ayurvedic treatments, consultations, and wellness rituals.' },
  { name: 'Hair Styling', desc: 'Cutting, colouring, styling, and specialist hair treatments for luxury settings.' },
  { name: 'Nail Technology', desc: 'Manicures, pedicures, gel nails, nail art, and specialist treatments.' },
]

export default function SpecialismsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Every Discipline</p>
          <h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">Specialisms</h1>
          <p className="text-[15px] text-secondary max-w-xl mx-auto">We cover every discipline within luxury spa, wellness and hospitality.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialisms.map((s) => (
            <div key={s.name} className="bg-white border border-border rounded-xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <h3 className="text-[16px] font-medium text-ink">{s.name}</h3>
              <p className="text-[13px] text-secondary leading-[1.7] mt-2">{s.desc}</p>
              <Link href={`/jobs?specialism=${encodeURIComponent(s.name)}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium mt-4" style={{ color: '#C9A96E' }}>
                View Roles <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
