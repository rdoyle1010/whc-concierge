'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import {
  MapPin, Star, Briefcase, ArrowLeft, Building2, ExternalLink, Users,
  BedDouble, Sparkles, Train, Car, ParkingCircle, BadgeCheck, CalendarDays,
  HeartHandshake, CheckCircle2,
} from 'lucide-react'

const asList = (value: any) => Array.isArray(value) ? value.filter(Boolean) : []

export default function PropertyDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return
      const [{ data: propertyData }, { data: jobsData }] = await Promise.all([
        supabase.from('employer_profiles').select('*').eq('id', id).single(),
        supabase.from('job_listings').select('*').eq('employer_id', id).eq('is_live', true).eq('status', 'active').order('posted_date', { ascending: false }),
      ])
      setProperty(propertyData)
      setJobs(jobsData || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <div className="min-h-screen bg-white"><Navbar /><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-[#0b2f4d] border-t-transparent rounded-full" /></div><Footer /></div>
  }

  if (!property) {
    return <div className="min-h-screen bg-white"><Navbar /><section className="py-20"><div className="max-w-7xl mx-auto px-6 text-center"><h1 className="text-3xl text-ink mb-4">Property not found</h1><Link href="/properties" className="text-[#0b2f4d] font-semibold">Back to Properties</Link></div></section><Footer /></div>
  }

  const name = property.property_name || property.company_name
  const photos = asList(property.property_photos)
  const about = property.about_text || property.description
  const reviewScore = Number(property.review_score || 0)
  const reviewCount = Number(property.review_count || 0)
  const starRating = property.star_rating
  const services = asList(property.services_offered)
  const brands = asList(property.product_houses_used)
  const systems = asList(property.systems_used)
  const culture = asList(property.culture_points)
  const highlights = asList(property.highlights)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="border-b border-[#e3e7eb] bg-white pt-[68px]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/properties" className="inline-flex items-center text-[12px] font-semibold text-[#65717a] hover:text-[#0b2f4d]"><ArrowLeft size={14} className="mr-2"/>Properties</Link>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {property.property_type && <span className="rounded-full bg-[#eef2f4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#53636f]">{property.property_type}</span>}
              {property.company_type && <span className="rounded-full bg-[#eef2f4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#53636f]">{property.company_type}</span>}
              {property.agency_available && <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-green-700">Agency cover accepted</span>}
            </div>
            <h1 className="text-[42px] md:text-[58px] leading-[1.02] tracking-[-.045em] text-[#10283b]">{name}</h1>
            {property.tagline && <p className="mt-4 text-[17px] md:text-[20px] leading-8 text-[#53636f] max-w-3xl">{property.tagline}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#65717a]">
              {(property.location || property.postcode) && <span className="inline-flex items-center gap-2"><MapPin size={16}/>{[property.location, property.postcode].filter(Boolean).join(' · ')}</span>}
              {starRating && <span className="inline-flex items-center gap-2 text-[#10283b]"><Star size={16} fill="currentColor"/>{isNaN(Number(starRating)) ? starRating : `${starRating} star property`}</span>}
              {reviewScore > 0 && <span className="inline-flex items-center gap-2"><BadgeCheck size={16}/><strong className="text-[#10283b]">{reviewScore.toFixed(1)}</strong>{reviewCount > 0 ? ` from ${reviewCount} verified review${reviewCount === 1 ? '' : 's'}` : ' verified rating'}</span>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
            {property.website && <a href={property.website} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">Visit property website <ExternalLink size={14}/></a>}
            {jobs.length > 0 && <a href="#openings" className="btn-primary inline-flex items-center justify-center gap-2">View {jobs.length} opening{jobs.length === 1 ? '' : 's'} <Briefcase size={14}/></a>}
          </div>
        </div>
      </section>

      {photos.length > 0 && <section className="bg-white pb-14"><div className="max-w-7xl mx-auto px-6"><div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {photos.slice(0, 6).map((url: string, index: number) => <div key={url} className={`overflow-hidden rounded-[18px] bg-[#f2f4f6] ${index === 0 && photos.length > 2 ? 'col-span-2 row-span-2 min-h-[420px]' : 'aspect-[4/3]'}`}><img src={url} alt={`${name} property ${index + 1}`} className="w-full h-full object-cover"/></div>)}
      </div></div></section>}

      <section className="border-y border-[#e3e7eb] bg-[#f7f9fa]">
        <div className="max-w-7xl mx-auto px-6 py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Property rating</p><p className="mt-1 text-[24px] text-[#10283b]">{starRating ? (isNaN(Number(starRating)) ? starRating : `${starRating}★`) : 'Not listed'}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">WHC review score</p><p className="mt-1 text-[24px] text-[#10283b]">{reviewScore > 0 ? reviewScore.toFixed(1) : 'New'}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Treatment rooms</p><p className="mt-1 text-[24px] text-[#10283b]">{property.num_treatment_rooms || '—'}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Spa team</p><p className="mt-1 text-[24px] text-[#10283b]">{property.team_size || '—'}</p></div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-14 md:py-16 space-y-16">
        {(about || highlights.length > 0) && <section className="grid lg:grid-cols-[1.25fr_.75fr] gap-10">
          <div><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#6f7f88]">About the property</p><h2 className="text-[32px] md:text-[38px] mt-2">What it is like to work here.</h2>{about && <p className="mt-5 text-[15px] leading-8 text-[#53636f] whitespace-pre-line">{about}</p>}</div>
          {highlights.length > 0 && <div className="rounded-[20px] border border-[#dfe5e8] bg-white p-6"><h3 className="text-[20px]">Property highlights</h3><div className="mt-4 space-y-3">{highlights.map((item: string) => <div key={item} className="flex gap-3 text-[13px] text-[#53636f]"><CheckCircle2 size={16} className="text-[#6f7f88] shrink-0 mt-0.5"/>{item}</div>)}</div></div>}
        </section>}

        <section>
          <p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#6f7f88]">Spa operation</p>
          <h2 className="text-[32px] md:text-[38px] mt-2">Understand the environment before you apply.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            <div className="border border-[#dfe5e8] rounded-[18px] p-5"><BedDouble size={19} className="text-[#6f7f88]"/><p className="text-[11px] text-[#7d8990] mt-4">Treatment rooms</p><p className="text-[22px] text-[#10283b] mt-1">{property.num_treatment_rooms || 'Not supplied'}</p></div>
            <div className="border border-[#dfe5e8] rounded-[18px] p-5"><Users size={19} className="text-[#6f7f88]"/><p className="text-[11px] text-[#7d8990] mt-4">Team size</p><p className="text-[22px] text-[#10283b] mt-1">{property.team_size || 'Not supplied'}</p></div>
            <div className="border border-[#dfe5e8] rounded-[18px] p-5"><Sparkles size={19} className="text-[#6f7f88]"/><p className="text-[11px] text-[#7d8990] mt-4">Services listed</p><p className="text-[22px] text-[#10283b] mt-1">{services.length || '—'}</p></div>
            <div className="border border-[#dfe5e8] rounded-[18px] p-5"><Building2 size={19} className="text-[#6f7f88]"/><p className="text-[11px] text-[#7d8990] mt-4">Property type</p><p className="text-[18px] text-[#10283b] mt-1">{property.property_type || property.company_type || 'Not supplied'}</p></div>
          </div>

          {(services.length > 0 || brands.length > 0 || systems.length > 0) && <div className="grid lg:grid-cols-3 gap-6 mt-7">
            {services.length > 0 && <InfoList title="Services & treatments" items={services}/>} 
            {brands.length > 0 && <InfoList title="Product houses" items={brands}/>} 
            {systems.length > 0 && <InfoList title="Systems used" items={systems}/>} 
          </div>}
        </section>

        {(property.nearest_transport || property.commute_car_required || property.parking_available || property.taxi_support || property.travel_notes) && <section>
          <p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#6f7f88]">Getting to work</p><h2 className="text-[32px] md:text-[38px] mt-2">Practical travel information.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            {property.nearest_transport && <TravelCard icon={Train} label="Nearest transport" value={`${property.nearest_transport}${property.transport_walk_minutes ? ` · ${property.transport_walk_minutes} min walk` : ''}`}/>} 
            {property.commute_car_required && <TravelCard icon={Car} label="Driving" value="A car is recommended or required"/>}
            {property.parking_available && <TravelCard icon={ParkingCircle} label="Parking" value="Staff parking available"/>}
            {property.taxi_support && <TravelCard icon={HeartHandshake} label="Taxi / shuttle" value={property.taxi_notes || 'Support may be available'}/>} 
          </div>
          {property.travel_notes && <p className="mt-5 text-[13px] leading-6 text-[#65717a]">{property.travel_notes}</p>}
        </section>}

        {culture.length > 0 && <section><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#6f7f88]">Culture</p><h2 className="text-[32px] md:text-[38px] mt-2">What this team says matters.</h2><div className="flex flex-wrap gap-2 mt-6">{culture.map((item: string) => <span key={item} className="rounded-full border border-[#dfe5e8] bg-[#f7f9fa] px-4 py-2 text-[12px] text-[#53636f]">{item}</span>)}</div></section>}

        <section id="openings">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#6f7f88]">Careers</p><h2 className="text-[32px] md:text-[38px] mt-2">Current openings.</h2></div><p className="text-[13px] text-[#65717a]">{jobs.length} live role{jobs.length === 1 ? '' : 's'}</p></div>
          {jobs.length > 0 ? <div className="grid md:grid-cols-2 gap-5 mt-7">{jobs.map(job => <Link key={job.id} href={`/jobs/${job.id}`} className="group border border-[#dfe5e8] rounded-[20px] p-6 hover:border-[#aebbc2] hover:shadow-sm transition-all"><div className="flex items-start justify-between gap-4"><div><h3 className="text-[22px] group-hover:text-[#123f64]">{job.job_title}</h3><p className="text-[12px] text-[#65717a] mt-2">{job.location || property.location} · {job.job_type || 'Full-time'}</p></div><Briefcase size={18} className="text-[#6f7f88]"/></div>{job.salary_min && job.salary_max && <p className="text-[14px] font-semibold text-[#10283b] mt-4">£{Number(job.salary_min).toLocaleString()}–£{Number(job.salary_max).toLocaleString()}</p>}{(job.job_description || job.description) && <p className="text-[13px] leading-6 text-[#65717a] mt-3 line-clamp-3">{job.job_description || job.description}</p>}<p className="text-[12px] font-semibold text-[#0b2f4d] mt-5">View role →</p></Link>)}</div> : <div className="border border-[#dfe5e8] rounded-[20px] p-10 text-center mt-7"><CalendarDays size={24} className="mx-auto text-[#6f7f88]"/><p className="text-[16px] text-[#10283b] mt-3">No current openings</p><p className="text-[12px] text-[#65717a] mt-1">Follow WHC or check back for future opportunities at {name}.</p></div>}
        </section>

        {(reviewScore > 0 || starRating) && <section className="rounded-[24px] bg-[#0b2f4d] text-white p-8 md:p-10 grid md:grid-cols-[auto_1fr] gap-7 items-center"><div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center"><Star size={30} className="text-white" fill="currentColor"/></div><div><p className="text-[10px] uppercase tracking-[.17em] text-white/55">Property reputation</p><h2 className="text-white text-[30px] mt-2">{reviewScore > 0 ? `${reviewScore.toFixed(1)} WHC rating` : `${starRating} property`}</h2><p className="text-[13px] leading-6 text-white/65 mt-2">{reviewCount > 0 ? `Based on ${reviewCount} verified review${reviewCount === 1 ? '' : 's'} recorded through the WHC platform.` : 'Property classification and reputation information shown from the employer profile.'}</p></div></section>}
      </main>

      <Footer />
    </div>
  )
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-[20px] border border-[#dfe5e8] p-6"><h3 className="text-[20px]">{title}</h3><div className="mt-4 flex flex-wrap gap-2">{items.slice(0, 16).map(item => <span key={item} className="rounded-full bg-[#f1f4f6] px-3 py-1.5 text-[11px] text-[#53636f]">{item}</span>)}</div></div>
}

function TravelCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="border border-[#dfe5e8] rounded-[18px] p-5"><Icon size={19} className="text-[#6f7f88]"/><p className="text-[10px] uppercase tracking-[.12em] text-[#7d8990] mt-4">{label}</p><p className="text-[14px] leading-6 text-[#10283b] mt-1">{value}</p></div>
}
