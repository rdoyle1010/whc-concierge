import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

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
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Specialisms</h1>
          <p className="text-white/60 max-w-xl mx-auto">We cover every discipline within luxury spa, wellness and hospitality.</p>
        </div>
      </section>
      <section className="py-16 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialisms.map((s) => (
            <div key={s.name} className="card hover:shadow-md transition-shadow group">
              <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-gold transition-colors">{s.name}</h3>
              <p className="text-gray-500 text-sm mt-2">{s.desc}</p>
              <Link href={`/jobs?specialism=${encodeURIComponent(s.name)}`} className="text-gold text-sm font-medium mt-4 inline-block">
                View Roles &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
