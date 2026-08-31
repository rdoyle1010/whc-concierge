'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, MessageSquare } from 'lucide-react'

export default function AgencyCaseAgreementPanel({ role }: { role: 'talent'|'employer' }) {
  const [cases, setCases] = useState<any[]>([])
  const [messages, setMessages] = useState<Record<string,string>>({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/agency/cases')
    if (res.ok) setCases((await res.json()).cases || [])
  }

  useEffect(() => { load() }, [])

  async function sendMessage(caseId: string) {
    const message = (messages[caseId] || '').trim()
    if (!message) return
    setBusy(true); setError(''); setNotice('')
    const res = await fetch('/api/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'message', caseId, message }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) setError(body.error || 'Could not send message.')
    else { setMessages(v => ({ ...v, [caseId]: '' })); setNotice('Message added to the case.'); await load() }
    setBusy(false)
  }

  async function agree(caseId: string) {
    setBusy(true); setError(''); setNotice('')
    const res = await fetch('/api/agency/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'agree', caseId }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) setError(body.error || 'Could not record your agreement.')
    else {
      setNotice(body.bothAgreed ? (body.awaitingPayment ? 'Both sides agreed. The approved additional payment is now due from the property.' : 'Both sides agreed. The case is now resolved.') : 'Your agreement has been recorded. Waiting for the other side to sign.')
      await load()
    }
    setBusy(false)
  }

  const active = cases.filter(row => !['resolved','rejected'].includes(row.status))
  if (!active.length) return null

  return <section className="mt-8 space-y-4">
    <div>
      <p className="dashboard-eyebrow">Case discussion & agreement</p>
      <h2 className="font-serif text-2xl text-ink">Keep talking until both sides agree.</h2>
      <p className="text-sm text-secondary mt-1 max-w-3xl">You can add further information while WHC reviews the case. When WHC proposes a resolution, both the professional and property must sign before any settlement is applied.</p>
    </div>
    {notice && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">{notice}</div>}
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
    {active.map(row => {
      const mySigned = role === 'talent' ? Boolean(row.candidate_agreed_at) : Boolean(row.employer_agreed_at)
      const otherSigned = role === 'talent' ? Boolean(row.employer_agreed_at) : Boolean(row.candidate_agreed_at)
      return <div key={row.id} className="dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-wider text-accent">Case {row.id.slice(0,8).toUpperCase()}</p><p className="text-sm text-secondary mt-1">Status: {String(row.status).replace(/_/g,' ')}</p></div>
          {row.status === 'awaiting_agreement' && <div className="flex gap-2 text-[11px]"><span className={`px-2.5 py-1 rounded-full ${row.candidate_agreed_at ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-secondary'}`}>Professional {row.candidate_agreed_at ? 'signed' : 'waiting'}</span><span className={`px-2.5 py-1 rounded-full ${row.employer_agreed_at ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-secondary'}`}>Property {row.employer_agreed_at ? 'signed' : 'waiting'}</span></div>}
        </div>

        {(row.messages || []).length > 0 && <div className="mt-4 space-y-2">{row.messages.map((m:any) => <div key={m.id} className="bg-[#f5f6f8] border border-[#e3e7eb] p-3 text-sm"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted"><MessageSquare size={11}/>{m.sender_role === 'candidate' ? 'Professional' : m.sender_role === 'employer' ? 'Property' : 'WHC Admin'}</div><p className="mt-1 whitespace-pre-wrap text-gray-700">{m.message}</p></div>)}</div>}

        {!['awaiting_payment','resolved','rejected'].includes(row.status) && <div className="mt-4"><textarea className="input-field min-h-20" value={messages[row.id] || ''} onChange={e => setMessages(v => ({ ...v, [row.id]: e.target.value }))} placeholder="Add more information or reply to the other side..."/><button disabled={busy} onClick={() => sendMessage(row.id)} className="btn-secondary mt-2 text-xs">Add to case discussion</button></div>}

        {row.status === 'awaiting_agreement' && <div className="mt-5 border border-accent/25 bg-[#f5f6f8] p-4 rounded-xl"><p className="text-[10px] uppercase tracking-wider text-accent">WHC proposed resolution</p><p className="font-medium text-ink mt-2 whitespace-pre-wrap">{row.proposed_resolution}</p><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm"><div><span className="text-muted">Employer refund</span><p className="font-semibold">£{Number(row.proposed_refund_amount || 0)}</p></div><div><span className="text-muted">Extra professional pay</span><p className="font-semibold">£{Number(row.proposed_extra_amount || 0)}</p></div><div><span className="text-muted">Final professional payout</span><p className="font-semibold">£{Number(row.proposed_payout_amount || 0)}</p></div></div><div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><p className="text-xs text-gray-600">By signing, you confirm that you accept these terms as the resolution of this Agency case.</p>{mySigned ? <span className="text-xs text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={14}/>You have signed. {otherSigned ? 'Both sides agreed.' : 'Waiting for the other side.'}</span> : <button disabled={busy} onClick={() => agree(row.id)} className="btn-primary text-xs">I agree & sign resolution</button>}</div></div>}
      </div>
    })}
  </section>
}
