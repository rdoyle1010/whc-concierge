import { supabase } from './supabase'

type TalentUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, any>
}

export async function ensureTalentRecords(user: TalentUser, fullName?: string) {
  const email = String(user.email || '').trim().toLowerCase()
  if (!email) throw new Error('Your account is missing an email address.')

  const { data: existingProfile, error: profileReadError } = await supabase
    .from('profiles')
    .select('id,role,full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileReadError) throw profileReadError
  if (existingProfile?.role === 'employer' || existingProfile?.role === 'admin') {
    return { role: existingProfile.role, createdProfile: false, createdCandidate: false }
  }

  const resolvedName = String(
    fullName || existingProfile?.full_name || user.user_metadata?.full_name || ''
  ).trim() || null

  let createdProfile = false
  if (!existingProfile) {
    const { error: profileInsertError } = await supabase.from('profiles').insert({
      id: user.id,
      email,
      role: 'talent',
      full_name: resolvedName,
    })
    if (profileInsertError) throw profileInsertError
    createdProfile = true
  }

  const { data: existingCandidate, error: candidateReadError } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (candidateReadError) throw candidateReadError

  let createdCandidate = false
  if (!existingCandidate) {
    const { error: candidateInsertError } = await supabase.from('candidate_profiles').insert({
      user_id: user.id,
      full_name: resolvedName,
      work_email: email,
      membership_tier: 'free',
    })
    if (candidateInsertError) throw candidateInsertError
    createdCandidate = true
  }

  return { role: 'talent' as const, createdProfile, createdCandidate }
}
