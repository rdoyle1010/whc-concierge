import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { PUBLIC_CACHE_TAGS } from '@/lib/public-cache'
import { SITE_ORIGIN } from '@/lib/site-content'
import { toArticleHtml, isRichArticle } from '@/lib/article-html'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowLeft } from 'lucide-react'
import { generateBlogJsonLd } from '@/lib/blog-jsonld'
import ShareButtons from '@/components/ShareButtons'
import BlogImage from '@/components/BlogImage'
import SponsoredAd from '@/components/SponsoredAd'
import { OG_DEFAULTS } from '@/lib/og-defaults'

// An hour, not a minute, and the page can finally honour it.
//
// This read the cookie-aware Supabase client purely to query a public table.
// Reading cookies makes a page dynamic, so the old `revalidate = 60` was a
// setting that did nothing at all and every visit re-rendered the article from
// the database. A published post is identical for every reader, so there is no
// session to read: the query below is cached under the blog tag, and publishing
// or editing a post in admin drops it at once.
export const revalidate = 3600

const readPost = unstable_cache(
  async (slug: string) => {
    const { data } = await createAdminClient()
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    return data || null
  },
  ['public-blog-post-v1'],
  { revalidate: 3600, tags: [PUBLIC_CACHE_TAGS.blog] },
)

// Every Journal article shared one title and one description in search results,
// because this page exported no metadata and there is no layout beside it to
// carry any. Google saw a dozen articles all called "Talent House Collective |
// Spa and Wellness Careers" - competing with each other and describing none of
// themselves. The Journal is the strongest organic asset on this platform and
// it was invisible.
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  try {
    const post = await readPost(slug)
    if (!post) return {}

    // A description Google will actually show: the excerpt if there is one,
    // otherwise the opening of the article, trimmed at a word rather than
    // mid-syllable.
    // Strip tags before trimming: the body is HTML now, and a description
    // reading "<p><strong>The spa..." helps nobody in a search result.
    const raw = (post.excerpt || post.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const description = raw.length > 155 ? raw.slice(0, 155).replace(/\s\S*$/, '') + '...' : raw
    const url = `${SITE_ORIGIN}/blog/${slug}`
    const published = post.published_at || post.created_at

    return {
      // The root template adds the brand; naming it here printed it twice.
      title: post.title,
      description,
      alternates: { canonical: url },
      openGraph: {
        ...OG_DEFAULTS,
        type: 'article', url, title: post.title, description,
        publishedTime: published || undefined,
        authors: post.author ? [post.author] : undefined,
        section: post.category || undefined,
        images: post.image_url ? [{ url: post.image_url }] : undefined,
      },
      twitter: {
        card: post.image_url ? 'summary_large_image' : 'summary',
        title: post.title, description,
        images: post.image_url ? [post.image_url] : undefined,
      },
    }
  } catch {
    // A database wobble should cost the article its rich title, not the page.
    return {}
  }
}


export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await readPost(params.slug)

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
      <main id="main-content">
      <section className="bg-[#ede8df] pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/blog" className="text-secondary text-sm flex items-center mb-6 hover:text-ink">
            <ArrowLeft size={16} className="mr-1" /> Back to Journal
          </Link>
          {post.category && <span className="text-secondary text-sm uppercase tracking-wider">{post.category}</span>}
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-ink mt-2 mb-4">{post.title}</h1>
          <p className="text-muted text-sm">
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
        <div className="article-body prose prose-lg max-w-none prose-headings:font-serif prose-a:text-accent">
          {isRichArticle(post.content) ? (
            // Sanitised again on the way out, not only on the way in. The stored
            // value is already clean, but an article could have been written
            // before the sanitiser existed or changed by any other path into the
            // table, and the cost of checking twice is nothing next to the cost
            // of being wrong once.
            <div dangerouslySetInnerHTML={{ __html: toArticleHtml(post.content) }} />
          ) : (
            // Every article written before the editor existed is plain text with
            // newlines, and must keep rendering exactly as it always has.
            post.content.split('\n').map((paragraph: string, i: number) => (
              paragraph.trim() ? <p key={i}>{paragraph}</p> : null
            ))
          )}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-[#dcd4c8]">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-gray-100 text-secondary px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#dcd4c8]">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Share this article</p>
          <ShareButtons url={`https://talenthousecollective.co.uk/blog/${post.slug}`} title={post.title} />
        </div>
      </article>
      </main>
      <Footer />
    </div>
  )
}
