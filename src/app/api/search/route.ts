import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseAccountRole } from '@/lib/role-access'
import { getRequestUser } from '@/lib/request-user'
import { ACADEMY } from '@/lib/academy'
import { isMissingColumnError } from '@/lib/private-mode'

export const dynamic = 'force-dynamic'

// Universal search: one query across jobs, people, employers, courses and
// articles. People are gated exactly like the agency directory - approved
// employer (or admin) viewers only, approved and visible candidates only,
// minus any candidate who has blocked that employer. No location, contact
// or compliance fields ever leave this route.

const RESULT_CAP = 5

type SearchResult = {
  type: 'job' | 'person' | 'employer' | 'course' | 'article' | 'agency'
  title: string
  subtitle: string
  href: string
}

// Terms that suggest the viewer is looking for agency cover rather than a
// permanent hire.
const AGENCY_TERMS = [
  'cover', 'shift', 'shifts', 'agency', 'therapist', 'therapists', 'urgent',
  'massage', 'freelance', 'temp', 'temporary', 'locum', 'today', 'tomorrow',
  'weekend', 'available', 'availability',
]

// Split the query into terms safe to embed in a PostgREST or() filter.
// Commas, parentheses and ilike wildcards are stripped rather than escaped.
function toTerms(query: string): string[] {
  return query
    .split(/\s+/)
    .map(term => term.replace(/[%_,().\\]/g, '').trim())
    .filter(Boolean)
    .slice(0, 6)
}

// Every term must match at least one of the given columns.
function applyTermFilters(query: any, terms: string[], columns: string[]) {
  let q = query
  for (const term of terms) {
    q = q.or(columns.map(column => `${column}.ilike.%${term}%`).join(','))
  }
  return q
}

