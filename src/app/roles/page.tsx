import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import PublicRolesBrowser from '@/components/PublicRolesBrowser'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatSalary } from '@/lib/money'
import { countryName, isUnitedKingdom } from '@/lib/countries'

export const revalidate = 180

function overseasLocation(town: string | null | undefined, country: string | null | undefined): string {
  const place = String(town || '').trim()
  if (isUnitedKingdom(country)) return place
  const named = countryName(country)
  if (!named) return place
  // A property that typed "Hong Kong" into the town box should not read
  // "Hong Kong, Hong Kong".
  if (!place || place.toLowerCase() === named.toLowerCase()) return named
  return `${place}, ${named}`
}

async function getPublicRoles() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('job_listings')
      .select('id,job_title,job_description,location,country_code,salary_min,salary_max,salary_currency,contract_type,job_type,tier,required_brands,posted_date,is_live')
      .eq('is_live', true)
      .order('posted_date', { ascending: false })
      .limit(150)

    if (error) return []

    return (data || []).map((job: any) => ({
      id: job.id,
      title: job.job_title || job.title || 'Hospitality opportunity',
      description: job.job_description || job.description || '',
      // The country is appended only when it is not the UK. On a board that is
      // still mostly British, "Harrogate, United Kingdom" on every card is
      // noise - and noise is what stops "Male, Maldives" standing out, which
      // is the whole reason for showing a country at all.
      location: overseasLocation(job.location, job.country_code),
      salary: formatSalary(job.salary_min, job.salary_max, job.salary_currency) || 'Competitive',
      contract_type: job.contract_type || '',
      job_type: job.job_type || '',
      tier: job.tier || 'Standard',
      required_brands: job.required_brands || [],
    }))
  } catch {
    return []
  }
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
            <p className="text-[15px] md:text-[16px] leading-7 text-secondary max-w-2xl">See the opportunities before you commit. We show enough to help you decide whether a role is worth exploring, while the property identity and full brief stay private until you create a free Talent profile.</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-muted">
              <span>No account needed to browse</span>
              <span>Property identity protected</span>
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
