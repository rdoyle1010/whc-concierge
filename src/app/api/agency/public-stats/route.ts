import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// Public by design: aggregate counts only, for the signed-out /agency
// marketing page. No names, rates, locations or any per-profile data ever
// leave this route - just three integers, cached for five minutes.
//
// "On the register" mirrors the directory's own listing rule: agency_available,
// approved, and either no agency_listed_until or one still in the future.
// Agency Ready is not computable without exposing raw compliance fields, so
// the page states WHC Verified and Insured counts instead.

const readPublicStats = unstable_cache(async () => {
  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const onRegister = () => admin
    .from('candidate_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'approved')
    .eq('agency_available', true)
    .or(`agency_listed_until.is.null,agency_listed_until.gte.${nowIso}`)

  const [registerRes, verifiedRes, insuredRes] = await Promise.all([
    onRegister(),
    onRegister().eq('whc_verified', true),
    onRegister().eq('has_insurance', true),
  ])
  if (registerRes.error || verifiedRes.error || insuredRes.error) throw new Error('stats unavailable')
  return {
    professionals: registerRes.count || 0,
    whc_verified: verifiedRes.count || 0,
    insured: insuredRes.count || 0,
  }
}, ['agency-public-stats-v1'], { revalidate: 300 })

export async function GET() {
  try {
    return NextResponse.json(await readPublicStats())
  } catch {
    // The marketing page simply omits the numbers when counts are unavailable.
    return NextResponse.json({ professionals: 0, whc_verified: 0, insured: 0 })
  }
}
