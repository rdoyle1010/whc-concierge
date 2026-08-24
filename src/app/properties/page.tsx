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
    const { data, error } = await admin.from('employer_profiles').select(PROPERTY_FIELDS).eq('is_verified', true).order('featured_employer', { ascending: false }).order('created_at', { ascending: false }).limit(PUBLIC_PROPERTIES_LIMIT)
    if (error) return []
    const now = Date.now()
    return [...(data || [])].sort((a: any, b: any) => {
      const aFeatured = a.featured_employer && (!a.featured_until || new Date(a.featured_until).getTime() > now)
      const bFeatured = b.featured_employer && (!b.featured_until || new Date(b.featured_until).getTime() > now)
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  } catch { return [] }
}

export default async function PropertiesPage() {
  const properties = await getPublicProperties()
  const now = Date.now()
  return <div className="min-h-screen bg-[#f3f1ec]">
    <Navbar />
    <section className="pt-[68px] bg-white border-b border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 md:py-14 grid lg:grid-cols-[.9fr_1.1fr] gap-9 items-center">
        <div className="py-6 lg:py-12">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#9c7a42] mb-4">WHC properties</p>
          <h1 className="text-[42px] md:text-[56px] font-semibold tracking-[-0.045em] leading-[1.02] text-[#10283b]">Exceptional places to work.</h1>
          <p className="text-[14px] text-muted max-w-xl mt-5 leading-7">Meet verified hotels, spas and wellness destinations using Spa Platform to find exceptional people. Featured properties appear first.</p>
        </div>
        <div className="grid grid-cols-[1.2fr_.8fr] gap-3 h-[360px] md:h-[430px]">
          <div className="relative overflow-hidden rounded-[26px]"><img src="https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&q=84&w=1600" alt="Luxury hospitality property interior" className="w-full h-full object-cover" /></div>
          <div className="grid grid-rows-2 gap-3"><div className="relative overflow-hidden rounded-[22px]"><img src="https://images.unsplash.com/photo-1779956511234-963c515b0516?auto=format&fit=crop&q=84&w=1200" alt="Contemporary wellness sauna" className="w-full h-full object-cover" /></div><div className="relative overflow-hidden rounded-[22px]"><img src="https://images.unsplash.com/photo-1751972788348-3360f69603f6?auto=format&fit=crop&q=84&w=1200" alt="Luxury destination hospitality courtyard" className="w-full h-full object-cover" /></div></div>
        </div>
      </div>
    </section>

    <section className="py-14"><div className="max-w-7xl mx-auto px-6 lg:px-8">
      {properties.length === 0 ? <div className="grid lg:grid-cols-[.85fr_1.15fr] overflow-hidden bg-white border border-border rounded-[26px]">
        <div className="min-h-[280px]"><img src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=84&w=1400" alt="Spa treatment setting" className="w-full h-full object-cover" /></div>
        <div className="px-8 py-14 md:px-12 flex flex-col justify-center"><Building2 size={30} className="text-[#9c7a42] mb-4" /><p className="text-[20px] font-medium text-[#10283b]">Our property collection is being prepared.</p><p className="text-[13px] text-muted mt-3 leading-6 max-w-lg">Verified hospitality partners will appear here shortly. In the meantime, this is the calibre of spa, wellness and hospitality environment Spa Platform is being built for.</p></div>
      </div> : <>
        <div className="flex items-end justify-between gap-5 mb-7"><div><p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#9c7a42]">Verified partners</p><h2 className="text-[27px] md:text-[34px] font-semibold tracking-[-0.03em] text-[#10283b] mt-1">Properties building their teams with us.</h2></div><p className="hidden md:block text-[12px] text-muted">{properties.length} verified propert{properties.length === 1 ? 'y' : 'ies'}</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{properties.map((p:any) => { const featured=p.featured_employer&&(!p.featured_until||new Date(p.featured_until).getTime()>now); const image=p.property_photos?.[0]||p.logo_url; return <Link key={p.id} href={`/properties/${p.id}`} className={`group overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${featured?'border border-[#c9a96e] ring-1 ring-[#c9a96e]/20':'border border-border'}`}><div className="relative aspect-[16/9] bg-[#e9e6df] overflow-hidden">{image?<img src={image} alt={p.property_name||p.company_name||'Property'} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"/>:<img src="https://images.unsplash.com/photo-1759038086403-c607d67bb245?auto=format&fit=crop&q=80&w=1200" alt="Luxury hospitality interior" loading="lazy" className="w-full h-full object-cover"/>}{featured&&<span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#0b2f4d] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white"><Star size={11} fill="#d4b477" className="text-[#d4b477]"/> Featured</span>}</div><div className="p-6"><h3 className="text-[18px] font-semibold tracking-tight text-[#10283b]">{p.property_name||p.company_name}</h3><div className="flex flex-wrap items-center gap-3 text-[12px] text-muted mt-2">{p.location&&<span className="flex items-center gap-1"><MapPin size={13}/>{p.location}</span>}{p.review_score&&<span className="flex items-center gap-1"><Star size={12} fill="currentColor" className="text-[#9c7a42]"/> {p.review_score}</span>}</div>{p.description&&<p className="text-[13px] leading-6 text-secondary mt-4 line-clamp-3">{p.description}</p>}<span className="mt-5 inline-flex text-[12px] font-semibold text-[#9c7a42]">Explore property →</span></div></Link>})}</div>
      </>}
    </div></section>
    <Footer />
  </div>
}
