'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

// One button, wherever something can be bought.
//
// The price is never sent from here. The browser says which pack or which
// document, and the server works out what that costs against what is actually
// signed off. A checkout that trusts an amount from the page is a checkout
// somebody buys the complete library through for a pound.

type Props =
  | { packSlug: string; reference?: never; label: string; primary?: boolean }
  | { reference: string; packSlug?: never; label: string; primary?: boolean }

export default function BuyButton({ packSlug, reference, label, primary = true }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function buy() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/standards/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packSlug ? { packSlug } : { reference }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.url) {
        setError(body?.error || 'That could not be started, and nothing has been charged.')
        setBusy(false)
        return
      }
      window.location.href = body.url
    } catch {
      setError('That could not be started. Check your connection: nothing has been charged.')
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1.5">
      <button type="button" onClick={buy} disabled={busy}
        className={primary
          ? 'inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50'
          : 'inline-flex items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-[#1c1c1c] disabled:opacity-50'}>
        {busy && <Loader2 size={13} className="animate-spin" />}
        {busy ? 'Opening checkout...' : label}
      </button>
      {/* Said next to the button that failed, not at the top of a long page
          where somebody scrolls past it and presses again. */}
      {error && <span className="max-w-[300px] text-right text-[12px] text-[#b45309]">{error}</span>}
    </span>
  )
}
