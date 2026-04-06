'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MapPin, Star } from 'lucide-react'

export default function PropertiesPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Query verified employer profiles as "properties"
      const { data } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
      setProperties(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Properties</h1>
          <p className="text-white/60 max-w-xl mx-auto">The world&apos;s finest wellness destinations, all in one place.</p>
        </div>
      </section>
      <section className="py-16 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
          ) : properties.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Properties will appear here as employers register and are verified.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((p) => (
                <Link key={p.id} href={`/properties/${p.id}`}>
                  <div className="card hover:shadow-lg transition-all group cursor-pointer">
                    {p.logo_url && (
                      <div className="aspect-video rounded-lg bg-gray-100 overflow-hidden mb-4 -mx-6 -mt-6">
                        <img src={p.logo_url} alt={p.property_name || p.company_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-gold transition-colors">{p.property_name || p.company_name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      {p.location && <><MapPin size={14} /><span>{p.location}</span></>}
                      {p.review_score && <span className="flex items-center text-gold"><Star size={12} className="fill-gold" /> {p.review_score}</span>}
                    </div>
                    {p.description && <p className="text-gray-500 text-sm mt-3 line-clamp-3">{p.description}</p>}
                    {p.property_type && <span className="inline-block text-xs bg-gold/10 text-gold px-2 py-1 rounded mt-3">{p.property_type}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
