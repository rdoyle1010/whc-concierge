import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react'
import { BRAND_FIELDS, normaliseBrand, type BrandProfile } from '@/lib/brand-profiles'

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: 'Spa and Wellness Brands | Talent House Collective' },
  description: 'The product houses behind the treatment menus, and the case for stocking each one: the proposition, the ingredients, the signature treatments and how a therapist sells it.',
  openGraph: {
    title: 'Spa and Wellness Brands | Talent House Collective',
    description: 'The case for stocking each product house, written for the person who has to decide.',
  },
}

async function readPublishedBrands(): Promise<BrandProfile[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    const { data, error } = await supabase
      .from('brand_profiles')
      .select(BRAND_FIELDS)
      .eq('is_published', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
      .limit(120)
    if (error) {
      console.error('Public brands query failed:', error.message)
      return []
    }
    return (data || []).map(normaliseBrand)
  } catch (error) {
    console.error('Public brands load failed:', error instanceof Error ? error.message : error)
    return []
  }
}

function monogram(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()
}

function BrandCard({ brand, wide }: { brand: BrandProfile; wide?: boolean }) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className={`group flex flex-col border border-border bg-white transition-colors hover:border-accent ${wide ? 'md:flex-row' : ''}`}
    >
      <div className={`relative overflow-hidden bg-surface ${wide ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'aspect-[16/10]'}`}>
        {brand.image_url
          ? <img src={brand.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-[34px] font-semibold tracking-[-.03em] text-muted">{monogram(brand.name)}</div>}
      </div>
      <div className={`flex flex-1 flex-col p-6 ${wide ? 'md:justify-center md:p-9' : ''}`}>
        <h2 className={`font-medium tracking-[-.03em] text-ink ${wide ? 'text-[26px]' : 'text-[19px]'}`}>{brand.name}</h2>
        {brand.tagline ? <p className="mt-2 text-[13px] leading-6 text-secondary">{brand.tagline}</p> : null}
        {wide && brand.usp ? <p className="mt-4 text-[13px] leading-7 text-secondary">{brand.usp}</p> : null}
        {brand.hero_ingredients.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {brand.hero_ingredients.slice(0, wide ? 5 : 3).map(ingredient => (
              <span key={ingredient} className="border border-border px-2.5 py-1 text-[10px] uppercase tracking-[.08em] text-secondary">{ingredient}</span>
            ))}
          </div>
        )}
        <span className="mt-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent">
          Why spas stock it <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export default async function BrandsPage() {
  const brands = await readPublishedBrands()

  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-white">
        <section className="mx-auto max-w-7xl px-6 pb-10 pt-16 lg:px-8 lg:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-accent">Talent House brands</p>
          <h1 className="site-heading mt-4 max-w-4xl text-[40px] leading-[1.05] tracking-[-.04em] md:text-[54px]">
            The houses behind the treatment menu.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-8 text-secondary">
            Choosing a product house is a five-figure decision about a treatment menu, a retail wall and a training
            commitment. These pages make the case for each one, in the order it gets asked: the proposition, why a spa
            stocks it, what the person who runs it says, and how a therapist actually sells it.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          {brands.length === 0 ? (
            <div className="border border-border bg-surface px-6 py-16 text-center">
              <Sparkles size={22} className="mx-auto text-muted" />
              <p className="mt-4 text-[15px] font-medium text-ink">The first brand pages are being written.</p>
              <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-secondary">
                Product houses working with Talent House get a page here alongside their Academy masterclass.
              </p>
              <Link href="/contact" className="btn-primary mt-6 inline-block text-[13px]">Talk to us about a brand page</Link>
            </div>
          ) : (
            <div className={`grid gap-6 ${brands.length === 1 ? '' : brands.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
              {brands.map(brand => <BrandCard key={brand.slug} brand={brand} wide={brands.length === 1} />)}
            </div>
          )}
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-3xl">
              <GraduationCap size={22} className="text-accent" />
              <h2 className="site-heading mt-4 text-[30px] leading-[1.1] tracking-[-.03em]">
                A masterclass, and a page that argues for you.
              </h2>
              <p className="mt-5 text-[14px] leading-8 text-secondary">
                Brands that give the Talent House Academy a masterclass get a page here in return. The course teaches
                therapists to speak your house fluently. The page makes your case to the spa directors deciding what to
                stock next season. Each one links to the other.
              </p>
              <Link href="/contact" className="btn-primary mt-7 inline-block text-[13px]">Become a Talent House brand</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
