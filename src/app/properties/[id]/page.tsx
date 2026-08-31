import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  MapPin, Star, Briefcase, ArrowLeft, Building2, ExternalLink, Users,
  BedDouble, Sparkles, Train, Car, ParkingCircle, BadgeCheck, CalendarDays,
  HeartHandshake, CheckCircle2, BookOpen, MessageSquareQuote,
} from 'lucide-react'

export const revalidate = 60

const asList = (value: any) => Array.isArray(value) ? value.filter(Boolean) : []

async function loadReviews(admin: ReturnType<typeof createAdminClient>, employerUserId?: string | null) {
  if (!employerUserId) return { reviews: [] as any[], summary: { count: 0, average: null as number | null } }

  let reviews: any[] = []
  for (const reviewedColumn of ['reviewed_id', 'reviewee_id']) {
    const { data, error } = await admin
      .from('reviews')
      .select('id,reviewer_id,rating,text,comment,criteria_scores,booking_id,created_at,type')
      .eq(reviewedColumn, employerUserId)
      .eq('type', 'employer')
      .order('created_at', { ascending: false })
      .limit(30)
    if (!error) { reviews = data || []; break }
  }

  const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))]
  const { data: candidates } = reviewerIds.length
    ? await admin.from('candidate_profiles').select('user_id,full_name,current_role').in('user_id', reviewerIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map((c: any) => [c.user_id, c]))

  const publicReviews = reviews
    .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
    .map(r => {
      const reviewer: any = candidateMap.get(r.reviewer_id)
      return {
        id: r.id,
        rating: Number(r.rating),
        comment: r.comment || r.text || '',
        created_at: r.created_at,
        verified: true,
        source: r.booking_id ? 'Completed WHC agency shift' : 'WHC placement',
        reviewer_name: reviewer?.full_name || 'WHC professional',
        reviewer_role: reviewer?.current_role || null,
      }
    })

  const average = publicReviews.length
    ? Math.round((publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length) * 10) / 10
    : null

  return { reviews: publicReviews, summary: { count: publicReviews.length, average } }
}

