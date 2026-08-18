import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { toPublicResidencyProfile } from '@/lib/residency-public'

export const revalidate = 60

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient()
    const id = req.nextUrl.searchParams.get('id')

    let query = admin.from('residency_profiles')
      .select('id,bio,full_name,primary_specialism,secondary_specialisms,qualifications,brand_experience,current_location,will_travel_to,preferred_duration,day_rate,weekly_rate,monthly_rate,negotiable,available_from,years_experience,is_featured,approval_status,candidate_profile_id,created_at')
      .eq('approval_status', 'approved')

    if (id) query = query.eq('id', id)
    else query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })

    const { data: profiles, error } = await query
    if (error) return NextResponse.json({ error: 'Unable to load Residency specialists.' }, { status: 500 })

    const rows = profiles || []
    if (!rows.length) return NextResponse.json(id ? { profile: null } : { profiles: [] })

    const candidateIds = Array.from(new Set(rows.map((row: any) => row.candidate_profile_id).filter(Boolean)))
    const { data: candidates } = candidateIds.length
      ? await admin.from('candidate_profiles').select('id,residency_member,residency_subscription_status').in('id', candidateIds)
      : { data: [] as any[] }

    const active = new Set((candidates || [])
      .filter((candidate: any) => candidate.residency_member === true && ['active', 'trialing'].includes(candidate.residency_subscription_status || 'active'))
      .map((candidate: any) => candidate.id))

    const visible = rows
      .filter((row: any) => active.has(row.candidate_profile_id))
      .map(toPublicResidencyProfile)

    return NextResponse.json(id ? { profile: visible[0] || null } : { profiles: visible }, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('Public Residency directory failed:', error)
    return NextResponse.json({ error: 'Unable to load Residency specialists.' }, { status: 500 })
  }
}
