import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft, ArrowRight, ExternalLink, GraduationCap, Heart, Mail, Phone, Quote, Sparkles } from 'lucide-react'
import BrandEnquiryForm from '@/components/BrandEnquiryForm'
import { BRAND_FIELDS, normaliseBrand, type BrandProfile } from '@/lib/brand-profiles'

export const revalidate = 60

async function readBrand(slug: string): Promise<BrandProfile | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data, error } = await supabase
      .from('brand_profiles')
      .select(BRAND_FIELDS)
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
    if (error) {
      console.error('Brand page query failed:', error.message)
      return null
    }
    return data ? normaliseBrand(data) : null
  } catch (error) {
    console.error('Brand page load failed:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = await readBrand(slug)
  if (!brand) return { title: 'Brand not found | Talent House Collective' }
  const description = brand.usp || brand.tagline || `${brand.name} on Talent House Collective.`
  return {
    title: { absolute: `${brand.name} | Talent House Collective` },
    description,
    openGraph: { title: `${brand.name} | Talent House Collective`, description, images: brand.image_url ? [brand.image_url] : undefined },
  }
}

// Paragraphs, kept as the author wrote them. A single blob of text is the
// fastest way to make a considered argument look unconsidered.
function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-5">
      {text.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="text-[15px] leading-8 text-secondary">{paragraph.trim()}</p>
      ))}
    </div>
  )
}

