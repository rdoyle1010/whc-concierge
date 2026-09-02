'use client'

import { useEffect, useMemo, useState } from 'react'
import ArticleEditor from '@/components/ArticleEditor'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, X, Upload, Image as ImageIcon, Share2 } from 'lucide-react'
import Pagination from '@/components/Pagination'

// The nine WHC Intelligence desks, plus Journal for general pieces. Posts in
// these categories surface on /intelligence under the matching desk.
const CATEGORIES = ['Salary reports', 'Industry benchmarks', 'Leadership interviews', 'Spa opening reports', 'Career advice', 'Revenue benchmarks', 'Recruitment trends', 'Role guides', 'Industry analysis', 'Journal']

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const emptyPost = {
    title: '', slug: '', content: '', excerpt: '', image_url: '',
    author: 'Talent House Collective', category: '', tags: '', status: 'draft', published_at: '',
  }
  const [form, setForm] = useState(emptyPost)

  const formDialog = useDialog(() => setShowForm(false), 'admin-blog-editor-heading', { enabled: showForm })
  const deleteDialog = useDialog(() => setShowDelete(null), 'admin-blog-delete-heading', { enabled: Boolean(showDelete) })

  const load = async () => {
    try {
      const res = await fetch('/api/admin/blog?per_page=200', { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) setPageError(j.error || 'Could not load blog posts.')
      else setPosts(j.posts || [])
    } catch { setPageError('Could not load blog posts.') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const uploadImage = async (file: File) => {
    setUploading(true); setFormError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bucket', 'site-images')
      body.append('path', `blog-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || 'Image upload failed.')
      setForm(current => ({ ...current, image_url: j.url }))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Image upload failed.')
    } finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!form.title || !form.content) return
    setSaving(true); setFormError('')
    const payload = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      content: form.content,
      excerpt: form.excerpt || null,
      image_url: form.image_url || null,
      author: form.author,
      category: form.category || null,
      tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : null,
      status: form.status,
      published_at: form.status === 'published' ? (form.published_at || new Date().toISOString()) : null,
    }
    const res = await fetch('/api/admin/blog', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { setFormError(j.error || 'Save failed.'); setSaving(false); return }
    await load(); setShowForm(false); setEditing(null); setForm(emptyPost); setSaving(false)
  }

  const handleEdit = (post: any) => {
    setForm({
      title: post.title || '', slug: post.slug || '', content: post.content || '', excerpt: post.excerpt || '',
      image_url: post.image_url || '', author: post.author || 'Talent House Collective', category: post.category || '',
      tags: post.tags?.join(', ') || '', status: post.status || 'draft',
      // Keep the full timestamp - saving a date-only value would silently
      // reset the publish time to midnight and reshuffle the Journal order.
      published_at: post.published_at || '',
    })
    setEditing(post); setFormError(''); setShowForm(true)
  }

  const confirmDelete = async () => {
    if (!showDelete) return
    const res = await fetch('/api/admin/blog', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: showDelete }) })
    if (!res.ok) { const j = await res.json().catch(() => ({})); setPageError(j.error || 'Delete failed.'); return }
    setPosts(posts.filter(p => p.id !== showDelete)); setShowDelete(null)
  }

  const togglePublish = async (post: any) => {
    const status = post.status === 'published' ? 'draft' : 'published'
    const res = await fetch('/api/admin/blog', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: post.id, status, ...(status === 'published' && !post.published_at ? { published_at: new Date().toISOString() } : {}) }) })
    if (!res.ok) { const j = await res.json().catch(() => ({})); setPageError(j.error || 'Status update failed.'); return }
    await load()
  }

  const paginated = useMemo(() => posts.slice((page - 1) * perPage, page * perPage), [posts, page])
  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="dashboard-eyebrow">Content & revenue</p><h1 className="dashboard-title">Blog & Journal</h1><p className="dashboard-intro">Create visual editorial content for the public Journal. Every published article includes social sharing controls automatically.</p></div>
      <button type="button" onClick={() => { setForm(emptyPost); setEditing(null); setShowForm(true) }} className="btn-primary flex items-center gap-2"><Plus size={16}/>Write blog post</button>
    </div>

    <div className="grid gap-3 sm:grid-cols-3 mb-7">
      <div className="dashboard-card !py-4"><p className="dashboard-eyebrow">Total</p><p className="text-[24px] font-semibold text-[#1c1c1c]">{posts.length}</p></div>
      <div className="dashboard-card !py-4"><p className="dashboard-eyebrow">Published</p><p className="text-[24px] font-semibold text-[#1c1c1c]">{publishedCount}</p></div>
      <div className="dashboard-card !py-4"><p className="dashboard-eyebrow">Drafts</p><p className="text-[24px] font-semibold text-[#1c1c1c]">{draftCount}</p></div>
    </div>

    {pageError && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{pageError}</div>}

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f]/70 p-4" onClick={() => setShowForm(false)}>
      <div {...formDialog.panelProps} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-7 md:p-9">
        <div className="mb-6 flex items-center justify-between"><div><p className="dashboard-eyebrow">Journal editor</p><h2 id="admin-blog-editor-heading" className="text-[24px] font-semibold text-[#1c1c1c]">{editing ? 'Edit article' : 'Write new article'}</h2></div><button onClick={() => setShowForm(false)} className="p-2 text-[#555555]"><X size={18}/></button></div>
        <div className="space-y-5">
          <div><label className="dashboard-eyebrow block mb-1.5">Title *</label><input aria-label="Title" className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) })} placeholder="Article title"/></div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="dashboard-eyebrow block mb-1.5">Slug</label><input aria-label="Slug" className="input-field" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}/></div><div><label className="dashboard-eyebrow block mb-1.5">Author</label><input aria-label="Author" className="input-field" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })}/></div></div>
          <div className="grid md:grid-cols-2 gap-4"><div><label className="dashboard-eyebrow block mb-1.5">Category</label><select aria-label="Category" className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select category</option>{form.category && !CATEGORIES.includes(form.category) && <option value={form.category}>{form.category}</option>}{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div><div><label className="dashboard-eyebrow block mb-1.5">Tags</label><input aria-label="Tags" className="input-field" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="spa, leadership, careers"/></div></div>

          <div><label className="dashboard-eyebrow block mb-1.5">Featured image</label><div className="grid md:grid-cols-[240px_1fr] gap-4 rounded-2xl border border-[#dddddd] p-4 bg-[#f1f1f1]">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-white border border-[#dddddd]">{form.image_url ? <img loading="lazy" decoding="async" src={form.image_url} alt="Article preview" className="w-full h-full object-cover"/> : <div className="h-full flex items-center justify-center text-[#6b6b6b]"><ImageIcon size={30}/></div>}</div>
            <div className="flex flex-col justify-center gap-3"><p className="text-[12px] leading-5 text-[#555555]">Upload the article image from your computer or phone. It will be stored in WHC site storage and used on the Journal card and article page.</p><div className="flex flex-wrap gap-2"><label className="btn-secondary w-fit cursor-pointer inline-flex items-center gap-2"><Upload size={14}/>{uploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={e => { const file=e.target.files?.[0]; if(file) uploadImage(file); e.target.value='' }}/></label>{form.image_url ? <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="btn-secondary">Remove image</button> : null}</div><p className="text-[11px] text-[#6b6b6b]">JPEG, PNG or WebP. Maximum 10 MB.</p></div>
          </div></div>

          <div><label className="dashboard-eyebrow block mb-1.5">Excerpt</label><textarea aria-label="Excerpt" rows={3} maxLength={220} className="input-field" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} placeholder="Short introduction shown on the Journal page"/></div>
          <div><label className="dashboard-eyebrow block mb-1.5">Article *</label><ArticleEditor value={form.content} onChange={html => setForm({ ...form, content: html })} /></div>

          <div className="rounded-xl bg-[#e7e7e7] p-4 flex gap-3"><Share2 size={18} className="text-[#1c1c1c] shrink-0 mt-0.5"/><div><p className="text-[12px] font-semibold text-[#1c1c1c]">Social sharing is automatic</p><p className="text-[11px] text-[#555555] mt-1">Published articles get LinkedIn, Facebook, WhatsApp, Email and Copy Link buttons on the article page.</p></div></div>

          <div className="flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-3"><input type="checkbox" checked={form.status === 'published'} onChange={e => setForm({ ...form, status: e.target.checked ? 'published' : 'draft' })}/><span className="text-[13px] font-semibold text-[#1c1c1c]">Publish article</span></label><div className="flex gap-2"><button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button onClick={handleSave} disabled={saving || uploading || !form.title || !form.content} className="btn-primary disabled:opacity-40">{saving ? 'Saving…' : editing ? 'Update article' : 'Create article'}</button></div></div>
          {formError && <div className="rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{formError}</div>}
        </div>
      </div>
    </div>}

    {showDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f]/70 p-4" onClick={() => setShowDelete(null)}><div {...deleteDialog.panelProps} className="w-full max-w-sm rounded-2xl bg-white p-6"><h3 id="admin-blog-delete-heading" className="text-[18px] font-semibold text-[#1c1c1c]">Delete this article?</h3><p className="text-[12px] text-[#555555] mt-2">This cannot be undone.</p><div className="flex gap-2 mt-6"><button className="btn-secondary flex-1" onClick={()=>setShowDelete(null)}>Cancel</button><button className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white text-[12px] font-semibold" onClick={confirmDelete}>Delete</button></div></div></div>}

    {loading ? <div className="h-64 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#555555] border-t-transparent"/></div> : posts.length === 0 ? <div className="dashboard-card text-center py-16"><FileText size={38} className="mx-auto text-[#6b6b6b]"/><p className="mt-3 text-[15px] font-semibold text-[#1c1c1c]">No articles yet</p></div> : <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{paginated.map(post => <article key={post.id} className="overflow-hidden rounded-2xl border border-[#dddddd] bg-white">
        <div className="aspect-[16/9] bg-[#e7e7e7] overflow-hidden">{post.image_url ? <img decoding="async" src={post.image_url} alt={post.title} className="w-full h-full object-cover" loading="lazy"/> : <div className="h-full flex items-center justify-center text-[#6b6b6b]"><ImageIcon size={28}/></div>}</div>
        <div className="p-5"><div className="flex items-center justify-between gap-2"><span className="text-[9px] uppercase tracking-[.14em] font-semibold text-[#555555]">{post.category || 'Journal'}</span><span className={`text-[10px] rounded-full px-2 py-1 ${post.status==='published'?'bg-emerald-50 text-emerald-700':'bg-[#e7e7e7] text-[#555555]'}`}>{post.status}</span></div><h3 className="mt-3 text-[17px] font-semibold leading-snug text-[#1c1c1c]">{post.title}</h3><p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#555555]">{post.excerpt || post.content?.slice(0,120)}</p><div className="mt-5 flex items-center justify-between"><a href={`/blog/${post.slug}`} target="_blank" className="text-[11px] font-semibold text-[#1c1c1c]">View article →</a><div className="flex gap-1"><button title="Edit" onClick={()=>handleEdit(post)} className="p-2 text-[#555555] hover:text-[#1c1c1c]"><Edit2 size={14}/></button><button title={post.status==='published'?'Unpublish':'Publish'} onClick={()=>togglePublish(post)} className="p-2 text-[#555555] hover:text-[#1c1c1c]">{post.status==='published'?<EyeOff size={14}/>:<Eye size={14}/>}</button><button title="Delete" onClick={()=>setShowDelete(post.id)} className="p-2 text-[#555555] hover:text-red-600"><Trash2 size={14}/></button></div></div></div>
      </article>)}</div>
      <Pagination page={page} perPage={perPage} total={posts.length} showPerPage={false} onPageChange={setPage}/>
    </>}
  </DashboardShell>
}
