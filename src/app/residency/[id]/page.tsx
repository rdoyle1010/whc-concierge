import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, MapPin, Clock, Briefcase, Star, Shield, Calendar } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 120

const galleryFallback = [
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80&auto=format&fit=crop',
]

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('residency_profiles').select('title').eq('id', params.id).single()
  return { title: data ? `${data.title} — Residency Specialist` : 'Residency Specialist' }
}

export default async function ResidencyDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: r } = await supabase.from('residency_profiles').select('*').eq('id', params.id).single()

  if (!r) notFound()

  const gallery = r.gallery_urls?.length > 0 ? r.gallery_urls : galleryFallback
  const travel = r.travel_availability === 'worldwide' ? 'Worldwide' : r.travel_availability === 'uk_only' ? 'UK Only' : r.travel_availability === 'uk_and_europe' ? 'UK & Europe' : r.travel_availability?.replace('_', ' ') || '—'

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-[60px] bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <Link href="/residency" className="hover:text-ink flex items-center gap-1"><ArrowLeft size={12} />Residency</Link>
            <span>/</span>
            <span className="text-ink">{r.title}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Photo */}
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-surface border-2 border-white shadow-lg">
              <img src={r.photo_url || r.photos?.[0] || galleryFallback[0]} alt={r.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            {r.is_featured && <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full mb-3 inline-block" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E' }}>Featured Specialist</span>}
            <h1 className="text-[28px] md:text-[36px] font-medium text-ink leading-tight mb-3">{r.title}</h1>

            {/* Specialism badges */}
            {r.services_offered?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {r.services_offered.map((s: string) => (
                  <span key={s} className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201, 169, 110, 0.25)' }}>{s}</span>
                ))}
              </div>
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
              <span className="flex items-center gap-1.5"><MapPin size={13} />{travel}</span>
              {r.availability_start && <span className="flex items-center gap-1.5"><Calendar size={13} />From {new Date(r.availability_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              {r.duration && <span className="flex items-center gap-1.5"><Clock size={13} />{r.duration}</span>}
            </div>
          </div>

          {/* Rate card */}
          <div className="shrink-0 bg-white border border-border rounded-xl p-5 min-w-[180px]">
            {r.day_rate && <p className="text-[24px] font-semibold" style={{ color: '#C9A96E' }}>£{r.day_rate}<span className="text-[13px] font-normal text-muted">/day</span></p>}
            {r.weekly_rate && <p className="text-[14px] text-muted">£{r.weekly_rate}/week</p>}
            {r.monthly_rate && <p className="text-[14px] text-muted">£{r.monthly_rate}/month</p>}
            <a href="#enquire" className="block mt-4 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white text-center" style={{ backgroundColor: '#C9A96E' }}>Enquire Now</a>
          </div>
        </div>
      </section>

      {/* Content grid */}
      <section className="max-w-5xl mx-auto px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {r.description && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">About</h2>
                <p className="text-[14px] text-secondary leading-[1.8] whitespace-pre-wrap">{r.description}</p>
              </div>
            )}

            {/* Product houses */}
            {r.product_houses?.length > 0 && (
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-[16px] font-medium text-ink mb-3">Product House Experience</h2>
                <div className="flex flex-wrap gap-2">
                  {r.product_houses.map((b: string) => (
                    <span key={b} className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: '#FDF6EC', color: '#C9A96E', border: '1px solid rgba(201, 169, 110, 0.25)' }}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h2 className="text-[16px] font-medium text-ink mb-4">Gallery</h2>
              <div className="grid grid-cols-2 gap-3">
                {gallery.slice(0, 4).map((url: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-surface">
                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-medium text-ink mb-3">Availability & Logistics</h3>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex justify-between"><span className="text-muted">Available from</span><span className="text-ink">{r.availability_start ? new Date(r.availability_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Duration</span><span className="text-ink">{r.duration || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted">Travel</span><span className="text-ink">{travel}</span></div>
                {r.travel_radius_miles && <div className="flex justify-between"><span className="text-muted">Radius</span><span className="text-ink">{r.travel_radius_miles} miles</span></div>}
              </div>
            </div>

            {/* Enquiry form */}
            <div id="enquire" className="bg-white border border-border rounded-xl p-6">
              <h3 className="text-[14px] font-medium text-ink mb-4">Enquire About This Specialist</h3>
              <form action={`/residency?enquired=${r.id}`} className="space-y-3">
                <input name="name" required placeholder="Your name" className="input-field text-[13px]" />
                <input name="property" required placeholder="Property name" className="input-field text-[13px]" />
                <input name="dates" placeholder="Dates needed" className="input-field text-[13px]" />
                <textarea name="message" rows={3} required placeholder="Tell us what you're looking for..." className="input-field text-[13px]" />
                <button type="submit" className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white" style={{ backgroundColor: '#C9A96E' }}>Send Enquiry</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
