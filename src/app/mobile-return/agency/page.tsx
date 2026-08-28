'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

const ALLOWED = new Set(['success', 'cancelled', 'billing'])

export default function AgencyMobileReturnPage() {
  const params = useSearchParams()
  const status = ALLOWED.has(params.get('status') || '') ? String(params.get('status')) : 'billing'
  const deepLink = useMemo(() => `whctalent://agency-account?status=${encodeURIComponent(status)}`, [status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(deepLink)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [deepLink])

  const heading = status === 'success'
    ? 'Agency membership confirmed'
    : status === 'cancelled'
      ? 'Agency checkout cancelled'
      : 'Returning to Agency billing'
  const copy = status === 'success'
    ? 'Your payment has been received. Return to the Wellness House Talent app to refresh your Agency status.'
    : status === 'cancelled'
      ? 'No payment was taken. Return to the app when you are ready to continue.'
      : 'Return to the Wellness House Talent app to continue managing your Agency subscription.'

  return <main className="min-h-screen bg-[#f5f7f8] px-5 py-16 text-[#173246]">
    <section className="mx-auto max-w-lg border border-[#dce3e7] bg-white p-7 sm:p-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71808a]">Wellness House Talent</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight text-[#092b45]">{heading}</h1>
      <p className="mt-5 text-sm leading-6 text-[#66747c]">{copy}</p>
      <a href={deepLink} className="mt-8 block bg-[#092b45] px-5 py-4 text-center text-sm font-semibold text-white">Open the Talent app</a>
      <p className="mt-4 text-center text-xs leading-5 text-[#8a969d]">The app should open automatically. Use the button if your browser blocks it.</p>
    </section>
  </main>
}
