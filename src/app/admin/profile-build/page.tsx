'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { BUILD_STATUS_LABEL, type BuildStatus } from '@/lib/profile-build'
import CvReadingReview, { type Reading } from '@/components/CvReadingReview'
import AdminProfileEditor from '@/components/AdminProfileEditor'
import { BUILD_QUESTIONS } from '@/lib/profile-build-questions'
import { Archive, ExternalLink, FileText, RefreshCw, RotateCcw, Send, Sparkles, Trash2, UserPlus } from 'lucide-react'

// The queue for "send us your CV and we will do the rest".
//
// Four steps in order, and each button only appears when the one before it is
// done, because the failure mode here is emailing somebody a profile that does
// not exist yet.

type Request = {
  id: string
  full_name: string
  email: string
  phone: string | null
  note: string | null
  cv_url: string | null
  cv_filename: string | null
  status: BuildStatus
  created_user_id: string | null
  consent_wording: string
  answers: Record<string, unknown> | null
  archived_at: string | null
  emails: SentEmail[]
  created_at: string
}

type SentEmail = {
  kind: string
  subject: string
  status: 'sent' | 'failed' | 'skipped'
  error: string | null
  created_at: string
}

// What they answered at intake, read back in the words they were asked.
// A select stores a value and shows a label, and an administrator looking at
// "1_week" has been handed the database rather than the answer.
function answered(answers: Record<string, unknown> | null | undefined) {
  if (!answers) return []
  return BUILD_QUESTIONS.flatMap(question => {
    const value = answers[question.key]
    if (value === undefined || value === null || value === '') return []
    if (Array.isArray(value)) return value.length ? [{ label: question.label, value: value.join(', ') }] : []
    const option = (question.options || []).find(choice => choice.value === String(value))
    return [{ label: question.label, value: option?.label || String(value) }]
  })
}

