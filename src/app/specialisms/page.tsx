import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Twelve hard-coded specialisms with marketing blurbs, and twelve dead links.
// Every "View Roles" pointed at /jobs?specialism=..., and /jobs had never read
// a search parameter in its life - so all twelve landed on the same
// unfiltered list. The links work now, and the page carries live demand
// rather than description.
//
// Where a discipline has no live role, the page says so instead of offering a
// link to an empty result. That is more useful to a professional deciding
// where to put their next year than a paragraph about what massage is.
type Specialism = {
  name: string
  terms: string[]
  desc: string
}

const SPECIALISMS: Specialism[] = [
  { name: 'Massage Therapy', terms: ['massage', 'bodywork'], desc: 'Swedish, deep tissue, hot stone, sports massage and specialist bodywork.' },
  { name: 'Beauty Therapy', terms: ['beauty', 'facial', 'aesthetician'], desc: 'Facials, skin treatments, waxing, tinting and advanced beauty services.' },
  { name: 'Spa Management', terms: ['spa manager', 'spa director', 'head of spa', 'operations'], desc: 'Operations, team leadership, revenue and guest experience.' },
  { name: 'Wellness Coaching', terms: ['wellness', 'coach'], desc: 'Lifestyle coaching, stress management, sleep and wellness programmes.' },
  { name: 'Yoga & Pilates', terms: ['yoga', 'pilates'], desc: 'Group classes, private instruction, reformer Pilates and mindfulness.' },
  { name: 'Aesthetic Treatments', terms: ['aesthetic', 'laser', 'skin'], desc: 'Non-surgical aesthetics, laser, skin rejuvenation and body contouring.' },
  { name: 'Nutritional Therapy', terms: ['nutrition', 'dietary'], desc: 'Dietary planning, functional nutrition and wellness cuisine.' },
  { name: 'Holistic Therapy', terms: ['holistic', 'reiki', 'sound therapy'], desc: 'Reiki, sound therapy and integrative wellness approaches.' },
  { name: 'Fitness Training', terms: ['fitness', 'personal train', 'gym'], desc: 'Personal training, group fitness and functional movement.' },
  { name: 'Ayurveda', terms: ['ayurved'], desc: 'Traditional Ayurvedic treatments, consultations and rituals.' },
  { name: 'Hair Styling', terms: ['hair', 'stylist'], desc: 'Cutting, colouring, styling and specialist treatments for luxury settings.' },
  { name: 'Nail Technology', terms: ['nail', 'manicure', 'pedicure'], desc: 'Manicures, pedicures, gel, nail art and specialist treatments.' },
]

type SpecialismDemand = Specialism & { liveRoles: number; properties: number }

const getSpecialismDemand = unstable_cache(async (): Promise<SpecialismDemand[]> => {
  const empty = SPECIALISMS.map(item => ({ ...item, liveRoles: 0, properties: 0 }))
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('job_listings')
      .select('id, job_title, employer_id')
      .eq('is_live', true)
      .limit(1000)
    if (error || !data) return empty

    return SPECIALISMS.map(item => {
      const matches = data.filter((job: any) => {
        const haystack = String(job.job_title || '').toLowerCase()
        return item.terms.some(term => haystack.includes(term))
      })
      const properties = new Set(matches.map((job: any) => job.employer_id).filter(Boolean))
      return { ...item, liveRoles: matches.length, properties: properties.size }
    })
  } catch {
    return empty
  }
}, ['specialism-demand-v1'], { revalidate: 300 })

export default async function SpecialismsPage() {
  const specialisms = await getSpecialismDemand()
  const open = specialisms.filter(item => item.liveRoles > 0).sort((a, b) => b.liveRoles - a.liveRoles)
  const quiet = specialisms.filter(item => item.liveRoles === 0)
  const totalLive = open.reduce((sum, item) => sum + item.liveRoles, 0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content">
        <section className="pt-[76px] border-b border-border">
          <div className="max-w-[1080px] mx-auto px-6 lg:px-8 py-16">
            <p className="public-eyebrow mb-4">Specialisms</p>
            <h1 className="public-title mb-4">Where the demand actually is.</h1>
            <p className="text-[15px] text-secondary max-w-[58ch]">
              WHC covers every discipline in luxury spa and wellness. This page shows which of them
              properties are hiring for today, rather than describing what each one involves.
              {totalLive > 0 && (
                <> Counted across {totalLive} live role{totalLive === 1 ? '' : 's'}, refreshed every few minutes.</>
              )}
            </p>
          </div>
        </section>

        {open.length > 0 && (
          <section className="border-b border-border">
            <div className="max-w-[1080px] mx-auto px-6 lg:px-8 py-12">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-secondary mb-6">Hiring now</h2>
              <ul className="border-t border-border">
                {open.map(item => (
                  <li key={item.name} className="border-b border-border">
                    <Link
                      href={`/jobs?specialism=${encodeURIComponent(item.name)}`}
                      className="flex flex-col gap-3 py-6 sm:flex-row sm:items-baseline sm:gap-8 hover:bg-surface -mx-4 px-4 transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-medium text-ink">{item.name}</span>
                        <span className="block text-[13px] leading-relaxed text-secondary mt-1 max-w-[62ch]">{item.desc}</span>
                      </span>
                      <span className="shrink-0 sm:text-right">
                        <span className="block text-[22px] font-serif text-ink tabular-nums leading-none">{item.liveRoles}</span>
                        <span className="block text-[11px] text-secondary mt-1.5">
                          live role{item.liveRoles === 1 ? '' : 's'}
                          {item.properties > 1 && <> at {item.properties} properties</>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {quiet.length > 0 && (
          <section className="border-b border-border">
            <div className="max-w-[1080px] mx-auto px-6 lg:px-8 py-12">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-secondary mb-3">
                Covered, nothing live today
              </h2>
              <p className="text-[13px] text-secondary max-w-[58ch] mb-6">
                These disciplines are supported on WHC and professionals in them are on the register.
                No property has a role open in them right now, so there is nothing to link to.
              </p>
              <ul className="flex flex-wrap gap-2">
                {quiet.map(item => (
                  <li key={item.name} className="border border-border px-3 py-2 text-[12px] text-secondary">
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section>
          <div className="max-w-[1080px] mx-auto px-6 lg:px-8 py-16">
            <h2 className="text-[22px] font-serif text-ink mb-3">Tell us when yours opens.</h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[56ch] mb-8">
              Create a profile and WHC will match you against roles as properties publish them,
              on skills and product houses rather than keywords.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register/talent" className="btn-primary">Create a profile</Link>
              <Link href="/intelligence" className="btn-secondary">See what each discipline pays</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
