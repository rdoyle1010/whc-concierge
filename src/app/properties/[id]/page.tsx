import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { Star, ArrowLeft, ExternalLink, BadgeCheck, BookOpen } from 'lucide-react'

export const revalidate = 60

const SITE = 'https://talent.wellnesshousecollective.co.uk'

const asList = (value: any) => Array.isArray(value) ? value.filter(Boolean) : []
const prettyType = (value: string) => String(value).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// Every column here exists in .live-schema.json for employer_profiles.
// The two destination columns (location_guide, relocation_support) arrive
// with the 20260831160000 migration, so they are requested defensively.
const PROPERTY_FIELDS = [
  'id', 'user_id', 'company_name', 'property_name', 'hotel_group', 'location', 'city', 'postcode',
  'star_rating', 'property_type', 'company_type', 'tagline', 'highlights', 'about_text',
  'property_description', 'room_count', 'opening_year', 'facilities', 'num_treatment_rooms',
  'spa_size', 'services_offered', 'treatment_menu', 'treatment_menu_url', 'product_houses',
  'product_houses_used', 'team_size', 'gm_name', 'gm_title', 'spa_director_name',
  'spa_director_title', 'culture_statement', 'culture_points', 'progression_notes',
  'staff_benefits', 'nearest_transport', 'transport_walk_minutes', 'parking_available',
  'commute_car_required', 'taxi_support', 'taxi_notes', 'travel_notes', 'awards',
  'guest_review_summary', 'review_score', 'review_count', 'tripadvisor_url', 'website',
  'property_photos',
].join(',')
const NEW_DESTINATION_FIELDS = 'location_guide,relocation_support'

async function loadReviews(admin: ReturnType<typeof createAdminClient>, employerUserId?: string | null) {
  if (!employerUserId) return { reviews: [] as any[], summary: { count: 0, average: null as number | null } }

  // Old rows predate the type column, so a null type on a review of this
  // employer still counts as an employer review. The type column itself is
  // newer than some environments, so fall back to a plain select if the
  // typed query fails.
  const buildReviewQuery = (withType: boolean) => {
    let query = admin
      .from('reviews')
      .select(withType ? 'id,reviewer_id,rating,text,booking_id,created_at,type' : 'id,reviewer_id,rating,text,booking_id,created_at')
      .eq('reviewee_id', employerUserId)
    if (withType) query = query.or('type.eq.employer,type.is.null')
    return query.order('created_at', { ascending: false }).limit(30)
  }
  let { data: reviewRows, error } = await buildReviewQuery(true)
  if (error) ({ data: reviewRows } = await buildReviewQuery(false))
  const reviews: any[] = reviewRows || []

  const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))]
  const { data: candidates } = reviewerIds.length
    ? await admin.from('candidate_profiles').select('user_id,full_name,role_level').in('user_id', reviewerIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map((c: any) => [c.user_id, c]))

  const publicReviews = reviews
    .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
    .map(r => {
      const reviewer: any = candidateMap.get(r.reviewer_id)
      return {
        id: r.id,
        rating: Number(r.rating),
        comment: r.text || '',
        created_at: r.created_at,
        verified: true,
        source: r.booking_id ? 'Completed WHC agency shift' : 'WHC placement',
        reviewer_name: reviewer?.full_name || 'WHC professional',
        reviewer_role: reviewer?.role_level || null,
      }
    })

  const average = publicReviews.length
    ? Math.round((publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length) * 10) / 10
    : null

  return { reviews: publicReviews, summary: { count: publicReviews.length, average } }
}

const getPropertyPageData = unstable_cache(async (id: string) => {
  const admin = createAdminClient()

  // The destination columns arrive with a migration; retry without them so
  // the page never breaks before it runs - the same fallback pattern as the
  // public Residency route.
  const buildPropertyQuery = (withNewColumns: boolean) => admin
    .from('employer_profiles')
    .select(withNewColumns ? `${PROPERTY_FIELDS},${NEW_DESTINATION_FIELDS}` : PROPERTY_FIELDS)
    .eq('id', id)
    .eq('approval_status', 'approved')
    .maybeSingle()

  const jobsQuery = admin
    .from('job_listings')
    .select('id,job_title,location,salary_display_text,salary_min,salary_max,tier,is_featured,job_type,contract_type,posted_date')
    .eq('employer_id', id)
    .eq('is_live', true)
    .eq('status', 'active')
    .order('posted_date', { ascending: false })

  let [{ data: property, error }, { data: jobs }] = await Promise.all([buildPropertyQuery(true), jobsQuery])
  if (error) ({ data: property } = await buildPropertyQuery(false))
  if (!property) return null
  const reviewData = await loadReviews(admin, (property as any).user_id)
  return { property: property as any, jobs: jobs || [], ...reviewData }
}, ['public-property-destination-v3'], { revalidate: 60 })

