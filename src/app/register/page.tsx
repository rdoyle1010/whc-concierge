import { redirect } from 'next/navigation'

export default async function RegisterRedirectPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const role = params.role === 'employer' ? 'employer' : 'talent'
  const requested = typeof params.redirect === 'string' ? params.redirect : ''
  const safeRedirect = requested.startsWith('/') && !requested.startsWith('//') ? requested : ''

  redirect(`/register/${role}${safeRedirect ? `?redirect=${encodeURIComponent(safeRedirect)}` : ''}`)
}
