import { NextRequest, NextResponse } from 'next/server'
import { sanitizeArticleHtml } from '@/lib/article-html'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Admin blog management - the blog_posts table is RLS-locked to public reads
// of published posts only (migration 023), so all writes come through this
// service-role route. The admin page expects GET to return { posts } and
// sends POST (create), PATCH ({ id, ...updates }) and DELETE ({ id }).

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
}

// Columns the admin page may set - everything else is dropped.
const EDITABLE_FIELDS = [
  'title', 'slug', 'content', 'excerpt', 'image_url',
  'author', 'category', 'tags', 'status', 'published_at',
] as const

function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) out[key] = body[key]
  }
  return out
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // The admin UI sends per_page/page (per_page=200 by default).
  const perPageRaw = Number(req.nextUrl.searchParams.get('per_page') || 200)
  const pageRaw = Number(req.nextUrl.searchParams.get('page') || 1)
  const perPage = Number.isFinite(perPageRaw) ? Math.min(Math.max(Math.floor(perPageRaw), 1), 500) : 200
  const page = Number.isFinite(pageRaw) ? Math.max(Math.floor(pageRaw), 1) : 1
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const admin = createAdminClient()
  const { data, error, count } = await admin
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data || [], total: count ?? 0, page, per_page: perPage })
}

// Article bodies arrive as HTML from the editor. They are sanitised here so
// the stored value is already safe for anything that reads it - the public
// page, the RSS feed, an export - rather than trusting each reader to do it.
function withCleanBody<T extends Record<string, any>>(post: T): T {
  return typeof post.content === 'string' ? { ...post, content: sanitizeArticleHtml(post.content) } : post
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const post = pickEditable(body)
  if (!post.title || !post.content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('blog_posts').insert(withCleanBody(post)).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, post: data })
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updates = withCleanBody(pickEditable(body))
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('blog_posts').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, post: data })
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('blog_posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
