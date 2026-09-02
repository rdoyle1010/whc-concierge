import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: { absolute: 'How WHC proves what it publishes | Talent House Collective' },
  description: 'Every review on WHC comes from a completed, paid engagement between two verified accounts. Here is the standard, and what is published today.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/testimonials' },
}

// Reviews on WHC are earned, not collected. This page used to carry eight
// invented quotes with a line underneath admitting they were invented, which
// told a prospective employer exactly one thing: that WHC had no customers.
// It now publishes the standard, and whatever genuinely meets it.
//
// Reviewers are published by role and engagement, never by name. A named
// professional permanently attached to a critical review of a named former
// employer is a real-world consequence, and nobody consented to it.
type PublishedReview = {
  id: string
  rating: number
  text: string
  role: string
  source: string
  when: string | null
}

const getPublishedReviews = unstable_cache(async (): Promise<PublishedReview[]> => {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('reviews')
      .select('id, reviewer_id, rating, text, booking_id, created_at')
      .gte('rating', 1)
      .lte('rating', 5)
      .not('text', 'is', null)
      .neq('text', '')
      .order('created_at', { ascending: false })
      .limit(24)

    const rows = (data || []).filter((row: any) => String(row.text || '').trim().length > 24).slice(0, 6)
    if (rows.length === 0) return []

    const reviewerIds = [...new Set(rows.map((row: any) => row.reviewer_id).filter(Boolean))]
    const { data: reviewers } = reviewerIds.length
      ? await admin.from('candidate_profiles').select('user_id, role_level').in('user_id', reviewerIds)
      : { data: [] as any[] }
    const roleByUser = new Map((reviewers || []).map((row: any) => [row.user_id, row.role_level]))

    return rows.map((row: any) => ({
      id: row.id,
      rating: Number(row.rating),
      text: String(row.text).trim(),
      role: roleByUser.get(row.reviewer_id) || 'Verified WHC professional',
      source: row.booking_id ? 'After a completed Agency shift' : 'After a completed placement',
      when: row.created_at || null,
    }))
  } catch {
    return []
  }
}, ['published-reviews-v1'], { revalidate: 300 })

const getProofCounts = unstable_cache(async () => {
  try {
    const admin = createAdminClient()
    const [reviews, properties, shifts] = await Promise.all([
      admin.from('reviews').select('id', { count: 'exact', head: true }),
      admin.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      admin.from('agency_bookings').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    ])
    return {
      reviews: reviews.error ? null : reviews.count ?? 0,
      properties: properties.error ? null : properties.count ?? 0,
      completedShifts: shifts.error ? null : shifts.count ?? 0,
    }
  } catch {
    return { reviews: null, properties: null, completedShifts: null }
  }
}, ['proof-counts-v1'], { revalidate: 300 })

