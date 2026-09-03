'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'

// Two readings of the same trading year, side by side.
//
// On an agency shift the property pays the whole amount and the professional
// is paid out of it. Whether that whole amount counts as turnover decides
// whether the year sits comfortably below the VAT threshold or well over it -
// and the gap between the two answers is roughly sevenfold. Registering late
// is the expensive version: VAT is owed on sales already made, and a property
// cannot be billed for it a year afterwards, so it comes out of margin.

const money = (pence: number) => `£${(pence / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`

// Grey is the brand colour and the portal repaints amber and yellow to neutral
// on purpose, so the warning state is carried by weight, border and wording
// rather than by a colour that would be stripped back out.
function Reading({ data, caution }: { data: any; caution: string }) {
  const pct = Math.min(100, Math.max(0, data.pctOfThreshold))
  const alarming = data.over || pct >= 75
  return (
    <div className={`border p-4 ${alarming ? 'border-[#1c1c1c] bg-[#f1f1f1]' : 'border-border bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{data.label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[26px] font-semibold text-ink">{money(data.turnoverPence)}</p>
        {alarming && <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">{data.over ? 'Over' : 'Close'}</span>}
      </div>
      <div className="mt-3 h-1.5 w-full bg-[#e7e7e7]">
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-secondary">
        {data.over
          ? 'Over the threshold on this reading.'
          : `${money(data.headroomPence)} of headroom - ${pct}% of the threshold.`}
        {data.months_to_threshold !== null && data.months_to_threshold !== undefined && !data.over && (
          <span className="block mt-0.5">At the last three months&apos; run rate, about {data.months_to_threshold} month{data.months_to_threshold === 1 ? '' : 's'} away.</span>
        )}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted">{caution}</p>
    </div>
  )
}

export default function VatExposurePanel() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/vat-exposure', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : res.json().then(body => Promise.reject(body?.error || 'Could not load')))
      .then(setData)
      .catch(message => setError(String(message)))
  }, [])

  if (error) return <div className="dashboard-card"><p className="text-[13px] text-red-600">VAT exposure unavailable - {error}</p></div>
  if (!data) return <div className="dashboard-card"><div className="skeleton h-40 w-full" /></div>

  const worst = data.principal?.over || data.principal?.pctOfThreshold >= 75

  return (
    <div className="dashboard-card">
      <div className="flex items-start gap-2.5">
        <TrendingUp size={16} className="mt-0.5 shrink-0 text-muted" />
        <div>
          <p className="text-[14px] font-medium text-ink">VAT threshold - rolling 12 months</p>
          <p className="mt-1 text-[12px] leading-6 text-muted max-w-2xl">
            The threshold test is a rolling twelve months, not a tax year - a strong summer can take you over in
            September while the year-to-date figure still looks safe. Which of these two numbers is your turnover
            depends on whether Talent House introduces professionals or supplies them.
          </p>
        </div>
      </div>

      {worst && (
        <div className="mt-4 flex gap-2.5 border border-[#1c1c1c] bg-[#f1f1f1] p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-ink" />
          <p className="text-[12px] leading-5 text-ink">
            On the principal reading you are at or near the threshold. Get the question settled with an accountant now:
            registering late means paying VAT out of margin on sales already made.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Reading data={data.agent} caution="Applies if professionals are engaged by the property and Talent House introduces them for a commission." />
        <Reading data={data.principal} caution="Applies if professionals are engaged by Talent House and supplied to the property - the likelier reading where Talent House takes the whole payment and pays the professional." />
      </div>

      <div className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-muted space-y-1">
        <p>Own products {money(data.reading.ownProductsPence)} - turnover under either reading. Pass-through bookings: {money(data.reading.commissionPence)} kept as commission on {money(data.reading.passThroughGrossPence)} of booking value, across {data.agency_bookings} paid shifts.</p>
        <p>Cancelled, refunded and disputed bookings are excluded. This is a management figure to prompt the question, not a VAT return - your accountant decides which reading applies.</p>
      </div>
    </div>
  )
}
