'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Upload, Save, Image as ImageIcon, RefreshCw, Plus, Trash2, Eye } from 'lucide-react'

type SiteImage = {
  id: string
  slot: string
  image_url: string
  label: string | null
  heading: string | null
  subtext: string | null
  sort_order: number
  active: boolean
}

const SLOT_GROUPS = [
  {
    title: 'Hero Carousel',
    description: 'Main homepage hero slides. Upload landscape images (1920×1080 ideal). Each slide can have a heading and description.',
    prefix: 'hero_',
    showText: true,
    maxSlots: 8,
  },
  {
    title: 'Featured Roles Cards',
    description: 'Three card images in the "Featured Roles" section. Square or landscape images work best (600×400).',
    prefix: 'featured_',
    showText: false,
    maxSlots: 3,
  },
  {
    title: 'CTA Background',
    description: 'Background image for the call-to-action section near the bottom of the homepage.',
    prefix: 'cta_',
    showText: false,
    maxSlots: 1,
  },
]

export default function AdminImagesPage() {
  const supabase = createClient()
  const [images, setImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, Partial<SiteImage>>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('site_images')
      .select('*')
      .order('sort_order', { ascending: true })
    setImages(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  /* ── Upload replacement image for a slot ── */
  const handleUpload = async (slot: string, file: File) => {
    setUploading(slot)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${slot}-${Date.now()}.${ext}`

    // Upload via API route (handles auth + bucket logic)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'site-images')
    formData.append('path', path)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }))
      flash('error', err.error || 'Upload failed')
      setUploading(null)
      return
    }

    const { url } = await res.json()

    // Check if slot already exists
    const existing = images.find(img => img.slot === slot)
    if (existing) {
      await supabase.from('site_images').update({ image_url: url, updated_at: new Date().toISOString() }).eq('slot', slot)
    } else {
      await supabase.from('site_images').insert({ slot, image_url: url, label: slot })
    }

    flash('success', `Image updated for ${slot}`)
    setUploading(null)
    load()
  }

  /* ── Save text changes (heading/subtext) ── */
  const handleSaveText = async (slot: string) => {
    setSaving(slot)
    const fields = editFields[slot]
    if (!fields) { setSaving(null); return }

    await supabase.from('site_images').update({
      heading: fields.heading,
      subtext: fields.subtext,
      updated_at: new Date().toISOString(),
    }).eq('slot', slot)

    flash('success', `Text updated for ${slot}`)
    setSaving(null)
    setEditFields(prev => { const next = { ...prev }; delete next[slot]; return next })
    load()
  }

  /* ── Add a new hero slot ── */
  const handleAddSlot = async (prefix: string, currentCount: number) => {
    const slot = `${prefix}${currentCount + 1}`
    await supabase.from('site_images').insert({
      slot,
      label: `${prefix === 'hero_' ? 'Hero Slide' : 'Featured Card'} ${currentCount + 1}`,
      image_url: 'https://placehold.co/1920x1080/f5f5f5/cccccc?text=Upload+Image',
      heading: prefix === 'hero_' ? 'New Slide' : null,
      subtext: prefix === 'hero_' ? 'Add your description here.' : null,
      sort_order: currentCount + 1,
    })
    flash('success', `Added new ${prefix === 'hero_' ? 'hero slide' : 'card'}`)
    load()
  }

  /* ── Remove a slot ── */
  const handleRemoveSlot = async (slot: string) => {
    if (!confirm(`Remove ${slot}? This will delete the image from the site.`)) return
    await supabase.from('site_images').delete().eq('slot', slot)
    flash('success', `Removed ${slot}`)
    load()
  }

  /* ── Get edit value or current DB value ── */
  const getVal = (slot: string, field: keyof SiteImage) => {
    if (editFields[slot]?.[field] !== undefined) return editFields[slot][field] as string
    const img = images.find(i => i.slot === slot)
    return (img?.[field] as string) || ''
  }

  const setEdit = (slot: string, field: keyof SiteImage, value: string) => {
    setEditFields(prev => ({
      ...prev,
      [slot]: { ...prev[slot], [field]: value },
    }))
  }

  const hasEdits = (slot: string) => !!editFields[slot]

  if (loading) {
    return (
      <DashboardShell role="admin" userName="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-medium text-ink">Site Images</h1>
          <p className="text-[13px] text-muted mt-1">
            Upload and manage every image on the site. Changes go live immediately.
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border border-border hover:border-ink/20 transition-colors">
          <Eye size={14} /> Preview site
        </a>
      </div>

      {/* Flash message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-[13px] font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {SLOT_GROUPS.map(group => {
        const groupImages = images
          .filter(img => img.slot.startsWith(group.prefix))
          .sort((a, b) => a.sort_order - b.sort_order)

        return (
          <section key={group.prefix} className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-medium text-ink">{group.title}</h2>
                <p className="text-[12px] text-muted mt-0.5">{group.description}</p>
              </div>
              {groupImages.length < group.maxSlots && (
                <button
                  onClick={() => handleAddSlot(group.prefix, groupImages.length)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-dashed border-gray-300 hover:border-ink/30 text-muted hover:text-ink transition-colors"
                >
                  <Plus size={14} /> Add slide
                </button>
              )}
            </div>

            <div className="space-y-4">
              {groupImages.map(img => (
                <div key={img.slot} className="dashboard-card p-5">
                  <div className="flex gap-6">
                    {/* Image preview + upload */}
                    <div className="shrink-0 w-[280px]">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                        <img
                          src={img.image_url}
                          alt={img.label || img.slot}
                          className="w-full h-full object-cover"
                        />
                        {/* Upload overlay */}
                        <label className={`absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading === img.slot ? 'opacity-100' : ''}`}>
                          {uploading === img.slot ? (
                            <RefreshCw size={24} className="text-white animate-spin" />
                          ) : (
                            <>
                              <Upload size={24} className="text-white mb-1" />
                              <span className="text-white text-[12px] font-medium">Replace image</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploading === img.slot}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(img.slot, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-muted font-mono">{img.slot}</span>
                        {groupImages.length > 1 && group.prefix === 'hero_' && (
                          <button
                            onClick={() => handleRemoveSlot(img.slot)}
                            className="text-[11px] text-red-400 hover:text-red-600 flex items-center gap-1"
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Text fields (hero slides only) */}
                    {group.showText && (
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1 block">
                            Heading
                          </label>
                          <input
                            type="text"
                            value={getVal(img.slot, 'heading')}
                            onChange={(e) => setEdit(img.slot, 'heading', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg text-[14px] text-ink focus:outline-none focus:border-ink/40 transition-colors"
                            placeholder="Slide heading..."
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1 block">
                            Description
                          </label>
                          <textarea
                            value={getVal(img.slot, 'subtext')}
                            onChange={(e) => setEdit(img.slot, 'subtext', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-border rounded-lg text-[14px] text-ink focus:outline-none focus:border-ink/40 transition-colors resize-none"
                            placeholder="Slide description..."
                          />
                        </div>
                        {hasEdits(img.slot) && (
                          <button
                            onClick={() => handleSaveText(img.slot)}
                            disabled={saving === img.slot}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity"
                            style={{ backgroundColor: '#C9A96E' }}
                          >
                            <Save size={14} />
                            {saving === img.slot ? 'Saving...' : 'Save text'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Non-hero: just show slot info */}
                    {!group.showText && (
                      <div className="flex-1 flex items-center">
                        <div>
                          <p className="text-[14px] font-medium text-ink">{img.label || img.slot}</p>
                          <p className="text-[12px] text-muted mt-1">Hover the image and click to replace.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {groupImages.length === 0 && (
                <div className="dashboard-card p-8 text-center">
                  <ImageIcon size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[13px] text-muted mb-3">No images set up for this section.</p>
                  <button
                    onClick={() => handleAddSlot(group.prefix, 0)}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#C9A96E' }}
                  >
                    Add first image
                  </button>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </DashboardShell>
  )
}
