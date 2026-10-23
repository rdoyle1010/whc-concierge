'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { ExternalLink, Image as ImageIcon, Plus, Save, Sparkles, Trash2, Upload } from 'lucide-react'
import { normaliseBrand, type BrandProfile } from '@/lib/brand-profiles'

const BLANK: BrandProfile = normaliseBrand({ slug: '', name: '', is_published: false })

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] text-secondary">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

function ListField({ label, hint, placeholder, values, onChange }: {
  label: string; hint: string; placeholder: string; values: string[]; onChange: (next: string[]) => void
}) {
  return (
    <div>
      <p className="text-[12px] font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-[11px] leading-5 text-muted">{hint}</p>
      <div className="mt-2 space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <input value={value} placeholder={placeholder} className="input-field"
              onChange={event => onChange(values.map((item, i) => (i === index ? event.target.value : item)))} />
            <button type="button" onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="border border-border p-2 text-secondary hover:text-red-600" aria-label={`Remove ${label} ${index + 1}`}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...values, ''])} className="btn-secondary mt-2 inline-flex items-center gap-1 text-[12px]"><Plus size={12} /> Add</button>
    </div>
  )
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandProfile[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [tab, setTab] = useState<'pages' | 'enquiries' | 'applications'>('pages')
  const [editing, setEditing] = useState<BrandProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/admin/brands')
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load the brands.')
      setBrands(json.brands || [])
      setEnquiries(json.enquiries || [])
      setApplications(json.applications || [])
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const update = (patch: Partial<BrandProfile>) => setEditing(current => (current ? { ...current, ...patch } : current))

  // The deck. One picture never carried a brand, and a spa director choosing a
  // partner is buying the look of the room as much as the product.
  async function uploadToGallery(files: FileList) {
    if (!editing) return
    setBusy('gallery'); setError(''); setNotice('')
    try {
      const added: string[] = []
      for (const file of Array.from(files).slice(0, 12)) {
        const form = new FormData()
        form.append('file', file)
        form.append('bucket', 'site-images')
        form.append('path', `brands/${editing.slug || 'brand'}/gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
        const response = await fetch('/api/upload', { method: 'POST', body: form })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(json.error || 'An image could not be uploaded.')
        added.push(String(json.url || ''))
      }
      update({ gallery: [...editing.gallery, ...added].filter(Boolean).slice(0, 12) })
      setNotice(`${added.length} image${added.length === 1 ? '' : 's'} added. Save the brand to publish them.`)
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  async function uploadImage(file: File, field: 'image_url' | 'logo_url') {
    if (!editing) return
    setBusy(field); setError(''); setNotice('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('bucket', 'site-images')
      const slug = editing.slug || 'brand'
      form.append('path', `brands/${slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
      const response = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error || 'The image could not be uploaded.')
      update({ [field]: String(json.url || '') } as Partial<BrandProfile>)
      setNotice('Image uploaded. Save the brand to publish it.')
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  async function save() {
    if (!editing) return
    setBusy('save'); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', brand: editing }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not save this brand.')
      setNotice(editing.is_published ? 'Saved and live on the Brands page.' : 'Saved as a draft. Tick "Live" when the page is ready.')
      setEditing(null)
      await load()
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  async function convert(application: any) {
    const slug = window.prompt(`Create a draft page for ${application.brand_name} at /brands/...`, String(application.brand_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    if (!slug) return
    setBusy(`convert-${application.id}`); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_application', id: application.id, slug }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not create the draft.')
      setNotice(`Draft created at /brands/${json.slug}. Edit it, then tick Live when it is ready.`)
      setTab('pages')
      await load()
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  async function remove(brand: BrandProfile) {
    if (!window.confirm(`Delete the ${brand.name} brand page? This cannot be undone.`)) return
    setBusy(`delete-${brand.slug}`); setError('')
    try {
      const response = await fetch('/api/admin/brands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', slug: brand.slug }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not delete this brand.')
      await load()
    } catch (caught: any) {
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="mb-8">
        <p className="eyebrow">Content and revenue</p>
        <h1 className="dashboard-title">Brands</h1>
        <p className="dashboard-intro max-w-3xl">
          A page for each product house, arguing why a spa should stock it. Brands that give the Academy a masterclass
          get one of these in return, and the two link to each other. Drafts are invisible to the public until you tick Live.
        </p>
      </div>

      {error ? <div className="mb-6 border border-red-200 bg-red-50 px-5 py-4 text-[13px] text-red-700">{error}</div> : null}
      {notice ? <div className="mb-6 border border-green-200 bg-green-50 px-5 py-4 text-[13px] text-green-800">{notice}</div> : null}

      {!editing && (
        <div className="mb-5 flex flex-wrap gap-1 border-b border-border">
          {([['pages', `Brand pages (${brands.length})`], ['enquiries', `Enquiries (${enquiries.filter(e => e.status === 'new').length})`], ['applications', `Applications (${applications.filter(a => a.status === 'new').length})`]] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-[12px] font-medium ${tab === key ? 'border-b-2 border-ink text-ink' : 'text-secondary hover:text-ink'}`}>{label}</button>
          ))}
        </div>
      )}

      {!editing && tab === 'enquiries' && (
        enquiries.length === 0
          ? <p className="text-[13px] text-secondary">No enquiries yet. They arrive from the form at the bottom of each brand page.</p>
          : <div className="space-y-3">
              {enquiries.map(enquiry => (
                <div key={enquiry.id} className="border border-border bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium text-ink">{enquiry.contact_name}</p>
                    {enquiry.property_name ? <span className="text-[12px] text-secondary">{enquiry.property_name}</span> : null}
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${enquiry.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-surface text-secondary'}`}>{enquiry.status}</span>
                    <span className="ml-auto text-[11px] text-muted">{new Date(enquiry.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-secondary">
                    Asking about <strong className="font-medium text-ink">{enquiry.brand_name || enquiry.brand_slug}</strong>
                    {enquiry.role_title ? ` · ${enquiry.role_title}` : ''}{enquiry.treatment_rooms ? ` · ${enquiry.treatment_rooms} rooms` : ''}
                  </p>
                  <p className="mt-2 text-[12px]">
                    <a href={`mailto:${enquiry.contact_email}`} className="text-accent hover:underline">{enquiry.contact_email}</a>
                    {enquiry.contact_phone ? <span className="text-secondary"> · {enquiry.contact_phone}</span> : null}
                  </p>
                  {enquiry.message ? <p className="mt-3 whitespace-pre-wrap border-l-2 border-border pl-3 text-[13px] leading-6 text-secondary">{enquiry.message}</p> : null}
                </div>
              ))}
            </div>
      )}

      {!editing && tab === 'applications' && (
        applications.length === 0
          ? <p className="text-[13px] text-secondary">No applications yet. Brands apply at /brands/apply.</p>
          : <div className="space-y-3">
              {applications.map(application => (
                <div key={application.id} className="border border-border bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium text-ink">{application.brand_name}</p>
                    {application.offers_masterclass ? <span className="bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">Masterclass offered</span> : null}
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${application.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-surface text-secondary'}`}>{application.status}</span>
                    <span className="ml-auto text-[11px] text-muted">{new Date(application.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-secondary">
                    {application.contact_name}{application.contact_role ? `, ${application.contact_role}` : ''} · <a href={`mailto:${application.contact_email}`} className="text-accent hover:underline">{application.contact_email}</a>
                    {application.contact_phone ? ` · ${application.contact_phone}` : ''}
                  </p>
                  {application.usp ? <p className="mt-3 whitespace-pre-wrap border-l-2 border-border pl-3 text-[13px] leading-6 text-secondary">{application.usp}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {application.converted_slug
                      ? <Link href={`/brands/${application.converted_slug}`} target="_blank" className="btn-secondary text-[12px]">Drafted at /brands/{application.converted_slug}</Link>
                      : <button type="button" disabled={busy === `convert-${application.id}`} onClick={() => convert(application)} className="btn-primary text-[12px] disabled:opacity-50">
                          {busy === `convert-${application.id}` ? 'Creating...' : 'Turn into a draft page'}
                        </button>}
                  </div>
                </div>
              ))}
            </div>
      )}

      {!editing && tab === 'pages' && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setEditing({ ...BLANK })} className="btn-primary inline-flex items-center gap-1.5 text-[13px]"><Plus size={14} /> Add a brand</button>
            <Link href="/brands" target="_blank" className="btn-secondary inline-flex items-center gap-1.5 text-[13px]">View the public page <ExternalLink size={12} /></Link>
          </div>

          {loading ? <p className="text-[13px] text-secondary">Loading...</p> : brands.length === 0 ? (
            <div className="border border-border bg-surface px-6 py-14 text-center">
              <Sparkles size={20} className="mx-auto text-muted" />
              <p className="mt-3 text-[14px] font-medium text-ink">No brand pages yet.</p>
              <p className="mt-1 text-[12px] text-secondary">Start with a house that has already given the Academy a masterclass.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {brands.map(brand => (
                <div key={brand.slug} className="flex flex-wrap items-center gap-3 border border-border bg-white p-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden border border-border bg-surface">
                    {brand.image_url
                      ? <img src={brand.image_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full items-center justify-center text-muted"><ImageIcon size={18} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-medium text-ink">{brand.name}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${brand.is_published ? 'bg-green-100 text-green-800' : 'bg-surface text-secondary'}`}>
                        {brand.is_published ? 'Live' : 'Draft'}
                      </span>
                      {brand.academy_course_slug ? <span className="text-[10px] text-accent">Masterclass linked</span> : null}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-secondary">/brands/{brand.slug}{brand.tagline ? ` · ${brand.tagline}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEditing(brand)} className="btn-secondary text-[12px]">Edit</button>
                    <button type="button" disabled={busy === `delete-${brand.slug}`} onClick={() => remove(brand)} className="text-[12px] font-medium text-red-500 disabled:opacity-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="space-y-6">
          <div className="dashboard-card space-y-4">
            <p className="text-[13px] font-semibold text-ink">The basics</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Brand name"><input value={editing.name} onChange={e => update({ name: e.target.value })} className="input-field mt-1" /></Field>
              <Field label="Web address" hint="The page lives at /brands/this. Lower case, hyphens, no spaces.">
                <input value={editing.slug} onChange={e => update({ slug: e.target.value })} placeholder="carol-joy-london" className="input-field mt-1" />
              </Field>
              <Field label="Tagline" hint="One line under the name."><input value={editing.tagline || ''} onChange={e => update({ tagline: e.target.value })} className="input-field mt-1" /></Field>
              <Field label="Website"><input value={editing.website_url || ''} onChange={e => update({ website_url: e.target.value })} placeholder="https://" className="input-field mt-1" /></Field>
              <Field label="Founded"><input value={editing.founded || ''} onChange={e => update({ founded: e.target.value })} placeholder="2009" className="input-field mt-1" /></Field>
              <Field label="Origin" hint="Where the house and its science come from."><input value={editing.origin || ''} onChange={e => update({ origin: e.target.value })} className="input-field mt-1" /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="aspect-[16/10] overflow-hidden border border-border bg-surface">
                {editing.image_url ? <img src={editing.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ImageIcon size={28} /></div>}
              </div>
              <div className="flex flex-col justify-center gap-2">
                <p className="text-[12px] font-medium text-ink">Brand image</p>
                <p className="text-[11px] leading-5 text-secondary">Shown on the directory card and at the top of the brand page. A landscape treatment or product shot works best.</p>
                <label className="btn-secondary w-fit cursor-pointer inline-flex items-center gap-2 text-[12px]">
                  <Upload size={13} /> {busy === 'image_url' ? 'Uploading...' : editing.image_url ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={Boolean(busy)}
                    onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file, 'image_url'); e.target.value = '' }} />
                </label>
              </div>
            </div>
          </div>

          <div className="dashboard-card space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">The argument</p>
              <p className="text-[11px] leading-5 text-secondary">In the order a spa director asks for it. Leave a blank line between paragraphs.</p>
            </div>
            <Field label="The proposition" hint="One or two sentences, set in large type across the page. The first thing anyone reads.">
              <textarea rows={3} value={editing.usp || ''} onChange={e => update({ usp: e.target.value })} className="input-field mt-1 resize-y leading-6" />
            </Field>
            <Field label="Why a spa stocks it" hint="The commercial case: the guest it attracts, the menu it supports, the retail it earns, the training behind it.">
              <textarea rows={10} value={editing.why_spas || ''} onChange={e => update({ why_spas: e.target.value })} className="input-field mt-1 resize-y leading-6" />
            </Field>
            <Field label="Why Talent House loves it" hint="Your own verdict. This is the only reason anybody trusts a directory whose other words come from the brand, so say what you actually think.">
              <textarea rows={7} value={editing.why_we_love_it || ''} onChange={e => update({ why_we_love_it: e.target.value })} className="input-field mt-1 resize-y leading-6" />
            </Field>
            <Field label="Why therapists love working on it" hint="A brand the team resents never gets retailed, whatever the margin looks like. What do therapists say about delivering it?">
              <textarea rows={7} value={editing.why_therapists_love_it || ''} onChange={e => update({ why_therapists_love_it: e.target.value })} className="input-field mt-1 resize-y leading-6" />
            </Field>
            <Field label="How your therapists sell it" hint="The retail conversation on the floor: what to say, what to link to what, what a treatment leads on to.">
              <textarea rows={10} value={editing.how_to_sell || ''} onChange={e => update({ how_to_sell: e.target.value })} className="input-field mt-1 resize-y leading-6" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Director's comment" hint="A quote from the person who runs the house.">
                <textarea rows={5} value={editing.director_quote || ''} onChange={e => update({ director_quote: e.target.value })} className="input-field mt-1 resize-y leading-6" />
              </Field>
              <div className="space-y-4">
                <Field label="Who said it"><input value={editing.director_name || ''} onChange={e => update({ director_name: e.target.value })} className="input-field mt-1" /></Field>
                <Field label="Their role"><input value={editing.director_role || ''} onChange={e => update({ director_role: e.target.value })} className="input-field mt-1" /></Field>
              </div>
            </div>
          </div>

          <div className="dashboard-card space-y-5">
            <p className="text-[13px] font-semibold text-ink">The detail</p>
            <ListField label="Hero ingredients" hint="Shown as tags on the card and in the facts panel." placeholder="Golden Millet Oil"
              values={editing.hero_ingredients} onChange={v => update({ hero_ingredients: v })} />
            <ListField label="Signature treatments" hint="The menu a spa would run." placeholder="24-Carat Gold Facial, 60 minutes"
              values={editing.signature_treatments} onChange={v => update({ signature_treatments: v })} />
            <ListField label="Where it is delivered" hint="Named spas and groups already carrying it." placeholder="The Dorchester, London"
              values={editing.notable_partners} onChange={v => update({ notable_partners: v })} />
          </div>

          <div className="dashboard-card space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">The picture deck</p>
              <p className="text-[11px] leading-5 text-secondary">Up to twelve images across the page: the room, the product, the texture, the moment in the treatment. A spa director choosing a partner is buying the look of all of it.</p>
            </div>
            {editing.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {editing.gallery.map((url, index) => (
                  <div key={url} className="relative">
                    <div className="aspect-[4/3] overflow-hidden border border-border bg-surface">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                    <button type="button" onClick={() => update({ gallery: editing.gallery.filter((_, i) => i !== index) })}
                      className="mt-1 text-[11px] font-medium text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
              </div>
            )}
            <label className="btn-secondary w-fit cursor-pointer inline-flex items-center gap-2 text-[12px]">
              <Upload size={13} /> {busy === 'gallery' ? 'Uploading...' : 'Add images'}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={Boolean(busy)}
                onChange={e => { const files = e.target.files; if (files && files.length) uploadToGallery(files); e.target.value = '' }} />
            </label>
          </div>

          <div className="dashboard-card space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">Who to talk to</p>
              <p className="text-[11px] leading-5 text-secondary">Printed on the page, and copied on every enquiry sent from it. A page that persuades and offers no way to act has wasted the persuasion.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Contact name"><input value={editing.contact_name || ''} onChange={e => update({ contact_name: e.target.value })} className="input-field mt-1" /></Field>
              <Field label="Their role"><input value={editing.contact_role || ''} onChange={e => update({ contact_role: e.target.value })} className="input-field mt-1" /></Field>
              <Field label="Email" hint="Enquiries from the page are sent here as well as to us."><input value={editing.contact_email || ''} onChange={e => update({ contact_email: e.target.value })} className="input-field mt-1" /></Field>
              <Field label="Phone"><input value={editing.contact_phone || ''} onChange={e => update({ contact_phone: e.target.value })} className="input-field mt-1" /></Field>
            </div>
          </div>

          <div className="dashboard-card space-y-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">The links</p>
              <p className="text-[11px] leading-5 text-secondary">What ties this page to the rest of the platform.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Academy masterclass" hint="The course slug, if this brand has given us one. Shows the training panel on the page.">
                <input value={editing.academy_course_slug || ''} onChange={e => update({ academy_course_slug: e.target.value })} placeholder="carol-joy-london-masterclass" className="input-field mt-1" />
              </Field>
              <Field label="Product house name" hint="Exactly as it appears in the profile and job pickers, so the page, the course and the match score mean the same house.">
                <input value={editing.product_house_name || ''} onChange={e => update({ product_house_name: e.target.value })} placeholder="Carol Joy London" className="input-field mt-1" />
              </Field>
              <Field label="Display order" hint="Lowest first. Blank sorts by name.">
                <input type="number" value={editing.sort_order ?? ''} onChange={e => update({ sort_order: e.target.value === '' ? null : Number(e.target.value) })} className="input-field mt-1" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-secondary">
              <input type="checkbox" checked={editing.is_published} onChange={e => update({ is_published: e.target.checked })} />
              Live on the public Brands page. Until this is ticked the page cannot be read by anyone outside the admin.
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={save} disabled={Boolean(busy)} className="btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"><Save size={14} /> {busy === 'save' ? 'Saving...' : 'Save brand'}</button>
            <button type="button" onClick={() => { setEditing(null); setError(''); setNotice('') }} className="btn-secondary text-[13px]">Cancel</button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
