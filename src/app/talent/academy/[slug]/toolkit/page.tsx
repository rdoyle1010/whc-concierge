'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { academyResources } from '@/lib/academy-resources'
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'

export default function AcademyToolkitPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : String(params?.slug || '')
  const resources = academyResources(slug)
  const title = slug === 'spa-director-programme' ? 'Spa Director Toolkit' : 'Spa Manager Toolkit'

  return (
    <DashboardShell role="talent">
      <div className="max-w-5xl">
        <Link href={`/talent/academy/${slug}`} className="mb-5 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"><ArrowLeft size={13} /> Back to programme</Link>
        <div className="mb-7">
          <p className="dashboard-eyebrow">WHC Academy resources</p>
          <h1 className="dashboard-title">{title}</h1>
          <p className="dashboard-intro max-w-2xl">Download the working tools used throughout the programme. Use them with real or practice spa figures as you complete the management labs.</p>
        </div>

        {resources.length === 0 ? (
          <div className="dashboard-card text-[13px] text-muted">No toolkit is attached to this programme.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map(resource => (
              <article key={resource.id} className="dashboard-card flex flex-col">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f1ec] text-[#9c7a42]"><FileSpreadsheet size={18} /></div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-ink">{resource.title}</h2>
                    <p className="mt-1 text-[12px] leading-5 text-muted">{resource.description}</p>
                  </div>
                </div>
                <a
                  href={`/api/academy/resource?course=${encodeURIComponent(slug)}&resource=${encodeURIComponent(resource.id)}`}
                  className="btn-secondary mt-auto inline-flex items-center justify-center gap-2 text-[12px]"
                >
                  <Download size={13} /> Download tool
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