const getPropertyPageData = unstable_cache(async (id: string) => {
  const admin = createAdminClient()
  const [{ data: property }, { data: jobs }] = await Promise.all([
    admin.from('employer_profiles').select('*').eq('id', id).eq('approval_status', 'approved').maybeSingle(),
    admin.from('job_listings').select('*').eq('employer_id', id).eq('is_live', true).eq('status', 'active').order('posted_date', { ascending: false }),
  ])
  if (!property) return null
  const reviewData = await loadReviews(admin, property.user_id)
  return { property, jobs: jobs || [], ...reviewData }
}, ['public-property-detail-v2'], { revalidate: 60 })

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPropertyPageData(id)

  if (!data) {
    return <div className="min-h-screen bg-white"><Navbar /><section className="pt-[120px] pb-20"><div className="max-w-7xl mx-auto px-6 text-center"><h1 className="text-3xl text-ink mb-4">Property not found</h1><Link href="/properties" className="text-[#111111] font-semibold">Back to Properties</Link></div></section><Footer /></div>
  }

  const { property, jobs, reviews: staffReviews, summary: reviewSummary } = data
  const name = property.property_name || property.company_name
  const photos = asList(property.property_photos)
  const about = property.about_text || property.description
  const whcReviewScore = reviewSummary.average ?? (Number(property.review_score || 0) || null)
  const whcReviewCount = reviewSummary.count || Number(property.review_count || 0)
  const starRating = property.star_rating
  const services = asList(property.services_offered)
  const brands = asList(property.product_houses_used)
  const systems = asList(property.systems_used)
  const culture = asList(property.culture_points)
  const highlights = asList(property.highlights)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="border-b border-[#e5e5e5] bg-white pt-[68px]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/properties" className="inline-flex items-center text-[12px] font-semibold text-[#555555] hover:text-[#111111]"><ArrowLeft size={14} className="mr-2"/>Properties</Link>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {property.property_type && <span className="rounded-full bg-[#eef2f4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#4d4d4d]">{property.property_type}</span>}
              {property.company_type && <span className="rounded-full bg-[#eef2f4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#4d4d4d]">{property.company_type}</span>}
              {property.agency_available && <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-green-700">Agency cover accepted</span>}
            </div>
            <h1 className="text-[42px] md:text-[58px] leading-[1.02] tracking-[-.045em] text-[#1a1a1a]">{name}</h1>
            {property.tagline && <p className="mt-4 text-[17px] md:text-[20px] leading-8 text-[#4d4d4d] max-w-3xl">{property.tagline}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#555555]">
              {(property.location || property.postcode) && <span className="inline-flex items-center gap-2"><MapPin size={16}/>{[property.location, property.postcode].filter(Boolean).join(' · ')}</span>}
              {starRating && <span className="inline-flex items-center gap-2 text-[#1a1a1a]"><Star size={16} fill="currentColor"/>{isNaN(Number(starRating)) ? starRating : `${starRating} star property`}</span>}
              {whcReviewScore && <span className="inline-flex items-center gap-2"><BadgeCheck size={16}/><strong className="text-[#1a1a1a]">{whcReviewScore.toFixed(1)}</strong>{whcReviewCount > 0 ? ` from ${whcReviewCount} verified WHC review${whcReviewCount === 1 ? '' : 's'}` : ' WHC verified rating'}</span>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
            {property.website && <a href={property.website} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">Official website <ExternalLink size={14}/></a>}
            {property.tripadvisor_url && <a href={property.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">View on TripAdvisor <ExternalLink size={14}/></a>}
            {property.treatment_menu_url && <a href={property.treatment_menu_url} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">View treatment menu <BookOpen size={14}/></a>}
            {jobs.length > 0 && <a href="#openings" className="btn-primary inline-flex items-center justify-center gap-2">View {jobs.length} opening{jobs.length === 1 ? '' : 's'} <Briefcase size={14}/></a>}
          </div>
        </div>
      </section>

      {photos.length > 0 && <section className="bg-white pb-14"><div className="max-w-7xl mx-auto px-6"><div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {photos.slice(0, 6).map((url: string, index: number) => <div key={url} className={`overflow-hidden rounded-[18px] bg-[#f2f4f6] ${index === 0 && photos.length > 2 ? 'col-span-2 row-span-2 min-h-[420px]' : 'aspect-[4/3]'}`}><img src={url} alt={`${name} property ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover"/></div>)}
      </div></div></section>}

      <section className="border-y border-[#e5e5e5] bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-6 py-7 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Property rating</p><p className="mt-1 text-[24px] text-[#1a1a1a]">{starRating ? (isNaN(Number(starRating)) ? starRating : `${starRating}★`) : 'Not listed'}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">WHC staff rating</p><p className="mt-1 text-[24px] text-[#1a1a1a]">{whcReviewScore ? whcReviewScore.toFixed(1) : 'New'}</p><p className="text-[10px] text-[#8b969c] mt-1">Verified workers only</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Treatment rooms</p><p className="mt-1 text-[24px] text-[#1a1a1a]">{property.num_treatment_rooms || '-'}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Spa team</p><p className="mt-1 text-[24px] text-[#1a1a1a]">{property.team_size || '-'}</p></div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-14 md:py-16 space-y-16">
        {(about || highlights.length > 0) && <section className="grid lg:grid-cols-[1.25fr_.75fr] gap-10">
          <div><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">About the property</p><h2 className="text-[32px] md:text-[38px] mt-2">Understand the place before you apply.</h2>{about && <p className="mt-5 text-[15px] leading-8 text-[#4d4d4d] whitespace-pre-line">{about}</p>}</div>
          {highlights.length > 0 && <div className="rounded-[20px] border border-[#e5e5e5] bg-white p-6"><h3 className="text-[20px]">Property highlights</h3><div className="mt-4 space-y-3">{highlights.map((item: string) => <div key={item} className="flex gap-3 text-[13px] text-[#4d4d4d]"><CheckCircle2 size={16} className="text-[#555555] shrink-0 mt-0.5"/>{item}</div>)}</div></div>}
        </section>}

        {(property.website || property.tripadvisor_url || property.treatment_menu_url || property.guest_review_summary) && <section>
          <p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Guest reputation & spa experience</p>
          <h2 className="text-[32px] md:text-[38px] mt-2">See what guests see too.</h2>
          <p className="mt-3 text-[13px] leading-6 text-[#555555] max-w-3xl">WHC keeps guest reputation separate from staff reviews. External links below are supplied by the property; WHC does not copy or invent external review scores.</p>
          <div className="grid md:grid-cols-3 gap-4 mt-7">
            {property.website && <ExternalCard title="Official property website" text="Explore the hotel, spa or wellness property directly." href={property.website}/>} 
            {property.tripadvisor_url && <ExternalCard title="TripAdvisor" text="Open the property's supplied TripAdvisor page to see current guest commentary." href={property.tripadvisor_url}/>} 
            {property.treatment_menu_url && <ExternalCard title="Treatment menu" text="See the current treatments, rituals, packages and spa positioning." href={property.treatment_menu_url}/>} 
          </div>
          {property.guest_review_summary && <div className="mt-5 rounded-[18px] bg-[#f7f7f7] border border-[#e5e5e5] p-5"><p className="text-[10px] uppercase tracking-[.12em] text-[#7d8990]">Property-supplied guest reputation context</p><p className="text-[13px] leading-6 text-[#4d4d4d] mt-2">{property.guest_review_summary}</p></div>}
        </section>}

        <section>
          <p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Spa operation</p>
          <h2 className="text-[32px] md:text-[38px] mt-2">Understand the working environment.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            <div className="border border-[#e5e5e5] rounded-[18px] p-5"><BedDouble size={19} className="text-[#555555]"/><p className="text-[11px] text-[#7d8990] mt-4">Treatment rooms</p><p className="text-[22px] text-[#1a1a1a] mt-1">{property.num_treatment_rooms || 'Not supplied'}</p></div>
            <div className="border border-[#e5e5e5] rounded-[18px] p-5"><Users size={19} className="text-[#555555]"/><p className="text-[11px] text-[#7d8990] mt-4">Team size</p><p className="text-[22px] text-[#1a1a1a] mt-1">{property.team_size || 'Not supplied'}</p></div>
            <div className="border border-[#e5e5e5] rounded-[18px] p-5"><Sparkles size={19} className="text-[#555555]"/><p className="text-[11px] text-[#7d8990] mt-4">Services listed</p><p className="text-[22px] text-[#1a1a1a] mt-1">{services.length || '-'}</p></div>
            <div className="border border-[#e5e5e5] rounded-[18px] p-5"><Building2 size={19} className="text-[#555555]"/><p className="text-[11px] text-[#7d8990] mt-4">Property type</p><p className="text-[18px] text-[#1a1a1a] mt-1">{property.property_type || property.company_type || 'Not supplied'}</p></div>
          </div>

          {(services.length > 0 || brands.length > 0 || systems.length > 0) && <div className="grid lg:grid-cols-3 gap-6 mt-7">
            {services.length > 0 && <InfoList title="Services & treatments" items={services}/>} 
            {brands.length > 0 && <InfoList title="Product houses" items={brands}/>} 
            {systems.length > 0 && <InfoList title="Systems used" items={systems}/>} 
          </div>}
        </section>

        {(property.nearest_transport || property.commute_car_required || property.parking_available || property.taxi_support || property.travel_notes) && <section>
          <p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Getting to work</p><h2 className="text-[32px] md:text-[38px] mt-2">Practical travel information.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
            {property.nearest_transport && <TravelCard icon={Train} label="Nearest transport" value={`${property.nearest_transport}${property.transport_walk_minutes ? ` · ${property.transport_walk_minutes} min walk` : ''}`}/>} 
            {property.commute_car_required && <TravelCard icon={Car} label="Driving" value="A car is recommended or required"/>}
            {property.parking_available && <TravelCard icon={ParkingCircle} label="Parking" value="Staff parking available"/>}
            {property.taxi_support && <TravelCard icon={HeartHandshake} label="Taxi / shuttle" value={property.taxi_notes || 'Support may be available'}/>} 
          </div>
          {property.travel_notes && <p className="mt-5 text-[13px] leading-6 text-[#555555]">{property.travel_notes}</p>}
        </section>}

        {culture.length > 0 && <section><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Culture</p><h2 className="text-[32px] md:text-[38px] mt-2">What this team says matters.</h2><div className="flex flex-wrap gap-2 mt-6">{culture.map((item: string) => <span key={item} className="rounded-full border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-2 text-[12px] text-[#4d4d4d]">{item}</span>)}</div></section>}

        <section id="staff-reviews">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Verified WHC professionals</p><h2 className="text-[32px] md:text-[38px] mt-2">What is it actually like to work here?</h2></div>{whcReviewScore && <div className="text-left md:text-right"><p className="text-[34px] text-[#1a1a1a] leading-none">{whcReviewScore.toFixed(1)} / 5</p><p className="text-[11px] text-[#7d8990] mt-2">{whcReviewCount} verified review{whcReviewCount === 1 ? '' : 's'}</p></div>}</div>
          <p className="mt-3 text-[13px] leading-6 text-[#555555] max-w-3xl">Only professionals with a completed paid WHC Agency shift or accepted WHC placement can leave these reviews. They are separate from guest reviews and property marketing.</p>
          {staffReviews.length > 0 ? <div className="grid md:grid-cols-2 gap-5 mt-7">{staffReviews.slice(0, 8).map((review: any) => <article key={review.id} className="rounded-[20px] border border-[#e5e5e5] p-6 bg-white"><div className="flex items-start justify-between gap-4"><div><div className="flex gap-1">{[1,2,3,4,5].map(n => <Star key={n} size={14} className={n <= review.rating ? 'text-[#111111]' : 'text-[#cccccc]'} fill={n <= review.rating ? 'currentColor' : 'none'}/>)}</div><p className="text-[14px] font-semibold text-[#1a1a1a] mt-3">{review.reviewer_name}</p>{review.reviewer_role && <p className="text-[11px] text-[#7d8990]">{review.reviewer_role}</p>}</div><span className="inline-flex items-center gap-1 rounded-full bg-[#eef4f1] text-[#355d49] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.08em]"><BadgeCheck size={11}/>Verified</span></div>{review.comment && <p className="mt-5 text-[13px] leading-6 text-[#4d4d4d]">“{review.comment}”</p>}<div className="mt-5 pt-4 border-t border-[#e8ecee] flex items-center justify-between gap-3"><p className="text-[10px] text-[#7d8990]">{review.source}</p>{review.created_at && <p className="text-[10px] text-[#9aa3a8]">{new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>}</div></article>)}</div> : <div className="mt-7 rounded-[20px] border border-[#e5e5e5] bg-[#f7f7f7] p-8 text-center"><MessageSquareQuote size={24} className="mx-auto text-[#555555]"/><p className="text-[16px] text-[#1a1a1a] mt-3">No verified WHC staff reviews yet</p><p className="text-[12px] text-[#555555] mt-1">The score will build as professionals complete WHC shifts and placements here.</p></div>}
        </section>

        <section id="openings">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.17em] font-semibold text-[#555555]">Careers</p><h2 className="text-[32px] md:text-[38px] mt-2">Current openings.</h2></div><p className="text-[13px] text-[#555555]">{jobs.length} live role{jobs.length === 1 ? '' : 's'}</p></div>
          {jobs.length > 0 ? <div className="grid md:grid-cols-2 gap-5 mt-7">{jobs.map((job: any) => <Link key={job.id} href={`/jobs/${job.id}`} className="group border border-[#e5e5e5] rounded-[20px] p-6 hover:border-[#aebbc2] hover:shadow-sm transition-all"><div className="flex items-start justify-between gap-4"><div><h3 className="text-[22px] group-hover:text-[#333333]">{job.job_title}</h3><p className="text-[12px] text-[#555555] mt-2">{job.location || property.location} · {job.job_type || 'Full-time'}</p></div><Briefcase size={18} className="text-[#555555]"/></div>{job.salary_min && job.salary_max && <p className="text-[14px] font-semibold text-[#1a1a1a] mt-4">£{Number(job.salary_min).toLocaleString()}–£{Number(job.salary_max).toLocaleString()}</p>}{(job.job_description || job.description) && <p className="text-[13px] leading-6 text-[#555555] mt-3 line-clamp-3">{job.job_description || job.description}</p>}<p className="text-[12px] font-semibold text-[#111111] mt-5">View role →</p></Link>)}</div> : <div className="border border-[#e5e5e5] rounded-[20px] p-10 text-center mt-7"><CalendarDays size={24} className="mx-auto text-[#555555]"/><p className="text-[16px] text-[#1a1a1a] mt-3">No current openings</p><p className="text-[12px] text-[#555555] mt-1">Follow WHC or check back for future opportunities at {name}.</p></div>}
        </section>
      </main>

      <Footer />
    </div>
  )
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-[20px] border border-[#e5e5e5] p-6"><h3 className="text-[20px]">{title}</h3><div className="mt-4 flex flex-wrap gap-2">{items.slice(0, 16).map(item => <span key={item} className="rounded-full bg-[#f1f4f6] px-3 py-1.5 text-[11px] text-[#4d4d4d]">{item}</span>)}</div></div>
}

function TravelCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="border border-[#e5e5e5] rounded-[18px] p-5"><Icon size={19} className="text-[#555555]"/><p className="text-[10px] uppercase tracking-[.12em] text-[#7d8990] mt-4">{label}</p><p className="text-[14px] leading-6 text-[#1a1a1a] mt-1">{value}</p></div>
}

function ExternalCard({ title, text, href }: { title: string; text: string; href: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="group rounded-[18px] border border-[#e5e5e5] p-5 hover:border-[#aebbc2] hover:bg-[#f7f7f7] transition-all"><div className="flex items-start justify-between gap-4"><div><h3 className="text-[18px]">{title}</h3><p className="text-[12px] leading-5 text-[#555555] mt-2">{text}</p></div><ExternalLink size={16} className="text-[#555555] shrink-0"/></div></a>
}
