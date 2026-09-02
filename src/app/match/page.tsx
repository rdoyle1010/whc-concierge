import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Heart, MapPin, Sparkles, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { getWebsiteContent } from '@/lib/site-content-server'
import { websiteCssVariables } from '@/lib/site-content'

export const revalidate = 60

// The image on the sample role card.
//
// This was a hotlinked Unsplash photograph of towels and tulips: generic, off
// the charcoal palette, and outside WHC's control, so a photo taken down at source
// would have left a hole in the middle of the page a professional lands on
// first. It is now a WHC image, served from this site.
//
// To change it: drop a new file into public/images and change this one line.
// The panel behind it is brand charcoal, so the card still reads if the image is
// ever slow or missing.
const SAMPLE_CARD_IMAGE = '/images/spa-therapist-facial.jpg'

const signals = [
  'Role level & experience',
  'Treatments & technical skills',
  'Qualifications',
  'Product-house knowledge',
  'Systems experience',
  'Location & travel radius',
  'Working preferences',
]

export default async function MatchExplainerPage() {
  const content = await getWebsiteContent(false)

  return (
    <div className="website-theme min-h-screen bg-white text-[#1c1b1a]" style={websiteCssVariables(content)}>
      <Navbar siteContent={content} />
      <main id="main-content" className="pt-[76px]">
        <section className="border-b border-[#e0dad2] bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#57534e]">WHC Match</p>
              <h1 className="site-heading text-[48px] font-semibold leading-[0.98] md:text-[68px]">Roles come to you. You decide what feels right.</h1>
              <p className="mt-7 max-w-xl text-[16px] leading-7 text-[#57534e]">Think of it like a dating app for your career. Talent House Collective ranks live roles around your real experience and preferences, then lets you review them one at a time.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?role=talent&next=%2Froles%2Fmatch" className="inline-flex items-center gap-2 bg-[#1c1b1a] px-6 py-3.5 text-[13px] font-semibold text-white">Sign in to start matching <ArrowRight size={15}/></Link>
                <Link href="/register/talent" className="inline-flex items-center gap-2 border border-[#6e6a66] bg-white px-6 py-3.5 text-[13px] font-semibold text-[#1c1b1a]">Create free profile</Link>
              </div>
              <p className="mt-5 text-[11px] leading-5 text-[#6e6a66]">Nothing is sent to an employer just because you swipe. You stay in control and choose when to submit an application.</p>
            </div>

            <div className="relative mx-auto w-full max-w-[440px] py-8">
              <div className="absolute left-2 top-12 h-[470px] w-[90%] -rotate-3 border border-[#e0dad2] bg-[#f3f0eb]" />
              <div className="absolute right-2 top-10 h-[470px] w-[90%] rotate-3 border border-[#e0dad2] bg-white" />
              <div className="relative overflow-hidden border border-[#e0dad2] bg-white shadow-[0_24px_70px_rgba(28,27,26,.14)]">
                <span className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-[#1c1b1a] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Sample - for illustration</span>
                <div className="relative h-[235px] bg-[#1c1b1a]">
                  <img src={SAMPLE_CARD_IMAGE} alt="A spa therapist giving a facial in a treatment room" width={472} height={264} className="h-full w-full object-cover" />
                  {/* Deeper than it was. The previous image was dark at the foot,
                      this one is bright white towels exactly where the role title
                      sits, and white on white does not read. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0d]/85 via-[#0f0e0d]/25 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-[10px] uppercase tracking-[.15em] text-white/70">The Grand Spa Hotel</p>
                    <p className="mt-1 text-[25px] font-semibold">Senior Spa Therapist</p>
                    <p className="mt-2 flex items-center gap-1 text-[12px] text-white/75"><MapPin size={12}/> Harrogate · Full time</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div><p className="text-[10px] uppercase tracking-[.14em] text-[#57534e]">Your match</p><p className="mt-1 text-[13px] text-[#57534e]">Strong alignment across skills, experience and location.</p></div>
                    <div className="shrink-0 border border-[#e0dad2] bg-[#f3f0eb] px-4 py-2 text-center"><p className="text-[27px] font-semibold text-[#1c1b1a]">86%</p><p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#57534e]">Strong</p></div>
                  </div>
                  <div className="border-t border-[#e0dad2] pt-5">
                    <p className="text-[11px] font-semibold text-[#1c1b1a]">Why it fits</p>
                    <div className="mt-3 space-y-2 text-[12px] text-[#57534e]">
                      <p className="flex gap-2"><Check size={14} className="mt-0.5 text-[#1c1b1a]"/> Luxury spa experience aligns</p>
                      <p className="flex gap-2"><Check size={14} className="mt-0.5 text-[#1c1b1a]"/> Required treatment skills match</p>
                      <p className="flex gap-2"><Check size={14} className="mt-0.5 text-[#1c1b1a]"/> Within your preferred travel radius</p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-center gap-2 border border-[#e0dad2] py-3 text-[12px] font-semibold text-[#57534e]"><X size={17}/> Swipe left</div>
                    <div className="flex items-center justify-center gap-2 bg-[#1c1b1a] py-3 text-[12px] font-semibold text-white"><Heart size={16}/> Swipe right</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f3f0eb] py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-px border border-[#e0dad2] bg-[#e0dad2] md:grid-cols-3">
              <div className="bg-white p-8"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#57534e]">01 · We rank</p><h2 className="mt-4 text-[24px] font-semibold text-[#1c1b1a]">Your strongest roles appear first.</h2><p className="mt-3 text-[13px] leading-6 text-[#57534e]">The score is built from your WHC profile and the employer’s real job requirements, not a generic keyword search.</p></div>
              <div className="bg-white p-8"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#57534e]">02 · You swipe</p><h2 className="mt-4 text-[24px] font-semibold text-[#1c1b1a]">Left to pass. Right to keep.</h2><p className="mt-3 text-[13px] leading-6 text-[#57534e]">Pass roles that are not for you. Swipe right on ones you want to explore and they move into My Applications.</p></div>
              <div className="bg-white p-8"><p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#57534e]">03 · You choose</p><h2 className="mt-4 text-[24px] font-semibold text-[#1c1b1a]">Nothing is sent until you say so.</h2><p className="mt-3 text-[13px] leading-6 text-[#57534e]">Review the full role, prepare your application and submit only when you are ready.</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.17em] text-[#57534e]">What creates your score</p>
              <h2 className="site-heading mt-4 text-[38px] leading-[1.02] md:text-[48px]">More than a job title.</h2>
              <p className="mt-5 text-[14px] leading-7 text-[#57534e]">A Spa Director and a newly qualified therapist should never get the same matching logic. Your score reflects the level and detail of the role you are actually looking at.</p>
            </div>
            <div className="grid gap-px border border-[#e0dad2] bg-[#e0dad2] sm:grid-cols-2">
              {signals.map(signal => <div key={signal} className="flex items-center gap-3 bg-white px-5 py-5 text-[13px] font-medium text-[#3a3835]"><Sparkles size={14} className="text-[#1c1b1a]"/>{signal}</div>)}
            </div>
          </div>
        </section>

        <section className="border-y border-[#e0dad2] bg-[#1c1b1a] py-16 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-7 px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-white/55">Ready?</p><h2 className="mt-2 text-[34px] font-semibold">See the roles built around your profile.</h2></div>
            <Link href="/login?role=talent&next=%2Froles%2Fmatch" className="inline-flex w-fit items-center gap-2 bg-white px-6 py-3.5 text-[13px] font-semibold text-[#1c1b1a]">Start matching <ArrowRight size={15}/></Link>
          </div>
        </section>
      </main>
      <Footer siteContent={content} />
    </div>
  )
}
