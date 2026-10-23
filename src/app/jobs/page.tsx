import { Suspense } from 'react'
import JobsBrowser from './JobsBrowser'
import JobsFirstPaint from '@/components/JobsFirstPaint'
import { getPublicRoles } from '@/lib/public-roles-server'

// The static document for /jobs now carries the roles.
//
// The browser below reads useSearchParams, which makes its whole subtree bail
// out of prerendering - so whatever sits in this Suspense fallback is the
// entire HTML a crawler receives. It used to be an h1 and "Loading live
// roles...". This page is the first item in the navigation and the highest
// priority URL in the sitemap, and it was competing with Indeed using a
// loading state.
//
// The fallback is rendered on the server with the real roles in it, so the
// document has every job title, salary and link before a line of JavaScript
// runs. The interactive browser takes over on hydration and nothing about it
// changed.
export const revalidate = 3600

export default async function PublicJobsPage() {
  const roles = await getPublicRoles()
  return (
    <Suspense fallback={<JobsFirstPaint roles={roles} />}>
      <JobsBrowser />
    </Suspense>
  )
}
