import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { INDUSTRY_GROUPS, INDUSTRY_SECTIONS, type IndustryBody, type IndustryGroup } from '@/lib/industry-bodies'

// Good to Know, read from the database with the shipped page as the seed.
//
// The fallback is deliberate and it is not a safety net: until somebody has
// imported the page into the editor, the entries in code ARE the page, and a
// reference page going blank because a table is empty would be the worst
// possible failure for the one page whose value is being right.

export const GOOD_TO_KNOW_CACHE_TAG = 'good-to-know'

export function normaliseBody(row: any): IndustryBody {
  return {
    name: String(row?.name || '').trim(),
    shortName: String(row?.short_name || '').trim() || undefined,
    url: String(row?.url || '').trim(),
    image: String(row?.image_url || '').trim() || undefined,
    what: String(row?.what || '').trim(),
    whyItMatters: String(row?.why_it_matters || '').trim(),
    whyWeRateIt: String(row?.why_we_rate_it || '').trim(),
    whySpasValueIt: String(row?.why_spas_value_it || '').trim(),
    tags: Array.isArray(row?.tags) ? row.tags.map((tag: unknown) => String(tag)) : [],
  }
}

async function readGroups(): Promise<IndustryGroup[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('industry_bodies')
      .select('id,section,name,short_name,url,image_url,what,why_it_matters,why_we_rate_it,why_spas_value_it,tags,sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    // No table yet, or nobody has imported the page: the code is the page.
    if (error || !data || data.length === 0) return INDUSTRY_GROUPS

    const groups = INDUSTRY_SECTIONS.map(section => ({
      id: section.id,
      title: section.title,
      intro: section.intro,
      bodies: data.filter((row: any) => row.section === section.id).map(normaliseBody).filter(entry => entry.name && entry.url),
    })).filter(group => group.bodies.length > 0)

    return groups.length ? groups : INDUSTRY_GROUPS
  } catch {
    return INDUSTRY_GROUPS
  }
}

// An hour, and a tag. The tag is what makes an edit land: the admin route
// revalidates it the moment something is saved, so nothing waits on the number.
const cached = unstable_cache(readGroups, ['good-to-know-groups-v1'], {
  revalidate: 3600,
  tags: [GOOD_TO_KNOW_CACHE_TAG],
})

export async function getIndustryGroups(): Promise<IndustryGroup[]> {
  return cached()
}
