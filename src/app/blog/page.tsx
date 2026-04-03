'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Clock } from 'lucide-react'

export default function BlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
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
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-16" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gold text-sm font-medium uppercase tracking-[0.25em] mb-4">Insights & Industry</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">The WHC <span className="italic gradient-text-gold">Journal</span></h1>
          <p className="text-white/40 max-w-xl mx-auto font-light">Career advice, industry insights and platform updates from the world of luxury wellness.</p>
        </div>
      </section>

      {/* Category filters */}
      {categories.length > 1 && (
        <section className="py-6 bg-white border-b border-gray-100/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex items-center space-x-2 overflow-x-auto">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  filter === cat ? 'gold-gradient text-white shadow-md shadow-gold/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>{cat}</button>
            ))}
          </div>
        </section>
      )}

      <section className="py-16 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-2 border-gold border-t-transparent rounded-full" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <h3 className="font-serif text-2xl text-ink mb-2">Coming Soon</h3>
              <p className="text-gray-400">Our first articles are in the works. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Hero article */}
              {heroPost && (
                <Link href={`/blog/${heroPost.slug}`} className="block mb-12 group animate-fade-in-up">
                  <div className="card p-0 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                    <div className="aspect-[16/10] lg:aspect-auto bg-gray-100 overflow-hidden">
                      {heroPost.image_url ? (
                        <img src={heroPost.image_url} alt={heroPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-ink to-navy-light" />
                      )}
                    </div>
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      {heroPost.category && <span className="text-gold text-xs font-medium uppercase tracking-wider">{heroPost.category}</span>}
                      <h2 className="font-serif text-3xl lg:text-4xl font-bold text-ink mt-3 mb-4 group-hover:text-gold transition-colors">{heroPost.title}</h2>
                      <p className="text-gray-400 leading-relaxed mb-6 line-clamp-3">{heroPost.excerpt || heroPost.content?.slice(0, 200)}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>{heroPost.author}</span>
                        <span>&middot;</span>
                        <span>{new Date(heroPost.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>&middot;</span>
                        <span className="flex items-center space-x-1"><Clock size={12} /><span>{readTime(heroPost.content)} min read</span></span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
                {gridPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="card group p-0 overflow-hidden">
                    <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-ink to-navy-light" />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        {post.category && <span className="text-gold text-xs font-medium uppercase tracking-wider">{post.category}</span>}
                        <span className="text-gray-300 text-xs flex items-center space-x-1"><Clock size={10} /><span>{readTime(post.content)} min</span></span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-ink mb-2 group-hover:text-gold transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{post.excerpt || post.content?.slice(0, 120)}</p>
                      <span className="text-gold text-sm font-medium flex items-center">
                        Read Article <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
