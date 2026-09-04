import { supabase } from './supabase'

// The website re-checks assurance level on every protected page and every API
// call. The app previously checked it once, on the login screen, as a
// client-side redirect - so force-quitting at the code screen left a live aal1
// session that every direct-Supabase screen would then serve. This is the
// equivalent root check: it runs on launch, on every return to the foreground
// and on every auth state change, so there is no window in which an
// unverified session renders account data.
export type MfaRequirement = {
  required: boolean
  factorId?: string
  role?: string
}

const NOT_REQUIRED: MfaRequirement = { required: false }

export async function mfaRequirement(): Promise<MfaRequirement> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData?.session) return NOT_REQUIRED

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    // A network failure must not throw the user out of the app - the server
    // enforces the same rule on every API call, so a transient unknown here
    // degrades to "carry on" rather than "sign out".
    if (assuranceError || !assurance) return NOT_REQUIRED
    if (assurance.nextLevel !== 'aal2' || assurance.currentLevel === 'aal2') return NOT_REQUIRED

    const { data: factors } = await supabase.auth.mfa.listFactors()
    const verified = (factors?.totp || []).find((factor: any) => factor?.status === 'verified')
    if (!verified) return NOT_REQUIRED

    let role: string | undefined
    try {
      const userId = sessionData.session.user?.id
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
        role = profile?.role || undefined
      }
    } catch { }

    return { required: true, factorId: verified.id, role }
  } catch {
    return NOT_REQUIRED
  }
}
