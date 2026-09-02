import Link from 'next/link'
import { Lock, Check } from 'lucide-react'
import DashboardShell from '@/components/DashboardShell'

// A feature that simply vanishes from the menu sells nothing. A locked one
// that shows exactly what is behind it, and what it costs to open, is the
// upgrade prompt - so the block is a sales page, not an error.

export default function UpgradePanel({
  eyebrow,
  heading,
  intro,
  points,
  href = '/employer/billing',
  cta = 'See membership options',
}: {
  eyebrow: string
  heading: string
  intro: string
  points: string[]
  href?: string
  cta?: string
}) {
  return (
    <DashboardShell role="employer">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
          <Lock size={11} /> {eyebrow}
        </span>
        <h1 className="dashboard-title mt-4">{heading}</h1>
        <p className="dashboard-intro">{intro}</p>

        <ul className="mt-7 border-t border-border">
          {points.map(point => (
            <li key={point} className="flex items-start gap-3 border-b border-border py-3.5 text-[13px] leading-6 text-body">
              <Check size={15} className="mt-1 shrink-0 text-ink" />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href={href} className="btn-primary">{cta}</Link>
          <Link href="/employer/dashboard" className="btn-ghost">Back to dashboard</Link>
        </div>
      </div>
    </DashboardShell>
  )
}