function normaliseAwards(raw: any): Array<{ name: string; year: string | null }> {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item: any) => {
      if (typeof item === 'string' && item.trim()) return { name: item.trim(), year: null }
      if (item && typeof item === 'object') {
        const name = item.name || item.title || item.award
        if (typeof name !== 'string' || !name.trim()) return null
        return { name: name.trim(), year: item.year != null && item.year !== '' ? String(item.year) : null }
      }
      return null
    })
    .filter(Boolean) as Array<{ name: string; year: string | null }>
}

function jobSalary(job: any): string | null {
  if (job.salary_display_text) return String(job.salary_display_text)
  if (job.salary_min && job.salary_max) return `£${Number(job.salary_min).toLocaleString()} - £${Number(job.salary_max).toLocaleString()}`
  if (job.salary_min) return `From £${Number(job.salary_min).toLocaleString()}`
  return null
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const data = await getPropertyPageData(id)
  if (!data) return { title: { absolute: 'Property not found | WHC Concierge' }, robots: { index: false, follow: false } }
  const { property } = data
  const name = property.property_name || property.company_name || 'Property'
  const description = String(property.tagline || property.property_description || property.about_text || `Explore working life at ${name} on WHC Concierge.`).slice(0, 160)
  const url = `${SITE}/properties/${id}`
  const image = asList(property.property_photos)[0]
  return {
    title: { absolute: `Work at ${name} | WHC Concierge` }, description,
    alternates: { canonical: url },
    openGraph: { title: `Work at ${name}`, description, url, type: 'website', ...(image ? { images: [image] } : {}) },
    twitter: { title: `Work at ${name}`, description, card: 'summary_large_image', ...(image ? { images: [image] } : {}) },
  }
}

