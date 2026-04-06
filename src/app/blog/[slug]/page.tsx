import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft } from 'lucide-react'
import { generateBlogJsonLd } from '@/lib/blog-jsonld'

export const revalidate = 60

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const jsonLd = generateBlogJsonLd({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.content?.slice(0, 160),
    category: post.category,
    publishedAt: post.created_at,
    updatedAt: post.updated_at,
    authorName: post.author,
  })

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="text-gold text-sm flex items-center mb-6 hover:text-gold-light">
            <ArrowLeft size={16} className="mr-1" /> Back to Blog
          </Link>
          {post.category && <span className="text-gold/60 text-sm uppercase tracking-wider">{post.category}</span>}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">{post.title}</h1>
          <p className="text-white/50 text-sm">
            {post.author} &middot; {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {post.image_url && (
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-a:text-gold">
          {post.content.split('\n').map((paragraph: string, i: number) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : null
          ))}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-200">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </article>
      <Footer />
    </div>
  )
}
