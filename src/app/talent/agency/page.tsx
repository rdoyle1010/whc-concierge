'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default function TalentAgencyPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).single()
      if (!profile) { setLoading(false); return }

      const { data } = await supabase
        .from('agency_bookings')
        .select('*, employer_profiles(company_name, location)')
        .eq('candidate_id', profile.id)
        .order('shift_date', { ascending: false })

      setBookings(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Shifts</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : bookings.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No agency shifts booked yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="dashboard-card flex items-center justify-between">
              <div>
                <h3 className="font-medium text-ink">{b.employer_profiles?.company_name || 'Property'}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center space-x-1"><Calendar size={14} /><span>{new Date(b.shift_date).toLocaleDateString()}</span></span>
                  {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                  {b.hours && <span>{b.hours}h</span>}
                </div>
              </div>
              <div className="text-right">
                {b.rate && <p className="font-medium text-ink">£{b.rate}/hr</p>}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
