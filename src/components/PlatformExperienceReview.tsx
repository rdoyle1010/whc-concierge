'use client'

import { useEffect, useState } from 'react'
import { Star, ExternalLink } from 'lucide-react'

export default function PlatformExperienceReview({ applicationId }: { applicationId: string }) {
  const [eligible, setEligible] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || ''

  useEffect(() => {
    let active = true
    fetch(`/api/platform-reviews?applicationId=${encodeURIComponent(applicationId)}`, { cache: 'no-store' })
      .then(async res => res.ok ? res.json() : null)
      .then(data => {
        if (!active || !data) return
        setEligible(Boolean(data.eligible))
        setReviewed(Boolean(data.reviewed))
        if (data.review?.rating) setRating(Number(data.review.rating))
        if (data.review?.comment) setComment(String(data.review.comment))
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applicationId])

  async function submit() {
    if (!rating || submitting) return
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/platform-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, rating, comment }),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setSubmitting(false)
    if (!res?.ok) {
      if (res?.status === 409) { setReviewed(true); return }
      setError(body.error || 'Could not save your review.')
      return
    }
    setReviewed(true)
  }

  if (loading || !eligible) return null

  if (reviewed) {
    return (
      <div className="rounded-2xl border border-[#e3e7eb] bg-[#fafafa] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#10283b]">Spa Platform experience</p>
        <div className="mt-3 flex items-center gap-1">
          {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />)}
        </div>
        <p className="mt-2 text-[13px] font-medium text-ink">Thank you for reviewing your Spa Platform experience.</p>
        {googleReviewUrl && <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#10283b] hover:underline">Share your experience on Google <ExternalLink size={12}/></a>}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#e3e7eb] bg-[#fafafa] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#10283b]">Spa Platform experience</p>
      <h3 className="mt-1 text-[17px] font-semibold text-ink">How was the recruitment journey?</h3>
      <p className="mt-1 text-[12px] leading-5 text-muted">Your feedback helps Wellness House Collective improve the platform for verified professionals and properties.</p>
      <div className="mt-4 flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button" onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(0)} onClick={()=>setRating(i)} aria-label={`${i} stars`} className="p-0.5">
            <Star size={22} className={(hover || rating) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-250'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000} rows={3} className="input-field mt-4 resize-y text-[12px] leading-5" placeholder="Tell us what worked well or what we could improve..." />
      <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-muted">{comment.length}/1000</span><button type="button" onClick={submit} disabled={!rating || submitting} className="btn-primary !py-2.5 !px-4 disabled:opacity-40">{submitting ? 'Submitting…' : 'Submit platform review'}</button></div>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</div>}
    </div>
  )
}
