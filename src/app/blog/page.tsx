import BlogList from './BlogList'
import { createAdminClient } from '@/lib/supabase/admin'

// The Journal, rendered on the server.
//
// Revalidated rather than dynamic: the posts change when Rebecca publishes one,
// which is not often enough to pay for a database read on every visit.
export const revalidate = 300

async function publishedPosts() {
  try {
    const { data } = await createAdminClient()
      .from('blog_posts').select('*').eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    return data || []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  return <BlogList initialPosts={await publishedPosts()} />
}
