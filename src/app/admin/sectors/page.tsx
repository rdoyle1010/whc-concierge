'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { RefreshCw, Check } from 'lucide-react'
import type { Door, RateCard, Sector } from '@/lib/sectors'

// Doors and sectors decide what the platform appears to be. Turning a door on
// is the single act that opens a new part of the industry, so it lives on one
// screen with the rate cards that make Agency work in those sectors possible.

type Payload = { doors: Door[]; sectors: Sector[]; rateCards: RateCard[] }

// Matches the database default, reached only by a sector opened before its
// rates were set.
const EMPTY_CARD = { min_hourly_rate: 20, platform_fee_pct: 15, min_shift_minutes: 240 }

export default function DoorsAndSectorsPage() {
  const [data, setData] = useState<Payload>({ doors: [], sectors: [], rateCards: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [drafts, setDrafts] = useState<Record<string, typeof EMPTY_CARD>>({})

  async function load() {
    const response = await fetch('/api/admin/sectors').catch(() => null)
    if (!response || !response.ok) { setLoadError('Doors and sectors could not be loaded.'); setLoading(false); return }
    const payload: Payload = await response.json()
    setData(payload)
    setDrafts(Object.fromEntries(payload.rateCards.map(card => [card.sector_id, {
      min_hourly_rate: Number(card.min_hourly_rate),
      platform_fee_pct: Number(card.platform_fee_pct),
      min_shift_minutes: Number(card.min_shift_minutes),
    }])))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const grouped = useMemo(() => {
    const rows = data.doors.map(door => ({
      door,
      sectors: data.sectors.filter(sector => sector.door_id === door.id),
    }))
    const orphans = data.sectors.filter(sector => !sector.door_id)
    return { rows, orphans }
  }, [data])

  async function send(body: Record<string, unknown>, key: string) {
    setBusy(key); setNotice(null)
    const response = await fetch('/api/admin/sectors', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).catch(() => null)
    const result = await response?.json().catch(() => ({}))
    setBusy(null)
    if (!response || !response.ok) {
      setNotice({ type: 'error', text: result?.error || 'That change could not be saved.' })
      return false
    }
    await load()
    setNotice({ type: 'success', text: 'Saved. The change is live now.' })
    return true
  }

  const draftFor = (sectorId: string) => drafts[sectorId] || EMPTY_CARD
  const updateDraft = (sectorId: string, field: keyof typeof EMPTY_CARD, value: number) =>
    setDrafts(current => ({ ...current, [sectorId]: { ...draftFor(sectorId), [field]: value } }))

  function SectorRow({ sector, doorLive }: { sector: Sector; doorLive: boolean }) {
    const card = draftFor(sector.id)
    return (
      <div className="border-t border-border py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-ink">{sector.label}</p>
            <p className="text-[11px] text-muted font-mono">{sector.slug}</p>
          </div>
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={sector.is_live}
              disabled={busy !== null}
              onChange={event => send({ action: 'set_sector_live', id: sector.id, is_live: event.target.checked }, sector.id)}
            />
            Live
          </label>
        </div>
        {sector.is_live && !doorLive && (
          <p className="mt-2 text-[11px] text-secondary">This sector is live but its door is not, so nobody can reach it yet.</p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="text-[11px] text-secondary">Minimum hourly rate (£)
            <input type="number" step="0.50" min="0.5" value={card.min_hourly_rate} className="input-field mt-1"
              onChange={event => updateDraft(sector.id, 'min_hourly_rate', Number(event.target.value))} />
          </label>
          <label className="text-[11px] text-secondary">Platform fee (%)
            <input type="number" step="0.5" min="0" max="100" value={card.platform_fee_pct} className="input-field mt-1"
              onChange={event => updateDraft(sector.id, 'platform_fee_pct', Number(event.target.value))} />
          </label>
          <label className="text-[11px] text-secondary">Minimum shift (minutes)
            <input type="number" step="15" min="15" value={card.min_shift_minutes} className="input-field mt-1"
              onChange={event => updateDraft(sector.id, 'min_shift_minutes', Number(event.target.value))} />
          </label>
          <button type="button" disabled={busy !== null} className="btn-secondary text-[12px] disabled:opacity-50"
            onClick={() => send({ action: 'save_rate_card', sector_id: sector.id, ...card }, `card-${sector.id}`)}>
            {busy === `card-${sector.id}` ? <RefreshCw size={13} className="animate-spin" /> : 'Save rates'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell role="admin">
      <p className="dashboard-eyebrow">Platform structure</p>
      <h1 className="dashboard-title">Doors &amp; sectors</h1>
      <p className="dashboard-intro max-w-2xl">
        A door is a part of the industry; a sector is a trade inside it. Only live sectors inside live doors can be
        chosen on a role, picked on a profile or filtered on the jobs page - so a door that is not ready is built,
        seeded and invisible. Rate cards set what Agency work in each sector is worth.
      </p>

      {notice && (
        <div role="status" className={`mt-5 border px-4 py-3 text-[13px] ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
          {notice.text}
        </div>
      )}
      {loadError && <div role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{loadError}</div>}
      {loading && <p className="mt-6 text-[13px] text-secondary">Loading...</p>}

      {grouped.rows.map(({ door, sectors }) => (
        <section key={door.id} className="dashboard-panel mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="dashboard-section-title">{door.label}</h2>
              <p className="text-[11px] text-muted font-mono">{door.slug}</p>
            </div>
            <label className="flex items-center gap-2 text-[12px] font-medium">
              <input
                type="checkbox"
                checked={door.is_live}
                disabled={busy !== null}
                onChange={event => send({ action: 'set_door_live', id: door.id, is_live: event.target.checked }, door.id)}
              />
              Door is live
            </label>
          </div>
          {!door.is_live && (
            <p className="mt-2 text-[12px] text-secondary">
              Closed. Nothing inside this door appears anywhere on the platform, whatever the sectors below say.
            </p>
          )}
          <div className="mt-4">
            {sectors.length
              ? sectors.map(sector => <SectorRow key={sector.id} sector={sector} doorLive={door.is_live} />)
              : <p className="text-[12px] text-muted">No sectors in this door yet.</p>}
          </div>
        </section>
      ))}

      {grouped.orphans.length > 0 && (
        <section className="dashboard-panel mt-6">
          <h2 className="dashboard-section-title">Not in a door yet</h2>
          <p className="mt-1 text-[12px] text-secondary">
            These cannot go live until they belong to a door, because there is nowhere to show them.
          </p>
          <div className="mt-4">
            {grouped.orphans.map(sector => (
              <div key={sector.id} className="flex items-center justify-between border-t border-border py-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">{sector.label}</p>
                  <p className="text-[11px] text-muted font-mono">{sector.slug}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                  {sector.is_live ? <><Check size={12} /> marked live</> : 'closed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  )
}