function formatWhen(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

const STANDARD = [
  {
    heading: 'A review requires a completed engagement',
    body: 'Reviews cannot be written by anyone who has simply visited a profile, been shortlisted, or exchanged messages. The engagement has to have finished and the money has to have moved. There is no way to leave a review from outside that.',
  },
  {
    heading: 'Both accounts are verified before either can review',
    body: 'Properties are approved by hand before a role goes live. Professionals hold verified right-to-work evidence, and insurance where they have chosen to provide it. A review is therefore attached to two accounts that are known, not two email addresses.',
  },
  {
    heading: 'Nobody is named without cause',
    body: 'Reviews are published by professional level and by the kind of engagement that produced them. We do not attach a person’s name to a public opinion of a former employer, and we do not invite properties to solicit reviews from people they are still paying.',
  },
  {
    heading: 'Nothing is written on WHC’s behalf',
    body: 'No review on this platform has ever been drafted, edited, arranged or paid for by us. Where there is nothing to publish, this page says so rather than filling the space.',
  },
]

export default async function ProofPage() {
  const [reviews, counts] = await Promise.all([getPublishedReviews(), getProofCounts()])

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-[76px] bg-white">
        <section className="border-b border-border">
          <div className="max-w-[880px] mx-auto px-6 lg:px-8 py-16">
            <p className="public-eyebrow mb-5">Proof</p>
            <h1 className="public-title mb-5">How WHC proves what it publishes.</h1>
            <p className="text-[16px] leading-relaxed text-secondary max-w-[62ch]">
              Most recruitment sites open with testimonials. Very few will tell you where they came
              from. This page is the reverse: the standard first, then whatever currently meets it,
              and an honest count of how much that is.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="max-w-[880px] mx-auto px-6 lg:px-8 py-14">
            <h2 className="text-[22px] font-serif text-ink mb-8">The standard</h2>
            <dl className="grid grid-cols-1 gap-px bg-border border border-border">
              {STANDARD.map(item => (
                <div key={item.heading} className="bg-white p-6">
                  <dt className="text-[15px] font-medium text-ink mb-2">{item.heading}</dt>
                  <dd className="text-[14px] leading-relaxed text-secondary max-w-[68ch]">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="max-w-[880px] mx-auto px-6 lg:px-8 py-14">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
              <h2 className="text-[22px] font-serif text-ink">What that produces today</h2>
              {counts.reviews != null && (
                <p className="text-[12px] text-secondary">
                  {counts.reviews === 0
                    ? 'No reviews have met the standard yet'
                    : `${counts.reviews} review${counts.reviews === 1 ? '' : 's'} on record`}
                </p>
              )}
            </div>

            {reviews.length > 0 ? (
              <ul className="border-t border-border">
                {reviews.map(review => {
                  const when = formatWhen(review.when)
                  return (
                    <li key={review.id} className="border-b border-border py-7">
                      <p className="text-[16px] leading-relaxed text-ink max-w-[64ch]">{review.text}</p>
                      <p className="text-[12px] text-secondary mt-4">
                        {review.role}
                        <span className="mx-2 text-border" aria-hidden="true">|</span>
                        {review.source}
                        {when && (
                          <>
                            <span className="mx-2 text-border" aria-hidden="true">|</span>
                            {when}
                          </>
                        )}
                        <span className="mx-2 text-border" aria-hidden="true">|</span>
                        <span className="tabular-nums">{review.rating} of 5</span>
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="border border-border p-8">
                <p className="text-[16px] text-ink leading-relaxed max-w-[62ch] mb-4">
                  Nothing yet. WHC is early, and no engagement has completed and been reviewed under
                  the standard above.
                </p>
                <p className="text-[14px] text-secondary leading-relaxed max-w-[62ch]">
                  We could fill this page in an afternoon with composite quotes and a disclaimer
                  underneath. That would tell you rather more about us than the empty page does. The
                  first real review will appear here the day it is written.
                </p>
                {(counts.properties || counts.completedShifts) ? (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border mt-8">
                    {counts.properties ? (
                      <div className="bg-white p-5">
                        <dt className="text-[10px] tracking-[0.16em] uppercase text-secondary mb-2">Approved properties</dt>
                        <dd className="text-[28px] font-serif text-ink tabular-nums">{counts.properties}</dd>
                      </div>
                    ) : null}
                    {counts.completedShifts ? (
                      <div className="bg-white p-5">
                        <dt className="text-[10px] tracking-[0.16em] uppercase text-secondary mb-2">Completed Agency shifts</dt>
                        <dd className="text-[28px] font-serif text-ink tabular-nums">{counts.completedShifts}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="max-w-[880px] mx-auto px-6 lg:px-8 py-16">
            <h2 className="text-[22px] font-serif text-ink mb-3">See the roles instead.</h2>
            <p className="text-[15px] text-secondary leading-relaxed max-w-[58ch] mb-8">
              The most useful thing on this platform is not what people say about it. It is what is
              open, at which properties, at what rate.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/jobs" className="btn-primary">Browse roles</Link>
              <Link href="/intelligence" className="btn-secondary">Read the market data</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
