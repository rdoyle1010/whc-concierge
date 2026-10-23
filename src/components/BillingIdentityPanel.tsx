'use client'

import { useEffect, useState } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import { DEFAULT_BILLING_IDENTITY, missingForInvoicing, parseBillingIdentity, type BillingIdentity } from '@/lib/billing-identity'

// The seller's own details, printed on every receipt the platform issues.
//
// Until these are filled in, receipts go out naming a trading name and a
// website and nothing else - which is not a document a hotel's accounts
// payable team can file, and they will ask for it again. The VAT position sits
// here too rather than in the page copy, because the day Rebecca registers
// every document has to change at once.

const FIELDS: { key: keyof BillingIdentity; label: string; hint?: string; wide?: boolean }[] = [
  { key: 'legalName', label: 'Registered company name', hint: 'Exactly as it appears at Companies House.' },
  { key: 'tradingName', label: 'Trading name', hint: 'What customers know you as, if different.' },
  { key: 'companyNumber', label: 'Company number' },
  { key: 'billingEmail', label: 'Billing email', hint: 'Where payment queries should go.' },
  { key: 'registeredAddress', label: 'Registered office address', wide: true },
]

export default function BillingIdentityPanel() {
  const [identity, setIdentity] = useState<BillingIdentity>(DEFAULT_BILLING_IDENTITY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/content?kind=platform_config', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        const row = (json?.rows || []).find((entry: any) => entry.key === 'billing_identity')
        if (row) {
          // Written as JSON text, and a value typed into the SQL editor by hand
          // arrives double-encoded. Try twice before giving up.
          let value: unknown = row.value
          for (let attempt = 0; attempt < 2 && typeof value === 'string'; attempt++) {
            try { value = JSON.parse(value) } catch { break }
          }
          setIdentity(parseBillingIdentity(value))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof BillingIdentity, value: string | number) => setIdentity(current => ({ ...current, [key]: value }) as BillingIdentity)

  const save = async () => {
    setSaving(true); setNotice(null)
    const res = await fetch('/api/admin/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'config_upsert', key: 'billing_identity', value: JSON.stringify(parseBillingIdentity(identity)) }),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)
    setNotice(res.ok
      ? { kind: 'ok', text: 'Billing identity saved. Receipts issued from now on carry these details.' }
      : { kind: 'error', text: body.error || 'Could not save.' })
    setTimeout(() => setNotice(null), 5000)
  }

  const missing = missingForInvoicing(identity)

  if (loading) return <div className="dashboard-card"><div className="skeleton h-32 w-full" /></div>

  return (
    <div className="dashboard-card">
      <p className="text-[14px] font-medium text-ink">Billing identity</p>
      <p className="mt-1 text-[12px] leading-6 text-muted max-w-2xl">
        Printed on every receipt. A hotel&apos;s accounts payable team files documents against a legal entity and a
        company number - without them the receipt comes back and the payment waits.
      </p>

      {missing.length > 0 && (
        <div className="mt-4 flex gap-2.5 border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-[12px] leading-5 text-amber-800">
            Receipts are going out incomplete. Still needed: {missing.join(', ')}.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {FIELDS.map(field => (
          <div key={field.key} className={field.wide ? 'sm:col-span-2' : ''}>
            <label htmlFor={`bi-${field.key}`} className="eyebrow block mb-1.5">{field.label}</label>
            {field.wide ? (
              <textarea id={`bi-${field.key}`} rows={3} value={String(identity[field.key] ?? '')} onChange={e => set(field.key, e.target.value)} className="input-field" />
            ) : (
              <input id={`bi-${field.key}`} value={String(identity[field.key] ?? '')} onChange={e => set(field.key, e.target.value)} className="input-field" />
            )}
            {field.hint && <p className="mt-1 text-[11px] text-muted">{field.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="bi-vat-mode" className="eyebrow block mb-1.5">VAT position</label>
          <select id="bi-vat-mode" value={identity.vatMode} onChange={e => set('vatMode', e.target.value)} className="input-field">
            <option value="not_registered">Not VAT registered</option>
            <option value="registered">VAT registered</option>
          </select>
          <p className="mt-1 text-[11px] leading-5 text-muted">Change this the day you register - every document follows it.</p>
        </div>
        {identity.vatMode === 'registered' && (
          <>
            <div>
              <label htmlFor="bi-vat-number" className="eyebrow block mb-1.5">VAT number</label>
              <input id="bi-vat-number" value={identity.vatNumber} onChange={e => set('vatNumber', e.target.value)} className="input-field" />
            </div>
            <div>
              <label htmlFor="bi-vat-rate" className="eyebrow block mb-1.5">Standard rate (%)</label>
              <input id="bi-vat-rate" type="number" min={0} max={100} value={identity.vatRatePct} onChange={e => set('vatRatePct', Number(e.target.value))} className="input-field" />
            </div>
          </>
        )}
        <div>
          <label htmlFor="bi-terms" className="eyebrow block mb-1.5">Payment terms (days)</label>
          <input id="bi-terms" type="number" min={0} max={120} value={identity.paymentTermsDays} onChange={e => set('paymentTermsDays', Number(e.target.value))} className="input-field" />
          <p className="mt-1 text-[11px] leading-5 text-muted">Used when an invoice is raised on terms rather than paid by card.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={save} disabled={saving} className="btn-primary text-[12px] inline-flex items-center gap-2 disabled:opacity-50">
          <Save size={13} /> {saving ? 'Saving...' : 'Save billing identity'}
        </button>
        {notice && <p className={`text-[12px] ${notice.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
      </div>
    </div>
  )
}
