import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated
    const cookieStore = cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Get user role to determine which tables to clean
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    // Delete user data based on role
    if (role === 'talent') {
      const { data: candProfile } = await admin
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (candProfile) {
        const cid = candProfile.id
        // Remove taxonomy joins
        await admin.from('candidate_skills').delete().eq('candidate_id', cid)
        await admin.from('candidate_systems').delete().eq('candidate_id', cid)
        await admin.from('candidate_product_houses').delete().eq('candidate_id', cid)
        await admin.from('candidate_certifications').delete().eq('candidate_id', cid)
        await admin.from('candidate_hotel_brands').delete().eq('candidate_id', cid)
        // Remove applications, swipes, matches
        await admin.from('applications').delete().eq('candidate_id', cid)
        await admin.from('swipes').delete().eq('candidate_id', cid)
        await admin.from('matches').delete().eq('candidate_id', cid)
        // Remove the candidate profile
        await admin.from('candidate_profiles').delete().eq('id', cid)
      }
    }
    if (role === 'employer') {
      const { data: empProfile } = await admin
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (empProfile) {
        const eid = empProfile.id
        const { data: jobs } = await admin.from('job_listings').select('id').eq('employer_id', eid)
        const jobIds = (jobs || []).map(j => j.id)

        if (jobIds.length > 0) {
          await admin.from('job_required_skills').delete().in('job_id', jobIds)
          await admin.from('job_preferred_skills').delete().in('job_id', jobIds)
          await admin.from('job_required_systems').delete().in('job_id', jobIds)
          await admin.from('job_required_product_houses').delete().in('job_id', jobIds)
          await admin.from('job_required_certifications').delete().in('job_id', jobIds)
          await admin.from('applications').delete().in('job_id', jobIds)
          await admin.from('job_listings').delete().eq('employer_id', eid)
        }
        await admin.from('employer_profiles').delete().eq('id', eid)
      }
    }

    // Clean shared tables
    await admin.from('messages').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    await admin.from('reviews').delete().or(`reviewer_id.eq.${user.id},reviewed_id.eq.${user.id}`)

    // Remove profiles row
    await admin.from('profiles').delete().eq('id', user.id)

    // Finally, delete the auth user
    await admin.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
