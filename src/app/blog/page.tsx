import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight } from 'lucide-react'

export const revalidate = 60

export default async function BlogPage() {
  const supabase = createServerSupabaseClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">The WHC Blog</h1>
          <p className="text-white/60 max-w-xl mx-auto">Industry insights, career advice, and platform updates from the world of luxury wellness.</p>
        </div>
      </section>

      <section className="py-16 bg-parchment">
        <div className="max-w-7xl mx-auto px-4">
          {!posts || posts.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No posts published yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="card group hover:shadow-lg transition-all">
                  {post.image_url && (
                    <div className="aspect-video rounded-lg bg-gray-100 overflow-hidden mb-4 -mx-6 -mt-6">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  {post.category && <span className="text-xs text-gold font-medium uppercase tracking-wider">{post.category}</span>}
                  <h2 className="font-serif text-xl font-semibold text-ink mt-2 mb-2 group-hover:text-gold transition-colors">{post.title}</h2>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">{post.excerpt || post.content?.slice(0, 150)}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{post.author} &middot; {new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="text-gold flex items-center">Read <ArrowRight size={14} className="ml-1" /></span>
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
