import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { ArrowRight, Building2, MapPin, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

const getFeaturedProperties = unstable_cache(async () => {
  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data } = await admin.from('employer_profiles')
      .select('id,property_name,company_name,location,tagline,logo_url,property_photos,featured_until')
      .eq('featured_employer', true)
      .eq('approval_status', 'approved')
      .or(`featured_until.is.null,featured_until.gt.${now}`)
      .order('featured_until', { ascending: false })
      .limit(6)
    return data || []
  } catch {
    return []
  }
}, ['homepage-featured-properties-v1'], { revalidate: 60 })

export default async function FeaturedPropertiesSection() {
  try {
    const data = await getFeaturedProperties()
    if (!data.length) return null

    return (
      <section className="border-b border-black/10 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="site-accent mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]">Featured properties</p>
              <h2 className="site-heading text-[30px] font-medium md:text-[40px]">Properties investing in exceptional talent.</h2>
            </div>
            <Link href="/properties" className="site-button site-accent-bg w-fit px-5 py-3 text-[12px] font-semibold text-white">Explore all properties</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.map((property: any) => {
              const name = property.property_name || property.company_name || 'WHC property'
              const image = property.property_photos?.[0] || property.logo_url
              return (
                <Link key={property.id} href={`/properties/${property.id}`} className="group overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-36 overflow-hidden bg-[#eef2f4]">
                    {image ? <img src={image} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center"><Building2 size={32} className="opacity-30" /></div>}
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#0b2f4d] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white"><Star size={10} fill="currentColor" /> Featured</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-[16px] font-semibold text-[#10283b]">{name}</h3>
                    {property.location && <p className="mt-1 flex items-center gap-1 text-[11px] opacity-55"><MapPin size={11} />{property.location}</p>}
                    <p className="mt-3 line-clamp-2 text-[12px] leading-5 opacity-65">{property.tagline || 'Discover this featured WHC property and its opportunities.'}</p>
                    <span className="site-accent mt-3 inline-flex items-center gap-1 text-[11px] font-semibold">View property <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    )
  } catch (error) {
    console.error('Unable to load featured properties:', error)
    return null
  }
}
