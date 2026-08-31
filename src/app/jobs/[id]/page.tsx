import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Link from 'next/link'
import { MapPin, Star, Check, ArrowRight, Building2, Users, BedDouble, ExternalLink, BriefcaseBusiness, CalendarDays, BadgeCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobApplyButtons from '@/components/JobApplyButtons'
import { createAdminClient } from '@/lib/supabase/admin'
import SponsoredAd from '@/components/SponsoredAd'

export const revalidate = 60

const SITE = 'https://talent.wellnesshousecollective.co.uk'
type Job = Record<string, any>

const getJob = cache(async (id: string): Promise<Job | null> => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('job_listings')
    .select('*, employer_profiles(*)')
    .eq('id', id)
    .eq('is_live', true)
    .maybeSingle()
  if (error || !data) return null
  return data as Job
})

function stripPlain(s: string) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() }
function prettyChip(s: string) { return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function hasAny(values: unknown[]) {
  return values.some(v => Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : Boolean(v))
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR', contractor: 'CONTRACTOR', temporary: 'TEMPORARY', permanent: 'FULL_TIME', internship: 'INTERN',
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  const job = await getJob(params.id)
  if (!job) return { title: { absolute: 'Role not found | WHC Concierge' }, robots: { index: false, follow: false } }
  const employer = job.employer_profiles || {}
  const propertyName = employer.property_name || employer.company_name || 'WHC Concierge'
  const titleText = job.job_title || job.title || 'Role'
  const description = stripPlain(String(job.job_description || job.description || '')).slice(0, 160)
  const url = `${SITE}/jobs/${params.id}`
  const image = Array.isArray(employer.property_photos) ? employer.property_photos[0] : undefined
  return {
    title: { absolute: `${titleText} - ${propertyName} | WHC Concierge` }, description,
    alternates: { canonical: url },
    openGraph: { title: `${titleText} - ${propertyName}`, description, url, type: 'article', ...(image ? { images: [image] } : {}) },
    twitter: { title: `${titleText} - ${propertyName}`, description, card: 'summary_large_image', ...(image ? { images: [image] } : {}) },
  }
}

export default async function RoleDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const job = await getJob(params.id)
  if (!job) notFound()

  const employer = (job.employer_profiles || {}) as Job
  const propertyName = employer.property_name || employer.company_name || 'Property'
  const titleText = job.job_title || job.title || 'Role'
  const description = String(job.job_description || job.description || '')
  const salaryRange = job.salary_min && job.salary_max ? `£${Number(job.salary_min).toLocaleString()} - £${Number(job.salary_max).toLocaleString()}` : null
  const propertyPhoto = Array.isArray(employer.property_photos) && employer.property_photos.length ? employer.property_photos[0] : null
  const reviewScore = Number(employer.review_score || 0)
  const reviewCount = Number(employer.review_count || 0)
  const packageItems = [job.salary_display_text, job.shift_pattern, job.offers_accommodation ? 'Accommodation provided' : null].filter(Boolean)

  const jobPostingLd: Record<string, unknown> = {
    '@context': 'https://schema.org/', '@type': 'JobPosting', title: titleText,
    description: description ? `<p>${stripPlain(description).slice(0, 5000)}</p>` : '',
    datePosted: job.posted_date || job.created_at || new Date().toISOString(),
    employmentType: EMPLOYMENT_TYPE_MAP[String(job.contract_type || '').toLowerCase()] || 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: employer.company_name || propertyName, ...(employer.website ? { sameAs: employer.website } : {}) },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location || employer.location || employer.city || undefined, addressCountry: 'GB' } },
  }
  if (job.application_deadline) jobPostingLd.validThrough = job.application_deadline
  if (job.salary_min && job.salary_max) jobPostingLd.baseSalary = { '@type': 'MonetaryAmount', currency: 'GBP', value: { '@type': 'QuantitativeValue', minValue: Number(job.salary_min), maxValue: Number(job.salary_max), unitText: 'YEAR' } }

  return <>
    <Navbar />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }} />
    <main className="pt-[68px] bg-white">
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4"><Link href="/jobs" className="text-[12px] text-[#555555] hover:text-[#111111]">← All roles</Link></div>
      </section>

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12 items-start">
          <div>
            <span className="inline-flex rounded-full bg-[#eef2f4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#4d4d4d]">{job.tier === 'Platinum' ? 'Featured role' : 'Standard role'}</span>{job.is_residency_role && <span className="ml-2 inline-flex rounded-full bg-[#e8eef4] px-3 py-1 text-[10px] uppercase tracking-[.12em] font-semibold text-[#111111]">Residency</span>}
            <h1 className="text-[42px] md:text-[58px] leading-[1.02] tracking-[-.045em] text-[#1a1a1a] mt-4">{titleText}</h1>
            <Link href={employer.id ? `/properties/${employer.id}` : '#'} className="inline-flex items-center gap-2 mt-4 text-[17px] font-semibold text-[#111111] hover:underline">
              <Building2 size={17}/>{propertyName}<ArrowRight size={14}/>
            </Link>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-[13px] text-[#555555]">
              {(job.location || employer.location) && <span className="inline-flex items-center gap-1.5"><MapPin size={14}/>{job.location || employer.location}</span>}
              {employer.star_rating && <span className="inline-flex items-center gap-1.5"><Star size={14} fill="currentColor"/>{isNaN(Number(employer.star_rating)) ? employer.star_rating : `${employer.star_rating} star property`}</span>}
              {reviewScore > 0 && <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14}/>{reviewScore.toFixed(1)} WHC rating{reviewCount ? ` · ${reviewCount} review${reviewCount === 1 ? '' : 's'}` : ''}</span>}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
              {salaryRange && <Fact label="Salary" value={salaryRange}/>} 
              {job.contract_type && <Fact label="Contract" value={prettyChip(String(job.contract_type))}/>} 
              {job.job_type && <Fact label="Hours" value={prettyChip(String(job.job_type))}/>} 
              {job.application_deadline && <Fact label="Apply by" value={new Date(job.application_deadline).toLocaleDateString('en-GB')}/>} 
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 border border-[#e5e5e5] rounded-[20px] p-5 bg-white shadow-sm">
            <p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Interested in this role?</p>
            <p className="text-[13px] leading-6 text-[#555555] mt-2">Apply through WHC so the property can review your full professional profile and match information.</p>
            <div className="mt-5"><JobApplyButtons roleId={String(job.id)} /></div>
          </aside>
        </div>
      </section>

      {(propertyPhoto || employer.id) && <section className="border-y border-[#e5e5e5] bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr_auto] gap-6 items-center">
          {propertyPhoto ? <div className="aspect-[4/3] overflow-hidden rounded-[16px] bg-white"><img src={propertyPhoto} alt={propertyName} className="w-full h-full object-cover"/></div> : <div className="aspect-[4/3] rounded-[16px] bg-white border border-[#e5e5e5] flex items-center justify-center"><Building2 size={30} className="text-[#8a979f]"/></div>}
          <div>
            <p className="text-[10px] uppercase tracking-[.14em] text-[#555555]">The property</p>
            <h2 className="text-[28px] mt-2">{propertyName}</h2>
            {employer.tagline && <p className="text-[13px] text-[#555555] mt-2">{employer.tagline}</p>}
            <div className="flex flex-wrap gap-4 mt-4 text-[12px] text-[#555555]">
              {employer.num_treatment_rooms && <span className="inline-flex items-center gap-1.5"><BedDouble size={14}/>{employer.num_treatment_rooms} treatment rooms</span>}
              {employer.team_size && <span className="inline-flex items-center gap-1.5"><Users size={14}/>{employer.team_size} team members</span>}
              {employer.property_type && <span className="inline-flex items-center gap-1.5"><Building2 size={14}/>{prettyChip(String(employer.property_type))}</span>}
            </div>
          </div>
          <div className="flex md:flex-col gap-2">{employer.id && <Link href={`/properties/${employer.id}`} className="btn-primary text-center">View full property profile</Link>}{employer.website && <a href={employer.website} target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2">Property website <ExternalLink size={13}/></a>}</div>
        </div>
      </section>}

      <section className="max-w-6xl mx-auto px-6 py-14 md:py-16 grid lg:grid-cols-[minmax(0,1fr)_290px] gap-12">
        <div className="space-y-14">
          {description && <JobSection eyebrow="The role" title="What you'll be doing"><div className="text-[15px] leading-8 text-[#465761] whitespace-pre-line">{description}</div></JobSection>}

          {hasAny([job.required_skills, job.required_qualifications, job.required_brands, job.required_systems, job.required_management_skills, job.required_role_level, job.min_years_experience]) &&
            <JobSection eyebrow="What we're looking for" title="Experience, skills & qualifications">
              <div className="space-y-7">
                <ChipList label="Skills" items={job.required_skills}/>
                <ChipList label="Qualifications" items={job.required_qualifications}/>
                <ChipList label="Brand experience" items={job.required_brands}/>
                <ChipList label="Systems" items={job.required_systems}/>
                <ChipList label="Management skills" items={job.required_management_skills}/>
                {(job.required_role_level || job.min_years_experience != null) && <div className="grid sm:grid-cols-2 gap-3">{job.required_role_level && <Fact label="Role level" value={prettyChip(String(job.required_role_level))}/>} {job.min_years_experience != null && <Fact label="Experience" value={`${job.min_years_experience}+ years`}/>}</div>}
              </div>
            </JobSection>}

          {hasAny([job.three_things, job.perks, ...packageItems]) && <JobSection eyebrow="The package" title="What you'll get">
            {Array.isArray(job.three_things) && job.three_things.length > 0 && <TickList items={job.three_things}/>} 
            {Array.isArray(job.perks) && job.perks.length > 0 && <div className="mt-6"><p className="text-[11px] uppercase tracking-[.12em] font-semibold text-[#7d8990] mb-3">Benefits & perks</p><TickList items={job.perks}/></div>}
            {packageItems.length > 0 && <div className="flex flex-wrap gap-2 mt-6">{packageItems.map((item: any) => <span key={String(item)} className="rounded-full bg-[#f1f4f6] px-3 py-1.5 text-[12px] text-[#4d4d4d]">{String(item)}</span>)}</div>}
          </JobSection>}

          <JobSection eyebrow="The employer" title={`Why ${propertyName}`}>
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start border border-[#e5e5e5] rounded-[20px] p-6">
              <div>
                <p className="text-[14px] leading-7 text-[#4d4d4d]">{employer.about_text || employer.description || employer.tagline || `Explore the full WHC property profile for ${propertyName} to see its spa operation, staff reviews, property rating, brands, travel information and current opportunities.`}</p>
                <div className="flex flex-wrap gap-3 mt-4 text-[12px] text-[#555555]">{employer.star_rating && <span>{isNaN(Number(employer.star_rating)) ? employer.star_rating : `${employer.star_rating}★ property`}</span>}{reviewScore > 0 && <span>{reviewScore.toFixed(1)} WHC staff rating</span>}{employer.hotel_group && <span>{employer.hotel_group}</span>}{employer.room_count && <span>{employer.room_count} rooms</span>}{employer.spa_size && <span>{employer.spa_size}</span>}{employer.num_treatment_rooms && <span>{employer.num_treatment_rooms} treatment rooms</span>}{employer.team_size && <span>{employer.team_size} spa team</span>}{employer.opening_year && <span>Opened {employer.opening_year}</span>}</div>
                {Array.isArray(employer.facilities) && employer.facilities.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{employer.facilities.map((facility: string) => <span key={facility} className="text-[11px] bg-[#f2f0ea] text-[#5c5646] px-2.5 py-1 rounded-full">{facility}</span>)}</div>}
                {employer.culture_statement && <div className="mt-5"><p className="text-[10px] uppercase tracking-[.14em] text-[#1a1a1a] font-semibold mb-1.5">Working here</p><p className="text-[13px] leading-6 text-[#4d4d4d] whitespace-pre-line">{employer.culture_statement}</p></div>}
                {Array.isArray(employer.staff_benefits) && employer.staff_benefits.length > 0 && <div className="mt-4"><p className="text-[10px] uppercase tracking-[.14em] text-[#1a1a1a] font-semibold mb-1.5">Staff benefits</p><div className="flex flex-wrap gap-1.5">{employer.staff_benefits.map((benefit: string) => <span key={benefit} className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">{benefit}</span>)}</div></div>}
                {employer.progression_notes && <div className="mt-4"><p className="text-[10px] uppercase tracking-[.14em] text-[#1a1a1a] font-semibold mb-1.5">Progression</p><p className="text-[13px] leading-6 text-[#4d4d4d] whitespace-pre-line">{employer.progression_notes}</p></div>}
              </div>
              {employer.id && <Link href={`/properties/${employer.id}`} className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap">Explore property <ArrowRight size={13}/></Link>}
            </div>
          </JobSection>
        </div>

        <aside className="space-y-4">
          <div className="border border-[#e5e5e5] rounded-[18px] p-5">
            <p className="text-[10px] uppercase tracking-[.14em] text-[#7d8990]">Role at a glance</p>
            <div className="space-y-4 mt-4">{salaryRange && <MiniFact icon={BriefcaseBusiness} label="Salary" value={salaryRange}/>} {(job.location || employer.location) && <MiniFact icon={MapPin} label="Location" value={job.location || employer.location}/>} {job.shift_pattern && <MiniFact icon={CalendarDays} label="Shift pattern" value={prettyChip(String(job.shift_pattern))}/>} {employer.star_rating && <MiniFact icon={Star} label="Property" value={isNaN(Number(employer.star_rating)) ? employer.star_rating : `${employer.star_rating} star`}/>}</div>
          </div>
        </aside>
      </section>

      <section className="bg-[#111111] text-white py-14 px-6"><div className="max-w-4xl mx-auto text-center"><h2 className="text-[30px] text-white">Could this be your next move?</h2><p className="text-[14px] text-white/65 mt-3 mb-7">Apply through WHC and the property will receive your profile, experience and match information in one place.</p><div className="flex justify-center"><JobApplyButtons roleId={String(job.id)} /></div></div></section>
    </main>
    <SponsoredAd placement="job_detail_sponsor" />
    <Footer />
  </>
}

function JobSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#555555]">{eyebrow}</p><h2 className="text-[30px] md:text-[36px] mt-2 mb-5">{title}</h2>{children}</section>
}
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-[14px] border border-[#e5e5e5] bg-white px-4 py-3"><p className="text-[9px] uppercase tracking-[.12em] text-[#8a979f]">{label}</p><p className="text-[13px] font-semibold text-[#1a1a1a] mt-1">{value}</p></div> }
function MiniFact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) { return <div className="flex gap-3"><Icon size={16} className="text-[#555555] mt-0.5 shrink-0"/><div><p className="text-[10px] uppercase tracking-[.1em] text-[#8a979f]">{label}</p><p className="text-[13px] text-[#1a1a1a] mt-0.5">{value}</p></div></div> }
function ChipList({ label, items }: { label: string; items?: string[] | null }) { if (!Array.isArray(items) || items.length === 0) return null; return <div><p className="text-[11px] uppercase tracking-[.12em] font-semibold text-[#7d8990] mb-3">{label}</p><div className="flex flex-wrap gap-2">{items.map(item => <span key={item} className="rounded-full border border-[#e5e5e5] bg-[#f7f7f7] px-3 py-1.5 text-[12px] text-[#4d4d4d]">{prettyChip(String(item))}</span>)}</div></div> }
function TickList({ items }: { items: string[] }) { return <div className="grid sm:grid-cols-2 gap-3">{items.map(item => <div key={item} className="flex gap-3 text-[13px] text-[#4d4d4d]"><Check size={15} className="text-[#111111] mt-0.5 shrink-0"/>{item}</div>)}</div> }
