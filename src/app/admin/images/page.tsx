'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, Copy, Image as ImageIcon, Check } from 'lucide-react'

export default function AdminImagesPage() {
  const supabase = createClient()
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [altText, setAltText] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_images').select('*').order('created_at', { ascending: false })
      setImages(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const path = `site-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true })

    if (uploadError) { alert(uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)

    const { data: img } = await supabase.from('site_images').insert({
      name: name || file.name,
      url: publicUrl,
      alt_text: altText || null,
      category: category || null,
    }).select().single()

    if (img) setImages([img, ...images])
    setName(''); setAltText(''); setCategory('')
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (img: any) => {
    if (!confirm('Delete this image?')) return
    await supabase.from('site_images').delete().eq('id', img.id)
    // Also try to delete from storage
    const path = img.url.split('/uploads/')[1]
    if (path) await supabase.storage.from('uploads').remove([path])
    setImages(images.filter(i => i.id !== img.id))
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Image Management</h1>

      {/* Upload area */}
      <div className="dashboard-card mb-8">
        <h3 className="font-serif text-lg font-semibold mb-4">Upload New Image</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input type="text" placeholder="Image name" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          <input type="text" placeholder="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} className="input-field" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            <option value="">Category</option>
            <option>Hero</option><option>Property</option><option>Blog</option><option>Logo</option><option>Icon</option><option>Banner</option><option>Other</option>
          </select>
          <label className={`btn-primary cursor-pointer flex items-center justify-center space-x-2 ${uploading ? 'opacity-50' : ''}`}>
            <Upload size={16} /><span>{uploading ? 'Uploading...' : 'Upload'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : images.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No images uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="dashboard-card p-3 group">
              <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-3">
                <img src={img.url} alt={img.alt_text || img.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-medium text-ink truncate">{img.name}</p>
              {img.category && <span className="text-xs text-gray-400">{img.category}</span>}
              <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => copyUrl(img.url)}
                  className="flex-1 py-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs flex items-center justify-center space-x-1">
                  {copied === img.url ? <><Check size={12} /><span>Copied</span></> : <><Copy size={12} /><span>Copy URL</span></>}
                </button>
                <button onClick={() => handleDelete(img)} className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
