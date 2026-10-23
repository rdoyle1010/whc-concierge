import Link from 'next/link'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProfileBuildForm from '@/components/ProfileBuildForm'

// The door for somebody who will never fill in a form.
//
// Fourteen people signed up in the first fortnight and not one finished a
// profile. Asking a therapist for fifteen fields in exchange for a promise is
// the wrong way round, so this asks for a CV and gives her a finished profile.

export const metadata: Metadata = {
  // The root layout appends "| Talent House Collective" to any plain title
  // string. Spelling the brand out here printed it twice in every search result.
  title: 'We Will Build Your Spa Profile For You',
  description: 'Send us your CV and we will build your spa and wellness profile properly, then send it to you to approve. Free.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/set-up-my-profile' },
}

export default function SetUpMyProfilePage() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pt-[76px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6e6a60]">Talent House Collective</p>
          <h1 className="mt-2 text-[38px] md:text-[46px] font-semibold leading-[1.08] text-[#222321]">
            Send us your CV. We will do the rest.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#3a3832]">
            A proper profile takes about half an hour: qualifications, product houses, systems,
            treatments, the brands you have worked with. You have better things to do on a Sunday.
            So send us your CV, answer the eight things a CV cannot tell us, and we will build the
            rest. It comes back to you finished, in your own words, before anybody else sees a word
            of it.
          </p>

          <div className="mt-8 border border-[#dcd4c8] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6e6a60]">What happens</p>
            <ol className="mt-4 space-y-4">
              {[
                ['You send a CV and answer eight things', 'The eight are the ones a CV never says: what you are now, when you could start, how far you would go, how visible you want to be. Two minutes.'],
                ['We build it', 'Properly, in your own words, with your qualifications and the houses you know. It reads as though you wrote it, because everything in it came from you.'],
                ['You look at it', 'We send it to you. Change anything you like. Nothing is visible to any property until you say yes.'],
                ['You set a password', 'That is the first thing we ever ask you to do, and by then it is already finished.'],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-4">
                  <span className="shrink-0 text-[11px] font-semibold text-[#6e6a60]">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[#222321]">{title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-[#57544c]">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 border border-[#222321] p-6">
            <p className="text-[14px] leading-relaxed text-[#222321]">
              <strong>Being on Talent House says nothing about whether you are looking for work.</strong>{' '}
              Most of our register is not. It is where your qualifications and brand training are kept
              somewhere they count, where the Academy is, and where you hear about launches and
              masterclasses first. You decide who can see you, and the answer starts at nobody.
            </p>
          </div>

          {/* The way out, said before the form rather than after it. Plenty of
              people would rather not hand their CV to a stranger, and the
              self-serve door has always been the main one. */}
          <p className="mt-8 text-[14px] leading-relaxed text-[#57544c]">
            Would rather do it yourself? Perfectly reasonable, and it is the same profile either way.{' '}
            <Link href="/register/talent" className="font-semibold text-[#222321] underline">Set it up yourself here</Link>,
            and come back to this page later if you change your mind.
          </p>

          <div className="mt-10">
            <h2 className="text-[24px] font-semibold text-[#222321]">Send it over</h2>
            <div className="mt-5"><ProfileBuildForm /></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
