import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { eventDateLabel, eventKindLabel, eventWhereLabel, isUpcoming, type SpaEvent } from '@/lib/events'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'

export const revalidate = 900

async function loadEvent(slug: string): Promise<SpaEvent | null> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('events')
      .select('*').eq('slug', slug).eq('is_published', true).maybeSingle()
    return (data as SpaEvent) || null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await loadEvent(slug)
  if (!event) return { title: 'Event not found' }
  const when = eventDateLabel(event.starts_at, event.ends_at)
  return {
    // The root template appends "| Talent House Collective" to any plain title
    // string, so spelling it out here produced it twice in every search result.
    title: event.title,
    description: event.summary || `${eventKindLabel(event.kind)} on ${when} at ${eventWhereLabel(event)}.`,
    alternates: { canonical: `${SITE_URL}/events/${event.slug}` },
    openGraph: {
      ...OG_DEFAULTS,
      title: event.title,
      description: event.summary || `${eventKindLabel(event.kind)} on ${when} at ${eventWhereLabel(event)}.`,
      url: `${SITE_URL}/events/${event.slug}`,
      ...(event.image_url ? { images: [{ url: event.image_url }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: event.title, description: event.summary || `${eventKindLabel(event.kind)} on ${when}.` },
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await loadEvent(slug)
  if (!event) notFound()

  const past = !isUpcoming(event)

  // Event structured data, which this page has never carried.
  //
  // An event is one of the few things Google will show with its date, place and
  // a booking link attached, and every field it wants is already stored here.
  // Past events keep their markup deliberately: "spa masterclass London" is
  // searched all year, and a finished event that still describes itself is how
  // somebody finds the next one.
  const eventLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.starts_at,
    url: `${SITE_URL}/events/${event.slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.is_online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: event.is_online
      ? { '@type': 'VirtualLocation', url: event.booking_url || `${SITE_URL}/events/${event.slug}` }
      : { '@type': 'Place', name: event.location || 'To be confirmed', address: event.location || 'United Kingdom' },
    organizer: { '@type': 'Organization', name: event.host || 'Talent House Collective', url: SITE_URL },
  }
  if (event.ends_at) eventLd.endDate = event.ends_at
  if (event.summary || event.description) eventLd.description = String(event.summary || event.description)
  if (event.image_url) eventLd.image = [event.image_url]

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <Navbar />
      <main id="main-content" className="flex-1 pt-[76px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link href="/events" className="text-[12px] font-semibold text-[#6e6a60] hover:text-[#222321]">← All events</Link>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">
            {eventKindLabel(event.kind)}{event.host ? ` · ${event.host}` : ''}
          </p>
          <h1 className="mt-2 text-[34px] md:text-[42px] font-semibold leading-[1.1] text-[#222321]">{event.title}</h1>

          {past && (
            <p className="mt-4 border border-[#dcd4c8] bg-[#f6f6f6] px-4 py-3 text-[13px] text-[#57544c]">
              This one has been and gone. It is left here because the record is worth keeping.
            </p>
          )}

          <div className="mt-6 border-y border-[#dcd4c8] py-5">
            <p className="text-[16px] font-semibold text-[#222321]">{eventDateLabel(event.starts_at, event.ends_at)}</p>
            <p className="mt-1 text-[15px] text-[#3a3832]">{eventWhereLabel(event)}</p>
            {event.members_only && (
              <p className="mt-3 text-[13px] text-[#57544c]">
                Open to Talent House members.{' '}
                <Link href="/register/talent" className="font-semibold text-[#222321] underline">Join free</Link>.
              </p>
            )}
          </div>

          {event.image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={event.image_url} alt="" className="mt-8 w-full" />
          )}

          {event.summary && (
            <p className="mt-8 text-[17px] leading-relaxed text-[#222321]">{event.summary}</p>
          )}

          {event.description && (
            <div className="mt-6 space-y-4">
              {event.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="text-[15px] leading-relaxed text-[#3a3832]">{paragraph}</p>
              ))}
            </div>
          )}

          {event.booking_url && !past && (
            <p className="mt-9">
              <a href={event.booking_url} target="_blank" rel="noopener noreferrer"
                className="inline-block bg-[#222321] px-6 py-3 text-[13px] font-semibold text-white">
                Book your place
              </a>
            </p>
          )}

          <div className="mt-12 border-t border-[#dcd4c8] pt-8">
            <p className="text-[15px] leading-relaxed text-[#3a3832]">
              Members hear about these first. Joining Talent House says nothing about whether you are
              looking for work, and you decide who can see you.
            </p>
            <p className="mt-5">
              <Link href="/register/talent"
                className="inline-block border border-[#222321] px-6 py-3 text-[13px] font-semibold text-[#222321]">
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
