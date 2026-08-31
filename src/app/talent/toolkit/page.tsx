'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { BadgeCheck, Download, FileSpreadsheet, Wrench } from 'lucide-react'

// My Toolkit: everything the learner has earned through Academy courses -
// spreadsheets, checklists, templates, workbooks - permanently in one place.

type Resource = { kind: 'built_in' | 'uploaded'; id: string; title: string; description: string; href: string; file_name?: string }
type CourseTools = { slug: string; title: string; completed: boolean; resources: Resource[] }

export default function TalentToolkitPage() {
  const [courses, setCourses] = useState<CourseTools[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/talent/toolkit')
      .then(res => res.ok ? res.json() : { courses: [] })
      .then(json => setCourses(json.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const total = courses.reduce((count, course) => count + course.resources.length, 0)

  return (
    <DashboardShell role="talent">
      <div className="max-w-4xl">
        <p className="dashboard-eyebrow">WHC Academy</p>
        <h1 className="dashboard-title">My Toolkit</h1>
        <p className="dashboard-intro max-w-2xl mb-7">Every tool, template and worksheet you gain through Academy courses lives here permanently - {total > 0 ? `${total} tool${total === 1 ? '' : 's'} and counting` : 'they appear as you enrol'}. Use them with real figures from your own spa.</p>

        {loading ? <div className="skeleton h-44 rounded-2xl" /> : courses.length === 0 ? (
          <div className="dashboard-card py-14 text-center">
            <Wrench size={22} className="mx-auto text-muted mb-3" />
            <p className="font-medium text-ink">Your toolkit is waiting to be earned</p>
            <p className="text-[13px] text-muted mt-2 mb-5 max-w-md mx-auto">Academy courses come with working tools - calculators, checklists, templates. Everything you unlock stays here for good.</p>
            <Link href="/talent/academy" className="btn-primary inline-block">Browse the Academy</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {courses.map(course => (
              <div key={course.slug} className="dashboard-card">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="font-serif text-[17px] font-semibold text-ink">{course.title}</h2>
                  <div className="flex items-center gap-2">
                    {course.completed && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700"><BadgeCheck size={12} /> Completed</span>}
                    <Link href={`/talent/academy/${course.slug}`} className="text-[12px] underline text-secondary">Open course</Link>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {course.resources.map(resource => (
                    <div key={`${resource.kind}-${resource.id}`} className="flex flex-col rounded-xl border border-border p-4">
                      <div className="flex items-start gap-2.5 mb-2">
                        <FileSpreadsheet size={16} className="mt-0.5 shrink-0 text-[#10283b]" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink">{resource.title}</p>
                          {resource.description && <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{resource.description}</p>}
                        </div>
                      </div>
                      <a href={resource.href} className="btn-secondary mt-auto inline-flex w-fit items-center gap-1.5 text-[12px]"><Download size={12} /> Download</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
