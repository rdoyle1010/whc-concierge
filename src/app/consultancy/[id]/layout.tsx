import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { OG_DEFAULTS } from '@/lib/og-defaults'
import { SITE_URL } from '@/lib/site-url'

// A title per consultant, rather than one title for all of them.
//
// This page is a client component and had no layout beside it, so every
// consultancy profile inherited the directory's title. Google saw a set of
// pages all called "Spa Consultants and Wellness Advisers", competing with each
// other and describing none of themselves - which is the same failure the
// Journal had before its posts got their own metadata.
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const fallback = { title: 'Spa Consultant | Talent House Collective' }

  try {
    const { data } = await createAdminClient()
      .from('consultancy_profiles')
      .select('practice_name, headline, specialisms, based_in, is_live, approval_status')
      .eq('id', id)
      .maybeSingle()

    // Only a published, approved practice gets a page of its own. Anything else
    // keeps the generic title rather than leaking a name that is not live.
    if (!data || data.is_live !== true || data.approval_status !== 'approved') return fallback

    const name = String(data.practice_name || '').trim()
    if (!name) return fallback

    // The first specialism is what this practice is actually known for, so it
    // is the words somebody would search. "Spa Consultant" is the fallback.
    const specialism = (Array.isArray(data.specialisms) ? data.specialisms : [])
      .map(value => String(value || '').trim()).filter(Boolean)[0]
    const where = String(data.based_in || '').trim()
    const title = specialism ? `${name} | ${specialism} Consultant` : `${name} | Spa Consultant`
    const description = String(data.headline || '').trim()
      || `${name}${where ? `, ${where}` : ''}: an independent spa and wellness consultancy on Talent House Collective.`

    return {
      title,
      description: description.length > 155 ? `${description.slice(0, 152).replace(/\s\S*$/, '')}...` : description,
      alternates: { canonical: `${SITE_URL}/consultancy/${id}` },
      openGraph: { ...OG_DEFAULTS, title, description, url: `${SITE_URL}/consultancy/${id}` },
      twitter: { card: 'summary_large_image', title, description },
    }
  } catch {
    // A metadata read must never take the page down with it.
    return fallback
  }
}

export default function ConsultancyProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
