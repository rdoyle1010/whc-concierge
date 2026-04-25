import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Link from 'next/link'
import { MapPin, Star, Check, ArrowRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import JobApplyButtons from '@/components/JobApplyButtons'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

type Job = Record<string, any>

const getJob = cache(async (id: string): Promise<Job | null> => {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('job_listings')
    .select('*, employer_profiles(*)')
    .eq('id', id)
    .eq('is_live', true)
    .maybeSingle()
  if (error || !data) return null
  return data as Job
})

function stripPlain(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function prettyChip(s: string): string {
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function hasAny(values: unknown[]): boolean {
  return values.some((v) => {
    if (v == null) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim().length > 0
    if (typeof v === 'boolean') return v === true
    if (typeof v === 'number') return true
    return Boolean(v)
  })
}

const TIER_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  Platinum: { bg: '#1a1a1a', color: '#FFFFFF', label: 'Platinum' },
  Gold: { bg: '#FDF6EC', color: '#C9A96E', label: 'Gold' },
  Silver: { bg: '#F1F1F1', color: '#6B7280', label: 'Silver' },
  Bronze: { bg: '#F8F7F5', color: '#6B7280', label: 'Bronze' },
}

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: 'FULL_TIME',
  part_time: 'PART_TIME',
  contract: 'CONTRACTOR',
  contractor: 'CONTRACTOR',
  temporary: 'TEMPORARY',
  permanent: 'FULL_TIME',
  internship: 'INTERN',
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJob(params.id)
  if (!job) {
    return {
      title: { absolute: 'Role not found | WHC Concierge' },
      robots: { index: false, follow: false },
    }
  }

  const propertyName =
    job.employer_profiles?.property_name || job.employer_profiles?.company_name || 'WHC Concierge'
  const titleText = job.job_title || job.title || 'Role'
  const fullTitle = `${titleText} — ${propertyName} | WHC Concierge`
  const description = stripPlain(String(job.job_description || job.description || '')).slice(0, 160)
  const url = `${SITE}/jobs/${params.id}`

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, type: 'article' },
    twitter: { title: fullTitle, description, card: 'summary_large_image' },
  }
}

