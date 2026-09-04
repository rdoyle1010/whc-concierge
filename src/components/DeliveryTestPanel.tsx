'use client'

import { useEffect, useState } from 'react'
import { Send, Check, AlertTriangle, MessageSquare, Mail } from 'lucide-react'

// "Somebody signed up and never got an email" - answered in ten seconds.
//
// Before this, the only way to test delivery was to register a fake account
// and wait, and a missing API key, an unverified sending domain and a spam
// folder all produced the same result: nothing. This sends a real message
// down the real path and prints what came back.

type Status = { providerConfigured: boolean; from?: string; to: string | null; rejected?: boolean; usingAccountFallback?: boolean }
type Config = { email: Status; sms: Status }
type Outcome = { status: 'sent' | 'failed' | 'skipped'; detail: string }

export default function DeliveryTestPanel() {
  const [config, setConfig] = useState<Config | null>(null)
  const [busy, setBusy] = useState<'email' | 'sms' | null>(null)
  const [result, setResult] = useState<Record<string, Outcome>>({})

  const load = () => fetch('/api/admin/delivery-test', { cache: 'no-store' })
    .then(res => res.ok ? res.json() : null)
    .then(setConfig)
    .catch(() => setConfig(null))

  useEffect(() => { load() }, [])

  async function test(channel: 'email' | 'sms') {
    setBusy(channel)
    setResult(current => ({ ...current, [channel]: undefined as any }))
    try {
      const res = await fetch('/api/admin/delivery-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      })
      const body = await res.json().catch(() => ({}))
      setResult(current => ({
        ...current,
        [channel]: { status: body.status || 'failed', detail: body.detail || body.error || 'No answer from the server.' },
      }))
    } catch (err: any) {
      setResult(current => ({ ...current, [channel]: { status: 'failed', detail: err?.message || 'Could not reach the server.' } }))
    }
    setBusy(null)
    // A number saved a moment ago should show as saved once the test has run.
    load()
  }

  const rows: { channel: 'email' | 'sms'; icon: React.ReactNode; label: string; status?: Status; missing: string }[] = [
    {
      channel: 'email', icon: <Mail size={15} />, label: 'Email',
      status: config?.email,
      missing: 'RESEND_API_KEY is not set on this deployment, so no email is being sent at all. Add it in Netlify and redeploy.',
    },
    {
      channel: 'sms', icon: <MessageSquare size={15} />, label: 'Text message',
      status: config?.sms,
      missing: 'Twilio is not configured on this deployment. Add TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET and TWILIO_FROM_NUMBER in Netlify, then redeploy.',
    },
  ]

  return <div className="dashboard-card">
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7e7e7] text-[#1c1c1c]"><Send size={18} /></div>
      <div>
        <p className="text-[15px] font-semibold text-ink">Is anything actually being delivered?</p>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">
          Sends a real message to your own alert address and number, down the same path a member&apos;s welcome
          email takes. Use it before you assume a sign-up went unnoticed - the answer here is definitive.
        </p>
      </div>
    </div>

    <div className="space-y-3">
      {rows.map(row => {
        const outcome = result[row.channel]
        const configured = row.status?.providerConfigured
        return <div key={row.channel} className="rounded-2xl border border-border bg-[#f1f1f1] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-ink">{row.icon}{row.label}</div>
            <button
              type="button"
              onClick={() => test(row.channel)}
              disabled={busy !== null}
              className="btn-secondary !px-4 text-[12px] disabled:opacity-50"
            >{busy === row.channel ? 'Sending...' : `Send a test ${row.channel === 'sms' ? 'text' : 'email'}`}</button>
          </div>

          <div className="mt-2.5 space-y-1 text-[11.5px] leading-5 text-muted">
            {config === null ? <p>Checking...</p> : <>
              {configured
                ? <p>Provider connected{row.status?.from ? <> - sending as <span className="text-secondary">{row.status.from}</span></> : null}</p>
                : <p className="text-amber-700 flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{row.missing}</p>}
              {row.status?.to
                ? <p>Goes to <span className="text-secondary">{row.status.to}</span>{row.status.usingAccountFallback
                  ? <> - your own sign-in address, because no alert address is saved below. Fine for you; set one if anybody else should receive them.</>
                  : null}</p>
                : row.status?.rejected
                  ? <p className="text-amber-700">The number saved above is not one we can text. Use the 07... form, eleven digits.</p>
                  : <p className="text-amber-700">Nothing saved to send to. Fill this in under General configuration below and save it.</p>}
            </>}
          </div>

          {outcome && <div className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12px] leading-5 ${
            outcome.status === 'sent' ? 'bg-emerald-50 text-emerald-800'
              : outcome.status === 'skipped' ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-700'}`}>
            {outcome.status === 'sent'
              ? <Check size={14} className="mt-0.5 shrink-0" />
              : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            <span>{outcome.detail}</span>
          </div>}
        </div>
      })}
    </div>

    <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-4 text-muted">
      Every test, and every real message, is recorded under Messages We Sent - including the ones that failed and why.
    </p>
  </div>
}
