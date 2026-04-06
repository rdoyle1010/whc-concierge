'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MapPin, Star, Briefcase, ArrowLeft } from 'lucide-react'

export default function PropertyDetailPage() {
  const supabase = createClient()
  const params = useParams()
  const id = params?.id as string

  const [property, setProperty] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!id) return

      // Load employer profile (property)
      const { data: propertyData } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('id', id)
        .single()

      setProperty(propertyData)

      // Load live job listings
      const { data: jobsData } = await supabase
        .from('job_listings')
        .select('*')
        .eq('employer_id', id)
        .eq('is_live', true)
        .order('created_at', { ascending: false })

      setJobs(jobsData || [])
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="py-20 bg-parchment">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-ink mb-4">Property not found</h1>
            <Link href="/properties" className="text-gold hover:text-gold/80 font-medium">
              Back to Properties
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Breadcrumb */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/properties" className="inline-flex items-center text-gold hover:text-gold/80 text-sm font-medium">
            <ArrowLeft size={16} className="mr-2" />
            Properties
          </Link>
          <span className="text-gray-300 mx-2">/</span>
          <span className="text-gray-600 text-sm">{property.property_name || property.company_name}</span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-white">
        {property.logo_url && (
          <div className="w-full h-96 bg-gray-100 overflow-hidden">
            <img
              src={property.logo_url}
              alt={property.property_name || property.company_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-4">
                {property.property_name || property.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                {property.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="mr-2 text-gold" />
                    <span>{property.location}</span>
                  </div>
                )}
                {property.review_score && (
                  <div className="flex items-center text-gold">
                    <Star size={18} className="fill-gold mr-2" />
                    <span className="font-semibold">{property.review_score}</span>
                  </div>
                )}
              </div>
            </div>
            {property.property_type && (
              <span className="bg-gold/10 text-gold px-4 py-2 rounded font-medium text-sm whitespace-nowrap">
                {property.property_type}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      {property.description && (
        <section className="bg-parchment py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-serif text-2xl font-bold text-ink mb-6">About</h2>
            <p className="text-secondary leading-relaxed text-lg">
              {property.description}
            </p>
          </div>
        </section>
      )}

      {/* Key Info */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold text-ink mb-8">Key Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {property.property_type && (
              <div className="card">
                <div className="text-sm text-secondary font-medium mb-2">Property Type</div>
                <div className="text-lg font-serif font-semibold text-ink">
                  {property.property_type}
                </div>
              </div>
            )}
            {property.location && (
              <div className="card">
                <div className="text-sm text-secondary font-medium mb-2">Location</div>
                <div className="flex items-center text-lg font-serif font-semibold text-ink">
                  <MapPin size={18} className="mr-2 text-gold" />
                  {property.location}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Current Openings */}
      <section className="bg-parchment py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold text-ink mb-8">Current Openings</h2>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {jobs.map((job) => (
                <Link key={job.id} href="/jobs">
                  <div className="card hover:shadow-lg transition-all group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-ink group-hover:text-gold transition-colors">
                          {job.job_title}
                        </h3>
                        <div className="flex items-center text-sm text-secondary mt-1">
                          <Briefcase size={14} className="mr-2" />
                          <span>{job.job_type || 'Full-time'}</span>
                        </div>
                      </div>
                      {job.tier && (
                        <span className="text-xs bg-gold/10 text-gold px-2 py-1 rounded font-medium whitespace-nowrap ml-2">
                          {job.tier}
                        </span>
                      )}
                    </div>

                    {job.salary_min && job.salary_max && (
                      <div className="text-gold font-semibold text-sm mb-3">
                        £{Math.round(job.salary_min / 1000)}k–£{Math.round(job.salary_max / 1000)}k
                      </div>
                    )}

                    {job.description && (
                      <p className="text-secondary text-sm line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-secondary text-lg">
                No current openings. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-ink py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Interested?</h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Get in touch to learn more about opportunities at {property.property_name || property.company_name}.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gold hover:bg-gold/90 text-ink font-semibold px-8 py-3 rounded transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