export default async function RoleDetailPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id)
  if (!job) notFound()

  const employer = (job.employer_profiles || {}) as Job
  const propertyName = employer.property_name || employer.company_name || 'Premium Property'
  const titleText = job.job_title || job.title || 'Role'
  const description: string = String(job.job_description || job.description || '')
  const tier = TIER_STYLES[job.tier as string] || TIER_STYLES.Bronze

  const salaryRange =
    job.salary_min && job.salary_max
      ? `£${Number(job.salary_min).toLocaleString()} – £${Number(job.salary_max).toLocaleString()}`
      : null

  // JobPosting structured data — Google Jobs eligibility
  const jobPostingLd: Record<string, unknown> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: titleText,
    description: description ? `<p>${stripPlain(description).slice(0, 5000)}</p>` : '',
    datePosted: job.posted_date || job.created_at || new Date().toISOString(),
    employmentType:
      EMPLOYMENT_TYPE_MAP[String(job.contract_type || '').toLowerCase()] || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: employer.company_name || propertyName,
      ...(employer.website ? { sameAs: employer.website } : {}),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || employer.city || undefined,
        addressCountry: 'GB',
      },
    },
  }
  if (job.application_deadline) jobPostingLd.validThrough = job.application_deadline
  if (job.salary_min && job.salary_max) {
    jobPostingLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'GBP',
      value: {
        '@type': 'QuantitativeValue',
        minValue: Number(job.salary_min),
        maxValue: Number(job.salary_max),
        unitText: 'YEAR',
      },
    }
  }

  const requirementValues = [
    job.required_skills,
    job.required_qualifications,
    job.required_brands,
    job.required_systems,
    job.required_management_skills,
    job.required_role_level,
    job.min_years_experience,
  ]

  const offerValues = [
    job.three_things,
    job.perks,
    job.salary_display_text,
    job.offers_accommodation,
    job.shift_pattern,
  ]

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />
      <main className="pt-[60px]">
        {/* Hero */}
        <section className="bg-white pt-12 pb-12 px-6">
          <div className="max-w-5xl mx-auto">
            <Link href="/jobs" className="text-[12px] hover:underline" style={{ color: '#9CA3AF' }}>
              ← All roles
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 mt-4 items-start">
              <div>
                <span
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full inline-block"
                  style={{ background: tier.bg, color: tier.color }}
                >
                  {tier.label}
                </span>
                <h1
                  className="text-[32px] md:text-[44px] font-medium tracking-tight leading-[1.08] mt-4 mb-3"
                  style={{ color: '#1a1a1a' }}
                >
                  {titleText}
                </h1>
                <p className="text-[16px]">
                  <span className="font-medium" style={{ color: '#C9A96E' }}>{propertyName}</span>
                  {job.location && <span style={{ color: '#9CA3AF' }}> · </span>}
                  {job.location && <span style={{ color: '#6B7280' }}>{job.location}</span>}
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {salaryRange && <Pill>{salaryRange}</Pill>}
                  {job.contract_type && <Pill>{prettyChip(String(job.contract_type))}</Pill>}
                  {job.job_type && <Pill>{prettyChip(String(job.job_type))}</Pill>}
                  {job.sector && <Pill>{prettyChip(String(job.sector))}</Pill>}
                </div>
              </div>
              <div className="lg:sticky lg:top-24">
                <JobApplyButtons roleId={String(job.id)} />
              </div>
            </div>
          </div>
        </section>

        {/* About the role */}
        {description && (
          <Section title="About the role" eyebrow="Overview">
            <div
              className="text-[15px] md:text-[16px] leading-[1.85] whitespace-pre-line"
              style={{ color: '#374151' }}
            >
              {description}
            </div>
          </Section>
        )}

        {/* Who we're looking for */}
        {hasAny(requirementValues) && (
          <Section title="Who we're looking for" eyebrow="Requirements" alt>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <ChipList label="Skills" items={job.required_skills as string[] | null | undefined} />
              <ChipList label="Qualifications" items={job.required_qualifications as string[] | null | undefined} />
              <ChipList label="Brand experience" items={job.required_brands as string[] | null | undefined} />
              <ChipList label="Systems" items={job.required_systems as string[] | null | undefined} />
              <ChipList label="Management skills" items={job.required_management_skills as string[] | null | undefined} />
              {job.required_role_level && (
                <SingleChip label="Role level" value={prettyChip(String(job.required_role_level))} />
              )}
              {job.min_years_experience != null && (
                <Plain label="Minimum years' experience" value={`${job.min_years_experience}+ years`} />
              )}
            </div>
          </Section>
        )}

        {/* What's on offer */}
        {hasAny(offerValues) && (
          <Section title="What's on offer" eyebrow="The package">
            {Array.isArray(job.three_things) && job.three_things.length > 0 && (
              <TickList items={job.three_things as string[]} />
            )}
            {Array.isArray(job.perks) && job.perks.length > 0 && (
              <div className="mt-6">
                <p className="text-[12px] uppercase tracking-wide font-medium mb-3" style={{ color: '#6B7280' }}>
                  Perks
                </p>
                <TickList items={job.perks as string[]} />
              </div>
            )}
            {(job.salary_display_text || job.offers_accommodation || job.shift_pattern) && (
              <div className="flex flex-wrap gap-3 mt-6">
                {job.salary_display_text && <Pill>{String(job.salary_display_text)}</Pill>}
                {job.offers_accommodation && <Pill>Accommodation provided</Pill>}
                {job.shift_pattern && <Pill>{prettyChip(String(job.shift_pattern))}</Pill>}
              </div>
            )}
          </Section>
        )}

        {/* About the property */}
        <Section title="About the property" eyebrow="The employer" alt>
          <div
            className="rounded-2xl p-6 md:p-8 max-w-2xl bg-white"
            style={{ border: '1px solid #E5E5E5' }}
          >
            {employer.hotel_group && (
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: '#9CA3AF' }}>
                {String(employer.hotel_group)}
              </p>
            )}
            <h3 className="text-[22px] font-medium" style={{ color: '#1a1a1a' }}>
              {propertyName}
            </h3>
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[13px]"
              style={{ color: '#6B7280' }}
            >
              {(employer.city || job.location) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} /> {String(employer.city || job.location)}
                </span>
              )}
              {employer.star_rating && (
                <span className="inline-flex items-center gap-1">
                  <Star size={12} className="fill-current" style={{ color: '#C9A96E' }} />{' '}
                  {String(employer.star_rating)}-star
                </span>
              )}
              {employer.num_treatment_rooms && (
                <span>{String(employer.num_treatment_rooms)} treatment rooms</span>
              )}
            </div>
            {Array.isArray(employer.brand_partners) && employer.brand_partners.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {(employer.brand_partners as string[]).slice(0, 3).map((b) => (
                  <span
                    key={b}
                    className="text-[11px] px-2 py-0.5 rounded-md"
                    style={{ background: '#F8F7F5', color: '#374151' }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
            {employer.id && (
              <Link
                href={`/properties/${employer.id}`}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium mt-5"
                style={{ color: '#C9A96E' }}
              >
                View property <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </Section>

        {/* Apply CTA strip */}
        <section className="bg-white py-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2
              className="text-[24px] md:text-[28px] font-medium tracking-tight mb-3"
              style={{ color: '#1a1a1a' }}
            >
              Ready to apply?
            </h2>
            <p className="text-[14px] mb-8 max-w-xl mx-auto" style={{ color: '#6B7280' }}>
              Application sent directly to the property — they review your full profile.
            </p>
            <div className="flex justify-center">
              <JobApplyButtons roleId={String(job.id)} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Section({
  title,
  eyebrow,
  alt = false,
  children,
}: {
  title: string
  eyebrow?: string
  alt?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className="py-14 px-6"
      style={
        alt
          ? { background: '#F8F7F5', borderTop: '1px solid #E8E5E0', borderBottom: '1px solid #E8E5E0' }
          : { background: '#FFFFFF' }
      }
    >
      <div className="max-w-5xl mx-auto">
        {eyebrow && (
          <p
            className="text-[11px] tracking-[0.15em] uppercase font-medium mb-2"
            style={{ color: '#C9A96E' }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-[22px] md:text-[28px] font-medium tracking-tight leading-[1.15] mb-6"
          style={{ color: '#1a1a1a' }}
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[12px] px-3 py-1 rounded-full"
      style={{ background: '#F8F7F5', color: '#374151', border: '1px solid #E8E5E0' }}
    >
      {children}
    </span>
  )
}

function ChipList({ label, items }: { label: string; items?: string[] | null }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide font-medium mb-2" style={{ color: '#6B7280' }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="text-[12px] px-2.5 py-1 rounded-md"
            style={{ background: '#FFFFFF', color: '#374151', border: '1px solid #E5E5E5' }}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  )
}

function SingleChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide font-medium mb-2" style={{ color: '#6B7280' }}>
        {label}
      </p>
      <span
        className="text-[12px] px-2.5 py-1 rounded-md inline-block"
        style={{
          background: '#FDF6EC',
          color: '#C9A96E',
          border: '1px solid rgba(201, 169, 110, 0.4)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function Plain({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide font-medium mb-1" style={{ color: '#6B7280' }}>
        {label}
      </p>
      <p className="text-[14px]" style={{ color: '#1a1a1a' }}>
        {value}
      </p>
    </div>
  )
}

function TickList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px]" style={{ color: '#374151' }}>
          <span className="flex-shrink-0 mt-0.5">
            <Check size={16} style={{ color: '#C9A96E' }} />
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}
