'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Mail, MessageSquare, RefreshCw } from 'lucide-react'

// Who signed up, how far they got, and whether anybody has spoken to them.
//
// The list is ordered by newest first, but the useful filter is "stuck": an
// account that has had the guide, has been given a day, and is still under
// half finished. That is the person worth an email today.

type Account = {
  kind: 'candidate' | 'employer'
  id: string
  userId: string | null
  name: string
  email: string | null
  createdAt: string
  audience: string
  emailConfirmed: boolean | null
  score: number
  missing: string[]
  onboardingEmail: { sentAt: string; status: string } | null
}

const AUDIENCE_LABEL: Record<string, string> = {
  talent: 'Talent', employer: 'Property', consultant: 'Consultant',
  residency: 'Residency', agency: 'Agency',
}

const FILTERS = [
  { key: 'all', label: 'Everyone' },
  { key: 'stuck', label: 'Stuck (under 50%)' },
  { key: 'nomail', label: 'No guide sent' },
  { key: 'unreachable', label: 'Address unconfirmed' },
] as const

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3600_000
}

function ago(iso: string) {
  const hours = hoursSince(iso)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${Math.round(hours)}h ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export default function AdminOnboardingPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [help, setHelp] = useState<{ limit: number; taken: number; remaining: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<typeof FILTERS[number]['key']>('all')
  const [writing, setWriting] = useState<Account | null>(null)
  const [subject, setSubject] = useState('A hand with your Talent House profile')
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/onboarding', { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load sign-ups.'); return }
    setAccounts(body.accounts || [])
    setHelp(body.setupHelp || null)
  }
  useEffect(() => { load() }, [])

  async function act(account: Account, action: string, extra: Record<string, any> = {}) {
    setBusy(account.id); setError(''); setNote('')
    const res = await fetch('/api/admin/onboarding', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: account.id, kind: account.kind, action, ...extra }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy('')
    if (!res.ok) { setError(body.error || 'That did not send.'); return }
    setNote(`Sent to ${account.name}.`)
    setWriting(null); setMessage('')
    await load()
  }

  const shown = useMemo(() => accounts.filter(account => {
    if (filter === 'stuck') return account.score < 50 && hoursSince(account.createdAt) > 24
    if (filter === 'nomail') return !account.onboardingEmail
    // Null means the check itself did not answer, which is not the same as
    // unconfirmed and must not be listed as though it were.
    if (filter === 'unreachable') return account.emailConfirmed === false
    return true
  }), [accounts, filter])

  const averageScore = accounts.length
    ? Math.round(accounts.reduce((sum, a) => sum + a.score, 0) / accounts.length) : 0

  return (
    <DashboardShell role="admin">
      <div className="max-w-6xl">
        <p className="eyebrow">People &amp; operations</p>
        <h1 className="text-[32px] mt-1">Sign-ups &amp; setup</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Everybody who has joined in the last sixty days, how complete their profile is, and whether
          the how-to-use-it email has reached them. It goes out automatically an hour after signing up.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="dashboard-card">
            <p className="eyebrow">Sign-ups</p>
            <p className="text-[28px] mt-1">{accounts.length}</p>
            <p className="text-[12px] text-secondary">in the last sixty days</p>
          </div>
          <div className="dashboard-card">
            <p className="eyebrow">Average completion</p>
            <p className="text-[28px] mt-1">{averageScore}%</p>
            <p className="text-[12px] text-secondary">across those accounts</p>
          </div>
          <div className="dashboard-card">
            <p className="eyebrow">Setup help left</p>
            <p className="text-[28px] mt-1">{help ? help.remaining : '-'}</p>
            <p className="text-[12px] text-secondary">
              of the first {help?.limit || 50} places. The offer stops appearing in the email once they are gone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          {FILTERS.map(option => (
            <button key={option.key} type="button" onClick={() => setFilter(option.key)}
              className={`px-3.5 py-1.5 text-[12px] font-medium border ${filter === option.key ? 'bg-[#1c1c1c] text-white border-[#1c1c1c]' : 'border-border text-secondary'}`}>
              {option.label}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        {loading ? (
          <p className="mt-8 text-[13px] text-secondary">Loading sign-ups...</p>
        ) : shown.length === 0 ? (
          <p className="mt-8 text-[13px] text-secondary">Nobody here yet under that filter.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {shown.map(account => (
              <div key={`${account.kind}-${account.id}`} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[16px] font-semibold text-ink truncate">{account.name}</p>
                    <p className="text-[12px] text-secondary truncate">
                      {AUDIENCE_LABEL[account.audience] || account.audience} &middot; joined {ago(account.createdAt)}
                      {account.email ? ` · ${account.email}` : ' · no address found'}
                    </p>
                    {account.emailConfirmed === false && (
                      <p className="mt-1 text-[11px] text-amber-700">
                        Address never confirmed. Anything we send may be going nowhere.
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[22px] font-semibold ${account.score >= 70 ? 'text-[#166534]' : account.score >= 40 ? 'text-ink' : 'text-red-600'}`}>
                      {account.score}%
                    </p>
                    <p className="text-[11px] text-muted">complete</p>
                  </div>
                </div>

                <div className="mt-3 h-1.5 w-full bg-[#eeeeee]">
                  <div className="h-full bg-[#1c1c1c]" style={{ width: `${account.score}%` }} />
                </div>

                {account.missing.length > 0 && (
                  <p className="mt-3 text-[12px] text-secondary">
                    <span className="font-semibold text-ink">Still missing:</span>{' '}
                    {account.missing.slice(0, 6).map(item => item.toLowerCase()).join(', ')}
                    {account.missing.length > 6 ? ` and ${account.missing.length - 6} more` : ''}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] px-2.5 py-1 border ${
                    account.onboardingEmail?.status === 'sent'
                      ? 'border-[#166534]/30 bg-[#f3fbf5] text-[#166534]'
                      : account.onboardingEmail
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-border text-secondary'}`}>
                    {account.onboardingEmail
                      ? `Guide ${account.onboardingEmail.status} ${ago(account.onboardingEmail.sentAt)}`
                      : hoursSince(account.createdAt) < 1 ? 'Guide goes within the hour' : 'Guide not sent'}
                  </span>

                  <button type="button" disabled={busy === account.id || !account.email}
                    onClick={() => act(account, 'send_guide', { audience: account.audience, score: account.score, missing: account.missing })}
                    className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-medium text-secondary disabled:opacity-40">
                    <Mail size={13} /> {account.onboardingEmail ? 'Send the guide again' : 'Send the guide now'}
                  </button>

                  <button type="button" disabled={!account.email}
                    onClick={() => {
                      setWriting(account)
                      setSubject('A hand with your Talent House profile')
                      setMessage(suggestedNote(account))
                    }}
                    className="flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                    <MessageSquare size={13} /> Offer them help
                  </button>
                </div>

                {writing && writing.id === account.id && (
                  <div className="mt-4 border-t border-border pt-4">
                    <label className="block text-[12px] font-semibold text-ink">Subject</label>
                    <input value={subject} onChange={e => setSubject(e.target.value)} className="input-field mt-1 w-full" />
                    <label className="block text-[12px] font-semibold text-ink mt-3">Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8}
                      className="input-field mt-1 w-full text-[13px]" />
                    <p className="mt-1.5 text-[11px] text-muted">
                      Sent from the Talent House address, and replies come back to the support mailbox.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" disabled={busy === account.id || !message.trim()}
                        onClick={() => act(account, 'offer_help', { subject, message })}
                        className="btn-primary text-[12px] px-4 py-2 disabled:opacity-40">
                        {busy === account.id ? 'Sending...' : 'Send it'}
                      </button>
                      <button type="button" onClick={() => { setWriting(null); setMessage('') }}
                        className="btn-secondary text-[12px] px-4 py-2">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

// A starting point rather than a template. It names the two things actually
// missing from this profile, because a generic "finish your profile" is the
// email everybody ignores.
function suggestedNote(account: Account): string {
  const gaps = account.missing.slice(0, 2).map(item => item.toLowerCase())
  const list = gaps.length === 2 ? `${gaps[0]} and ${gaps[1]}` : gaps[0] || 'the last few details'
  const where = account.kind === 'employer' ? 'your property page' : 'your profile'
  return `I noticed ${where} is about ${account.score}% there, and the bit holding it back is ${list}.\n\n`
    + `If it is easier, send me what you have - a CV, an old profile, a few photographs, even just a few lines in a reply - and I will put it together for you and send it back to check. It takes me ten minutes and there is no charge for it.\n\n`
    + `Rebecca`
}
