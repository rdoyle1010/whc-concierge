import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Banknote, CalendarCheck, MapPin, ShieldCheck } from 'lucide-react'
import { getPublicPageContent } from '@/lib/public-page-content-server'

export const revalidate = 3600

const benefits = [
  { icon: ShieldCheck, title: 'Verified professionals', text: 'Properties see approved professionals with the skills, experience and availability needed for the shift.' },
  { icon: CalendarCheck, title: 'Real availability', text: 'Professionals set the exact days and hours they can work, so properties can search for genuine cover.' },
  { icon: MapPin, title: 'Local first', text: 'Travel radius and location matching help properties find people who can realistically get to the shift.' },
  { icon: Banknote, title: 'Clear rates', text: 'Rates are agreed before confirmation, with property payment and payout records kept inside Spa Platform.' },
]

export default async function PublicAgencyPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const cms = await getPublicPageContent('agency', params?.pagePreview === 'draft')
  return <div className="min-h-screen bg-[#f5f2eb]">
    <Navbar />
    <section className="pt-[68px] bg-[#0b2f4d] text-white overflow-hidden"><div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-22 grid lg:grid-cols-[1fr_.9fr] gap-10 items-center"><div><p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#d4b477] mb-5">{cms.hero.eyebrow}</p><h1 className="text-[45px] md:text-[64px] font-semibold tracking-[-0.045em] leading-[.98] max-w-3xl text-white">{cms.hero.heading}</h1><p className="text-[16px] md:text-[18px] leading-8 text-white/68 max-w-2xl mt-7">{cms.hero.text}</p><div className="flex flex-col sm:flex-row gap-3 mt-9"><Link href="/login?role=employer&redirect=/agency" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4b477] px-6 py-3.5 text-[13px] font-semibold text-[#0b2f4d]">I need cover <ArrowRight size={14}/></Link><Link href="/register?role=talent&redirect=/talent/agency/settings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white">I want flexible shifts <ArrowRight size={14}/></Link></div></div><div className="aspect-[4/5] md:aspect-[5/4] overflow-hidden rounded-[28px]"><img src={cms.hero.image.url} alt={cms.hero.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${cms.hero.image.focalX}% ${cms.hero.image.focalY}%`}}/></div></div></section>

    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20"><div className="grid lg:grid-cols-[.75fr_1.25fr] gap-8 items-start"><div><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">{cms.blocks[0].eyebrow}</p><h2 className="text-[34px] md:text-[45px] font-semibold tracking-[-.04em] leading-[1.05] text-[#10283b] mt-3">{cms.blocks[0].heading}</h2><p className="text-[13px] leading-6 text-black/55 mt-4">{cms.blocks[0].text}</p><div className="aspect-[4/3] overflow-hidden rounded-[24px] mt-7"><img src={cms.blocks[0].image.url} alt={cms.blocks[0].image.alt} className="w-full h-full object-cover"/></div></div><div className="grid md:grid-cols-2 gap-4">{benefits.map(({icon:Icon,title,text})=><div key={title} className="bg-white border border-black/10 rounded-2xl p-6"><div className="h-10 w-10 rounded-xl bg-[#f5efe2] flex items-center justify-center mb-5"><Icon size={18} className="text-[#9c7a42]"/></div><h3 className="text-[15px] font-semibold text-[#10283b]">{title}</h3><p className="text-[12px] text-black/55 leading-6 mt-2">{text}</p></div>)}</div></div></section>

    {cms.blocks.slice(1).filter(b=>b.visible).map((b,i)=><section key={i} className={i%2===0?'bg-white border-y border-black/10':'bg-[#0b2f4d] text-white'}><div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-8 items-center"><div className={i%2?'lg:order-2':''}><p className={`text-[10px] uppercase tracking-[.16em] font-semibold ${i%2===0?'text-[#9c7a42]':'text-[#d4b477]'}`}>{b.eyebrow}</p><h2 className={`text-[32px] md:text-[42px] font-semibold tracking-[-.04em] mt-3 ${i%2===0?'text-[#10283b]':'text-white'}`}>{b.heading}</h2><p className={`text-[14px] leading-7 mt-4 ${i%2===0?'text-black/58':'text-white/65'}`}>{b.text}</p></div><div className={`aspect-[4/3] overflow-hidden rounded-[24px] ${i%2?'lg:order-1':''}`}><img src={b.image.url} alt={b.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${b.image.focalX}% ${b.image.focalY}%`}}/></div></div></section>)}
    <Footer />
  </div>
}
