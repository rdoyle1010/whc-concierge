'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Briefcase, Filter, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react'

export default function TalentJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        setProfile(prof)
      }

      let query = supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name, location)')
        .or('is_live.eq.true,is_live.is.null')
        .order('created_at', { ascending: false })

      const { data } = await query
      setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description, employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name } })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) &&
        !job.employer_profiles?.company_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (locationFilter && !job.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false
    if (typeFilter && job.job_type !== typeFilter) return false
    return true
  })

  const handleApply = async () => {
    if (!profile || !selectedJob) return
    setApplying(true)

    await supabase.from('applications').insert({
      job_id: selectedJob.id,
      candidate_id: profile.id,
      cover_letter: coverLetter || null,
      status: 'pending',
    })

    setApplying(false)
    setCoverLetter('')
    setSelectedJob(null)
    alert('Application submitted!')
  }

  const handleSwipe = async (jobId: string, direction: 'left' | 'right') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('swipes').insert({
      user_id: user.id,
      target_id: jobId,
      direction,
      target_type: 'job',
    })
    if (direction === 'right') {
      setSelectedJob(jobs.find(j => j.id === jobId))
    }
  }

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Browse Roles</h1>

      {/* Filters */}
      <div className="dashboard-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search roles or properties..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10" />
          </div>
          <input type="text" placeholder="Location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="input-field" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field">
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Temporary">Temporary</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <div key={job.id} className="dashboard-card hover:border-gold/30 cursor-pointer transition-all" onClick={() => setSelectedJob(job)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink">{job.title}</h3>
                  <p className="text-gold text-sm font-medium">{job.employer_profiles?.company_name}</p>
                </div>
                {job.tier && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    job.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                    job.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>{job.tier}</span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center space-x-1"><MapPin size={14} /><span>{job.location}</span></span>
                <span className="flex items-center space-x-1"><Briefcase size={14} /><span>{job.job_type}</span></span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {job.salary_min && job.salary_max ? `£${job.salary_min.toLocaleString()} – £${job.salary_max.toLocaleString()}` : 'Competitive salary'}
                </p>
                <div className="flex space-x-2">
                  <button onClick={(e) => { e.stopPropagation(); handleSwipe(job.id, 'left') }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400"><X size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleSwipe(job.id, 'right') }}
                    className="p-2 rounded-full bg-gold/10 hover:bg-gold/20 text-gold"><Heart size={16} /></button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-gray-400">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>No roles found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl font-bold text-ink">{selectedJob.title}</h2>
                <p className="text-gold font-medium">{selectedJob.employer_profiles?.company_name}</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{selectedJob.location}</span>
              <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{selectedJob.job_type}</span>
              {selectedJob.specialism && <span className="text-sm bg-gold/10 text-gold px-3 py-1 rounded-full">{selectedJob.specialism}</span>}
            </div>

            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.description}</p>
            </div>

            {selectedJob.salary_min && (
              <p className="text-lg font-medium text-ink mb-6">
                £{selectedJob.salary_min.toLocaleString()} – £{selectedJob.salary_max?.toLocaleString()}
              </p>
            )}

            {selectedJob.requirements?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-serif font-semibold mb-2">Requirements</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {selectedJob.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {selectedJob.benefits?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-serif font-semibold mb-2">Benefits</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {selectedJob.benefits.map((b: string, i: number) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            )}

            <hr className="my-6" />

            <h4 className="font-serif font-semibold mb-3">Apply for this Role</h4>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="input-field mb-4"
              placeholder="Add a cover letter (optional)..."
            />
            <button onClick={handleApply} disabled={applying} className="btn-primary w-full disabled:opacity-50">
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
