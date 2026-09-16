// The live roles, read on the server.
//
// This query lived inside /roles and nowhere else, which is why /jobs - the
// first item in the navigation and the highest-priority URL in the sitemap -
// served a crawler nothing but the words "Loading live roles...". Both pages
// now read from here, so there is one definition of what "a live role" means
// rather than two that drift.

import { createAdminClient } from '@/lib/supabase/admin'
import { formatSalary } from '@/lib/money'
import { countryName, isUnitedKingdom } from '@/lib/countries'

export type PublicRole = {
  id: string
  title: string
  description: string
  location: string
  salary: string
  contract_type: string
  job_type: string
  tier: string
  required_brands: string[]
  posted_date: string | null
  company_name: string
}

export function overseasLocation(town: string | null | undefined, country: string | null | undefined): string {
  const place = String(town || '').trim()
  if (isUnitedKingdom(country)) return place
  const named = countryName(country)
  if (!named) return place
  // A property that typed "Hong Kong" into the town box should not read
  // "Hong Kong, Hong Kong".
  if (!place || place.toLowerCase() === named.toLowerCase()) return named
  return `${place}, ${named}`
}

export async function getPublicRoles(limit = 150): Promise<PublicRole[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('job_listings')
      .select('id,job_title,job_description,location,country_code,salary_min,salary_max,salary_currency,contract_type,job_type,tier,required_brands,posted_date,is_live,employer_profiles(company_name,property_name)')
      // An advert is paid for by the month, and nothing ever takes one down: no
      // scheduled job flips is_live, and the admin health check already counts
      // "live but expired" as a warning. The public jobs list filters expiry
      // inside get_public_jobs_page; these two did not, so a term that had run
      // out stayed visible and clickable, and Repost had no purpose.
      .eq('is_live', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('posted_date', { ascending: false })
      .limit(limit)

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
      posted_date: job.posted_date || null,
      company_name: job.employer_profiles?.property_name || job.employer_profiles?.company_name || '',
    }))
  } catch {
    return []
  }
}
