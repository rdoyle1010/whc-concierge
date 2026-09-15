import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadAllowances } from '@/lib/ai-allowance-server'
import {
  ALLOWANCE_BUCKETS, ALLOWANCE_DEFAULT, ALLOWANCE_LABEL, ALLOWANCE_WHY,
  allowancePeriod, limitFor, limitIsSane, type AllowanceBucket,
} from '@/lib/ai-allowance'

// The allowances, and what they have actually cost.
//
// Same shape as the pricing screen: the code keeps its defaults, a row
// overrides one, and putting a default back is one button. The numbers are a
// commercial decision and should not need a deploy.
//
// The second half of this route is the part that was missing all along. The
// question that produced the allowances was "what does a member cost me",
// and it was answered with arithmetic because nothing recorded the answer.
// This reads the month's real token spend and divides it by the number of
// people who spent it, so the next answer is a fact.

export const dynamic = 'force-dynamic'

// Sonnet 5, in pence per million tokens, for turning a token count into a
// number somebody can act on. Here rather than in the shared library because
// this is the only screen that needs it, and a price that drifts should be
// wrong in one obvious place rather than quietly everywhere.
const PENCE_PER_M_INPUT = 160
const PENCE_PER_M_OUTPUT = 800

function pencePerMillion(input: number, output: number): number {
  return (input * PENCE_PER_M_INPUT + output * PENCE_PER_M_OUTPUT) / 1_000_000
}

export async function GET() {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const admin = createAdminClient()
  const overrides = await loadAllowances(admin)
  const period = allowancePeriod()

  const { data: rows } = await admin.from('ai_usage')
    .select('user_id, bucket, used, input_tokens, output_tokens')
    .eq('period', period)

  const usage = (rows || []) as any[]
  const people = new Set(usage.map(row => row.user_id))

  const perBucket = ALLOWANCE_BUCKETS.map(bucket => {
    const mine = usage.filter(row => row.bucket === bucket)
    const input = mine.reduce((sum, row) => sum + Number(row.input_tokens || 0), 0)
    const output = mine.reduce((sum, row) => sum + Number(row.output_tokens || 0), 0)
    const calls = mine.reduce((sum, row) => sum + Number(row.used || 0), 0)
    const pence = pencePerMillion(input, output)
    return {
      bucket,
      label: ALLOWANCE_LABEL[bucket],
      why: ALLOWANCE_WHY[bucket],
      fallback: ALLOWANCE_DEFAULT[bucket],
      current: limitFor(bucket, overrides),
      overridden: overrides[bucket] !== undefined,
      calls,
      people: new Set(mine.map(row => row.user_id)).size,
      pence: Math.round(pence * 100) / 100,
      pencePerCall: calls ? Math.round((pence / calls) * 100) / 100 : 0,
    }
  })

  const totalPence = perBucket.reduce((sum, entry) => sum + entry.pence, 0)

  return NextResponse.json({
    period,
    allowances: perBucket,
    // The headline number. Not an estimate.
    month: {
      people: people.size,
      pence: Math.round(totalPence * 100) / 100,
      pencePerPerson: people.size ? Math.round((totalPence / people.size) * 100) / 100 : 0,
      // What it would cost if every free member spent every allowance. The
      // number to check a decision against, rather than the one to worry
      // about: nobody reaches it.
      ceilingPencePerPerson: Math.round(
        ALLOWANCE_BUCKETS.reduce((sum, bucket) => {
          const limit = limitFor(bucket, overrides)
          const each = bucket === 'cv_reading' ? 1.8 : 0.6
          return sum + limit * each
        }, 0) * 100,
      ) / 100,
    },
  })
}

export async function POST(req: NextRequest) {
  const actor = await adminRequestUser()
  if (!actor) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const bucket = String(body.bucket || '') as AllowanceBucket
  if (!ALLOWANCE_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: 'That is not an allowance this platform has.' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === 'set') {
    const checked = limitIsSane(body.limit)
    if (!checked.ok) return NextResponse.json({ error: checked.reason }, { status: 400 })

    const { error } = await admin.from('ai_allowances').upsert({
      bucket,
      monthly_limit: checked.limit,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    }, { onConflict: 'bucket' })
    if (error) return NextResponse.json({ error: 'That could not be saved. Try again.' }, { status: 500 })
    return NextResponse.json({ success: true, bucket, limit: checked.limit })
  }

  if (action === 'reset') {
    // Deleting the row restores the default, so a decision made at four on a
    // Tuesday is one click from being undone.
    const { error } = await admin.from('ai_allowances').delete().eq('bucket', bucket)
    if (error) return NextResponse.json({ error: 'That could not be undone. Try again.' }, { status: 500 })
    return NextResponse.json({ success: true, bucket, limit: ALLOWANCE_DEFAULT[bucket] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
