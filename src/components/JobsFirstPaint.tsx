import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { PublicRole } from '@/lib/public-roles-server'

// What a crawler, and a visitor with no JavaScript yet, actually receive.
//
// /jobs is a client page whose subtree reads useSearchParams, so it bails out
// of prerendering and this is the whole of the static document. It used to be
// an h1 and the words "Loading live roles..." - no title, no salary, no link
// to a single advert. Indeed and LinkedIn server-render their listings; this
// page was competing with them using a loading state.
//
// It renders the same heading and the same roles as the live page, then the
// interactive browser replaces it once JavaScript boots. Nothing here is
// interactive on purpose: every role is a plain link a crawler can follow.
export default function JobsFirstPaint({ roles }: { roles: PublicRole[] }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main id="main-content">
        <section className="pt-[76px] bg-white border-b border-border">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
            <p className="public-eyebrow mb-4">Open positions</p>
            <h1 className="public-title mb-4">Live roles at exceptional properties.</h1>
            <p className="text-[15px] text-secondary max-w-[58ch]">Matched on real skills, qualifications and product houses - not CV keywords. Every property here has been approved by hand before its role went live.</p>
          </div>
        </section>
        <section className="py-12">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            {roles.length === 0 ? (
              <div className="border border-border bg-white p-10 md:p-14">
                <p className="public-eyebrow mb-4">Nothing live</p>
                <h2 className="text-[22px] font-serif text-ink mb-3">No roles are live right now.</h2>
                <p className="text-[14px] leading-relaxed text-secondary max-w-[54ch] mb-7">Roles appear the moment an approved property publishes one. The Journal and the market data are worth a look in the meantime.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/intelligence" className="btn-secondary">See what the market is paying</Link>
                  <Link href="/register/talent" className="btn-primary">Get alerted when one opens</Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Live roles</p>
                  <p className="mt-1 text-[13px] text-secondary">{roles.length === 1 ? '1 role' : `${roles.length} roles`} open at approved luxury spa and wellness properties.</p>
                </div>
                <div className="border-x border-b border-t border-border bg-white px-6 md:px-8">
                  {roles.map(role => (
                    <div key={role.id} className="border-b border-border py-6 last:border-b-0">
                      <h2 className="text-[20px] md:text-[23px] font-serif font-semibold tracking-tight text-ink">
                        <Link href={`/jobs/${role.id}`}>{role.title}</Link>
                      </h2>
                      <p className="mt-1.5 text-[13px] leading-6 text-secondary">
                        {[role.company_name, role.location, role.salary, role.job_type].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