async function safeRows(promise: PromiseLike<{ data: any[] | null; error: any }>): Promise<any[]> {
  try {
    const { data, error } = await promise
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

function displayName(fullName: string | null, firstNameOnly: boolean): string {
  const name = (fullName || '').trim()
  if (!name) return 'WHC professional'
  if (!firstNameOnly) return name
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

function joinParts(...parts: (string | null | undefined)[]): string {
  return parts.map(part => (part || '').trim()).filter(Boolean).join(' · ')
}

function formatSalary(min: number | null, max: number | null): string {
  const fmt = (value: number) => `£${Math.round(value).toLocaleString('en-GB')}`
  if (min && max) return min === max ? fmt(min) : `${fmt(min)} - ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  if (max) return `Up to ${fmt(max)}`
  return ''
}

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit(req as unknown as Request, 'search-public', { windowMs: 60_000, maxRequests: 40 })
  if (limited) return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } })

  const raw = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80)
  if (raw.length < 2) return NextResponse.json({ results: [], counts: {} })
  const terms = toTerms(raw)
  if (terms.length === 0) return NextResponse.json({ results: [], counts: {} })

  const admin = createAdminClient()

  // Resolve the viewer. Search itself is public; only people (and the agency
  // shortcut) require an approved employer or admin viewer.
  const user = await getRequestUser(req).catch(() => null)
  let role: ReturnType<typeof normaliseAccountRole> = null
  let employerId: string | null = null
  if (user) {
    const [{ data: account }, { data: employer }] = await Promise.all([
      admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      admin.from('employer_profiles').select('id, approval_status').eq('user_id', user.id).maybeSingle(),
    ])
    role = normaliseAccountRole(account?.role)
    if (role === 'employer' && employer?.approval_status === 'approved') employerId = employer.id
  }
  const isAdmin = role === 'admin'
  const canSeePeople = isAdmin || (role === 'employer' && employerId != null)

  const jobsQuery = applyTermFilters(
    admin.from('job_listings')
      .select('id, job_title, location, required_role_level, salary_min, salary_max')
      .eq('is_live', true)
      .eq('status', 'active'),
    terms,
    ['job_title', 'location', 'required_role_level', 'sector'],
  ).limit(RESULT_CAP)

  const employersQuery = applyTermFilters(
    admin.from('employer_profiles')
      .select('id, property_name, company_name, location, city')
      .eq('approval_status', 'approved'),
    terms,
    ['property_name', 'company_name', 'location', 'city'],
  ).limit(RESULT_CAP)

  const articlesQuery = applyTermFilters(
    admin.from('blog_posts')
      .select('id, slug, title, excerpt, category')
      .eq('status', 'published'),
    terms,
    ['title', 'excerpt', 'category'],
  ).limit(RESULT_CAP)

  // People: over-fetch so block filtering cannot leak a shortfall into the cap.
  // private_mode (20260831190000) may not exist in the live database yet, so
  // the select retries without it rather than losing people results entirely.
  const buildPeopleQuery = (fields: string) => applyTermFilters(
    admin.from('candidate_profiles')
      .select(fields)
      .eq('approval_status', 'approved')
      .or('profile_visible.eq.true,profile_visible.is.null'),
    terms,
    ['full_name', 'headline', 'role_level', 'location'],
  ).limit(RESULT_CAP * 4)

  const PEOPLE_FIELDS = 'id, full_name, headline, role_level, location, show_first_name_only, approval_status, profile_visible, stealth_mode'
  const peopleQuery = canSeePeople
    ? (async () => {
        let result = await buildPeopleQuery(`${PEOPLE_FIELDS}, private_mode`)
        if (isMissingColumnError(result.error)) result = await buildPeopleQuery(PEOPLE_FIELDS)
        return result
      })()
    : Promise.resolve({ data: [] as any[], error: null })

  const blocksQuery = canSeePeople && employerId
    ? admin.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', employerId)
    : Promise.resolve({ data: [] as any[], error: null })

  const [jobRows, employerRows, articleRows, peopleRows, blockRows] = await Promise.all([
    safeRows(jobsQuery),
    safeRows(employersQuery),
    safeRows(articlesQuery),
    safeRows(peopleQuery),
    safeRows(blocksQuery),
  ])

  const jobs: SearchResult[] = jobRows.map((row: any) => ({
    type: 'job',
    title: row.job_title || 'Role',
    subtitle: joinParts(row.location, row.required_role_level, formatSalary(row.salary_min, row.salary_max)),
    href: `/jobs/${row.id}`,
  }))

  const blockedIds = new Set(blockRows.map((row: any) => row.candidate_id))
  const people: SearchResult[] = peopleRows
    .filter((row: any) => row.approval_status === 'approved' && row.profile_visible !== false && row.stealth_mode !== true && !blockedIds.has(row.id))
    .slice(0, RESULT_CAP)
    .map((row: any) => ({
      type: 'person',
      title: displayName(row.full_name, row.show_first_name_only === true || row.private_mode === true),
      subtitle: joinParts(row.role_level, row.location) || row.headline || '',
      href: `/employer/candidates?candidate=${row.id}`,
    }))

  const employers: SearchResult[] = employerRows.map((row: any) => ({
    type: 'employer',
    title: row.property_name || row.company_name || 'Property',
    subtitle: joinParts(row.location || row.city, row.property_name && row.company_name && row.company_name !== row.property_name ? row.company_name : null),
    href: `/properties/${row.id}`,
  }))

  // Courses live in code, not the database. There is no public per-course
  // route, so members deep-link into the course and everyone else lands on
  // the public catalogue.
  const haystack = (course: { title: string; tagline: string; slug: string; category: string }) =>
    `${course.title} ${course.tagline} ${course.slug} ${course.category}`.toLowerCase()
  const courses: SearchResult[] = ACADEMY
    .filter(course => {
      const text = haystack(course)
      return terms.every(term => text.includes(term.toLowerCase()))
    })
    .slice(0, RESULT_CAP)
    .map(course => ({
      type: 'course',
      title: course.title,
      subtitle: joinParts(course.category, `${course.minutes} minutes`),
      href: role === 'candidate' ? `/talent/academy/${course.slug}` : '/academy#courses',
    }))

  const articles: SearchResult[] = articleRows.map((row: any) => ({
    type: 'article',
    title: row.title || 'Article',
    subtitle: joinParts(row.category) || (row.excerpt ? String(row.excerpt).slice(0, 90) : ''),
    href: `/blog/${row.slug}`,
  }))

  const agency: SearchResult[] = []
  if (canSeePeople) {
    const agencyIntent = terms.some(term => AGENCY_TERMS.includes(term.toLowerCase()))
    if (agencyIntent || people.length > 0) {
      agency.push({
        type: 'agency',
        title: 'Search agency cover',
        subtitle: 'Available professionals by date, hours and distance',
        href: '/agency',
      })
    }
  }

  const results = [...jobs, ...people, ...employers, ...courses, ...articles, ...agency]
  return NextResponse.json({
    results,
    counts: {
      jobs: jobs.length,
      people: people.length,
      employers: employers.length,
      courses: courses.length,
      articles: articles.length,
      agency: agency.length,
    },
  })
}
