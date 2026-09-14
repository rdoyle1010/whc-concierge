'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import SopSheet from '@/components/documents/SopSheet'
import PlanSheet from '@/components/documents/PlanSheet'
import type { PlanDocument } from '@/lib/documents/plan-types'
import { PLAN_KINDS } from '@/lib/documents/render-pdf'
import type { SopDocument } from '@/lib/documents/types'
import { JOURNEY_STAGES, stageOf, kindOf, KIND_LABEL, type JourneyStage } from '@/lib/documents/journey'
import { LIFE_SAFETY_WARNING } from '@/lib/documents/safety'
import {
  Check, CheckCheck, Eye, Plus, Printer, RefreshCw, RotateCcw, Trash2, Download, Sparkles,
  ShieldAlert, Inbox, Pencil, ClipboardCheck, Banknote, Layers,
} from 'lucide-react'

// The library, and the desk it is signed off at.
//
// Read it, print it, then approve it. Nothing here reaches a property until
// she has, and the screen says which state each one is in rather than leaving
// her to work it out from which buttons happen to be enabled.

type Row = {
  id: string
  reference: string
  kind: string
  title: string
  department: string | null
  version: string
  status: 'draft' | 'approved' | 'retired'
  approved_by_name: string | null
  approved_at: string | null
  approved_version: string | null
  missing: string[]
  stale: boolean
  written: boolean
  lifeSafety: boolean
  blanks: number
  tier: 'day-1' | 'month-1' | 'quarter-1' | null
  tier_reason: string | null
  created_at: string
}

type Run = {
  provider_batch_id: string
  tier: string | null
  requested: number
  collected: number
  failed: number
  status: 'submitted' | 'collecting' | 'done' | 'failed'
  note: string | null
  created_at: string
}

