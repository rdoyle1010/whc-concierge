'use client'

import { useEffect, useState } from 'react'
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
      const { data } = await supabase
        .from('property_profiles')
        .select('*, employer_profiles(company_name)')
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
            <p className="text-center text-gray-400 py-16">Properties will appear here as employers register.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((p) => (
                <div key={p.id} className="card hover:shadow-lg transition-all group">
                  {p.image_url && (
                    <div className="aspect-video rounded-lg bg-gray-100 overflow-hidden mb-4 -mx-6 -mt-6">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <h3 className="font-serif text-xl font-semibold text-ink group-hover:text-gold transition-colors">{p.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                    <MapPin size={14} /><span>{p.location}</span>
                    {p.star_rating && <span className="flex items-center text-gold"><Star size={12} className="fill-gold" /> {p.star_rating}</span>}
                  </div>
                  {p.description && <p className="text-gray-500 text-sm mt-3 line-clamp-3">{p.description}</p>}
                  {p.property_type && <span className="inline-block text-xs bg-gold/10 text-gold px-2 py-1 rounded mt-3">{p.property_type}</span>}
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