function Facts({ brand }: { brand: BrandProfile }) {
  const rows = [
    ['Founded', brand.founded],
    ['Origin', brand.origin],
  ].filter(([, value]) => Boolean(value)) as [string, string][]
  if (rows.length === 0 && brand.hero_ingredients.length === 0) return null
  return (
    <div className="border border-border bg-surface p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">The facts</p>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-[.08em] text-muted">{label}</dt>
            <dd className="mt-0.5 text-[14px] leading-6 text-ink">{value}</dd>
          </div>
        ))}
        {brand.hero_ingredients.length > 0 && (
          <div>
            <dt className="text-[11px] uppercase tracking-[.08em] text-muted">Hero ingredients</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {brand.hero_ingredients.map(item => (
                <span key={item} className="border border-border bg-white px-2.5 py-1 text-[11px] text-ink">{item}</span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = await readBrand(slug)
  if (!brand) notFound()

  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-white">
        <section className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
          <Link href="/brands" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary hover:text-ink">
            <ArrowLeft size={13} /> All brands
          </Link>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-12 pt-8 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-accent">Talent House brand</p>
              <h1 className="site-heading mt-4 text-[40px] leading-[1.05] tracking-[-.04em] md:text-[52px]">{brand.name}</h1>
              {brand.tagline ? <p className="mt-5 max-w-2xl text-[16px] leading-8 text-secondary">{brand.tagline}</p> : null}
              {brand.website_url ? (
                <a href={brand.website_url} target="_blank" rel="noreferrer noopener"
                  className="mt-7 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline">
                  Visit {brand.name} <ExternalLink size={12} />
                </a>
              ) : null}
            </div>
            <div className="aspect-[16/11] overflow-hidden border border-border bg-surface">
              {brand.image_url
                ? <img src={brand.image_url} alt={`${brand.name}`} className="h-full w-full object-cover" />
                : null}
            </div>
          </div>
        </section>

        {brand.gallery.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 pb-14 lg:px-8">
            <div className={`grid gap-3 ${brand.gallery.length === 1 ? '' : brand.gallery.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
              {brand.gallery.map((url, index) => (
                <div key={url} className="aspect-[4/3] overflow-hidden border border-border bg-surface">
                  <img src={url} alt={`${brand.name}, image ${index + 1}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {brand.usp ? (
          <section className="border-y border-border bg-ink">
            <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">The proposition</p>
              <p className="mt-5 max-w-4xl text-[22px] leading-[1.45] tracking-[-.02em] text-white md:text-[27px]">{brand.usp}</p>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_.65fr]">
            <div className="space-y-14">
              {brand.why_spas ? (
                <div>
                  <h2 className="site-heading text-[28px] leading-[1.15] tracking-[-.03em]">Why a spa stocks it</h2>
                  <div className="mt-6"><Prose text={brand.why_spas} /></div>
                </div>
              ) : null}

              {/* Our own verdict. This is the only reason anybody trusts a
                  directory whose other words come from the brand: a page where
                  every entry is written by its subject is a brochure rack. */}
              {brand.why_we_love_it ? (
                <div className="border border-accent/30 bg-surface p-7">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-accent" />
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-accent">Why Talent House loves it</p>
                  </div>
                  <div className="mt-5"><Prose text={brand.why_we_love_it} /></div>
                </div>
              ) : null}

              {/* And the people who will actually work with it. A brand the
                  team resents never gets retailed, whatever the margin looks
                  like on the wholesale sheet. */}
              {brand.why_therapists_love_it ? (
                <div>
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-accent" />
                    <h2 className="site-heading text-[28px] leading-[1.15] tracking-[-.03em]">Why therapists love working on it</h2>
                  </div>
                  <div className="mt-6"><Prose text={brand.why_therapists_love_it} /></div>
                </div>
              ) : null}

              {brand.director_quote ? (
                <figure className="border-l-2 border-accent bg-surface px-7 py-8">
                  <Quote size={18} className="text-accent" />
                  <blockquote className="mt-4 text-[17px] leading-[1.7] tracking-[-.01em] text-ink">{brand.director_quote}</blockquote>
                  {(brand.director_name || brand.director_role) && (
                    <figcaption className="mt-5 text-[12px] text-secondary">
                      {brand.director_name}
                      {brand.director_name && brand.director_role ? ', ' : ''}
                      {brand.director_role}
                    </figcaption>
                  )}
                </figure>
              ) : null}

              {brand.how_to_sell ? (
                <div>
                  <h2 className="site-heading text-[28px] leading-[1.15] tracking-[-.03em]">How your therapists sell it</h2>
                  <div className="mt-6"><Prose text={brand.how_to_sell} /></div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
              <Facts brand={brand} />

              {brand.signature_treatments.length > 0 && (
                <div className="border border-border p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Signature treatments</p>
                  <ul className="mt-4 space-y-2.5">
                    {brand.signature_treatments.map(treatment => (
                      <li key={treatment} className="border-b border-border pb-2.5 text-[13px] leading-6 text-ink last:border-0 last:pb-0">{treatment}</li>
                    ))}
                  </ul>
                </div>
              )}

              {brand.notable_partners.length > 0 && (
                <div className="border border-border p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Where it is delivered</p>
                  <ul className="mt-4 space-y-2">
                    {brand.notable_partners.map(partner => (
                      <li key={partner} className="text-[13px] leading-6 text-secondary">{partner}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(brand.contact_name || brand.contact_email || brand.contact_phone) && (
                <div className="border border-border p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Who to talk to</p>
                  {brand.contact_name ? <p className="mt-3 text-[14px] font-medium text-ink">{brand.contact_name}</p> : null}
                  {brand.contact_role ? <p className="text-[12px] text-secondary">{brand.contact_role}</p> : null}
                  <div className="mt-4 space-y-2">
                    {brand.contact_email ? (
                      <a href={`mailto:${brand.contact_email}`} className="flex items-center gap-2 text-[12px] text-accent hover:underline">
                        <Mail size={12} /> {brand.contact_email}
                      </a>
                    ) : null}
                    {brand.contact_phone ? (
                      <a href={`tel:${brand.contact_phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-[12px] text-secondary hover:text-ink">
                        <Phone size={12} /> {brand.contact_phone}
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {/* The other half of the bargain: the course this brand gave the
                  Academy. A page with no route to the training is only half of
                  what either side agreed to. */}
              {brand.academy_course_slug ? (
                <div className="border border-border bg-surface p-6">
                  <GraduationCap size={20} className="text-accent" />
                  <p className="mt-3 text-[14px] font-medium leading-6 text-ink">Your team can train on this house today.</p>
                  <p className="mt-2 text-[12px] leading-6 text-secondary">
                    {brand.name} has a Talent House Academy masterclass: the history, the science, the treatment menu and
                    the retail conversation, with a certificate on completion.
                  </p>
                  <Link href={`/academy#${brand.academy_course_slug}`} className="btn-primary mt-5 inline-flex items-center gap-1.5 text-[12px]">
                    See the masterclass <ArrowRight size={12} />
                  </Link>
                </div>
              ) : null}

              {brand.product_house_name ? (
                <div className="border border-border p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Hiring on this house</p>
                  <p className="mt-3 text-[12px] leading-6 text-secondary">
                    Therapists list {brand.product_house_name} experience on their Talent House profile, so a role that
                    requires it is matched to people who already have it.
                  </p>
                  <Link href="/jobs" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:underline">
                    Browse roles <ArrowRight size={12} />
                  </Link>
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        <section className="border-t border-border bg-white">
          <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
            <BrandEnquiryForm brandSlug={brand.slug} brandName={brand.name} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
