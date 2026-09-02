import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWebsiteContent } from '@/lib/site-content-server'
import PanelBackdrop from '@/components/PanelBackdrop'
import PanelPicture from '@/components/PanelPicture'
import { Clock, ArrowRight } from 'lucide-react'

export const revalidate = 300

const SITE = 'https://talenthousecollective.co.uk'

export const metadata: Metadata = {
  title: 'WHC Intelligence',
  description: 'Salary signals, hiring demand and editorial analysis for luxury spa and wellness - drawn from live WHC platform data and published only when the sample clears our credibility thresholds.',
  alternates: { canonical: `${SITE}/intelligence` },
  openGraph: {
    title: 'WHC Intelligence',
    description: 'Verifiable industry intelligence for luxury spa and wellness, from a live hiring platform.',
    url: `${SITE}/intelligence`,
    type: 'website',
  },
}

// House credibility rules - identical to the Career Intelligence API. A salary
// figure is only shown with its sample size; below 30 records it is suppressed
// entirely, and 30-99 records is an early signal, not an established number.
const SALARY_SUPPRESS_BELOW = 30
const SALARY_EARLY_BELOW = 100

function median(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

// Loose seniority grouping - role_level is free wording across employers, so
// these are honest approximations by label, not a strict taxonomy.
const SENIORITY_GROUPS: Array<{ label: string; test: (level: string) => boolean }> = [
  { label: 'Director & head of department', test: level => /director|head/.test(level) },
  { label: 'Manager', test: level => /manager/.test(level) },
  { label: 'Therapist & practitioner', test: level => /therapist|practitioner/.test(level) },
  { label: 'Support & front of house', test: level => /support|reception|attendant|assistant|host/.test(level) },
]

const EDITORIAL_CATEGORIES = [
  'Salary reports',
  'Industry benchmarks',
  'Leadership interviews',
  'Spa opening reports',
  'Career advice',
  'Revenue benchmarks',
  'Recruitment trends',
  'Role guides',
  'Industry analysis',
]

const getIntelligenceData = unstable_cache(async () => {
  const admin = createAdminClient()

  // Every query is defensive - an error collapses to an empty list so the
  // page composes around missing data instead of failing.
  let liveJobs: any[] = []
  try {
    const { data, error } = await admin
      .from('job_listings')
      .select('id, required_role_level, required_skills')
      .eq('is_live', true)
      .eq('status', 'active')
    if (!error) liveJobs = data || []
  } catch { liveJobs = [] }

  let salaryRows: any[] = []
  try {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await admin
      .from('salary_records')
      .select('amount_min, amount_max, role_level')
      .eq('kind', 'advertised')
      .eq('period', 'annual')
      .gte('recorded_at', since)
    if (!error) salaryRows = data || []
  } catch { salaryRows = [] }

  let posts: any[] = []
  try {
    const { data, error } = await admin
      .from('blog_posts')
      .select('id, slug, title, excerpt, content, category, tags, author, read_time, published_at, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (!error) posts = data || []
  } catch { posts = [] }

  return { liveJobs, salaryRows, posts, generatedAt: new Date().toISOString() }
}, ['whc-intelligence-v1'], { revalidate: 300 })

function seniorityCounts(liveJobs: any[]) {
  return SENIORITY_GROUPS.map(group => ({
    label: group.label,
    count: liveJobs.filter(job => group.test(String(job.required_role_level || '').toLowerCase())).length,
  }))
}

function topSkills(liveJobs: any[], limit = 8) {
  const counts = new Map<string, number>()
  for (const job of liveJobs) {
    const skills = Array.isArray(job.required_skills) ? job.required_skills : []
    for (const raw of skills) {
      const skill = String(raw).trim()
      if (skill) counts.set(skill, (counts.get(skill) || 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

type SalarySignal =
  | { label: string; suppressed: true; sample: number }
  | { label: string; suppressed: false; median: number; sample: number; early: boolean }

function salarySignals(salaryRows: any[]): SalarySignal[] {
  return SENIORITY_GROUPS.map(group => {
    const midpoints = salaryRows
      .filter(row => group.test(String(row.role_level || '').toLowerCase()))
      .map(row => {
        const low = row.amount_min ? Number(row.amount_min) : null
        const high = row.amount_max ? Number(row.amount_max) : null
        if (low && high) return Math.round((low + high) / 2)
        return low || high || null
      })
      .filter((value): value is number => Boolean(value))
    const sample = midpoints.length
    if (sample < SALARY_SUPPRESS_BELOW) return { label: group.label, suppressed: true as const, sample }
    return {
      label: group.label,
      suppressed: false as const,
      median: median(midpoints) as number,
      sample,
      early: sample < SALARY_EARLY_BELOW,
    }
  })
}

function readMinutes(post: any): number {
  const stored = Number(post.read_time)
  if (stored > 0) return Math.round(stored)
  return Math.max(1, Math.ceil((post.content?.length || 0) / 1200))
}

function postDate(post: any): string | null {
  const raw = post.published_at || post.created_at
  if (!raw) return null
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Category match: case-insensitive against category, falling back to tags
// when the post has no category. No match means no entry - nothing is invented.
function postsForCategory(posts: any[], category: string) {
  const key = category.toLowerCase()
  return posts.filter(post => {
    const postCategory = String(post.category || '').trim().toLowerCase()
    if (postCategory) return postCategory === key
    const tags = Array.isArray(post.tags) ? post.tags : []
    return tags.some((tag: any) => String(tag).trim().toLowerCase() === key)
  })
}

export default async function IntelligencePage() {
  const { liveJobs, salaryRows, posts, generatedAt } = await getIntelligenceData()
  const site = await getWebsiteContent()

  const dateline = new Date(generatedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const seniority = seniorityCounts(liveJobs)
  const skills = topSkills(liveJobs)
  const salaries = salarySignals(salaryRows)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Masthead. The copy has always occupied the left half; the right half
          is now a picture box Rebecca can fill from Admin -> Pictures, or sell.
          With nothing in it the masthead renders exactly as it did. */}
      <header className="bg-accent pt-[76px]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/70">WHC Intelligence</p>
            <h1 className="mt-5 text-white text-[38px] md:text-[58px] leading-[1.05] tracking-[-.04em]">
              The numbers behind luxury wellness careers, reported straight.
            </h1>
            <p className="mt-6 text-[15px] leading-7 text-white/75 max-w-2xl">
              Intelligence drawn from a live hiring platform - real roles, advertised salaries and demand as it stands.
              A figure appears here only once the data clears WHC&apos;s credibility thresholds. Nothing padded, nothing invented.
            </p>
          </div>
          <PanelPicture panel={site.panels.intelligenceHero} placement="intelligence_hero" aspect="aspect-[5/4]" />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6">
        {/* The market this month */}
        <section className="py-14 md:py-20">
          <p className="public-eyebrow">The market this month</p>
          <h2 className="mt-4 text-[26px] md:text-[34px] leading-[1.2] max-w-3xl">{dateline}</h2>
          <p className="mt-4 text-[13px] leading-6 text-secondary max-w-2xl">
            Source: live WHC platform data, refreshed continuously.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-6 max-w-5xl">
            <div className="border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-muted">Live roles</p>
              <p className="mt-1 text-[24px] font-serif font-semibold text-ink">{liveJobs.length}</p>
            </div>
            {seniority.map(group => (
              <div key={group.label} className="border-t border-border pt-3">
                <p className="text-[10px] uppercase tracking-[.14em] text-muted">{group.label}</p>
                <p className="mt-1 text-[24px] font-serif font-semibold text-ink">{group.count}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted max-w-3xl">
            Seniority is grouped loosely by role title wording, so the groups are an honest approximation rather than a strict taxonomy.
          </p>

          {/* Skills in demand */}
          <div className="mt-12">
            <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">Most-demanded skills across live roles</p>
            {skills.length > 0 ? (
              <div className="mt-3 max-w-4xl grid md:grid-cols-2 gap-x-14">
                {skills.map(([skill, count]) => (
                  <div key={skill} className="flex items-baseline justify-between gap-6 border-t border-border py-2.5">
                    <p className="text-[13px] leading-5 text-body">{skill}</p>
                    <p className="text-[13px] font-semibold text-ink tabular-nums">{count} role{count === 1 ? '' : 's'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-secondary">No live roles list required skills right now.</p>
            )}
          </div>

          {/* Salary signal */}
          <div className="mt-12">
            <p className="text-[11px] uppercase tracking-[.14em] font-semibold text-muted">Advertised salary signal</p>
            <p className="mt-2 text-[12px] leading-5 text-secondary max-w-2xl">
              Advertised annual salaries recorded on the platform over the last 12 months. A median is published only with its sample size; below 30 verified records we publish nothing at all.
            </p>
            <dl className="mt-4 max-w-3xl">
              {salaries.map(signal => (
                <div key={signal.label} className="flex flex-col sm:flex-row sm:items-baseline gap-x-8 gap-y-1 border-t border-border py-4">
                  <dt className="w-64 shrink-0 text-[11px] uppercase tracking-[.12em] text-muted pt-1">{signal.label}</dt>
                  {signal.suppressed ? (
                    <dd className="text-[13px] leading-6 text-secondary">
                      Publishing at 30 verified records - currently {signal.sample}
                    </dd>
                  ) : (
                    <dd className="text-[14px] leading-6 text-ink">
                      <strong className="font-serif font-semibold text-[18px]">£{signal.median.toLocaleString('en-GB')}</strong>
                      <span className="text-secondary"> median · {signal.sample} records{signal.early ? ' · early signal' : ''}</span>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Editorial categories */}
        <section className="border-t border-border py-14 md:py-20">
          <p className="public-eyebrow">The intelligence desk</p>
          <h2 className="mt-4 text-[26px] md:text-[34px] leading-[1.2] max-w-3xl">Reported when there is something worth saying.</h2>

          <div className="mt-12 space-y-14">
            {EDITORIAL_CATEGORIES.map(category => {
              const entries = postsForCategory(posts, category)
              return (
                <div key={category}>
                  <h3 className="text-[11px] uppercase tracking-[.16em] font-semibold text-ink">{category}</h3>
                  {entries.length > 0 ? (
                    <div className="mt-3 max-w-4xl">
                      {entries.map(post => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="group block border-t border-border py-5">
                          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-x-8 gap-y-2">
                            <div className="min-w-0">
                              <p className="text-[18px] md:text-[20px] font-serif font-semibold text-ink leading-snug group-hover:text-accent transition-colors">{post.title}</p>
                              {(post.excerpt || post.content) && (
                                <p className="mt-1.5 text-[13px] leading-6 text-secondary line-clamp-2">{post.excerpt || String(post.content).slice(0, 160)}</p>
                              )}
                            </div>
                            <p className="shrink-0 flex items-center gap-3 text-[11px] text-muted whitespace-nowrap">
                              {postDate(post) && <span>{postDate(post)}</span>}
                              <span className="inline-flex items-center gap-1"><Clock size={11} />{readMinutes(post)} min</span>
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 border-t border-border pt-4 max-w-4xl text-[13px] italic text-secondary">
                      In research - published when there is something worth saying.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* Closing CTA - the global newsletter signup bar already appears on
          public pages via the root layout, so this row points to the archive
          rather than duplicating the form. */}
      <section className="bg-accent relative isolate overflow-hidden">
        <PanelBackdrop panel={site.panels.intelligenceJournal} placement="intelligence_band" />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <h2 className="text-white text-[28px] md:text-[36px]">Read the full journal</h2>
          <p className="mt-4 text-[14px] leading-7 text-white/70 max-w-xl mx-auto">
            Every article WHC has published - careers, leadership and industry perspective across luxury wellness.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/blog" className="inline-flex items-center gap-2 bg-white text-accent px-6 py-3 text-[13px] font-semibold hover:bg-surface transition-colors">
              Browse the journal archive <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
