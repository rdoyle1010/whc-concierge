import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import PublicRolesBrowser from '@/components/PublicRolesBrowser'
import { getPublicRoles } from '@/lib/public-roles-server'

export const revalidate = 180

import type { Metadata } from 'next'
import { OG_DEFAULTS } from '@/lib/og-defaults'

export const metadata: Metadata = {
  title: { absolute: 'Browse UK Spa & Wellness Roles | Talent House' },
  description: 'Browse luxury spa, wellness and hospitality roles across the UK without applying. See what is out there before you decide anything.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/roles' },
  openGraph: {
    ...OG_DEFAULTS,
    title: 'Browse UK Spa & Wellness Roles | Talent House',
    description: 'Browse luxury spa, wellness and hospitality roles across the UK without applying. See what is out there before you decide anything.',
  },
  twitter: { card: 'summary_large_image', title: 'Browse UK Spa & Wellness Roles | Talent House', description: 'Browse luxury spa, wellness and hospitality roles across the UK without applying. See what is out there before you decide anything.' },
}

export default async function BrowseRolesPage() {
  const jobs = await getPublicRoles()

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main-content">

      <section className="pt-[76px] bg-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-accent mb-3">Luxury spa & hospitality careers</p>
            <h1 className="text-[38px] md:text-[54px] font-semibold text-ink tracking-[-0.04em] leading-[1.02] mb-4">Browse first. Decide later.</h1>
            <p className="text-[15px] md:text-[16px] leading-7 text-secondary max-w-2xl">See the opportunities before you commit. Every brief is open to read without an account. Creating a free Talent profile is what adds your personal match score against each one.</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-muted">
              <span>No account needed to browse</span>
              <span>Full brief on every role</span>
              <span>Personal match after sign-in</span>
            </div>
          </div>
        </div>
      </section>

      <SponsoredAd placement="jobs_talent_sponsor" />
      <PublicRolesBrowser jobs={jobs} />
      </main>
      <Footer />
    </div>
  )
}
