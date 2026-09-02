import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Regenerated hourly. A sitemap built once at deploy would list a role that
// closed three weeks ago and miss every one posted since.
export const revalidate = 3600

const BASE = 'https://talenthousecollective.co.uk'

type Entry = MetadataRoute.Sitemap[number]

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Every dynamic section is independently fallible. A sitemap that returns 500
// because one query timed out is worse than one missing a section, so each
// block answers with an empty list rather than throwing.
async function safely(load: () => Promise<Entry[]>): Promise<Entry[]> {
  try {
    return await load()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // The public surface. /roles, /academy, /intelligence, /advertise,
  // /testimonials, /faq and /how-to-use were all live and all absent from
  // this file, so nothing pointed a crawler at them.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/jobs`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/roles`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/agency`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/residency`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/properties`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/specialisms`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/academy`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/intelligence`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/advertise`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/testimonials`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/how-to-use`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/register/talent`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/register/employer`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  const supabase = client()
  if (!supabase) return staticPages

  // Live roles. The filter matches the one the role page itself applies, so
  // the sitemap can never advertise a URL that answers with a 404.
  const roles = safely(async () => {
    const { data } = await supabase
      .from('job_listings')
      .select('id, posted_date, expires_at')
      .eq('is_live', true)
      .eq('status', 'active')
      .order('posted_date', { ascending: false })
      .limit(2000)
    const today = new Date()
    return (data ?? [])
      .filter(row => !row.expires_at || new Date(row.expires_at) > today)
      .map(row => ({
        url: `${BASE}/jobs/${row.id}`,
        lastModified: row.posted_date ? new Date(row.posted_date) : now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
  })

  // Approved properties. These are the pages that carry a spa's name, its
  // location and its treatment menu, which is what somebody searching for
  // that spa by name actually wants to land on.
  const properties = safely(async () => {
    const { data } = await supabase
      .from('employer_profiles')
      .select('id, created_at')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(2000)
    return (data ?? []).map(row => ({
      url: `${BASE}/properties/${row.id}`,
      lastModified: row.created_at ? new Date(row.created_at) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  })

  const posts = safely(async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, created_at, updated_at, published_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1000)
    return (data ?? [])
      .filter(row => Boolean(row.slug))
      .map(row => ({
        url: `${BASE}/blog/${row.slug}`,
        lastModified: new Date(row.updated_at || row.published_at || row.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
  })

  const dynamic = await Promise.all([roles, properties, posts])
  return [...staticPages, ...dynamic.flat()]
}