const STATUS_LABEL: Record<Row['status'], string> = {
  draft: 'Draft, not signed off',
  approved: 'Signed off',
  retired: 'Retired',
}

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<Row[]>([])
  // What is being written right now. Without this on screen, the only way to
  // find out whether anything is happening is to ask somebody.
  const [runs, setRuns] = useState<Run[]>([])
  // Which references are written in the repository rather than drafted. It
  // comes from the API because the content itself is a megabyte of procedure
  // nobody needs in a browser, and a copy of the list kept here would drift.
  const [authored, setAuthored] = useState<string[]>([])
  // The buttons nobody presses on a normal day, out of the way until asked.
  const [showRest, setShowRest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // The list no longer carries four hundred and sixty document bodies, so
  // opening one fetches it.
  const [reading, setReading] = useState<{ row: Row; document: SopDocument } | null>(null)
  const [opening, setOpening] = useState('')
  // Four hundred and sixty documents is not a list anybody scrolls. It is
  // filtered, counted, and worked through a tier at a time.
  // Browsed by the guest journey, then by what kind of document it is.
  // "Before the first guest" answers a question a property asks once,
  // while it is opening. "Where in the visit does this happen" is the
  // question everybody asks afterwards.
  const [stage, setStage] = useState<JourneyStage | 'all'>('all')
  const [kind, setKind] = useState<string>('all')
  const [department, setDepartment] = useState('all')
  const [only, setOnly] = useState<
    'all' | 'unwritten' | 'incomplete' | 'signed-unfinished' | 'unsigned' | 'signed'>('all')

  async function load() {
    const res = await fetch('/api/admin/documents', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load the library.'); return }
    setUnavailable(Boolean(body.unavailable))
    setRows(body.rows || [])
    setRuns(body.runs || [])
    setAuthored(body.authored || [])
  }
  useEffect(() => { load() }, [])

  async function act(action: string, id?: string, extra: Record<string, unknown> = {}) {
    setBusy(id || action); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, ...extra }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || `That did not work (${res.status}). Tell Claude what you pressed and this number.`)
        return false
      }
      if (!body?.warning && action === 'approve') setNote('Signed off. It can be issued to a property now.')
      // A warning is shown instead of the success line, never underneath it
      // and never in place of it. The warning that carried the only record of
      // a batch id was swallowed by the cheerful sentence below, and two paid
      // runs of three hundred and thirty-eight documents went missing with it.
      if (body?.warning) {
        setError(body.warning)
      } else if (action === 'draft_tier') {
        setNote(body?.submitted
          ? `${body.submitted} documents sent to be written. It takes a while, and you do not have to wait: come back later and press Collect what is ready.`
          : body?.note || 'Nothing to send.')
      }
      if (!body?.warning && action === 'adopt_batch') {
        setNote(body?.note || 'Adopted. Press Collect what is ready to bring it in.')
      }
      if (!body?.warning && action === 'collect') {
        // Never just "nothing came back". A run still working through its
        // queue and a run in which every request failed look identical from
        // here, and they need completely different things from her.
        if (body?.collected) {
          // A collection that stopped on the clock looks exactly like one
          // that finished, unless it says so. It has to say so, or she reads
          // a number, believes it is the whole batch, and never presses again.
          setNote(body?.unfinished
            ? `${body.collected} brought in so far, and there is more waiting. Press Collect what is ready again.`
            : `${body.collected} documents came back written. Read them before signing any off.`)
        } else if (body?.unfinished) {
          setNote('Still working through it. Press Collect what is ready again.')
        } else if (body?.stillRunning) {
          setNote(`Still being written${body.progress ? `: ${body.progress}` : ''}. Nothing to do but come back later.`)
        } else if (body?.refused?.length) {
          setError(`The run finished and wrote nothing. ${body.refused.join(' ')}`)
        } else {
          setNote(body?.note || 'Nothing came back, and nothing is waiting. Press Write this whole tier to start one.')
        }
      }
      if (!body?.warning && action === 'draft_incomplete') {
        setNote(body?.submitted
          ? body.note || `${body.submitted} sent to be written again.`
          : body?.note || 'Nothing to do.')
      }
      if (!body?.warning && (action === 'write_authored' || action === 'add_pool_plans' || action === 'add_risk_assessments'
        || action === 'add_checklists' || action === 'add_finance_pack'
        || action === 'add_everything' || action === 'approve_ready')) {
        setNote(body?.note || 'Done.')
      }
      // A document too long for a web request is now sent the slower way
      // rather than refused, so the answer is different from a drafted one.
      if (!body?.warning && action === 'draft' && body?.queued) {
        setNote(body.note)
      } else if (!body?.warning && action === 'draft') {
        setNote(body?.lifeSafety
          ? 'Drafted. This one is life safety: read every step against the actual building before you sign it off.'
          : 'Drafted. Read it, correct it, then sign it off.')
      }
      await load()
      return true
    } catch {
      setError('That did not work. Check your connection and try again.')
      return false
    } finally { setBusy('') }
  }

  async function open(row: Row) {
    setOpening(row.id); setError('')
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', id: row.id }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) { setError(body?.error || 'That document could not be opened.'); return }
      setReading({ row, document: body.document as SopDocument })
    } catch {
      setError('That document could not be opened. Check your connection.')
    } finally { setOpening('') }
  }

  // The extra statement a life safety document takes, asked once and plainly
  // rather than buried in a tick box nobody reads.
  async function signOff(row: Row) {
    if (row.lifeSafety) {
      const sure = window.confirm(
        `${row.title}\n\nThis is a life safety document.\n\nConfirm that a competent person has checked it `
        + 'against the actual premises, equipment and team.',
      )
      if (!sure) return false
      return act('approve', row.id, { competentPersonChecked: true })
    }
    return act('approve', row.id)
  }

  if (reading) {
    return (
      <DashboardShell role="admin">
        <div className="print:hidden">
          <button type="button" onClick={() => setReading(null)}
            className="text-[12px] text-secondary underline hover:text-ink">&larr; Back to the library</button>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary">
              <Printer size={13} /> Print or save as PDF
            </button>
            {/* Printing the page gives a locked file full of square brackets.
                This one has a form field for every bracket, so a property can
                complete it in the free Adobe Reader. It is what gets sent to
                a buyer; the print button is for checking the layout. */}
            <a href={`/api/admin/documents/${reading.row.id}/pdf`}
              className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink">
              <Download size={13} /> Fillable PDF
            </a>
            {reading.row.status !== 'approved' ? (
              <button type="button" disabled={busy === reading.row.id}
                onClick={async () => { if (await signOff(reading.row)) setReading(null) }}
                className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                <Check size={13} /> Sign this off
              </button>
            ) : (
              <span className="border border-[#166534]/30 bg-[#f3fbf5] px-3 py-1.5 text-[12px] font-semibold text-[#166534]">
                Signed off by {reading.row.approved_by_name || 'you'}
              </span>
            )}
          </div>
          {error && <p className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        </div>
        {/* Named, because printing is allowlisted rather than blocklisted.
            The old print rules hid a list of workspace selectors, and the
            dashboard header was not among them, so a document she would send
            to a hotel came out with a burger menu, a logo and a notification
            bell across the top of page one. Hiding everything and showing
            only this cannot be defeated by a chrome element nobody listed. */}
        <div className="document-print-root mt-6 border border-border bg-white shadow-sm print:mt-0 print:border-0 print:shadow-none">
          {/* A plan and a procedure are different shapes. Rendering a Normal
              Operating Procedure through the SOP sheet would show her a list
              of steps that is not there and hide the hundred and fifty blanks
              that are. */}
          {PLAN_KINDS.has(reading.row.kind)
            ? <PlanSheet document={reading.document as unknown as PlanDocument} />
            : <SopSheet document={reading.document} />}
        </div>
      </DashboardShell>
    )
  }

  // What the current state filter matches outside the chosen tier, and what
  // has no tier at all. Both are the answer to "it says one is written and I
  // cannot see it".
  const matchesState = (row: Row) => {
    if (only === 'unwritten' && row.written) return false
    // Written, and still missing something it needs before anybody can sign
    // it off. The draft came back short and was stored as though it had not.
    if (only === 'incomplete' && (!row.written || row.missing.length === 0)) return false
    // Signed off and still missing something. The one state on this screen
    // that is not merely unfinished but wrong.
    if (only === 'signed-unfinished'
      && (row.status !== 'approved' || !row.written || row.missing.length === 0)) return false
    if (only === 'unsigned' && (!row.written || row.status === 'approved')) return false
    if (only === 'signed' && row.status !== 'approved') return false
    return true
  }
  // Written, still missing something, split by what can actually be done
  // about it. The button used to offer to write thirteen again and send six,
  // because it counted every unfinished document and the action only takes
  // the ones it can honestly redraft. A button that reports its intention
  // rather than its outcome is the thing this screen keeps getting wrong.
  const unfinished = (row: Row) => row.written && row.missing.length > 0
  const isAuthored = (row: Row) => authored.includes(row.reference)

  // Hand-written, unsigned, and not yet finished in the database. Exactly
  // what pressing Write the hand-written ones will change, which is the only
  // number worth putting on a button.
  const authoredShort = rows.filter(row =>
    isAuthored(row) && row.status !== 'approved' && (!row.written || row.missing.length > 0))
  // Unapproved drafted procedures. Everything the redraft will actually send,
  // now excluding the hand-written ones: six of those went to the model twice
  // and came back with nothing both times, which is what the written content
  // exists to end.
  const redraftable = rows.filter(row =>
    unfinished(row) && row.kind === 'sop' && row.status !== 'approved' && !isAuthored(row))
  // Signed off and still missing something, which should not be possible and
  // is the exact failure the sign-off exists to prevent.
  const signedUnfinished = rows.filter(row => unfinished(row) && row.status === 'approved')
  // Written in the repository rather than drafted, so a model cannot fix them.
  const unfinishedPlans = rows.filter(row =>
    unfinished(row) && row.kind !== 'sop' && row.status !== 'approved' && !isAuthored(row))

  const inFlight = runs.some(run => run.status === 'submitted' || run.status === 'collecting')

  const stageFor = (row: Row) => stageOf({ reference: row.reference, title: row.title })
  const elsewhere = rows.filter(row => stage !== 'all' && stageFor(row) !== stage && matchesState(row)).length

  const visible = rows.filter(row => {
    if (stage !== 'all' && stageFor(row) !== stage) return false
    if (kind !== 'all' && kindOf(row.reference) !== kind) return false
    if (department !== 'all' && row.department !== department) return false
    return matchesState(row)
  })

  // Only the kinds actually present, so the filter never offers an empty one.
  const kindsPresent = Array.from(new Set(rows.map(row => kindOf(row.reference)))).sort()

  return (
    <DashboardShell role="admin">
      <div className="max-w-5xl">
        <p className="eyebrow">Standards</p>
        <h1 className="text-[32px] mt-1">The document library</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Procedures, risk assessments, job descriptions and policies. Read each one, print it to check how it
          sits on a page, then sign it off. Nothing reaches a property until you have.
        </p>

        {unavailable && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            This is not switched on yet. Run the documents migration in Supabase.
          </p>
        )}
        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        {/* A signed-off document that is still missing something should not be
            possible, and it is the exact failure the sign-off exists to
            prevent: an approval says a person read a finished document. It
            gets its own line rather than being folded into a count, because
            it is the only state on this screen that is actually wrong. */}
        {signedUnfinished.length > 0 && (
          <div className="mt-4 border-l-2 border-[#8a1c14] bg-[#fbe9e7] px-4 py-3 text-[13px] text-[#8a1c14]">
            <p className="font-semibold">
              {signedUnfinished.length === 1
                ? 'One document is signed off and still missing something.'
                : `${signedUnfinished.length} documents are signed off and still missing something.`}
            </p>
            <p className="mt-1.5 leading-relaxed">
              An approval says somebody read a finished document, so this should not be possible. Take the
              sign-off back on each one and it joins the queue to be written again.
            </p>
            <button type="button" onClick={() => setOnly('signed-unfinished')}
              className="mt-2 font-semibold underline">
              Show me which ones
            </button>
          </div>
        )}

        {/* The six that would not sign off. They were sent to be drafted
            again twice and came back with nothing both times, so they are
            written in the repository now and one press puts them in. */}
        {authoredShort.length > 0 && (
          <p className="mt-3 border border-[#8a1c14] px-4 py-3 text-[13px] text-secondary">
            {authoredShort.length === 1 ? 'One document is' : `${authoredShort.length} documents are`}
            {' '}written by hand in the repository and not in the library yet, or in it unfinished. Drafting them
            again will not fix them. Press Write the {authoredShort.length}{' '}
            hand-written {authoredShort.length === 1 ? 'one' : 'ones'}, which is certain rather than a redraft.
          </p>
        )}

        {/* Written in the repository rather than drafted, so no amount of
            redrafting will fix one. Worth saying, or the two counts look
            like the same problem reported twice. */}
        {unfinishedPlans.length > 0 && (
          <p className="mt-3 border border-[#dddddd] px-4 py-3 text-[13px] text-secondary">
            {unfinishedPlans.length === 1 ? 'One other document is' : `${unfinishedPlans.length} other documents are`}
            {' '}unfinished and not a drafted procedure, so writing them again would not help. Press Bring the
            library up to date, which rewrites them from the repository.
          </p>
        )}

        {/* Twelve buttons was eleven too many on any given day.
            Everything that adds a set of documents is inside Bring the
            library up to date, which is the one that gets pressed; the rest
            are here for the day one import fails on its own and somebody
            wants to retry that set rather than all of it. */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={load}
            className="flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
            <RefreshCw size={13} /> Refresh
          </button>
          <button type="button" disabled={busy === 'add_everything'} onClick={() => act('add_everything')}
            className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
            <Layers size={13} /> {busy === 'add_everything' ? 'Bringing them in...' : 'Bring the library up to date'}
          </button>

          {/* Written here, in the repository, so pressing this is certain
              rather than a coin toss inside a twenty-six second function.
              Two model redrafts of the same six came back with nothing. */}
          {authoredShort.length > 0 && (
            <button type="button" disabled={busy === 'write_authored'} onClick={() => act('write_authored')}
              className="inline-flex items-center gap-1.5 border border-[#8a1c14] px-3 py-1.5 text-[12px] font-semibold text-[#8a1c14] disabled:opacity-40">
              <Pencil size={13} />
              {busy === 'write_authored'
                ? 'Writing...'
                : `Write the ${authoredShort.length} hand-written ${authoredShort.length === 1 ? 'one' : 'ones'}`}
            </button>
          )}

          {/* Only while something is actually out. A collect button on a
              screen with nothing in flight is a button that reports
              "nothing new" and teaches her to ignore it. */}
          {inFlight && (
            <button type="button" disabled={busy === 'collect'} onClick={() => act('collect')}
              className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-40">
              <Inbox size={13} /> {busy === 'collect' ? 'Checking...' : 'Collect what is ready'}
            </button>
          )}

          {/* One press for everything that is finished. The life safety ones
              are held back by the route rather than here, because a rule that
              only exists in a button is a rule until somebody calls the API
              directly. */}
          <button type="button" disabled={busy === 'approve_ready'}
            onClick={() => {
              const waiting = rows.filter(r => r.written && r.status === 'draft').length
              if (!waiting) { setNote('Nothing is waiting to be signed off.'); return }
              if (!window.confirm(
                `Sign off every finished document that is not a life safety one. ${waiting} are written and waiting. `
                + 'Life safety documents are held back and stay one at a time, because signing one says a competent '
                + 'person checked it against the premises.',
              )) return
              act('approve_ready')
            }}
            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
            <CheckCheck size={13} /> {busy === 'approve_ready' ? 'Signing off...' : 'Sign off everything finished'}
          </button>

          <button type="button" onClick={() => setShowRest(!showRest)}
            className="text-[12px] text-secondary underline hover:text-ink">
            {showRest ? 'Hide the rest' : 'The rest'}
          </button>
        </div>

        {/* Pressed once a quarter at most, and never on a normal day. */}
        {showRest && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-l-2 border-border pl-4">
            <button type="button" disabled={busy === 'import_plan'} onClick={() => act('import_plan')}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
              <Download size={13} /> {busy === 'import_plan' ? 'Importing...' : 'Import the build plan'}
            </button>
            {!inFlight && (
              <button type="button" disabled={busy === 'collect'} onClick={() => act('collect')}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                <Inbox size={13} /> {busy === 'collect' ? 'Checking...' : 'Collect what is ready'}
              </button>
            )}
            <button type="button" disabled={busy === 'adopt_batch'}
              onClick={() => {
                const providerBatchId = window.prompt(
                  'Paste a batch id from the Anthropic console. Use this for a run that was started before the '
                  + 'register existed, so its results can still be collected.',
                )
                if (providerBatchId?.trim()) act('adopt_batch', undefined, { providerBatchId: providerBatchId.trim() })
              }}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
              <Inbox size={13} /> Collect a batch by id
            </button>

            {/* Demoted. It counts only the ones a model could plausibly fix:
                the hand-written ones are excluded, because sending those to
                be drafted again is what already failed twice. */}
            {redraftable.length > 0 && (
              <button type="button" disabled={busy === 'draft_incomplete'}
                onClick={() => {
                  const count = redraftable.length
                  if (!window.confirm(
                    `Write ${count} unfinished ${count === 1 ? 'document' : 'documents'} again. They came back `
                    + 'short the first time. A redraft only replaces what is there if it comes back more '
                    + 'complete, so nothing can get worse, and it costs what a batch of that size costs.',
                  )) return
                  act('draft_incomplete')
                }}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                <RefreshCw size={13} />
                {busy === 'draft_incomplete'
                  ? 'Sending...'
                  : `Write the ${redraftable.length} drafted ${redraftable.length === 1 ? 'one' : 'ones'} again`}
              </button>
            )}
            {authoredShort.length === 0 && (
              <button type="button" disabled={busy === 'write_authored'} onClick={() => act('write_authored')}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                <Pencil size={13} /> {busy === 'write_authored' ? 'Writing...' : 'Write the hand-written ones again'}
              </button>
            )}

            {([
              ['add_risk_assessments', 'the risk assessments'],
              ['add_checklists', 'the daily checklists'],
              ['add_finance_pack', 'the reporting pack'],
              ['add_pool_plans', 'the pool safety plans'],
            ] as const).map(([which, label]) => (
              <button key={which} type="button" disabled={busy === which} onClick={() => act(which)}
                className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                <ShieldAlert size={13} /> {busy === which ? 'Adding...' : `Add ${label}`}
              </button>
            ))}
            <button type="button" disabled={busy === 'add_example'} onClick={() => act('add_example')}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
              <Plus size={13} /> Add the worked example
            </button>
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-5">
              {/* Five, not four. "Written" counted a document whose draft came
                  back with no steps in it, so the library reported nothing
                  left to write and she met each one individually, by pressing
                  sign off and being refused. A number that is only true if you
                  do not look closely is worse than no number. */}
              {([
                ['Planned', rows.length, 'all'],
                ['Written', rows.filter(r => r.written).length, 'all'],
                ['Signed off', rows.filter(r => r.status === 'approved').length, 'signed'],
                ['Written, not finished', rows.filter(unfinished).length, 'incomplete'],
                ['Still to write', rows.filter(r => !r.written).length, 'unwritten'],
              ] as const).map(([label, value, filter]) => (
                <button key={label} type="button" onClick={() => setOnly(filter as typeof only)}
                  className="bg-white px-4 py-3 text-left">
                  <p className="text-[10px] uppercase tracking-[.14em] text-muted">{label}</p>
                  <p className={`mt-0.5 text-[22px] font-semibold ${
                    label === 'Written, not finished' && value > 0 ? 'text-[#8a1c14]' : 'text-ink'}`}>{value}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setStage('all')}
                className={`border px-3 py-1.5 text-[12px] ${stage === 'all' ? 'border-[#1c1c1c] bg-[#1c1c1c] text-white' : 'border-border text-secondary'}`}>
                Everything<span className="ml-1.5 opacity-60">{rows.length}</span>
              </button>
              {JOURNEY_STAGES.map(option => (
                <button key={option.slug} type="button" onClick={() => setStage(option.slug)} title={option.blurb}
                  className={`border px-3 py-1.5 text-[12px] ${stage === option.slug ? 'border-[#1c1c1c] bg-[#1c1c1c] text-white' : 'border-border text-secondary'}`}>
                  {option.label}
                  <span className="ml-1.5 opacity-60">{rows.filter(r => stageFor(r) === option.slug).length}</span>
                </button>
              ))}
              <select value={kind} onChange={e => setKind(e.target.value)}
                className="border border-border px-2 py-1.5 text-[12px] text-secondary">
                <option value="all">Every kind</option>
                {kindsPresent.map(code => (
                  <option key={code} value={code}>
                    {KIND_LABEL[code] || code} ({rows.filter(r => kindOf(r.reference) === code).length})
                  </option>
                ))}
              </select>
              <select value={department} onChange={e => setDepartment(e.target.value)}
                className="border border-border px-2 py-1.5 text-[12px] text-secondary">
                <option value="all">Every department</option>
                {Array.from(new Set(rows.map(r => r.department).filter(Boolean))).sort().map(name => (
                  <option key={String(name)} value={String(name)}>{name}</option>
                ))}
              </select>
              <select value={only} onChange={e => setOnly(e.target.value as typeof only)}
                className="border border-border px-2 py-1.5 text-[12px] text-secondary">
                <option value="all">Any state</option>
                <option value="unwritten">Not written yet</option>
                <option value="incomplete">Written, not finished</option>
                <option value="signed-unfinished">Signed off, not finished</option>
                <option value="unsigned">Written, not signed off</option>
                <option value="signed">Signed off</option>
              </select>
            </div>
          </>
        )}

        {/* Being written right now. A page that cannot answer "is anything
            happening" is a page somebody presses the button on again, which
            in this case means paying to write the same documents twice. */}
        {runs.some(run => run.status === 'submitted' || run.status === 'collecting') && (
          <div className="mt-6 border border-[#1c1c1c] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Being written now</p>
            {runs.filter(run => run.status === 'submitted' || run.status === 'collecting').map(run => (
              <p key={run.provider_batch_id} className="mt-1.5 text-[13px] text-ink">
                {run.requested} documents, sent {new Date(run.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                {run.collected > 0 ? `. ${run.collected} written so far` : '. Nothing back yet'}
                {run.failed > 0 ? `, ${run.failed} failed` : ''}.
              </p>
            ))}
            <p className="mt-1.5 text-[12px] text-secondary">
              Nothing to do. Press Collect what is ready when you come back.
            </p>
          </div>
        )}

        {/* A finished run leaves a note for two completely different reasons:
            something failed, or there was nothing new in it because the same
            tier had been submitted more than once. Only the first is a
            problem, and dressing the second in amber sends her looking for a
            fault that is not there. The failed count says which it is. */}
        {runs.filter(run => run.status === 'done' && run.note).slice(0, 1).map(run => (
          run.failed > 0 ? (
            <p key={run.provider_batch_id} className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              The last run finished with a problem. {run.note}
            </p>
          ) : (
            <p key={run.provider_batch_id} className="mt-4 border border-border px-4 py-3 text-[13px] text-secondary">
              {run.note}
            </p>
          )
        ))}

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            Nothing in the library yet. Import the build plan to put all four hundred and sixty documents in as
            drafts, or add the worked example on its own to look at the layout first.
          </p>
        ) : visible.length === 0 ? (
          <div className="mt-8 text-[13px] text-secondary">
            {/* Not just "nothing matches". A count at the top saying one
                document is written, above a list saying nothing matches, is
                the screen contradicting itself and leaving her to work out
                which half is lying. It says where the missing ones are. */}
            <p>Nothing matches those filters.</p>
            {elsewhere > 0 && (
              <p className="mt-1.5">
                {elsewhere === 1 ? 'One document matches' : `${elsewhere} documents match`} that state in another tier.
                <button type="button" onClick={() => { setStage('all'); setKind('all') }} className="ml-1.5 font-semibold text-ink underline">
                  Show everything
                </button>
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visible.slice(0, 60).map(row => (
              <div key={row.id} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-ink">{row.title}</p>
                    <p className="text-[12px] text-secondary">
                      <span className="font-mono">{row.reference}</span> &middot; version {row.version}
                      {row.department ? ` · ${row.department}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 border px-2.5 py-1 text-[11px] ${
                    row.status === 'approved'
                      ? 'border-[#166534]/30 bg-[#f3fbf5] text-[#166534]'
                      : 'border-border text-secondary'
                  }`}>
                    {STATUS_LABEL[row.status]}
                  </span>
                </div>

                {row.status === 'approved' && (
                  <p className="mt-2 text-[12px] text-secondary">
                    Signed off by {row.approved_by_name || 'you'}
                    {row.approved_at ? ` on ${new Date(row.approved_at).toLocaleDateString('en-GB')}` : ''}
                    {row.approved_version ? `, at version ${row.approved_version}` : ''}.
                  </p>
                )}

                {/* An approval that applied to an earlier version is not an
                    approval of this one, and saying so is the whole point. */}
                {row.stale && (
                  <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    This was signed off at version {row.approved_version} and it is now {row.version}. Read it again.
                  </p>
                )}

                {row.lifeSafety && (
                  <p className="mt-3 flex gap-2 border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900">
                    <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                    <span><span className="font-semibold">Life safety. </span>{LIFE_SAFETY_WARNING}</span>
                  </p>
                )}

                {row.tier_reason && !row.written && (
                  <p className="mt-2 text-[12px] text-secondary">{row.tier_reason}</p>
                )}

                {!row.written && (
                  <p className="mt-2 text-[12px] text-muted">Not written yet. Nothing in it but the reference.</p>
                )}

                {/* What the property has to fill in. Said both ways round: a
                    procedure with nothing to complete, on a subject that
                    turns on a fact about one building, means the drafter
                    stated something it could not know. */}
                {row.written && (
                  row.blanks > 0 ? (
                    <p className="mt-2 text-[12px] text-secondary">
                      {row.blanks} {row.blanks === 1 ? 'thing' : 'things'} for the property to fill in.
                      The PDF has a box for each.
                    </p>
                  ) : (
                    <p className="mt-2 text-[12px] text-amber-800">
                      Nothing for the property to fill in. Check it has not stated a fact about a building it
                      has never seen.
                    </p>
                  )
                )}

                {row.written && row.missing.length > 0 && (
                  <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                    Not ready to sign off. Still needs: {row.missing.join(', ')}.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {!row.written && (
                    <button type="button" disabled={busy === row.id} onClick={() => act('draft', row.id)}
                      className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                      <Sparkles size={13} /> {busy === row.id ? 'Drafting...' : 'Draft it'}
                    </button>
                  )}

                  <button type="button" disabled={!row.written || opening === row.id} onClick={() => open(row)}
                    className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-30">
                    <Eye size={13} /> {opening === row.id ? 'Opening...' : 'Read it'}
                  </button>

                  {row.written && (
                    <a href={`/api/admin/documents/${row.id}/pdf`}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary">
                      <Download size={13} /> Fillable PDF
                    </a>
                  )}

                  {row.status === 'approved' ? (
                    <button type="button" disabled={busy === row.id} onClick={() => act('unapprove', row.id)}
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                      <RotateCcw size={13} /> Take the sign-off back
                    </button>
                  ) : (
                    <button type="button" disabled={busy === row.id || row.missing.length > 0}
                      onClick={() => signOff(row)}
                      className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                      <Check size={13} /> Sign it off
                    </button>
                  )}

                  <button type="button" disabled={busy === row.id}
                    onClick={() => {
                      if (!window.confirm(`Delete ${row.title}? This cannot be undone.`)) return
                      act('delete', row.id)
                    }}
                    className="ml-auto inline-flex items-center gap-1.5 border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 disabled:opacity-40">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {visible.length > 60 && (
              <p className="pt-2 text-[12px] text-secondary">
                Showing 60 of {visible.length}. Narrow it by department to see the rest.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
