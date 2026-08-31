import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft } from 'lucide-react'
import { generateBlogJsonLd } from '@/lib/blog-jsonld'
import ShareButtons from '@/components/ShareButtons'
import BlogImage from '@/components/BlogImage'
import SponsoredAd from '@/components/SponsoredAd'

export const revalidate = 60

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const publishedDate = post.published_at || post.created_at

  const jsonLd = generateBlogJsonLd({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.content?.slice(0, 160),
    category: post.category,
    publishedAt: publishedDate,
    updatedAt: publishedDate,
    authorName: post.author,
  })

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <section className="bg-ink pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="text-white/80 text-sm flex items-center mb-6 hover:text-white">
            <ArrowLeft size={16} className="mr-1" /> Back to Journal
          </Link>
          {post.category && <span className="text-white/80 text-sm uppercase tracking-wider">{post.category}</span>}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mt-2 mb-4">{post.title}</h1>
          <p className="text-white/50 text-sm">
            {post.author} &middot; {new Date(publishedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      <SponsoredAd placement="journal_article_sponsor" />

      {post.image_url && (
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <div className="aspect-video overflow-hidden">
            <BlogImage src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-a:text-accent">
          {post.content.split('\n').map((paragraph: string, i: number) => (
            paragraph.trim() ? <p key={i}>{paragraph}</p> : null
          ))}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#e3e7eb]">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-secondary px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#e3e7eb]">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Share this article</p>
          <ShareButtons url={`https://talent.wellnesshousecollective.co.uk/blog/${post.slug}`} title={post.title} />
        </div>
      </article>
      <Footer />
    </div>
  )
}
