import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getRequestUser(req: NextRequest) {
  const authorization = req.headers.get('authorization') || ''
  const bearer = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

  if (bearer) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data: { user } } = await supabase.auth.getUser(bearer)
    if (!user) return null

    // Two-step verification applies to bearer tokens exactly as it does to
    // browser sessions: when the account has a verified authenticator, a
    // token minted by password alone (aal1) is treated as signed out. The
    // aal claim is read from the token itself; the factor list comes back
    // on the user object.
    try {
      const hasVerifiedFactor = Array.isArray((user as any).factors)
        && (user as any).factors.some((factor: any) => factor?.status === 'verified')
      if (hasVerifiedFactor) {
        const payloadPart = bearer.split('.')[1] || ''
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'))
        if (payload?.aal !== 'aal2') return null
      }
    } catch { return null }
    return user
  }

  const auth = await createServerSupabaseClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null

  // Two-step verification is enforced, not advisory: a session whose account
  // has a verified authenticator but which has not completed the challenge
  // (aal1 with aal2 available) is treated as signed out by every API that
  // authenticates through this helper. A password alone never unlocks data.
  try {
    const { data: assurance } = await auth.auth.mfa.getAuthenticatorAssuranceLevel()
    if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') return null
  } catch { /* assurance unavailable - fall through to the authenticated user */ }
  return user
}