export default async function PropertyDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getPropertyPageData(id)

  if (!data) {
    return <div className="min-h-screen bg-white"><Navbar /><section className="pt-[120px] pb-20"><div className="max-w-6xl mx-auto px-6 text-center"><h1 className="text-3xl text-ink mb-4">Property not found</h1><Link href="/properties" className="text-accent font-semibold">Back to Properties</Link></div></section><Footer /></div>
  }

  const { property, jobs, reviews: staffReviews, summary: reviewSummary } = data
  const name = property.property_name || property.company_name || 'Property'
  const photos = asList(property.property_photos)
  const heroPhoto = photos[0] || null

  const highlights = asList(property.highlights)
  const description = property.property_description || property.about_text
  const facilities = asList(property.facilities)
  const services = asList(property.services_offered)
  const treatments = asList(property.treatment_menu)
  const productHouses = asList(property.product_houses_used).length ? asList(property.product_houses_used) : asList(property.product_houses)
  const culturePoints = asList(property.culture_points)
  const benefits = asList(property.staff_benefits)
  const awards = normaliseAwards(property.awards)
  const reviewScore = Number(property.review_score || 0) || null
  const reviewCount = Number(property.review_count || 0) || null

  const starLabel = property.star_rating
    ? (isNaN(Number(property.star_rating)) ? String(property.star_rating) : `${property.star_rating} star`)
    : null
  const heroMeta = [
    property.hotel_group,
    property.location || property.city,
    starLabel,
    property.property_type ? prettyType(property.property_type) : null,
  ].filter(Boolean) as string[]

  const propertyFacts = [
    property.room_count ? { label: 'Rooms', value: String(property.room_count) } : null,
    property.opening_year ? { label: 'Opened', value: String(property.opening_year) } : null,
    starLabel ? { label: 'Rating', value: starLabel } : null,
    property.property_type ? { label: 'Property type', value: prettyType(property.property_type) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const spaFacts = [
    property.num_treatment_rooms ? { label: 'Treatment rooms', value: String(property.num_treatment_rooms) } : null,
    property.spa_size ? { label: 'Spa size', value: String(property.spa_size) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const leadership = [
    property.gm_name ? { name: property.gm_name, role: property.gm_title || 'General Manager' } : null,
    property.spa_director_name ? { name: property.spa_director_name, role: property.spa_director_title || 'Spa Director' } : null,
  ].filter(Boolean) as Array<{ name: string; role: string }>

  const travelRows = [
    property.nearest_transport ? { label: 'Nearest transport', value: `${property.nearest_transport}${property.transport_walk_minutes ? ` - about ${property.transport_walk_minutes} min on foot` : ''}` } : null,
    property.commute_car_required ? { label: 'Driving', value: 'A car is recommended or required for the commute' } : null,
    property.parking_available ? { label: 'Parking', value: 'Staff parking is available on site' } : null,
    property.taxi_support ? { label: 'Taxi or shuttle', value: property.taxi_notes || 'The property can arrange or contribute to taxis' } : null,
    property.travel_notes ? { label: 'Notes', value: property.travel_notes } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const showWhy = Boolean(property.tagline) || highlights.length > 0
  const showProperty = Boolean(description) || facilities.length > 0 || Boolean(property.room_count) || Boolean(property.opening_year)
  const showSpa = spaFacts.length > 0 || services.length > 0 || treatments.length > 0 || productHouses.length > 0 || Boolean(property.treatment_menu_url)
  const showTeam = Boolean(property.team_size) || leadership.length > 0
  const showCulture = Boolean(property.culture_statement) || culturePoints.length > 0
  const showLocation = Boolean(property.location_guide) || travelRows.length > 0
  const showReputation = awards.length > 0 || Boolean(property.guest_review_summary) || Boolean(reviewScore) || Boolean(property.tripadvisor_url) || Boolean(property.website)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="border-b border-border bg-white pt-[76px]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/properties" className="inline-flex items-center text-[12px] font-semibold text-secondary hover:text-accent"><ArrowLeft size={14} className="mr-2" />All properties</Link>
        </div>
      </div>

      {/* Hero */}
      {heroPhoto ? (
        <header className="relative">
          <img src={heroPhoto} alt={name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,47,77,.92) 0%, rgba(11,47,77,.5) 45%, rgba(11,47,77,.18) 100%)' }} />
          <div className="relative max-w-6xl mx-auto px-6 pt-44 md:pt-64 pb-12 md:pb-16">
            <h1 className="text-white text-[40px] md:text-[62px] leading-[1.03] tracking-[-.04em] max-w-4xl">{name}</h1>
            {heroMeta.length > 0 && (
              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/85">
                {heroMeta.map((item, index) => (
                  <span key={item} className="inline-flex items-center gap-3">
                    {index > 0 && <span className="text-white/40" aria-hidden>·</span>}
                    {item}
                  </span>
                ))}
              </p>
            )}
          </div>
        </header>
      ) : (
        <header className="bg-accent">
          <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
            <h1 className="text-white text-[40px] md:text-[62px] leading-[1.03] tracking-[-.04em] max-w-4xl">{name}</h1>
            {heroMeta.length > 0 && (
              <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/85">
                {heroMeta.map((item, index) => (
                  <span key={item} className="inline-flex items-center gap-3">
                    {index > 0 && <span className="text-white/40" aria-hidden>·</span>}
                    {item}
                  </span>
                ))}
              </p>
            )}
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-6">
        {/* Why work here */}
        {showWhy && (
          <section className="py-14 md:py-20">
            <p className="public-eyebrow">Why work here</p>
            {property.tagline && <h2 className="mt-4 text-[26px] md:text-[36px] leading-[1.2] max-w-3xl">{property.tagline}</h2>}
            {highlights.length > 0 && (
              <div className="mt-10 grid md:grid-cols-2 gap-x-12 gap-y-6">
                {highlights.map((item: string) => (
                  <p key={item} className="border-t border-border pt-4 text-[15px] leading-7 text-body">{item}</p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* The property */}
        {showProperty && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">The property</p>
            {description && <p className="mt-6 text-[16px] leading-8 text-body max-w-3xl whitespace-pre-line">{description}</p>}
            {propertyFacts.length > 0 && (
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-4xl">
                {propertyFacts.map(fact => (
                  <div key={fact.label} className="border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-[.14em] text-muted">{fact.label}</p>
                    <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}
            {facilities.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {facilities.map((item: string) => <span key={item} className="border border-border bg-surface px-3 py-1.5 text-[12px] text-secondary">{item}</span>)}
              </div>
            )}
          </section>
        )}

        {/* The spa */}
        {showSpa && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">The spa</p>
            {spaFacts.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-4xl">
                {spaFacts.map(fact => (
                  <div key={fact.label} className="border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-[.14em] text-muted">{fact.label}</p>
                    <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}
            {productHouses.length > 0 && (
              <div className="mt-10">
                <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-ink">Product partners</p>
                <p className="mt-3 text-[19px] md:text-[22px] font-serif font-semibold text-ink leading-relaxed max-w-3xl">
                  {productHouses.join('  ·  ')}
                </p>
              </div>
            )}
            {services.length > 0 && (
              <div className="mt-8">
                <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">Services</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {services.map((item: string) => <span key={item} className="border border-border bg-surface px-3 py-1.5 text-[12px] text-secondary">{item}</span>)}
                </div>
              </div>
            )}
            {treatments.length > 0 && (
              <div className="mt-8">
                <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">Treatment menu</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {treatments.map((item: string) => <span key={item} className="border border-border bg-surface px-3 py-1.5 text-[12px] text-secondary">{item}</span>)}
                </div>
              </div>
            )}
            {property.treatment_menu_url && (
              <a href={property.treatment_menu_url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline">
                <BookOpen size={15} />View the treatment menu<ExternalLink size={13} />
              </a>
            )}
          </section>
        )}

        {/* The team */}
        {showTeam && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">The team</p>
            {property.team_size && <p className="mt-6 text-[16px] leading-8 text-body max-w-3xl">A spa team of {property.team_size}.</p>}
            {leadership.length > 0 && (
              <div className="mt-8 max-w-2xl">
                <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">Leadership</p>
                <div className="mt-3">
                  {leadership.map(person => (
                    <div key={person.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border py-4">
                      <p className="text-[16px] font-serif font-semibold text-ink">{person.name}</p>
                      <p className="text-[13px] text-secondary">{person.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Culture */}
        {showCulture && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Culture</p>
            {property.culture_statement && (
              <blockquote className="mt-7 max-w-4xl text-[22px] md:text-[28px] font-serif font-medium leading-[1.5] text-accent whitespace-pre-line">
                {property.culture_statement}
              </blockquote>
            )}
            {culturePoints.length > 0 && (
              <div className="mt-9 grid md:grid-cols-2 gap-x-12 gap-y-4 max-w-4xl">
                {culturePoints.map((item: string) => (
                  <p key={item} className="border-t border-border pt-3 text-[14px] leading-7 text-body">{item}</p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Development & progression */}
        {property.progression_notes && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Development &amp; progression</p>
            <p className="mt-6 text-[16px] leading-8 text-body max-w-3xl whitespace-pre-line">{property.progression_notes}</p>
          </section>
        )}

        {/* Employee benefits */}
        {benefits.length > 0 && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Employee benefits</p>
            <div className="mt-8 grid md:grid-cols-2 gap-x-12 max-w-4xl">
              {benefits.map((item: string) => (
                <p key={item} className="border-b border-border py-3.5 text-[14px] leading-6 text-body">{item}</p>
              ))}
            </div>
          </section>
        )}

        {/* Location guide */}
        {showLocation && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Location guide</p>
            {property.location_guide && <p className="mt-6 text-[16px] leading-8 text-body max-w-3xl whitespace-pre-line">{property.location_guide}</p>}
            {travelRows.length > 0 && (
              <dl className="mt-9 max-w-3xl">
                {travelRows.map(row => (
                  <div key={row.label} className="flex flex-col sm:flex-row gap-x-8 gap-y-1 border-t border-border py-4">
                    <dt className="w-44 shrink-0 text-[11px] uppercase tracking-[.12em] text-muted pt-1">{row.label}</dt>
                    <dd className="text-[14px] leading-6 text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-5 text-[11px] text-muted max-w-3xl">Travel details are supplied by the property.</p>
          </section>
        )}

        {/* Relocation */}
        {property.relocation_support && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Relocating for this role</p>
            <p className="mt-6 text-[16px] leading-8 text-body max-w-3xl whitespace-pre-line">{property.relocation_support}</p>
          </section>
        )}

        {/* Reputation */}
        {showReputation && (
          <section className="border-t border-border py-14 md:py-20">
            <p className="public-eyebrow">Reputation</p>
            {awards.length > 0 && (
              <div className="mt-8 max-w-3xl">
                {awards.map((award, index) => (
                  <div key={`${award.name}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border py-3.5">
                    <p className="text-[15px] font-serif font-semibold text-ink">{award.name}</p>
                    {award.year && <p className="text-[13px] text-secondary">{award.year}</p>}
                  </div>
                ))}
              </div>
            )}
            {property.guest_review_summary && <p className="mt-8 text-[15px] leading-8 text-body max-w-3xl whitespace-pre-line">{property.guest_review_summary}</p>}
            {reviewScore && (
              <p className="mt-6 inline-flex items-center gap-2 text-[14px] text-ink">
                <Star size={15} fill="currentColor" className="text-accent" />
                <strong className="font-semibold">{reviewScore.toFixed(1)}</strong>
                {reviewCount ? <span className="text-secondary">from {reviewCount} review{reviewCount === 1 ? '' : 's'}</span> : null}
              </p>
            )}
            {(property.website || property.tripadvisor_url) && (
              <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                {property.website && <a href={property.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline">Official website<ExternalLink size={13} /></a>}
                {property.tripadvisor_url && <a href={property.tripadvisor_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent hover:underline">TripAdvisor<ExternalLink size={13} /></a>}
              </div>
            )}
          </section>
        )}

        {/* Verified team reviews */}
        {staffReviews.length > 0 && (
          <section className="border-t border-border py-14 md:py-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="public-eyebrow">What it&apos;s actually like to work here</p>
                <p className="mt-5 text-[14px] leading-7 text-secondary max-w-2xl">
                  These reviews are platform-verified. Only professionals with a completed paid WHC agency shift or an accepted WHC placement here can leave one - they are separate from guest reviews and property marketing.
                </p>
              </div>
              {reviewSummary.average && (
                <div className="md:text-right shrink-0">
                  <p className="text-[36px] font-serif font-semibold text-ink leading-none">{reviewSummary.average.toFixed(1)}<span className="text-[16px] text-muted font-sans font-normal"> / 5</span></p>
                  <p className="mt-2 text-[11px] text-muted">{reviewSummary.count} verified review{reviewSummary.count === 1 ? '' : 's'}</p>
                </div>
              )}
            </div>
            <div className="mt-10 grid md:grid-cols-2 gap-x-14 gap-y-12">
              {staffReviews.slice(0, 8).map((review: any) => (
                <article key={review.id} className="border-t border-border pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} className={n <= review.rating ? 'text-accent' : 'text-border'} fill={n <= review.rating ? 'currentColor' : 'none'} />)}
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-accent"><BadgeCheck size={12} />Verified</span>
                  </div>
                  {review.comment && <p className="mt-4 text-[15px] leading-7 text-body">&ldquo;{review.comment}&rdquo;</p>}
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <p className="text-[13px] font-semibold text-ink">{review.reviewer_name}{review.reviewer_role ? <span className="font-normal text-secondary"> · {review.reviewer_role}</span> : null}</p>
                    <p className="text-[11px] text-muted">{review.source}{review.created_at ? ` · ${new Date(review.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : ''}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Current vacancies */}
        <section id="openings" className="border-t border-border py-14 md:py-20">
          <p className="public-eyebrow">Current vacancies</p>
          {jobs.length > 0 ? (
            <div className="mt-8 border-b border-border">
              {jobs.map((job: any) => {
                const salary = jobSalary(job)
                const featured = Boolean(job.is_featured) || job.tier === 'Platinum'
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="group flex items-baseline justify-between gap-6 border-t border-border py-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-[20px] md:text-[23px] group-hover:text-accent transition-colors">{job.job_title}</h3>
                        {featured && <span className="bg-accent text-white text-[9px] font-semibold uppercase tracking-[.12em] px-2 py-1">Featured</span>}
                      </div>
                      <p className="mt-1.5 text-[13px] text-secondary">
                        {[job.location || property.location, salary].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <span className="hidden sm:inline text-[13px] font-semibold text-accent whitespace-nowrap">View role →</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="mt-6 text-[14px] text-secondary">
              No open roles right now - <Link href="/jobs" className="font-semibold text-accent hover:underline">browse all live roles</Link>.
            </p>
          )}
        </section>
      </main>

      {/* Closing CTA */}
      <section className="bg-accent">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="text-white text-[30px] md:text-[38px]">Considering a move?</h2>
          <p className="mt-4 text-[14px] leading-7 text-white/70 max-w-xl mx-auto">Browse live roles across WHC properties, or create a profile so employers like {name} can find you.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/jobs" className="bg-white text-accent px-6 py-3 text-[13px] font-semibold hover:bg-surface transition-colors">Browse live roles</Link>
            <Link href="/register" className="border border-white/40 text-white px-6 py-3 text-[13px] font-semibold hover:bg-white/10 transition-colors">Create your profile</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
