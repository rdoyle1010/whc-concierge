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

export async function POST(req: Request) {
  if (!(await adminRequestUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Rebuild, because topping up cannot repair what is already there.
  //
  // The seed skips any role that already exists, matched on property and job
  // title - which is right for running it twice, and useless after the seed
  // itself has been fixed. Roles written by the older code kept their old
  // shape and the button said "Top it up", so pressing it changed nothing and
  // looked like it had worked. Removing and reloading is the thing somebody
  // actually wants after a fix, and it should not be two steps they have to
  // know to take in order.
  const body = await req.json().catch(() => ({}))
  const rebuild = body?.rebuild === true

  try {
    const admin = createAdminClient()
    const removed = rebuild ? await clearDemoData(admin) : null
    const report = await seedDemoData(admin)
    return NextResponse.json({ success: true, rebuilt: rebuild, removed, ...report })
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
