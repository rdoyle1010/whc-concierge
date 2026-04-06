'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

const CRITERIA = [
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'punctuality', label: 'Punctuality / Timekeeping' },
  { key: 'communication', label: 'Communication' },
  { key: 'skillLevel', label: 'Skill Level' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'overallExperience', label: 'Overall Experience' },
] as const

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)} className="p-0.5">
          <Star size={18} className={(hover || value) >= i ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewForm({ reviewerId, reviewedId, reviewedName, type = 'candidate', onComplete }: {
  reviewerId: string; reviewedId: string; reviewedName?: string; type?: 'candidate' | 'employer'; onComplete?: () => void
}) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const allRated = CRITERIA.every(c => scores[c.key] > 0)
  const avgScore = allRated ? (Object.values(scores).reduce((a, b) => a + b, 0) / CRITERIA.length) : 0

  const handleSubmit = async () => {
    if (!allRated) { setError('Please rate all categories'); return }
    setSubmitting(true); setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer_id: reviewerId, reviewed_id: reviewedId,
        criteria_scores: scores, comment: comment || null, type,
      }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) { setError(data.error || 'Failed to submit review'); return }
    setSubmitted(true)
    onComplete?.()
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star size={20} className="text-emerald-500 fill-emerald-500" />
        </div>
        <p className="text-[15px] font-medium text-ink mb-1">Review submitted</p>
        <p className="text-[13px] text-muted">Thank you for your feedback{reviewedName ? ` on ${reviewedName}` : ''}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {reviewedName && <p className="text-[14px] text-secondary">How was your experience with <strong className="text-ink">{reviewedName}</strong>?</p>}

      {error && <div className="bg-red-50 text-red-600 text-[13px] px-4 py-3 rounded-lg">{error}</div>}

      {/* Criteria ratings */}
      <div className="space-y-3">
        {CRITERIA.map(c => (
          <div key={c.key} className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <span className="text-[13px] text-ink font-medium">{c.label}</span>
            <StarSelector value={scores[c.key] || 0} onChange={v => setScores({ ...scores, [c.key]: v })} />
          </div>
        ))}
      </div>

      {/* Average preview */}
      {allRated && (
        <div className="flex items-center gap-3 p-3 bg-[#FDF6EC] border border-accent/20 rounded-lg">
          <span className="text-[20px] font-semibold text-accent">{avgScore.toFixed(1)}</span>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className={i <= Math.round(avgScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}
            </div>
            <p className="text-[11px] text-muted mt-0.5">Overall rating (average of all criteria)</p>
          </div>
        </div>
      )}

      {/* Comment */}
      <div>
        <label className="eyebrow block mb-1.5">Comment (optional)</label>
        <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
          className="input-field text-[13px]" placeholder="Share your experience..." maxLength={500} />
        <p className="text-[11px] text-muted mt-1">{comment.length}/500</p>
      </div>

      <button type="button" onClick={handleSubmit} disabled={submitting || !allRated}
        className="btn-primary w-full disabled:opacity-40">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
