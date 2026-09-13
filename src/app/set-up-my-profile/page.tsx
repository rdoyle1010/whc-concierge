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
  title: 'We will set up your profile for you | Talent House Collective',
  description: 'Send us your CV and we will build your professional spa and wellness profile properly, then send it to you to approve. Free, and nothing goes live until you say so.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/set-up-my-profile' },
}

export default function SetUpMyProfilePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 pt-[76px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6b6b6b]">Talent House Collective</p>
          <h1 className="mt-2 text-[38px] md:text-[46px] font-semibold leading-[1.08] text-[#1c1c1c]">
            Send us your CV. We will do the rest.
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#3a3a3a]">
            A proper profile takes about half an hour: qualifications, product houses, systems,
            treatments, the brands you have worked with. You have better things to do on a Sunday.
            So send us what you have and we will build it for you, then send it back for you to
            look at before anybody else sees a word of it.
          </p>

          <div className="mt-8 border border-[#dddddd] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#6b6b6b]">What happens</p>
            <ol className="mt-4 space-y-4">
              {[
                ['You send a CV', 'Or an old profile, a few photographs, or a couple of lines telling us what you do. Whatever you already have.'],
                ['We build it', 'Properly, in your words, with your qualifications and the houses you know. A couple of days.'],
                ['You look at it', 'We send it to you. Change anything you like. Nothing is visible to any property until you say yes.'],
                ['You set a password', 'That is the first thing we ever ask you to do, and by then it is already finished.'],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-4">
                  <span className="shrink-0 text-[11px] font-semibold text-[#6b6b6b]">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[#1c1c1c]">{title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-[#555555]">{detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 border border-[#1c1c1c] p-6">
            <p className="text-[14px] leading-relaxed text-[#1c1c1c]">
              <strong>Being on Talent House says nothing about whether you are looking for work.</strong>{' '}
              Most of our register is not. It is where your qualifications and brand training are kept
              somewhere they count, where the Academy is, and where you hear about launches and
              masterclasses first. You decide who can see you, and the answer starts at nobody.
            </p>
          </div>

          {/* The way out, said before the form rather than after it. Plenty of
              people would rather not hand their CV to a stranger, and the
              self-serve door has always been the main one. */}
          <p className="mt-8 text-[14px] leading-relaxed text-[#555555]">
            Would rather do it yourself? Perfectly reasonable, and it is the same profile either way.{' '}
            <Link href="/register/talent" className="font-semibold text-[#1c1c1c] underline">Set it up yourself here</Link>,
            and come back to this page later if you change your mind.
          </p>

          <div className="mt-10">
            <h2 className="text-[24px] font-semibold text-[#1c1c1c]">Send it over</h2>
            <div className="mt-5"><ProfileBuildForm /></div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
