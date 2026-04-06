'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, X } from 'lucide-react'
import Pagination from '@/components/Pagination'

const CATEGORIES = ['Career Advice', 'Industry Insights', 'Wellness Trends', 'Business Tips', 'Recruitment']

export default function AdminBlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const emptyPost = {
    title: '', slug: '', content: '', excerpt: '', image_url: '',
    author: 'WHC Concierge', category: '', tags: '', status: 'draft' as string,
    published_at: '',
  }
  const [form, setForm] = useState(emptyPost)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleSave = async () => {
    if (!form.title || !form.content) return
    setSaving(true)
    const payload = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      content: form.content,
      excerpt: form.excerpt || null,
      image_url: form.image_url || null,
      author: form.author,
      category: form.category || null,
      status: form.status,
      published_at: form.status === 'published' ? (form.published_at || new Date().toISOString()) : null,
    }

    if (editing) {
      await supabase.from('blog_posts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('blog_posts').insert(payload)
    }

    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
    setShowForm(false)
    setEditing(null)
    setForm(emptyPost)
    setSaving(false)
  }

  const handleEdit = (post: any) => {
    setForm({
      title: post.title, slug: post.slug, content: post.content,
      excerpt: post.excerpt || '', image_url: post.image_url || '',
      author: post.author || 'WHC Concierge', category: post.category || '',
      tags: post.tags?.join(', ') || '', status: post.status || 'draft',
      published_at: post.published_at ? post.published_at.slice(0, 10) : '',
    })
    setEditing(post)
    setShowForm(true)
  }

  const confirmDelete = async () => {
    if (!showDelete) return
    await supabase.from('blog_posts').delete().eq('id', showDelete)
    setPosts(posts.filter(p => p.id !== showDelete))
    setShowDelete(null)
  }

  const togglePublish = async (post: any) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const updates: any = { status: newStatus }
    if (newStatus === 'published' && !post.published_at) updates.published_at = new Date().toISOString()
    await supabase.from('blog_posts').update(updates).eq('id', post.id)
    setPosts(posts.map(p => p.id === post.id ? { ...p, ...updates } : p))
  }

  const paginatedPosts = posts.slice((page - 1) * perPage, page * perPage)
  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink">Blog Management</h1>
          <p className="text-[12px] text-muted mt-1">{publishedCount} published &middot; {draftCount} drafts</p>
        </div>
        <button type="button" onClick={() => { setForm(emptyPost); setEditing(null); setShowForm(true) }}
          className="btn-primary flex items-center space-x-2"><Plus size={16} /><span>New Post</span></button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1 text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })} className="input-field" placeholder="Your blog post title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field text-[13px] font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Author</label>
                  <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    <option value="">Select category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Published Date</label>
                  <input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Excerpt</label>
                <textarea rows={2} maxLength={200} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input-field" placeholder="Brief summary for previews..." />
                <p className="text-[11px] text-muted mt-1">{form.excerpt.length}/200</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Content *</label>
                <textarea rows={14} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field font-mono text-sm leading-relaxed" placeholder="Write your post content here. Markdown supported." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Featured Image URL</label>
                  <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field text-[13px]" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="wellness, spa, careers" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button type="button" onClick={() => setForm({ ...form, status: form.status === 'published' ? 'draft' : 'published' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.status === 'published' ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.status === 'published' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm font-medium text-ink">{form.status === 'published' ? 'Published' : 'Draft'}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.title || !form.content} className="btn-primary flex-1 disabled:opacity-40">
                  {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-[16px] font-medium text-ink mb-2">Delete this post?</h3>
            <p className="text-[13px] text-muted mb-6">This action cannot be undone. The post will be permanently removed.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="button" onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Posts Table ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
      ) : posts.length === 0 ? (
        <div className="dashboard-card text-center py-16">
          <FileText size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="text-[15px] font-medium text-ink mb-1">No blog posts yet</p>
          <p className="text-[13px] text-muted">Create your first post to get started.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-muted uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-muted uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[11px] font-medium text-muted uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-[11px] font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-medium text-ink">{post.title}</p>
                      <p className="text-[11px] text-muted font-mono">/{post.slug}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {post.category ? (
                        <span className="text-[11px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{post.category}</span>
                      ) : <span className="text-[11px] text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-muted">
                      {new Date(post.published_at || post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => togglePublish(post)}
                          className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink transition-colors"
                          title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                          {post.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button type="button" onClick={() => handleEdit(post)}
                          className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button type="button" onClick={() => setShowDelete(post.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} perPage={perPage} total={posts.length} onPageChange={setPage} onPerPageChange={setPerPage} />
        </>
      )}
    </DashboardShell>
  )
}
