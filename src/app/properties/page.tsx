import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Building2, MapPin, Star, BadgeCheck } from 'lucide-react'
import { getPublicPageContent } from '@/lib/public-page-content-server'

export const revalidate = 60

const PUBLIC_PROPERTIES_LIMIT = 120
const PROPERTY_FIELDS = 'id,company_name,property_name,location,about_text,logo_url,property_photos,review_score,review_count,star_rating,property_type,tagline,featured_employer,featured_until,created_at,is_verified,approval_status'

function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function readPublicProperties() {
  try {
    const supabase = createPublicSupabaseClient()
    const { data, error } = await supabase
      .from('employer_profiles')
      .select(PROPERTY_FIELDS)
      .eq('approval_status', 'approved')
      .order('featured_employer', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PUBLIC_PROPERTIES_LIMIT)
    if (error) {
      console.error('Public properties query failed:', error.message)
      return []
    }
    const now = Date.now()
    return [...(data || [])].sort((a: any, b: any) => {
      const aFeatured = a.featured_employer && (!a.featured_until || new Date(a.featured_until).getTime() > now)
      const bFeatured = b.featured_employer && (!b.featured_until || new Date(b.featured_until).getTime() > now)
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  } catch (error) {
    console.error('Public properties load failed:', error)
    return []
  }
}

const getPublicProperties = unstable_cache(readPublicProperties, ['public-properties-v3'], { revalidate: 60 })

export default async function PropertiesPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const useDraft = params?.pagePreview === 'draft'
  const [properties, cms] = await Promise.all([getPublicProperties(), getPublicPageContent('properties', useDraft)])
  const now = Date.now()

  return <div className="min-h-screen bg-white">
    <Navbar />
    <section className="pt-[76px] bg-white border-b border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 md:py-14 grid lg:grid-cols-[.9fr_1.1fr] gap-9 items-center">
        <div className="py-6 lg:py-12">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#555555] mb-4">{cms.hero.eyebrow}</p>
          <h1 className="text-[42px] md:text-[56px] font-semibold tracking-[-0.045em] leading-[1.02] text-[#10283b]">{cms.hero.heading}</h1>
          <p className="text-[14px] text-muted max-w-xl mt-5 leading-7">{cms.hero.text}</p>
        </div>
        <div className="h-[360px] md:h-[430px] overflow-hidden rounded-[26px]"><img src={cms.hero.image.url} alt={cms.hero.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${cms.hero.image.focalX}% ${cms.hero.image.focalY}%`}}/></div>
      </div>
    </section>

    <section className="py-14 bg-white"><div className="max-w-7xl mx-auto px-6 lg:px-8">
      {properties.length === 0 ? <div className="grid lg:grid-cols-[.85fr_1.15fr] overflow-hidden bg-white border border-border rounded-[26px]"><div className="min-h-[280px]"><img src={cms.blocks[0].image.url} alt={cms.blocks[0].image.alt} className="w-full h-full object-cover" /></div><div className="px-8 py-14 md:px-12 flex flex-col justify-center"><Building2 size={30} className="text-[#555555] mb-4" /><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#555555] mb-3">Properties</p><p className="text-[20px] font-medium text-[#10283b]">New properties are joining WHC.</p><p className="text-[13px] text-muted mt-3 leading-6 max-w-lg">Approved property profiles will appear here as soon as they are ready for professionals to explore.</p></div></div> : <>
        <div className="flex items-end justify-between gap-5 mb-7"><div><p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#555555]">WHC properties</p><h2 className="text-[27px] md:text-[34px] font-semibold tracking-[-0.03em] text-[#10283b] mt-1">Explore places to work</h2><p className="text-[13px] text-muted mt-2 max-w-2xl">See the property profile, ratings, spa information and live roles before deciding whether it is right for you.</p></div><p className="hidden md:block text-[12px] text-muted">{properties.length} approved propert{properties.length === 1 ? 'y' : 'ies'}</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{properties.map((p:any)=>{
          const featured=p.featured_employer&&(!p.featured_until||new Date(p.featured_until).getTime()>now)
          const image=p.property_photos?.[0]||p.logo_url
          return <Link key={p.id} href={`/properties/${p.id}`} className={`group overflow-hidden rounded-2xl bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${featured?'border border-[#aebbc2] ring-1 ring-[#aebbc2]/20':'border border-border'}`}>
            <div className="relative aspect-[16/9] bg-[#eef2f4] overflow-hidden">{image?<img src={image} alt={p.property_name||p.company_name||'Property'} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"/>:<img src={cms.blocks[0].image.url} alt={cms.blocks[0].image.alt} loading="lazy" className="w-full h-full object-cover"/>}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">{featured&&<span className="inline-flex items-center gap-1.5 rounded-full bg-[#0b2f4d] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white"><Star size={11} fill="currentColor"/> Featured</span>}{p.is_verified&&<span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0b2f4d]"><BadgeCheck size={11}/> WHC Verified</span>}</div>
            </div>
            <div className="p-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-[19px] font-semibold tracking-tight text-[#10283b]">{p.property_name||p.company_name}</h3>{p.tagline&&<p className="text-[12px] text-[#555555] mt-1">{p.tagline}</p>}</div>{p.star_rating&&<span className="text-[12px] font-semibold text-[#10283b] whitespace-nowrap">{isNaN(Number(p.star_rating))?p.star_rating:`${p.star_rating}★`}</span>}</div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted mt-3">{p.location&&<span className="flex items-center gap-1"><MapPin size={13}/>{p.location}</span>}{Number(p.review_score)>0&&<span className="flex items-center gap-1"><Star size={12} fill="currentColor" className="text-[#555555]"/> {Number(p.review_score).toFixed(1)} WHC{p.review_count?` · ${p.review_count} review${Number(p.review_count)===1?'':'s'}`:''}</span>}</div>
              {p.about_text&&<p className="text-[13px] leading-6 text-secondary mt-4 line-clamp-3">{p.about_text}</p>}
              <span className="mt-5 inline-flex text-[12px] font-semibold text-[#0b2f4d]">Explore property →</span>
            </div>
          </Link>})}</div>
      </>}
    </div></section>

    {cms.blocks.slice(1).filter(b=>b.visible).map((b,i)=><section key={i} className="bg-white border-t border-border"><div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center"><div className={i%2?'md:order-2':''}><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#555555]">{b.eyebrow}</p><h2 className="text-[30px] md:text-[40px] tracking-[-.04em] font-semibold text-[#10283b] mt-3">{b.heading}</h2><p className="text-[14px] leading-7 text-muted mt-4">{b.text}</p></div><div className={`aspect-[4/3] overflow-hidden ${i%2?'md:order-1':''}`}><img src={b.image.url} alt={b.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${b.image.focalX}% ${b.image.focalY}%`}}/></div></div></section>)}
    <Footer />
  </div>
}
