import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, BrainCircuit, BriefcaseBusiness, ClipboardCheck, UsersRound } from 'lucide-react'
import { getPublicPageContent } from '@/lib/public-page-content-server'

export const revalidate = 3600

export default async function ComingSoonPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const cms = await getPublicPageContent('coming-soon', params?.pagePreview === 'draft')
  return <div className="min-h-screen bg-[#f1f1f1]">
    <Navbar />
    <main id="main-content" className="pt-[76px]">
      <section className="bg-[#1c1c1c] text-white"><div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24 grid lg:grid-cols-[1fr_.9fr] gap-10 items-center"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold mb-4">{cms.hero.eyebrow}</p><h1 className="text-[44px] md:text-[64px] leading-[1.01] tracking-[-0.05em] font-semibold text-white max-w-4xl">{cms.hero.heading}</h1><p className="text-[16px] md:text-[18px] leading-8 text-white/68 max-w-2xl mt-6">{cms.hero.text}</p><div className="flex flex-col sm:flex-row gap-3 mt-8"><Link href="/register/talent" className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3.5 text-[13px] font-semibold text-[#1c1c1c]">Join as Talent <ArrowRight size={14}/></Link><Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white">Talk to us <ArrowRight size={14}/></Link></div></div><div className="aspect-[4/3] overflow-hidden rounded-[28px]"><img src={cms.hero.image.url} alt={cms.hero.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${cms.hero.image.focalX}% ${cms.hero.image.focalY}%`}}/></div></div></section>

      {cms.blocks.filter(b=>b.visible).map((b,i)=><section key={i} className={i===1?'bg-white border-y border-[#dddddd]':'bg-[#f1f1f1]'}><div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20 grid lg:grid-cols-2 gap-10 items-center"><div className={i%2?'lg:order-2':''}><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#1c1c1c]">{b.eyebrow}</p><h2 className="text-[36px] md:text-[48px] font-semibold tracking-[-.045em] leading-[1.03] text-[#1c1c1c] mt-3">{b.heading}</h2><p className="text-[14px] leading-7 text-[#555555] mt-5">{b.text}</p>{i===0&&<div className="grid sm:grid-cols-2 gap-3 mt-7">{[[BriefcaseBusiness,'Hospitality Jobs'],[UsersRound,'Hospitality Agency'],[BrainCircuit,'Interview Ready'],[ClipboardCheck,'Arrival Packs']].map(([Icon,title]:any)=><div key={title} className="bg-white border border-[#dddddd] rounded-xl p-4 flex items-center gap-3"><Icon size={17} className="text-[#1c1c1c]"/><span className="text-[12px] font-semibold text-[#1c1c1c]">{title}</span></div>)}</div>}</div><div className={`aspect-[4/3] overflow-hidden rounded-[26px] ${i%2?'lg:order-1':''}`}><img src={b.image.url} alt={b.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${b.image.focalX}% ${b.image.focalY}%`}}/></div></div></section>)}
    </main>
    <Footer />
  </div>
}
