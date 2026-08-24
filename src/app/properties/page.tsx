import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Building2, MapPin, Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 300

const PUBLIC_PROPERTIES_LIMIT = 120
const PROPERTY_FIELDS = 'id,company_name,property_name,location,description,logo_url,property_photos,review_score,featured_employer,featured_until,created_at,is_verified'

async function getPublicProperties() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('employer_profiles')
      .select(PROPERTY_FIELDS)
      .eq('is_verified', true)
      .order('featured_employer', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PUBLIC_PROPERTIES_LIMIT)

    if (error) return []

    const now = Date.now()
    return [...(data || [])].sort((a: any, b: any) => {
      const aFeatured = a.featured_employer && (!a.featured_until || new Date(a.featured_until).getTime() > now)
      const bFeatured = b.featured_employer && (!b.featured_until || new Date(b.featured_until).getTime() > now)
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  } catch {
    return []
  }
}

export default async function PropertiesPage() {
  const properties = await getPublicProperties()
  const now = Date.now()

  return (
    <div className="min-h-screen bg-[#f3f1ec]">
      <Navbar />
      <section className="pt-[68px] bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#9c7a42] mb-4">WHC properties</p>
          <h1 className="text-[38px] md:text-[50px] font-semibold tracking-[-0.04em] text-[#10283b]">Exceptional places to work.</h1>
          <p className="text-[14px] text-muted max-w-2xl mx-auto mt-4 leading-6">Meet verified hotels, spas and wellness destinations using Spa Platform to find exceptional people. Featured properties appear first.</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {properties.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl px-6 py-14 text-center">
              <Building2 size={34} className="mx-auto text-muted/40 mb-3" />
              <p className="text-[15px] font-medium text-[#10283b]">Our property collection is being prepared.</p>
              <p className="text-[13px] text-muted mt-2">Verified hospitality partners will appear here shortly.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-5 mb-7">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#9c7a42]">Verified partners</p>
                  <h2 className="text-[27px] md:text-[34px] font-semibold tracking-[-0.03em] text-[#10283b] mt-1">Properties building their teams with us.</h2>
                </div>
                <p className="hidden md:block text-[12px] text-muted">{properties.length} verified propert{properties.length === 1 ? 'y' : 'ies'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p: any) => {
                  const featured = p.featured_employer && (!p.featured_until || new Date(p.featured_until).getTime() > now)
                  const image = p.property_photos?.[0] || p.logo_url
                  return (
                    <Link key={p.id} href={`/properties/${p.id}`} className={`group overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${featured ? 'border border-[#c9a96e] ring-1 ring-[#c9a96e]/20' : 'border border-border'}`}>
                      <div className="relative aspect-[16/9] bg-[#e9e6df] overflow-hidden">
                        {image ? <img src={image} alt={p.property_name || p.company_name || 'Property'} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" /> : <div className="h-full w-full flex items-center justify-center"><Building2 size={34} className="text-muted/40" /></div>}
                        {featured && <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#0b2f4d] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm"><Star size={11} fill="#d4b477" className="text-[#d4b477]" /> Featured</span>}
                        {p.logo_url && image !== p.logo_url && <div className="absolute bottom-4 left-4 h-12 w-12 rounded-xl border-2 border-white bg-white overflow-hidden shadow-sm"><img src={p.logo_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /></div>}
                      </div>
                      <div className="p-6">
                        <h3 className="text-[18px] font-semibold tracking-tight text-[#10283b] group-hover:text-[#9c7a42] transition-colors">{p.property_name || p.company_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted mt-2">
                          {p.location && <span className="flex items-center gap-1"><MapPin size={13} />{p.location}</span>}
                          {p.review_score && <span className="flex items-center gap-1"><Star size={12} fill="currentColor" className="text-[#9c7a42]" /> {p.review_score}</span>}
                        </div>
                        {p.description && <p className="text-[13px] leading-6 text-secondary mt-4 line-clamp-3">{p.description}</p>}
                        <span className="mt-5 inline-flex text-[12px] font-semibold text-[#9c7a42]">Explore property →</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
