import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { eventDateLabel, eventKindLabel, eventWhereLabel, isUpcoming, type SpaEvent } from '@/lib/events'

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
  if (!event) return { title: 'Event | Talent House Collective' }
  const when = eventDateLabel(event.starts_at, event.ends_at)
  return {
    title: `${event.title} | Talent House Collective`,
    description: event.summary || `${eventKindLabel(event.kind)} on ${when} at ${eventWhereLabel(event)}.`,
    alternates: { canonical: `https://talenthousecollective.co.uk/events/${event.slug}` },
    openGraph: event.image_url ? { images: [event.image_url] } : undefined,
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await loadEvent(slug)
  if (!event) notFound()

  const past = !isUpcoming(event)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pt-[76px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link href="/events" className="text-[12px] font-semibold text-[#6b6b6b] hover:text-[#1c1c1c]">← All events</Link>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">
            {eventKindLabel(event.kind)}{event.host ? ` · ${event.host}` : ''}
          </p>
          <h1 className="mt-2 text-[34px] md:text-[42px] font-semibold leading-[1.1] text-[#1c1c1c]">{event.title}</h1>

          {past && (
            <p className="mt-4 border border-[#dddddd] bg-[#f6f6f6] px-4 py-3 text-[13px] text-[#555555]">
              This one has been and gone. It is left here because the record is worth keeping.
            </p>
          )}

          <div className="mt-6 border-y border-[#dddddd] py-5">
            <p className="text-[16px] font-semibold text-[#1c1c1c]">{eventDateLabel(event.starts_at, event.ends_at)}</p>
            <p className="mt-1 text-[15px] text-[#3a3a3a]">{eventWhereLabel(event)}</p>
            {event.members_only && (
              <p className="mt-3 text-[13px] text-[#555555]">
                Open to Talent House members.{' '}
                <Link href="/register/talent" className="font-semibold text-[#1c1c1c] underline">Join free</Link>.
              </p>
            )}
          </div>

          {event.image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={event.image_url} alt="" className="mt-8 w-full" />
          )}

          {event.summary && (
            <p className="mt-8 text-[17px] leading-relaxed text-[#1c1c1c]">{event.summary}</p>
          )}

          {event.description && (
            <div className="mt-6 space-y-4">
              {event.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index} className="text-[15px] leading-relaxed text-[#3a3a3a]">{paragraph}</p>
              ))}
            </div>
          )}

          {event.booking_url && !past && (
            <p className="mt-9">
              <a href={event.booking_url} target="_blank" rel="noopener noreferrer"
                className="inline-block bg-[#1c1c1c] px-6 py-3 text-[13px] font-semibold text-white">
                Book your place
              </a>
            </p>
          )}

          <div className="mt-12 border-t border-[#dddddd] pt-8">
            <p className="text-[15px] leading-relaxed text-[#3a3a3a]">
              Members hear about these first. Joining Talent House says nothing about whether you are
              looking for work, and you decide who can see you.
            </p>
            <p className="mt-5">
              <Link href="/register/talent"
                className="inline-block border border-[#1c1c1c] px-6 py-3 text-[13px] font-semibold text-[#1c1c1c]">
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
