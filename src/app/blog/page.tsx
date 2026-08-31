'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Clock, ArrowRight } from 'lucide-react'
import SkeletonCard from '@/components/SkeletonCard'
import Pagination from '@/components/Pagination'
import BlogImage from '@/components/BlogImage'
import SponsoredAd from '@/components/SponsoredAd'

export default function BlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 9

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]
  const filtered = filter === 'All' ? posts : posts.filter(p => p.category === filter)
  const heroPost = page === 1 ? filtered[0] : null
  const gridStart = page === 1 ? 1 : (page - 1) * perPage
  const gridEnd = page === 1 ? perPage : page * perPage
  const gridPosts = filtered.slice(gridStart, gridEnd)
  const readTime = (content: string) => Math.max(1, Math.ceil((content?.length || 0) / 1200))

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 text-center">
          <p className="dashboard-eyebrow">Insights &amp; Industry</p>
          <h1 className="dashboard-title">The Journal</h1>
          <p className="dashboard-intro mx-auto">Ideas, leadership, careers and industry perspective from across luxury wellness and hospitality.</p>
        </div>
      </section>

      <SponsoredAd placement="journal_sponsor" />

      {categories.length > 1 && (
        <section className="bg-white border-b border-border">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-5 flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button key={cat} onClick={() => { setFilter(cat); setPage(1) }}
                className={`px-4 py-2 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  filter === cat ? 'bg-[#111111] text-white' : 'bg-[#f5f5f5] text-secondary hover:text-[#111111]'
                }`}>{cat}</button>
            ))}
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} variant="blog" />)}</div>
          ) : posts.length === 0 ? (
            <div className="dashboard-card text-center py-20">
              <h3 className="text-[22px] font-semibold text-[#1a1a1a] mb-2">Coming Soon</h3>
              <p className="text-[13px] text-muted">Our first articles are in the works.</p>
            </div>
          ) : (
            <>
              {heroPost && (
                <Link href={`/blog/${heroPost.slug}`} className="dashboard-card block mb-10 group !p-0 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
                    <div className="aspect-[4/3] lg:aspect-auto min-h-[340px] bg-[#e9e6df] overflow-hidden">
                      <BlogImage src={heroPost.image_url} alt={heroPost.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                    </div>
                    <div className="p-7 lg:p-10 flex flex-col justify-center">
                      {heroPost.category && <p className="dashboard-eyebrow">{heroPost.category}</p>}
                      <h2 className="text-[30px] lg:text-[38px] font-semibold text-[#1a1a1a] leading-[1.1] tracking-[-0.035em] mb-4">{heroPost.title}</h2>
                      <p className="text-[14px] text-secondary leading-7 mb-6 line-clamp-3">{heroPost.excerpt || heroPost.content?.slice(0, 200)}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                        <span>{heroPost.author}</span><span>&middot;</span>
                        <span>{new Date(heroPost.published_at || heroPost.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><span>&middot;</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{readTime(heroPost.content)} min</span>
                      </div>
                      <span className="mt-6 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1a1a1a]">Read article <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </Link>
              )}

              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                  {gridPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="dashboard-card group !p-0 overflow-hidden">
                      <div className="aspect-[16/10] bg-[#e9e6df] overflow-hidden">
                        <BlogImage src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 text-[10px] text-muted mb-2">
                          {post.category && <span className="uppercase tracking-[0.12em] text-[#1a1a1a] font-semibold">{post.category}</span>}
                          <span className="flex items-center gap-1"><Clock size={10} />{readTime(post.content)} min</span>
                        </div>
                        <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-2 leading-snug">{post.title}</h3>
                        <p className="text-secondary text-[13px] leading-6 line-clamp-2">{post.excerpt || post.content?.slice(0, 120)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Pagination page={page} perPage={perPage} total={filtered.length} showPerPage={false} onPageChange={setPage} />
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
