'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Star, X } from 'lucide-react'
import ReviewForm from '@/components/ReviewForm'
import PlatformExperienceReview from '@/components/PlatformExperienceReview'

type Placement = {
  applicationId: string
  jobTitle: string
  hiredAt?: string | null
  counterpartUserId: string
  counterpartName: string
  counterpartReviewType: 'candidate' | 'employer'
  counterpartReviewed: boolean
  platformReviewed: boolean
}

export default function PostHireReviews() {
  const pathname = usePathname()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<Placement | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/post-hire/reviews', { cache: 'no-store' })
      .then(async res => res.ok ? res.json() : null)
      .then(data => { if (active && data?.placements) setPlacements(data.placements) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (pathname === '/talent/applications' || loading || placements.length === 0) return null

  return (
    <section className="dashboard-card mb-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="dashboard-eyebrow !mb-1">Post-hire feedback</p>
          <h2 className="dashboard-section-title">Complete the placement journey</h2>
          <p className="mt-1 text-[12px] leading-5 text-muted">Completed hires can be reviewed by both sides, and you can separately tell Wellness House Collective how the Spa Platform experience worked for you.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {placements.map(placement => (
          <div key={placement.applicationId} className="rounded-2xl border border-[#e4ddd1] bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-semibold text-ink">{placement.jobTitle}</h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Hired</span>
                </div>
                <p className="mt-1 text-[12px] text-muted">Placement with {placement.counterpartName}{placement.hiredAt ? ` · ${new Date(placement.hiredAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {placement.counterpartReviewed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700"><Star size={12} className="fill-emerald-600"/> {placement.counterpartReviewType === 'candidate' ? 'Professional reviewed' : 'Property reviewed'}</span>
                ) : (
                  <button type="button" onClick={()=>setReviewing(placement)} className="btn-secondary inline-flex items-center gap-2 !py-2.5"><Star size={13}/> Review {placement.counterpartReviewType === 'candidate' ? 'professional' : 'property'}</button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <PlatformExperienceReview applicationId={placement.applicationId} />
            </div>
          </div>
        ))}
      </div>

      {reviewing && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={()=>setReviewing(null)}><div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#10283b]">Placement review</p><h2 className="mt-1 text-lg font-semibold text-ink">Review {reviewing.counterpartName}</h2></div><button type="button" onClick={()=>setReviewing(null)}><X size={20}/></button></div><ReviewForm reviewedId={reviewing.counterpartUserId} reviewedName={reviewing.counterpartName} type={reviewing.counterpartReviewType} onComplete={()=>setPlacements(current=>current.map(item=>item.applicationId===reviewing.applicationId?{...item,counterpartReviewed:true}:item))}/></div></div>}
    </section>
  )
}
