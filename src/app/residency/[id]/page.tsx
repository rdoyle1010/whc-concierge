import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ResidencyEnquiryForm from '@/components/ResidencyEnquiryForm'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, Award, Calendar, Clock, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 120

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('residency_profiles').select('full_name,primary_specialism').eq('id', params.id).single()
  const name = data?.full_name || data?.primary_specialism || 'Specialist'
  return { title: `${name} - Residency Specialist` }
}

export default async function ResidencyDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const { data: r } = await supabase.from('residency_profiles').select('*').eq('id', params.id).single()
  if (!r) notFound()

  const name = r.full_name || r.title || 'Specialist'
  const bio = r.bio || r.description || ''
  const secondarySpecs = r.secondary_specialisms || r.services_offered || []
  const quals = r.qualifications || []
  const brands = r.brand_experience || r.product_houses || []
  const location = r.current_location || ''
  const travelTo = r.will_travel_to || r.travel_availability || ''
  const duration = r.preferred_duration || r.duration || ''
  const gallery: string[] = r.gallery_urls?.length > 0 ? r.gallery_urls : []
  const dayRate = Number(r.day_rate || (r.weekly_rate ? Math.round(Number(r.weekly_rate) / 5) : 0))

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <Navbar />
      <div className="pt-[60px] bg-white border-b border-border"><div className="max-w-6xl mx-auto px-6 lg:px-8 py-3"><Link href="/residency" className="text-[12px] text-muted hover:text-ink flex items-center gap-1"><ArrowLeft size={12}/>Back to Residency</Link></div></div>

      <section className="bg-[#F4F0E8] border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 md:py-14">
          <div className="grid md:grid-cols-[160px_1fr_auto] gap-7 items-start">
            <div className="w-36 h-44 rounded-[24px] overflow-hidden bg-parchment shadow-sm">{(r.profile_photo_url || r.photo_url || r.photos?.[0]) ? <img src={r.profile_photo_url || r.photo_url || r.photos?.[0]} alt={name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-5xl font-semibold text-accent">{name.trim().charAt(0).toUpperCase()}</div>}</div>
            <div>{r.is_featured && <span className="badge-gold mb-3 inline-flex items-center gap-1"><Sparkles size={11}/>Featured Residency Talent</span>}<h1 className="text-4xl md:text-5xl leading-none tracking-[-.035em] font-semibold text-ink">{name}</h1>{r.primary_specialism && <p className="text-base text-accent font-medium mt-3">{r.primary_specialism}</p>}<div className="flex flex-wrap gap-4 text-[12px] text-muted mt-5">{location && <span className="flex items-center gap-1.5"><MapPin size={13}/>{location}</span>}{travelTo && <span>Travels: {travelTo}</span>}{(r.available_from || r.availability_start) && <span className="flex items-center gap-1.5"><Calendar size={13}/>Available {new Date(r.available_from || r.availability_start).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>}{duration && <span className="flex items-center gap-1.5"><Clock size={13}/>{duration}</span>}</div>{secondarySpecs.length > 0 && <div className="flex flex-wrap gap-1.5 mt-5">{secondarySpecs.slice(0,7).map((s:string)=><span key={s} className="text-[10px] px-2.5 py-1 rounded-full bg-white/70 border border-white text-ink">{s}</span>)}</div>}</div>
            <div className="bg-white rounded-2xl border border-white p-5 min-w-[210px] shadow-sm">{dayRate > 0 && <><p className="text-[10px] uppercase tracking-[.12em] text-muted">Indicative rate</p><p className="text-3xl font-semibold text-ink mt-1">£{dayRate}<span className="text-xs font-normal text-muted">/day</span></p></>}<a href="#enquire" className="btn-primary block text-center mt-4">Invite to Residency</a><p className="text-[10px] text-muted text-center mt-2">No payment until terms are agreed.</p></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 items-start">
          <div className="space-y-6">
            {bio && <div className="bg-white border border-border rounded-[22px] p-7"><p className="eyebrow mb-3">About the Specialist</p><p className="text-[14px] text-secondary leading-7 whitespace-pre-wrap">{bio}</p></div>}

            <div className="grid md:grid-cols-2 gap-5">
              {quals.length > 0 && <div className="bg-white border border-border rounded-[22px] p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Qualifications</h2><div className="space-y-2">{quals.map((q:string)=><div key={q} className="flex items-center gap-2 text-[12px] text-secondary"><Award size={13} className="text-accent"/>{q}</div>)}</div></div>}
              {brands.length > 0 && <div className="bg-white border border-border rounded-[22px] p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Brand Experience</h2><div className="flex flex-wrap gap-2">{brands.map((b:string)=><span key={b} className="text-[11px] px-2.5 py-1 rounded-full bg-parchment text-accent border border-accent/20">{b}</span>)}</div></div>}
            </div>

            {gallery.length > 0 && <div className="bg-white border border-border rounded-[22px] p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Portfolio</h2><div className="grid grid-cols-2 gap-3">{gallery.slice(0,4).map((url:string,i:number)=><div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-surface"><img src={url} alt="" className="w-full h-full object-cover"/></div>)}</div></div>}

            <div className="bg-white border border-border rounded-[22px] p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Residency Logistics</h2><div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">{location && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Based in</span><span className="text-ink text-right">{location}</span></div>}{travelTo && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Travel</span><span className="text-ink text-right">{travelTo}</span></div>}{duration && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Preferred duration</span><span className="text-ink text-right">{duration}</span></div>}{r.years_experience && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Experience</span><span className="text-ink text-right">{r.years_experience} years</span></div>}</div></div>
          </div>

          <aside id="enquire" className="lg:sticky lg:top-24 bg-white border border-border rounded-[24px] p-6 shadow-lg shadow-black/5">
            <div className="flex items-start gap-3 pb-5 mb-5 border-b border-border"><div className="w-9 h-9 rounded-xl bg-parchment flex items-center justify-center shrink-0"><ShieldCheck size={17} className="text-accent"/></div><div><h2 className="text-[16px] font-semibold text-ink">Invite {name.split(' ')[0] || 'this specialist'}</h2><p className="text-[11px] text-muted leading-5 mt-1">Send a proper residency offer rather than exchanging contact details.</p></div></div>
            <ResidencyEnquiryForm specialistName={name} listingId={r.id} suggestedDayRate={dayRate} />
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  )
}
