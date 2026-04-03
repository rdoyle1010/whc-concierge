'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'

export default function AdminBlogPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const emptyPost = {
    title: '', slug: '', content: '', excerpt: '', image_url: '',
    author: 'WHC Concierge', category: '', tags: '', published: false,
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
    setSaving(true)
    const payload = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      content: form.content,
      excerpt: form.excerpt || null,
      image_url: form.image_url || null,
      author: form.author,
      category: form.category || null,
      tags: form.tags ? (form.tags as string).split(',').map(t => t.trim()) : null,
      published: form.published,
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
      tags: post.tags?.join(', ') || '', published: post.published,
    })
    setEditing(post)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts(posts.filter(p => p.id !== id))
  }

  const togglePublish = async (post: any) => {
    await supabase.from('blog_posts').update({ published: !post.published }).eq('id', post.id)
    setPosts(posts.map(p => p.id === post.id ? { ...p, published: !p.published } : p))
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Blog Management</h1>
        <button onClick={() => { setForm(emptyPost); setEditing(null); setShowForm(true) }}
          className="btn-primary flex items-center space-x-2"><Plus size={16} /><span>New Post</span></button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold mb-6">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Author</label>
                  <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content *</label>
                <textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field font-mono text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                  <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" />
                </div>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded border-gray-300 text-gold focus:ring-gold" />
                <span className="text-sm font-medium text-gray-700">Publish immediately</span>
              </label>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : posts.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">No blog posts yet.</div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="dashboard-card flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-serif text-lg font-semibold text-ink">{post.title}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${post.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {post.author} &middot; {new Date(post.created_at).toLocaleDateString()}
                  {post.category && <> &middot; {post.category}</>}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => togglePublish(post)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title={post.published ? 'Unpublish' : 'Publish'}>
                  {post.published ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={() => handleEdit(post)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
