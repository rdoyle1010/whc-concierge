import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

export const dynamic = 'force-dynamic'

// Private Career Mode blocklist manager. Candidates search approved employer
// profiles by name and add or remove rows in profile_blocks - the same table
// already enforced across the employer talent directory, universal search and
// the agency register, so a block here removes the profile everywhere.

async function getCandidate(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return { user: null, candidate: null }
  const admin = createAdminClient()
  const { data: candidate } = await admin.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
  return { user, candidate, admin }
}

export async function GET(req: NextRequest) {
  const { user, candidate, admin } = await getCandidate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!candidate || !admin) return NextResponse.json({ error: 'Only professionals can manage a blocklist' }, { status: 403 })

  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 80).replace(/[%_,().\\]/g, '')

  const [{ data: blockRows }, { data: searchRows }] = await Promise.all([
    admin.from('profile_blocks').select('id, blocked_employer_id').eq('candidate_id', candidate.id),
    q.length >= 2
      ? admin.from('employer_profiles')
          .select('id, property_name, company_name, location, city')
          .eq('approval_status', 'approved')
          .or(`property_name.ilike.%${q}%,company_name.ilike.%${q}%`)
          .order('property_name')
          .limit(8)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const blockedIds = (blockRows || []).map((row: any) => row.blocked_employer_id).filter(Boolean)
  const { data: blockedEmployers } = blockedIds.length
    ? await admin.from('employer_profiles').select('id, property_name, company_name').in('id', blockedIds)
    : { data: [] as any[] }
  const nameById = new Map((blockedEmployers || []).map((row: any) => [row.id, row.property_name || row.company_name || 'Employer']))

  return NextResponse.json({
    blocks: (blockRows || []).map((row: any) => ({
      id: row.id,
      employer_id: row.blocked_employer_id,
      name: nameById.get(row.blocked_employer_id) || 'Employer',
    })),
    results: (searchRows || [])
      .filter((row: any) => !blockedIds.includes(row.id))
      .map((row: any) => ({
        id: row.id,
        name: row.property_name || row.company_name || 'Employer',
        location: row.location || row.city || null,
      })),
  })
}

export async function POST(req: NextRequest) {
  const { user, candidate, admin } = await getCandidate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!candidate || !admin) return NextResponse.json({ error: 'Only professionals can manage a blocklist' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const employerId = typeof body.employerId === 'string' ? body.employerId : ''
  const action = body.action
  if (!employerId || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'employerId and action (add/remove) required' }, { status: 400 })
  }

  if (action === 'add') {
    const { data: employer } = await admin.from('employer_profiles').select('id').eq('id', employerId).maybeSingle()
    if (!employer) return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    const { error } = await admin.from('profile_blocks').insert({ candidate_id: candidate.id, blocked_employer_id: employerId })
    if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin.from('profile_blocks').delete().eq('candidate_id', candidate.id).eq('blocked_employer_id', employerId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