export default function AdminProfileBuildPage() {
  const [rows, setRows] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  // The draft, per request. Held here and nowhere else until somebody saves it.
  const [readings, setReadings] = useState<Record<string, Reading>>({})
  const [pasted, setPasted] = useState<Record<string, string>>({})
  // The sign-in link, shown rather than followed.
  const [link, setLink] = useState<{ url: string; name: string; copied: boolean } | null>(null)
  // Which row has been refused a handover once and is now one press from being sent anyway.
  const [confirming, setConfirming] = useState('')
  // Archived requests are off the queue by default. That is the point of them.
  const [showArchived, setShowArchived] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/profile-build', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load the queue.'); return }
    setUnavailable(Boolean(body.unavailable))
    setRows(body.rows || [])
  }
  useEffect(() => { load() }, [])

  async function act(row: Request, action: string, extra: Record<string, any> = {}) {
    setBusy(row.id); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/profile-build', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, action, ...extra }),
      })
      // Not every failure comes back as JSON. A function that was killed
      // mid-request returns an error page, and "That did not work" is what
      // that used to look like on screen: true, and useless to whoever has
      // to fix it.
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error
          || (res.status === 504 || res.status === 502
            ? 'That took too long and the server gave up. Try again, or paste the CV text in instead of using the file.'
            : `That did not work (${res.status}). Tell Claude what you pressed and this number.`))
        return null
      }
      if (body.warning) setError(body.warning)
      else if (action === 'create') {
        setNote(body.reused
          ? `${row.full_name} already had an account, so this is now linked to it. Nothing of theirs has been changed.`
          : `Account created for ${row.full_name}. Now fill in the profile.`)
      }
      else if (action === 'handover') setNote(`Sent to ${row.full_name}. They set a password from here.`)
      await load()
      return body
    } catch {
      setError('That did not work. Check your connection and try again.')
      return null
    } finally {
      setBusy('')
    }
  }

  // Sending is refused once when the name on the profile and the name on the
  // request disagree, because that is what a CV attached to the wrong person
  // looks like. Pressing again is the administrator saying she has checked.
  async function sendItToThem(row: Request) {
    const confirmed = confirming === row.id
    const sent = await act(row, 'handover', confirmed ? { confirm: true } : {})
    setConfirming(sent ? '' : row.id)
  }

  async function remove(row: Request) {
    // Typed out rather than clicked through. A delete that only needs one
    // press is a delete that happens by accident on a laptop trackpad, and
    // the CV somebody sent goes with it.
    const sure = window.confirm(
      `Delete ${row.full_name}'s request and their CV?\n\nThis cannot be undone. Their account and profile are not touched.`,
    )
    if (!sure) return
    const gone = await act(row, 'delete')
    if (gone) setNote(gone.note || 'Deleted.')
  }

  // The sign-in link, handed over rather than followed.
  //
  // This used to open the link in a new tab, which is the one thing it must
  // not do: the session it creates replaces the administrator's own on the
  // same origin, so the tab behind it starts answering "Unauthorised" to
  // everything and the workspace that opens belongs to somebody else. It is
  // copied now, with the consequence said out loud, and there is a form on
  // this page that makes it unnecessary for almost everything.
  async function copyWorkspaceLink(row: Request) {
    const body = await act(row, 'open')
    if (!body?.url) return
    setLink({ url: body.url, name: row.full_name, copied: false })
    // Attempted, not relied on. The clipboard is refused often enough - a
    // desktop shell, a permission, an await between the click and the write -
    // and a link nobody can copy is not an error worth a red panel. It is
    // shown either way, in a box, with a button that tries again.
    try {
      await navigator.clipboard.writeText(body.url)
      setLink({ url: body.url, name: row.full_name, copied: true })
    } catch { /* the panel below is the fallback */ }
  }

  const archivedCount = rows.filter(row => row.archived_at).length
  const visible = rows.filter(row => Boolean(row.archived_at) === showArchived)

  return (
    <DashboardShell role="admin">
      <div className="max-w-5xl">
        <p className="eyebrow">People &amp; operations</p>
        <h1 className="text-[32px] mt-1">Profiles we are building</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          People who sent a CV rather than filling in a form. Their account is made the moment they
          send it, so there are four things to do and they are in order on each card:
        </p>
        <ol className="mt-3 space-y-1 text-[13px] text-secondary">
          <li><strong className="text-ink">1. Read the CV</strong> and correct anything it got wrong</li>
          <li><strong className="text-ink">2. Save this to their profile</strong></li>
          <li><strong className="text-ink">3. Fill in the rest</strong> in the form on their card, without leaving this page</li>
          <li><strong className="text-ink">4. Send it to them</strong>, and they set a password</li>
        </ol>
        <p className="text-[13px] text-secondary mt-3 max-w-2xl">
          They already have an account: it is made the moment they send their CV, with no password on
          it, and they never see it until you press Send it to them. That email is the sign-up, and
          setting a password is the first and only thing they are ever asked to do.
        </p>
        <p className="text-[13px] text-secondary mt-3 max-w-2xl">
          Nothing they have is visible to anybody until they say so.
        </p>

        {unavailable && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            This is not switched on yet. Run the profile build migration in Supabase.
          </p>
        )}
        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        {link && (
          <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[13px] font-semibold text-amber-900">
              {link.name}&rsquo;s sign-in link
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-amber-800">
              Open this in a private window. If you open it in this one you will be signed in as them and
              signed out of admin. You only need it for a photograph: everything else is on their card below.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input readOnly value={link.url} onFocus={event => event.currentTarget.select()}
                className="min-w-0 flex-1 border border-amber-300 bg-white px-2 py-1.5 text-[11px] text-amber-900" />
              <button type="button"
                onClick={() => navigator.clipboard.writeText(link.url)
                  .then(() => setLink(current => current && { ...current, copied: true }))
                  .catch(() => {})}
                className="border border-amber-400 px-3 py-1.5 text-[12px] font-semibold text-amber-900">
                {link.copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={() => setLink(null)}
                className="text-[12px] text-amber-800 underline">Done</button>
            </div>
          </div>
        )}

        <button type="button" onClick={load} className="mt-5 flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
          <RefreshCw size={13} /> Refresh
        </button>

        {archivedCount > 0 && (
          <button type="button" onClick={() => setShowArchived(current => !current)}
            className="mt-3 ml-4 text-[12px] text-secondary underline hover:text-ink">
            {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
          </button>
        )}

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">
            {rows.length === 0
              ? 'Nobody has sent anything in yet. The page they use is talenthousecollective.co.uk/set-up-my-profile'
              : 'Nothing waiting on you. Everything that has come in is archived.'}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {visible.map(row => (
              <div key={row.id} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-ink">{row.full_name}</p>
                    <p className="text-[12px] text-secondary">
                      {row.email}{row.phone ? ` · ${row.phone}` : ''} · {new Date(row.created_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className="shrink-0 border border-border px-2.5 py-1 text-[11px] text-secondary">
                    {BUILD_STATUS_LABEL[row.status] || row.status}
                  </span>
                </div>

                {row.note && (
                  <p className="mt-3 border-l-2 border-[#dddddd] pl-3 text-[13px] leading-relaxed text-secondary">{row.note}</p>
                )}

                {answered(row.answers).length > 0 && (
                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 border-l-2 border-[#dddddd] pl-3 text-[12px] sm:grid-cols-2">
                    {answered(row.answers).map(item => (
                      <div key={item.label} className="flex gap-2">
                        <dt className="shrink-0 text-muted">{item.label}</dt>
                        <dd className="min-w-0 font-medium text-ink">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {row.cv_url ? (
                    <a href={row.cv_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary">
                      <FileText size={13} /> {row.cv_filename || 'Their CV'}
                    </a>
                  ) : (
                    <span className="text-[12px] text-muted">No CV attached</span>
                  )}

                  {/* Normally already done: the account is made the moment
                      somebody sends their CV. This is here for the ones that
                      could not be, which the note on the row explains. */}
                  {!row.created_user_id ? (
                    <button type="button" disabled={busy === row.id} onClick={() => act(row, 'create')}
                      className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                      <UserPlus size={13} /> Make their account
                    </button>
                  ) : (
                    <>
                      <button type="button" disabled={busy === row.id} onClick={() => copyWorkspaceLink(row)}
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                        <ExternalLink size={13} /> Copy their sign-in link
                      </button>
                      <button type="button" disabled={busy === row.id} onClick={() => sendItToThem(row)}
                        className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                        <Send size={13} /> {confirming === row.id ? 'Send it anyway' : 'Send it to them'}
                      </button>
                    </>
                  )}

                  <select value={row.status} disabled={busy === row.id}
                    onChange={e => act(row, 'status', { status: e.target.value })}
                    className="ml-auto border border-border px-2 py-1.5 text-[12px] text-secondary">
                    {(Object.keys(BUILD_STATUS_LABEL) as BuildStatus[]).map(status => (
                      <option key={status} value={status}>{BUILD_STATUS_LABEL[status]}</option>
                    ))}
                  </select>

                  <button type="button" disabled={busy === row.id}
                    onClick={() => act(row, row.archived_at ? 'restore' : 'archive')}
                    className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                    {row.archived_at ? <><RotateCcw size={13} /> Put it back</> : <><Archive size={13} /> Archive</>}
                  </button>

                  <button type="button" disabled={busy === row.id} onClick={() => remove(row)}
                    className="inline-flex items-center gap-1.5 border border-red-200 px-3 py-1.5 text-[12px] font-medium text-red-700 disabled:opacity-40">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>

                {/* Always available. Reading writes nothing, so hiding it behind
                    account creation only put the useful button behind a step
                    that can fail. */}
                {(
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" disabled={busy === row.id}
                        onClick={async () => {
                          const result = await act(row, 'read_cv', { text: pasted[row.id] || '' })
                          if (result?.reading) setReadings(current => ({ ...current, [row.id]: result.reading }))
                        }}
                        className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink disabled:opacity-40">
                        <Sparkles size={13} /> {busy === row.id ? 'Reading...' : 'Read the CV'}
                      </button>
                      <span className="text-[11px] text-muted">
                        {row.created_user_id
                          ? 'Fills in a draft you check. Nothing is saved until you say so.'
                          : 'Reads a draft now. This one has no account yet, so make one before saving.'}
                      </span>
                    </div>

                    <textarea rows={3} value={pasted[row.id] || ''}
                      onChange={e => setPasted(current => ({ ...current, [row.id]: e.target.value }))}
                      placeholder="Or paste the CV text here, for a Word document or anything they sent in an email."
                      className="input-field mt-3 w-full text-[12px]" />

                    {readings[row.id] && !row.created_user_id && (
                      <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                        Read and ready. Press &quot;Create their account&quot; above and it can be saved.
                      </p>
                    )}

                    {readings[row.id] && row.created_user_id && (
                      <CvReadingReview
                        reading={readings[row.id]}
                        saving={busy === row.id}
                        onChange={next => setReadings(current => ({ ...current, [row.id]: next }))}
                        onSave={async () => {
                          const saved = await act(row, 'apply_reading', { reading: readings[row.id] })
                          if (saved) {
                            setNote(`Saved to ${row.full_name}'s profile. Finish the rest in the form below.`)
                            setReadings(current => {
                              const next = { ...current }
                              delete next[row.id]
                              return next
                            })
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                {/* What has actually left the building. A status of "Sent to
                    them" records that the button worked, which is not the
                    same fact and was being read as though it were. */}
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-muted">What we have sent them</p>
                  {row.emails?.length ? (
                    <ul className="mt-2 space-y-1">
                      {row.emails.map(sent => (
                        <li key={`${sent.created_at}${sent.subject}`} className="flex flex-wrap items-baseline gap-2 text-[12px]">
                          <span className={sent.status === 'sent' ? 'text-[#166534]' : 'text-red-700'}>
                            {sent.status === 'sent' ? 'Sent' : sent.status === 'failed' ? 'Failed' : 'Not sent'}
                          </span>
                          <span className="text-ink">{sent.subject}</span>
                          <span className="text-muted">
                            {new Date(sent.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          {sent.error && <span className="text-red-700">{sent.error}</span>}
                        </li>
                      ))}
                      <li className="pt-1 text-[11px] text-muted">
                        Sent means our provider accepted it. If they still cannot find it, it is in a junk folder.
                      </li>
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-muted">
                      Nothing yet. They have had no email from us at all.
                    </p>
                  )}
                </div>

                {row.created_user_id && (
                  <AdminProfileEditor requestId={row.id} fullName={row.full_name} onSaved={load} />
                )}

                {row.created_user_id && (
                  <p className="mt-3 text-[11px] text-muted">
                    You are saving as yourself, and nothing here is visible to anybody until they release it.
                    The sign-in link is only for the few things that need their own workspace, such as a
                    photograph, and every use of it is written to the access log against your name.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
