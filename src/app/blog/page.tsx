'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Clock } from 'lucide-react'
import SkeletonCard from '@/components/SkeletonCard'

export default function BlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]
  const filtered = filter === 'All' ? posts : posts.filter(p => p.category === filter)
  const heroPost = filtered[0]
  const gridPosts = filtered.slice(1)
  const readTime = (content: string) => Math.max(1, Math.ceil((content?.length || 0) / 1200))

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Insights & Industry</p>
          <h1 className="text-5xl md:text-6xl font-bold text-black tracking-tight">The Journal</h1>
        </div>
      </section>

      {/* Filters */}
      {categories.length > 1 && (
        <section className="pb-8 px-4 border-b border-neutral-100">
          <div className="max-w-7xl mx-auto flex items-center space-x-3 overflow-x-auto">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === cat ? 'bg-black text-white' : 'text-neutral-400 hover:text-black'
                }`}>{cat}</button>
            ))}
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} variant="blog" />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <h3 className="text-2xl font-bold text-black mb-2">Coming Soon</h3>
              <p className="text-neutral-400">Our first articles are in the works.</p>
            </div>
          ) : (
            <>
              {/* Hero article */}
              {heroPost && (
                <Link href={`/blog/${heroPost.slug}`} className="block mb-16 group">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                      {heroPost.image_url ? (
                        <img src={heroPost.image_url} alt={heroPost.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                      ) : <div className="w-full h-full bg-neutral-100" />}
                    </div>
                    <div className="py-4">
                      {heroPost.category && <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">{heroPost.category}</p>}
                      <h2 className="text-3xl lg:text-4xl font-bold text-black leading-tight mb-4 group-hover:underline">{heroPost.title}</h2>
                      <p className="text-neutral-400 leading-relaxed mb-6 line-clamp-3">{heroPost.excerpt || heroPost.content?.slice(0, 200)}</p>
                      <div className="flex items-center space-x-3 text-sm text-neutral-300">
                        <span>{heroPost.author}</span>
                        <span>&middot;</span>
                        <span>{new Date(heroPost.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>&middot;</span>
                        <span className="flex items-center space-x-1"><Clock size={12} /><span>{readTime(heroPost.content)} min</span></span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid */}
              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
                  {gridPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                      <div className="aspect-[16/10] bg-neutral-100 overflow-hidden mb-4">
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                        ) : <div className="w-full h-full bg-neutral-100" />}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-neutral-300 mb-2">
                        {post.category && <span className="text-neutral-400 uppercase tracking-wider">{post.category}</span>}
                        <span className="flex items-center space-x-1"><Clock size={10} /><span>{readTime(post.content)} min</span></span>
                      </div>
                      <h3 className="text-lg font-semibold text-black mb-2 group-hover:underline leading-snug">{post.title}</h3>
                      <p className="text-neutral-400 text-sm line-clamp-2">{post.excerpt || post.content?.slice(0, 120)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
