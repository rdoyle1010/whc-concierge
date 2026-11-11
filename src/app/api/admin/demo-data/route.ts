import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { clearDemoData, demoDataStatus, seedDemoData } from '@/lib/demo-seed'

export const dynamic = 'force-dynamic'

// Demonstration data, switched on and off from the admin screen.
//
// The CLI script (scripts/seed-demo.ts) is the right tool for somebody with a
// terminal and the service-role key in front of them. It is the wrong tool
// twenty minutes before a call with a hotel group, which is the moment this
// actually gets used. So the same library is driven from a button here.
//
// This sits under /api/admin/, which is not in BLOCKED_API_ROUTES, because it
// is not a maintenance endpoint - it is a feature of the admin product, used
// by a signed-in administrator through the interface. The seed and migration
// routes stay blocked, and the readiness check that enforces that is
// untouched.
//
// GET reads. POST seeds. DELETE removes. Nothing writes on a read.

export async function GET() {
  if (!(await adminRequestUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    return NextResponse.json(await demoDataStatus(createAdminClient()))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not read the demonstration data' }, { status: 500 })
  }
}

export async function POST() {
  if (!(await adminRequestUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const report = await seedDemoData(createAdminClient())
    return NextResponse.json({ success: true, ...report })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Seed failed' }, { status: 500 })
  }
}

export async function DELETE() {
  if (!(await adminRequestUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    return NextResponse.json({ success: true, removed: await clearDemoData(createAdminClient()) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Teardown failed' }, { status: 500 })
  }
}
