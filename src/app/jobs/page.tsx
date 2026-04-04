'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Search, MapPin, Briefcase, ArrowRight } from 'lucide-react'

export default function PublicJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    async function load() {
      const { data: rawData } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('created_at', { ascending: false })
      setJobs((rawData || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description, employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name } })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.employer_profiles?.company_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (location && !job.location?.toLowerCase().includes(location.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Browse Roles</h1>
          <p className="text-white/60 max-w-xl mx-auto mb-10">Discover your next position at the world&apos;s finest wellness destinations.</p>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Job title or property..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10 bg-white" />
            </div>
            <div className="relative flex-1">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} className="input-field pl-10 bg-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No roles found. Try adjusting your search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((job) => (
                <div key={job.id} className="card hover:shadow-lg transition-all group border-t-4 border-t-gold/20 hover:border-t-gold">
                  <div className="flex items-center justify-between mb-3">
                    {job.tier && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        job.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                        job.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>{job.tier}</span>
                    )}
                    <span className="text-xs text-gray-400">{job.job_type}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-gold transition-colors">{job.title}</h3>
                  <p className="text-gold text-sm font-medium">{job.employer_profiles?.company_name}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-500 mt-2">
                    <span className="flex items-center space-x-1"><MapPin size={14} /><span>{job.location}</span></span>
                  </div>
                  <p className="font-medium text-ink mt-3">
                    {job.salary_min && job.salary_max ? `£${job.salary_min.toLocaleString()} – £${job.salary_max.toLocaleString()}` : 'Competitive salary'}
                  </p>
                  <Link href="/login?role=talent" className="mt-4 flex items-center text-gold text-sm font-medium">
                    Apply Now <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
