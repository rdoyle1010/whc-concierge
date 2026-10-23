'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, GraduationCap, Send } from 'lucide-react'

// The way in for a brand, and deliberately the same shape as the page itself.
//
// A brand that fills this in has written most of its own entry. That is better
// for both sides: they say why a spa should stock them in their own words,
// which nobody else can do as well, and what reaches us is a draft rather than
// a lead to chase.

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-ink">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11px] leading-5 text-muted">{hint}</span> : null}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

const BLANK = {
  brand_name: '', website_url: '', contact_name: '', contact_role: '', contact_email: '', contact_phone: '',
  usp: '', why_spas: '', why_therapists_love_it: '', how_to_sell: '',
  director_quote: '', director_name: '', director_role: '',
  founded: '', origin: '', hero_ingredients: '', signature_treatments: '', notable_partners: '',
}

export default function BrandApplyPage() {
  const [form, setForm] = useState(BLANK)
  const [offersMasterclass, setOffersMasterclass] = useState(false)
  const [company, setCompany] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const set = (key: keyof typeof BLANK) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(current => ({ ...current, [key]: event.target.value }))

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (state === 'sending') return
    setState('sending'); setError('')
    try {
      const response = await fetch('/api/brands/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, offers_masterclass: offersMasterclass, company }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || 'Your application could not be sent. Please try again.')
      setState('sent')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (caught: any) {
      setState('error'); setError(caught.message)
    }
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-white">
        <section className="mx-auto max-w-3xl px-6 pb-10 pt-16 lg:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-accent">Talent House brands</p>
          <h1 className="site-heading mt-4 text-[38px] leading-[1.05] tracking-[-.04em] md:text-[48px]">
            Put your house in front of the people who choose it.
          </h1>
          <p className="mt-6 text-[15px] leading-8 text-secondary">
            A brand page on Talent House argues your case to spa directors, spa managers and the therapists who will
            deliver you: your proposition, why a spa stocks you, what your founder says, and how a therapist sells you
            on the floor. Fill this in and we will draft the page from your own words and come back to you before
            anything goes live.
          </p>
          {/* Said now, while it is generous, rather than later when it is an
              invoice. A brand that was never told a price existed hears the
              first one as a change of terms. */}
          <p className="mt-5 max-w-2xl border-l-2 border-accent pl-4 text-[14px] leading-7 text-ink">
            Brand pages are complimentary for our founding houses. We are choosing a small number to build this
            properly with, and those pages stay free. Later brands will be a paid listing.
          </p>
        </section>

        {state === 'sent' ? (
          <section className="mx-auto max-w-3xl px-6 pb-24">
            <div className="border border-border bg-surface p-8">
              <Check size={22} className="text-accent" />
              <h2 className="site-heading mt-4 text-[24px] tracking-[-.03em]">Thank you. We have it.</h2>
              <p className="mt-3 text-[14px] leading-7 text-secondary">
                We will draft your page from what you have written and come back to you with it before anything is
                published. Nothing appears on the site until you have seen it.
              </p>
              <Link href="/brands" className="btn-primary mt-6 inline-block text-[13px]">See the brands already listed</Link>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="mx-auto max-w-3xl space-y-10 px-6 pb-24">
            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-ink">Who you are</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Brand name"><input required value={form.brand_name} onChange={set('brand_name')} className="input-field" /></Field>
                <Field label="Website"><input value={form.website_url} onChange={set('website_url')} placeholder="https://" className="input-field" /></Field>
                <Field label="Your name"><input required value={form.contact_name} onChange={set('contact_name')} className="input-field" /></Field>
                <Field label="Your role"><input value={form.contact_role} onChange={set('contact_role')} className="input-field" /></Field>
                <Field label="Email"><input required type="email" value={form.contact_email} onChange={set('contact_email')} className="input-field" /></Field>
                <Field label="Phone"><input value={form.contact_phone} onChange={set('contact_phone')} className="input-field" /></Field>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-ink">Your case</legend>
              <Field label="Your proposition in one or two sentences" hint="This runs in large type at the top of your page. What do you do that the house next to you does not?">
                <textarea rows={3} value={form.usp} onChange={set('usp')} className="input-field resize-y leading-6" />
              </Field>
              <Field label="Why a spa should stock you" hint="The commercial case: the guest you attract, the menu you support, the retail you earn, the training behind you.">
                <textarea rows={8} value={form.why_spas} onChange={set('why_spas')} className="input-field resize-y leading-6" />
              </Field>
              <Field label="Why therapists love working on you" hint="A brand the team resents never gets retailed. What do therapists say about delivering your treatments?">
                <textarea rows={6} value={form.why_therapists_love_it} onChange={set('why_therapists_love_it')} className="input-field resize-y leading-6" />
              </Field>
              <Field label="How a therapist sells you" hint="The retail conversation on the floor: what to say, what links to what, what a treatment leads on to.">
                <textarea rows={6} value={form.how_to_sell} onChange={set('how_to_sell')} className="input-field resize-y leading-6" />
              </Field>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-ink">Your founder or director</legend>
              <Field label="Their comment" hint="A few sentences in their own voice. This is quoted on the page.">
                <textarea rows={4} value={form.director_quote} onChange={set('director_quote')} className="input-field resize-y leading-6" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Their name"><input value={form.director_name} onChange={set('director_name')} className="input-field" /></Field>
                <Field label="Their role"><input value={form.director_role} onChange={set('director_role')} className="input-field" /></Field>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-[13px] font-semibold text-ink">The detail</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Founded"><input value={form.founded} onChange={set('founded')} placeholder="2009" className="input-field" /></Field>
                <Field label="Origin" hint="Where the house and its science come from."><input value={form.origin} onChange={set('origin')} className="input-field" /></Field>
              </div>
              <Field label="Hero ingredients" hint="One per line."><textarea rows={4} value={form.hero_ingredients} onChange={set('hero_ingredients')} className="input-field resize-y leading-6" /></Field>
              <Field label="Signature treatments" hint="One per line, with durations if you have them."><textarea rows={5} value={form.signature_treatments} onChange={set('signature_treatments')} className="input-field resize-y leading-6" /></Field>
              <Field label="Spas already carrying you" hint="One per line. Named accounts do more for you than any adjective."><textarea rows={5} value={form.notable_partners} onChange={set('notable_partners')} className="input-field resize-y leading-6" /></Field>
            </fieldset>

            <div className="border border-border bg-surface p-6">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={offersMasterclass} onChange={e => setOffersMasterclass(e.target.checked)} className="mt-1" />
                <span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink"><GraduationCap size={14} className="text-accent" /> We would give the Academy a masterclass</span>
                  <span className="mt-1 block text-[12px] leading-6 text-secondary">
                    Brands that teach therapists their house get the strongest pages here, because a therapist who can
                    speak your brand fluently is the reason a spa keeps stocking it. We build the course with you.
                  </span>
                </span>
              </label>
            </div>

            <input type="text" value={company} onChange={e => setCompany(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

            {error ? <p className="text-[13px] text-red-600">{error}</p> : null}

            <div>
              <button type="submit" disabled={state === 'sending'} className="btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50">
                <Send size={14} /> {state === 'sending' ? 'Sending...' : 'Send my application'}
              </button>
              <p className="mt-3 text-[12px] leading-6 text-muted">
                Nothing is published without your approval. Leave anything blank and we will ask you about it.
              </p>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}
