import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ResidencyEnquiryForm from '@/components/ResidencyEnquiryForm'
import StartResidencyConversation from '@/components/StartResidencyConversation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, Award, Calendar, Clock, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import type { Metadata } from 'next'
import { toPublicResidencyProfile } from '@/lib/residency-public'

export const revalidate = 120

async function publicProfile(id: string) {
  const admin = createAdminClient()
  const { data: raw } = await admin.from('residency_profiles')
    .select('id,bio,full_name,primary_specialism,secondary_specialisms,qualifications,brand_experience,current_location,will_travel_to,preferred_duration,day_rate,weekly_rate,monthly_rate,negotiable,available_from,years_experience,is_featured,approval_status,candidate_profile_id')
    .eq('id', id)
    .eq('approval_status', 'approved')
    .maybeSingle()
  if (!raw?.candidate_profile_id) return null

  const { data: candidate } = await admin.from('candidate_profiles')
    .select('residency_member,residency_subscription_status')
    .eq('id', raw.candidate_profile_id)
    .maybeSingle()

  if (!candidate?.residency_member || !['active', 'trialing'].includes(candidate.residency_subscription_status || 'active')) return null
  return toPublicResidencyProfile(raw)
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const r = await publicProfile(id)
  return { title: `${r?.primary_specialism || 'Residency Specialist'} - WHC Concierge Residency` }
}

export default async function ResidencyDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const r = await publicProfile(id)
  if (!r) notFound()

  const specialistLabel = `Residency Specialist ${r.reference}`
  const secondarySpecs = r.secondary_specialisms || []
  const quals = r.qualifications || []
  const brands = r.brand_experience || []
  const dayRate = Number(r.day_rate || (r.weekly_rate ? Math.round(Number(r.weekly_rate) / 5) : 0))

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar />
      <div className="pt-[76px] bg-white border-b border-border"><div className="max-w-6xl mx-auto px-6 lg:px-8 py-3"><Link href="/residency" className="text-[12px] text-muted hover:text-ink flex items-center gap-1"><ArrowLeft size={12}/>Back to Residency</Link></div></div>

      <section className="bg-[#f5f6f8] border-b border-border">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 md:py-14">
          <div className="grid md:grid-cols-[128px_1fr_auto] gap-7 items-start">
            <div className="w-28 h-32 bg-white/70 border border-white flex items-center justify-center"><UserRound size={38} className="text-accent/70"/></div>
            <div>{r.is_featured && <span className="badge-gold mb-3 inline-flex items-center gap-1"><Sparkles size={11}/>Featured Residency Talent</span>}<p className="text-[10px] uppercase tracking-[.15em] text-muted">{specialistLabel}</p><h1 className="text-4xl md:text-5xl leading-none tracking-[-.035em] font-semibold text-ink mt-2">{r.primary_specialism || 'Wellness Specialist'}</h1><div className="flex flex-wrap gap-4 text-[12px] text-muted mt-5">{r.current_location && <span className="flex items-center gap-1.5"><MapPin size={13}/>{r.current_location}</span>}{r.travel_availability && <span>Travels: {r.travel_availability}</span>}{r.available_from && <span className="flex items-center gap-1.5"><Calendar size={13}/>Available {new Date(r.available_from).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>}{r.preferred_duration && <span className="flex items-center gap-1.5"><Clock size={13}/>{r.preferred_duration}</span>}</div>{secondarySpecs.length > 0 && <div className="flex flex-wrap gap-1.5 mt-5">{secondarySpecs.slice(0,7).map((s:string)=><span key={s} className="text-[10px] px-2.5 py-1 bg-white/70 border border-white text-ink">{s}</span>)}</div>}</div>
            <div className="bg-white border border-white p-5 min-w-[210px] shadow-sm">{dayRate > 0 && <><p className="text-[10px] uppercase tracking-[.12em] text-muted">Indicative rate</p><p className="text-3xl font-semibold text-ink mt-1">£{dayRate}<span className="text-xs font-normal text-muted">/day</span></p></>}<a href="#enquire" className="btn-primary block text-center mt-4">Discuss Residency</a><p className="text-[10px] text-muted text-center mt-2">Identity remains protected until the Residency is confirmed.</p></div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 items-start">
          <div className="space-y-6">
            {r.bio && <div className="bg-white border border-border p-7"><p className="eyebrow mb-3">About the Specialist</p><p className="text-[14px] text-secondary leading-7 whitespace-pre-wrap">{r.bio}</p></div>}

            <div className="grid md:grid-cols-2 gap-5">
              {quals.length > 0 && <div className="bg-white border border-border p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Qualifications</h2><div className="space-y-2">{quals.map((q:string)=><div key={q} className="flex items-center gap-2 text-[12px] text-secondary"><Award size={13} className="text-accent"/>{q}</div>)}</div></div>}
              {brands.length > 0 && <div className="bg-white border border-border p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Brand Experience</h2><div className="flex flex-wrap gap-2">{brands.map((b:string)=><span key={b} className="text-[11px] px-2.5 py-1 bg-parchment text-accent border border-accent/20">{b}</span>)}</div></div>}
            </div>

            <div className="bg-white border border-border p-6"><h2 className="text-[15px] font-semibold text-ink mb-4">Residency Logistics</h2><div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">{r.current_location && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Based in</span><span className="text-ink text-right">{r.current_location}</span></div>}{r.travel_availability && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Travel</span><span className="text-ink text-right">{r.travel_availability}</span></div>}{r.preferred_duration && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Preferred duration</span><span className="text-ink text-right">{r.preferred_duration}</span></div>}{r.years_experience && <div className="flex justify-between gap-3 border-b border-border pb-2"><span className="text-muted">Experience</span><span className="text-ink text-right">{r.years_experience} years</span></div>}</div></div>
          </div>

          <aside id="enquire" className="lg:sticky lg:top-24 bg-white border border-border p-6 shadow-lg shadow-black/5">
            <div className="flex items-start gap-3 pb-5 mb-5 border-b border-border"><div className="w-9 h-9 bg-parchment flex items-center justify-center shrink-0"><ShieldCheck size={17} className="text-accent"/></div><div><h2 className="text-[16px] font-semibold text-ink">Start a private conversation</h2><p className="text-[11px] text-muted leading-5 mt-1">Discuss fit first. Direct contact details and identity stay protected until confirmation.</p></div></div>
            <StartResidencyConversation listingId={r.id} />
            <div className="flex items-center gap-3 my-5"><span className="h-px flex-1 bg-border"/><span className="text-[10px] uppercase tracking-[.14em] text-muted">or send a structured offer</span><span className="h-px flex-1 bg-border"/></div>
            <ResidencyEnquiryForm specialistName={specialistLabel} listingId={r.id} suggestedDayRate={dayRate} />
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  )
}
