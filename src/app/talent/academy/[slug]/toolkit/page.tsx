'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { academyResources } from '@/lib/academy-resources'
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react'

export default function AcademyToolkitPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : String(params?.slug || '')
  const resources = academyResources(slug)
  const title = slug === 'spa-director-programme' ? 'Spa Director Toolkit'
    : slug === 'spa-manager-programme' ? 'Spa Manager Toolkit'
    : 'Course Toolkit'
  const [uploads, setUploads] = useState<any[]>([])
  useEffect(() => {
    if (!slug) return
    fetch(`/api/academy/uploads?course=${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : { resources: [] })
      .then(json => setUploads(json.resources || []))
      .catch(() => {})
  }, [slug])

  return (
    <DashboardShell role="talent">
      <div className="max-w-5xl">
        <Link href={`/talent/academy/${slug}`} className="mb-5 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"><ArrowLeft size={13} /> Back to programme</Link>
        <div className="mb-7">
          <p className="dashboard-eyebrow">WHC Academy resources</p>
          <h1 className="dashboard-title">{title}</h1>
          <p className="dashboard-intro max-w-2xl">Download the working tools used throughout the programme. Use them with real or practice spa figures as you complete the management labs.</p>
        </div>

        {uploads.length > 0 && (
          <div className="mb-7">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#10283b]">Course downloads</p>
            <div className="grid gap-4 md:grid-cols-2">
              {uploads.map(upload => (
                <article key={upload.id} className="dashboard-card flex flex-col">
                  <h2 className="text-[15px] font-semibold text-ink">{upload.title}</h2>
                  {upload.description && <p className="mt-1 text-[12px] leading-5 text-muted">{upload.description}</p>}
                  <a href={`/api/academy/uploads?course=${encodeURIComponent(slug)}&id=${encodeURIComponent(upload.id)}`}
                    className="btn-secondary mt-4 inline-flex w-fit items-center gap-1.5 text-[12px]">
                    <Download size={13} /> Download{upload.file_name ? ` (${String(upload.file_name).split('.').pop()?.toUpperCase()})` : ''}
                  </a>
                </article>
              ))}
            </div>
          </div>
        )}

        {resources.length === 0 && uploads.length === 0 ? (
          <div className="dashboard-card text-[13px] text-muted">No toolkit is attached to this programme yet.</div>
        ) : resources.length === 0 ? null : (
          <div className="grid gap-4 md:grid-cols-2">
            {resources.map(resource => (
              <article key={resource.id} className="dashboard-card flex flex-col">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f5f5] text-[#10283b]"><FileSpreadsheet size={18} /></div>
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
