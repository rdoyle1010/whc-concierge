import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { eventDateLabel, eventKindLabel, eventWhereLabel, isUpcoming, type SpaEvent } from '@/lib/events'

// What is on, for everybody.
//
// Public rather than gated, deliberately. Most spa professionals are not
// looking for work, and a page that says "here is what is happening in your
// industry" is a reason to come back that costs a therapist nothing to be seen
// reading. The members-only ones are marked, and marking them is the argument
// for joining.

export const revalidate = 900

export const metadata: Metadata = {
  // The root layout appends "| Talent House Collective" to any plain title
  // string. Spelling the brand out here printed it twice in every search result.
  title: 'Spa and Wellness Events',
  description: 'Brand launches, masterclasses, product house training, trade shows and awards across luxury spa and wellness. Know what is on before everybody else.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/events' },
}

async function upcomingEvents(): Promise<{ events: SpaEvent[]; unavailable: boolean }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('events')
      .select('*').eq('is_published', true).order('starts_at', { ascending: true }).limit(120)
    if (error) return { events: [], unavailable: true }
    return { events: (data || []).filter(event => isUpcoming(event)), unavailable: false }
  } catch {
    return { events: [], unavailable: true }
  }
}

export default async function EventsPage() {
  const { events } = await upcomingEvents()

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pt-[76px]">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6e6a60]">Talent House Collective</p>
          <h1 className="mt-2 text-[38px] md:text-[46px] font-semibold leading-[1.08] text-[#222321]">What is on</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#57544c]">
            Brand launches, masterclasses, product house training, trade shows and awards across luxury
            spa and wellness. Everything on this page is open to anybody. Join the register and you hear
            about them first, along with the ones we keep for members.
          </p>

          {events.length === 0 ? (
            <div className="mt-10 border border-[#dcd4c8] p-8">
              <p className="text-[15px] text-[#3a3832]">
                Nothing listed just yet. We are adding the season now, so check back shortly.
              </p>
              <p className="mt-4">
                <Link href="/register/talent" className="text-[13px] font-semibold text-[#222321] underline">
                  Join the register and be told first
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-4">
              {events.map(event => (
                <Link key={event.id} href={`/events/${event.slug}`}
                  className="block border border-[#dcd4c8] p-6 transition-colors hover:border-[#222321]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">
                        {eventKindLabel(event.kind)}{event.host ? ` · ${event.host}` : ''}
                      </p>
                      <h2 className="mt-1.5 text-[22px] font-semibold text-[#222321]">{event.title}</h2>
                      <p className="mt-1.5 text-[13px] text-[#57544c]">
                        {eventDateLabel(event.starts_at, event.ends_at)} · {eventWhereLabel(event)}
                      </p>
                    </div>
                    {event.members_only && (
                      <span className="shrink-0 border border-[#222321] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#222321]">
                        Members
                      </span>
                    )}
                  </div>
                  {event.summary && (
                    <p className="mt-3 text-[14px] leading-relaxed text-[#3a3832]">{event.summary}</p>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 border-t border-[#dcd4c8] pt-8">
            <p className="text-[15px] leading-relaxed text-[#3a3832]">
              Talent House Collective is where spa and wellness professionals keep their record: verified
              qualifications, the brands and systems they know, and courses that count. Joining says nothing
              about whether you are looking for work, and you decide who can see you.
            </p>
            <p className="mt-5">
              <Link href="/register/talent"
                className="inline-block bg-[#222321] px-6 py-3 text-[13px] font-semibold text-white">
                Create your free profile
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
