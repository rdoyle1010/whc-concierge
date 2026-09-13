'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Check, X } from 'lucide-react'
import type { WriteField } from '@/lib/ai-write'

// The button next to the blank box.
//
// Two things it must never do: save anything by itself, and replace something
// somebody wrote without showing it to them first. A draft appears, they read
// it, and they decide. If they do not like it they say why in one line and
// press again, which is how a person actually works with a draft.

type Props = {
  field: WriteField
  /** What is in the box now. Empty means there is nothing to improve. */
  value: string
  onAccept: (text: string) => void
  /** Which box this is, where one shape serves many. */
  subject?: string
  /** Extra detail the server cannot read from a saved record, for an unsaved role. */
  context?: Record<string, unknown>
  className?: string
}

export default function AiWrite({ field, value, onAccept, subject, context, className = '' }: Props) {
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const [steer, setSteer] = useState('')
  const [error, setError] = useState('')

  const hasText = String(value || '').trim().length > 40

  async function run(mode: 'write' | 'improve') {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, mode, draft: value, steer, subject, ...(context || {}) }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        setError(body?.error || `That did not work (${res.status}). Try again in a moment.`)
        return
      }
      setDraft(body.text || '')
    } catch {
      setError('That did not work. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => run('write')} disabled={busy}
          className="inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-[#1c1c1c] disabled:opacity-40">
          <Sparkles size={13} /> {busy ? 'Writing...' : hasText ? 'Write a fresh one' : 'Write it for me'}
        </button>
        {hasText && (
          <button type="button" onClick={() => run('improve')} disabled={busy}
            className="inline-flex items-center gap-1.5 border border-[#dddddd] px-3 py-1.5 text-[12px] font-medium text-[#555555] disabled:opacity-40">
            <RefreshCw size={13} /> Make mine read better
          </button>
        )}
        <span className="text-[11px] text-[#777777]">
          From what is already on here. Nothing is saved until you say so.
        </span>
      </div>

      {error && (
        <p className="mt-2 border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
      )}

      {draft && (
        <div className="mt-3 border border-[#1c1c1c] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#777777]">A draft, for you to read</p>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-[#1c1c1c]">{draft}</p>

          <label className="mt-3 block">
            <span className="block text-[11px] text-[#777777]">Not quite? Say what to change and press again.</span>
            <input value={steer} onChange={e => setSteer(e.target.value)}
              placeholder="Shorter. Less about training, more about running the floor."
              className="mt-1 w-full border border-[#dddddd] px-3 py-2 text-[13px]" />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { onAccept(draft); setDraft(''); setSteer('') }}
              className="inline-flex items-center gap-1.5 bg-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-white">
              <Check size={13} /> Use this
            </button>
            <button type="button" disabled={busy} onClick={() => run(hasText ? 'improve' : 'write')}
              className="inline-flex items-center gap-1.5 border border-[#dddddd] px-3 py-1.5 text-[12px] font-medium text-[#555555] disabled:opacity-40">
              <RefreshCw size={13} /> {busy ? 'Writing...' : 'Try again'}
            </button>
            <button type="button" onClick={() => { setDraft(''); setSteer(''); setError('') }}
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[12px] text-[#777777]">
              <X size={13} /> Leave mine as it is
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
