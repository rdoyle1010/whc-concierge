'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { academyResources } from '@/lib/academy-resources'
import { ArrowLeft, Download, FileSpreadsheet, FileText, LockKeyhole } from 'lucide-react'

export default function AcademyResourcesPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : String(params?.slug || '')
  const resources = academyResources(slug)
  const title = slug === 'spa-director-programme' ? 'Spa Director Toolkit' : 'Spa Manager Toolkit'

  return (
    <DashboardShell role="talent">
      <Link href={`/talent/academy/${slug}`} className="mb-5 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> Back to programme</Link>
      <div className="mb-7">
        <p className="dashboard-eyebrow">WHC Academy resources</p>
        <h1 className="dashboard-title">{title}</h1>
        <p className="dashboard-intro">Practical working documents included with your programme. Download them, use them with real spa numbers and keep them as part of your management toolkit.</p>
      </div>

      {resources.length === 0 ? (
        <div className="dashboard-card text-[13px] text-secondary">No downloadable resources are available for this programme yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => {
            const spreadsheet = resource.contentType.startsWith('text/csv')
            return (
              <article key={resource.id} className="dashboard-card flex flex-col">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f0eb] text-[#1c1b1a]">
                  {spreadsheet ? <FileSpreadsheet size={19} /> : <FileText size={19} />}
                </div>
                <h2 className="text-[16px] font-semibold text-ink">{resource.title}</h2>
                <p className="mt-2 flex-1 text-[13px] leading-6 text-secondary">{resource.description}</p>
                <a
                  href={`/api/academy/resource?course=${encodeURIComponent(slug)}&resource=${encodeURIComponent(resource.id)}`}
                  className="btn-primary mt-5 inline-flex items-center justify-center gap-2 text-[12px]"
                >
                  <Download size={14} /> Download resource
                </a>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-white px-4 py-3 text-[11px] text-muted">
        <LockKeyhole size={14} className="mt-0.5 shrink-0 text-accent" />
        <p>Downloads are protected by your paid Academy enrolment. They are working templates, not legal, HR, accounting or health-and-safety advice; managers should adapt them to their employer, insurer and local requirements.</p>
      </div>
    </DashboardShell>
  )
}
