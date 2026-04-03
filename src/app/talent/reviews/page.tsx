'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

export default function TalentReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewed_id', user.id)
        .order('created_at', { ascending: false })

      setReviews(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">My Reviews</h1>

      <div className="dashboard-card mb-6 flex items-center space-x-8">
        <div className="text-center">
          <p className="text-4xl font-serif font-bold text-gold">{avgRating}</p>
          <div className="flex justify-center mt-1">
            {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= Math.round(Number(avgRating)) ? 'text-gold fill-gold' : 'text-gray-200'} />)}
          </div>
          <p className="text-sm text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : reviews.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <Star size={48} className="mx-auto mb-4 opacity-50" />
          <p>No reviews yet. They&apos;ll appear here after your placements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="dashboard-card">
              <div className="flex items-center space-x-1 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className={i <= review.rating ? 'text-gold fill-gold' : 'text-gray-200'} />)}
              </div>
              {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
