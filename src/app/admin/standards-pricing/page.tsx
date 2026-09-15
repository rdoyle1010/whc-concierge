'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Check, Plus, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/documents/pricing'

// Prices and bundles, hers to change.
//
// The defaults stay in the code with the reasoning beside them, and this
// screen shows both: what it is now, what the code says, and whether she has
// changed it. Putting one back is deleting the override rather than typing
// the old number in, because a number typed back in stops being the default
// the day the default changes.

type Price = {
  key: string; label: string; why: string; fallback: number; current: number; overridden: boolean
  group?: 'document' | 'pack'
}
type Bundle = {
  id: string; slug: string; name: string; blurb: string | null; pricePence: number
  packSlugs: string[]; documentReferences: string[]; isLive: boolean; sortOrder: number
}
type PackOption = { slug: string; name: string; count: number; price: number }

const pounds = (pence: number) => (pence / 100).toFixed(2)

export default function StandardsPricingPage() {
  const [prices, setPrices] = useState<Price[]>([])
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [packs, setPacks] = useState<PackOption[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Partial<Bundle> | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/standards-pricing', { cache: 'no-store' })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) { setError(body?.error || 'Could not load the prices.'); setLoading(false); return }
    setPrices(body.prices || [])
    setBundles(body.bundles || [])
    setPacks(body.packs || [])
    setDraft(Object.fromEntries((body.prices || []).map((p: Price) => [p.key, pounds(p.current)])))
    setLoading(false)
  }

  useEffect(() => { load().catch(() => { setError('Could not load the prices.'); setLoading(false) }) }, [])

  async function act(action: string, payload: Record<string, unknown>, key: string) {
    setBusy(key); setError(''); setNote('')
    try {
      const res = await fetch('/api/admin/standards-pricing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) { setError(body?.error || 'That did not save.'); setBusy(''); return false }
      setNote(body?.note || 'Saved.')
      await load()
      setBusy('')
      return true
    } catch {
      setError('That did not save. Check your connection.')
      setBusy('')
      return false
    }
  }

  const toggle = (list: string[] | undefined, value: string) =>
    (list || []).includes(value) ? (list || []).filter(entry => entry !== value) : [...(list || []), value]

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <p className="eyebrow">Standards</p>
        <h1 className="mt-1 text-[32px]">Prices and bundles</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-secondary">
          A price change here is live on the shop immediately. Anybody who has already bought something keeps it
          at what they paid.
        </p>

        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
        {note && <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

        {loading ? <p className="mt-8 text-[13px] text-secondary">Loading...</p> : (
          <>
            {/* Two lists, because there are now twenty-four rows and they
                answer different questions. What one document costs decides
                the way into the shop; what a pack costs decides the size of
                the order. Changing a document price moves every pack that
                contains it, because a pack is capped at what its own
                documents cost bought one at a time, so it is not possible to
                set a number here that makes a pack look like a swindle. */}
            {(['document', 'pack'] as const).map(group => (
            <div key={group} className="mt-8 border-t border-border">
              <p className="pt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">
                {group === 'document'
                  ? 'One document, by what kind of document it is'
                  : 'The packs'}
              </p>
              {prices.filter(price => (price.group || 'pack') === group).map(price => (
                <div key={price.key} className="border-b border-border py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink">{price.label}</p>
                      <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-secondary">{price.why}</p>
                      {/* Both numbers, so she can see what she changed and
                          what the reasoning behind the original was. */}
                      <p className="mt-1.5 text-[11px] text-muted">
                        {price.overridden
                          ? `Changed by you. The price in the code is ${formatPrice(price.fallback)}.`
                          : 'This is the price in the code.'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[13px] text-secondary">£</span>
                      <input
                        type="number" min="1" step="1" inputMode="decimal"
                        value={draft[price.key] ?? ''}
                        onChange={event => setDraft(current => ({ ...current, [price.key]: event.target.value }))}
                        aria-label={`Price for ${price.label}`}
                        className="w-24 border border-border px-2 py-1.5 text-right text-[14px] text-ink"
                      />
                      <button type="button" disabled={busy === price.key}
                        onClick={() => act('set_price', { key: price.key, pricePence: Math.round(Number(draft[price.key]) * 100) }, price.key)}
                        className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
                        {busy === price.key ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                      {price.overridden && (
                        <button type="button" disabled={busy === price.key}
                          onClick={() => act('reset_price', { key: price.key }, price.key)}
                          title="Put it back to the price in the code"
                          className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[12px] text-secondary disabled:opacity-40">
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            ))}

            <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-semibold text-ink">Bundles</h2>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-secondary">
                  Any packs, any individual documents, one price. A bundle is not on the shop until you make it
                  live, and it only sells when every document in it is signed off.
                </p>
              </div>
              <button type="button"
                onClick={() => setEditing({ name: '', blurb: '', pricePence: 0, packSlugs: [], documentReferences: [], isLive: false, sortOrder: 0 })}
                className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink">
                <Plus size={13} /> New bundle
              </button>
            </div>

            {bundles.length === 0 && !editing && (
              <p className="mt-5 text-[13px] text-secondary">
                No bundles yet. A hotel group wanting the safety procedure and the risk register together is the
                obvious first one.
              </p>
            )}

            <div className="mt-5 border-t border-border">
              {bundles.map(bundle => (
                <div key={bundle.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">
                      {bundle.name}
                      {!bundle.isLive && <span className="ml-2 text-[11px] font-normal text-amber-700">Not live</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {bundle.packSlugs.length} {bundle.packSlugs.length === 1 ? 'pack' : 'packs'}
                      {bundle.documentReferences.length > 0 && `, ${bundle.documentReferences.length} single documents`}
                      {' · /standards, '}{bundle.slug}
                    </p>
                  </div>
                  <p className="shrink-0 font-serif text-[18px] text-ink">{formatPrice(bundle.pricePence)}</p>
                  <button type="button" onClick={() => setEditing(bundle)}
                    className="shrink-0 border border-border px-3 py-1.5 text-[12px] text-secondary">Edit</button>
                  <button type="button" disabled={busy === bundle.id}
                    onClick={() => act('delete_bundle', { id: bundle.id }, bundle.id)}
                    className="shrink-0 border border-red-200 px-2.5 py-1.5 text-[12px] text-red-700 disabled:opacity-40">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {editing && (
              <div className="mt-8 border border-[#1c1c1c] p-5">
                <h3 className="text-[16px] font-semibold text-ink">{editing.id ? 'Edit bundle' : 'New bundle'}</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bundle-name" className="block text-[12px] font-medium text-ink">Name</label>
                    <input id="bundle-name" value={editing.name || ''}
                      onChange={e => setEditing(c => ({ ...c, name: e.target.value }))}
                      className="mt-1.5 w-full border border-border px-3 py-2 text-[14px]" />
                  </div>
                  <div>
                    <label htmlFor="bundle-price" className="block text-[12px] font-medium text-ink">Price, in pounds</label>
                    <input id="bundle-price" type="number" min="1" step="1"
                      value={editing.pricePence ? pounds(editing.pricePence) : ''}
                      onChange={e => setEditing(c => ({ ...c, pricePence: Math.round(Number(e.target.value) * 100) }))}
                      className="mt-1.5 w-full border border-border px-3 py-2 text-[14px]" />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="bundle-blurb" className="block text-[12px] font-medium text-ink">
                    What it is, in a sentence or two
                  </label>
                  <textarea id="bundle-blurb" rows={2} value={editing.blurb || ''}
                    onChange={e => setEditing(c => ({ ...c, blurb: e.target.value }))}
                    className="mt-1.5 w-full border border-border px-3 py-2 text-[14px]" />
                </div>

                <p className="mt-5 text-[12px] font-semibold uppercase tracking-[.1em] text-muted">What is in it</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {packs.map(pack => (
                    <label key={pack.slug} className="flex items-start gap-2 text-[13px] text-ink">
                      <input type="checkbox" className="mt-1 h-3.5 w-3.5"
                        checked={(editing.packSlugs || []).includes(pack.slug)}
                        onChange={() => setEditing(c => ({ ...c, packSlugs: toggle(c?.packSlugs, pack.slug) }))} />
                      <span>{pack.name} <span className="text-muted">({pack.count})</span></span>
                    </label>
                  ))}
                </div>

                <label className="mt-5 flex items-center gap-2 text-[13px] text-ink">
                  <input type="checkbox" className="h-3.5 w-3.5" checked={editing.isLive === true}
                    onChange={e => setEditing(c => ({ ...c, isLive: e.target.checked }))} />
                  Live on the shop
                </label>

                <div className="mt-5 flex items-center gap-2">
                  <button type="button" disabled={busy === 'bundle'}
                    onClick={async () => {
                      if (await act('save_bundle', { ...editing }, 'bundle')) setEditing(null)
                    }}
                    className="inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40">
                    {busy === 'bundle' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save bundle
                  </button>
                  <button type="button" onClick={() => setEditing(null)}
                    className="border border-border px-3 py-2 text-[13px] text-secondary">Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  )
}
