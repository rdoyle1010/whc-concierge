'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash2, RefreshCw } from 'lucide-react'

type Category = { key: string; label: string; period: string; action: string; reason: string; count: number; note?: string; error?: string }
type Excluded = { table: string; reason: string }
type DryRun = {
  generatedAt?: string
  total: number
  categories: Category[]
  excluded: Excluded[]
  lastRun?: { ran_at: string; summary: any } | null
}

const when = (value?: string | null) =>
  value ? new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'never'

export default function RetentionPanel() {
  const [data, setData] = useState<DryRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/retention', { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (res.ok) setData(body)
      else setMessage(body.error || 'Could not load the retention preview.')
    } catch {
      setMessage('Could not load the retention preview.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const run = async () => {
    if (!confirm('Run the retention sweep now? Everything past its period is permanently deleted. Financial records are never touched.')) return
    setRunning(true); setMessage('')
    try {
      const res = await fetch('/api/admin/retention', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) setMessage(body.error || 'The sweep could not be run.')
      else {
        const problems = (body.categories || []).filter((c: Category) => c.error)
        setMessage(problems.length
          ? `Swept ${body.total} record(s). ${problems.length} categor${problems.length === 1 ? 'y' : 'ies'} reported a problem - see the server log.`
          : `Swept ${body.total} record(s).${body.recorded === false ? ' The run could not be logged - the retention migration has not been applied yet.' : ''}`)
      }
    } catch {
      setMessage('The sweep could not be run.')
    }
    setRunning(false)
    await load()
  }

  return (
    <div className="dashboard-card">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-[#f5f6f8] text-[#0b2f4d]"><Trash2 size={18} /></div>
        <div>
          <p className="text-[15px] font-semibold text-ink">Data retention</p>
          <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">
            WHC keeps personal data only for the periods below. This runs on demand rather than on a schedule, so it should be run periodically - roughly once a month is enough to keep the platform inside its own policy. The preview below is a dry run and deletes nothing.
          </p>
        </div>
      </div>

      {message && <div className="mb-4 border border-border bg-[#f5f6f8] px-4 py-3 text-[12px] text-secondary">{message}</div>}

      {loading ? (
        <p className="text-[13px] text-muted">Loading the preview...</p>
      ) : !data ? (
        <p className="text-[13px] text-muted">No preview available.</p>
      ) : (
        <>
          <div className="border border-border">
            {data.categories.map(category => (
              <div key={category.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3 last:border-b-0">
                <div className="min-w-[220px] flex-1">
                  <p className="text-[13px] font-medium text-ink">{category.label}</p>
                  <p className="text-[11px] leading-4 text-muted">{category.period}{category.action === 'clear' ? ' - cleared, not deleted' : ''}</p>
                </div>
                <p className={`text-[13px] font-semibold ${category.error ? 'text-red-600' : category.count ? 'text-ink' : 'text-muted'}`}>
                  {category.error ? 'unavailable' : `${category.count} due`}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-4 text-muted">
            {data.total} record{data.total === 1 ? '' : 's'} are currently past their period. Last sweep: {when(data.lastRun?.ran_at)}.
          </p>

          <div className="mt-4 border-t border-border pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a949b]">Never swept</p>
            <ul className="mt-2 space-y-1">
              {data.excluded.map(item => (
                <li key={item.table} className="text-[11px] leading-4 text-muted"><span className="font-medium text-secondary">{item.table}</span> - {item.reason}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-[10.5px] leading-4 text-muted">Deleting is permanent. Run the preview again afterwards to confirm.</p>
            <div className="flex gap-2">
              <button type="button" onClick={load} disabled={running} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"><RefreshCw size={14} />Refresh preview</button>
              <button type="button" onClick={run} disabled={running || data.total === 0} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"><Trash2 size={14} />{running ? 'Running...' : 'Run sweep now'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
