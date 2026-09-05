'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Upload, Save, Send, Eye, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { cloneDefaultPublicPagesContent, PUBLIC_PAGE_SLUGS, type PublicPageSlug, type PublicPagesContent } from '@/lib/public-page-content'

const pageNames: Record<PublicPageSlug,string> = { properties:'Properties', agency:'Agency', residency:'Residency', pricing:'Pricing', 'coming-soon':'Coming Soon' }
const pagePaths: Record<PublicPageSlug,string> = { properties:'/properties', agency:'/agency/about', residency:'/residency', pricing:'/pricing', 'coming-soon':'/coming-soon' }

// Where "Preview page" goes.
//
// Pricing and Residency load their copy in the browser, so they can read the
// draft flag from the address bar and stay static for everybody else. The
// other three render their copy on the server, so their preview has its own
// admin-only address and the public page keeps its cache.
const previewOnItsOwnAddress = new Set<PublicPageSlug>(['properties','agency','coming-soon'])
const previewHref = (slug: PublicPageSlug) =>
  previewOnItsOwnAddress.has(slug) ? `/preview/${slug}` : `${pagePaths[slug]}?pagePreview=draft`

export default function PublicPagesEditor() {
  const [content, setContent] = useState<PublicPagesContent>(cloneDefaultPublicPagesContent())
  const [published, setPublished] = useState<PublicPagesContent>(cloneDefaultPublicPagesContent())
  const [selected, setSelected] = useState<PublicPageSlug>('properties')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const page = content.pages[selected]
  const changed = useMemo(() => JSON.stringify(content) !== JSON.stringify(published), [content, published])

  // The editor must never open on silently-loaded defaults: publishing those
  // would overwrite the live content. If the load fails, show an error.
  useEffect(() => {
    fetch('/api/admin/public-pages')
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) { setLoadError(data.error || 'Could not load the current page content.'); return }
        if (data.draft) setContent(data.draft)
        if (data.published) setPublished(data.published)
      })
      .catch(() => setLoadError('Could not load the current page content.'))
      .finally(() => setLoading(false))
  }, [])

  function update(path: string, value: any) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const parts = `pages.${selected}.${path}`.split('.')
      let target: any = next
      for (let i=0;i<parts.length-1;i++) target = target[parts[i]]
      target[parts[parts.length-1]] = value
      return next
    })
  }

  function updateRoot(path: string, value: any) {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const parts = path.split('.')
      let target: any = next
      for (let i=0;i<parts.length-1;i++) target = target[parts[i]]
      target[parts[parts.length-1]] = value
      return next
    })
  }

  async function save(action: 'save'|'publish') {
    setBusy(action); setNotice('')
    const res = await fetch('/api/admin/public-pages', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action, content }) })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return setNotice(data.error || 'Could not save changes.')
    if (action === 'publish') setPublished(content)
    setNotice(action === 'publish' ? 'Pages published successfully.' : 'Draft saved.')
  }

  async function upload(path: string, file?: File, root = false) {
    if (!file) return
    setBusy('upload')
    const form = new FormData(); form.append('file', file); form.append('bucket','site-images'); form.append('path', `${root ? 'sitewide' : `page-${selected}`}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`)
    const res = await fetch('/api/upload', { method:'POST', body:form }); const data = await res.json().catch(() => ({})); setBusy(null)
    if (!res.ok) return setNotice(data.error || 'Image upload failed.')
    if (root) updateRoot(`${path}.url`, data.url)
    else update(`${path}.url`, data.url)
    setNotice('Photo uploaded into the draft. Save or publish when ready.')
  }

  const ImageEditor = ({ path, image, title }: any) => <div className="border border-border bg-white p-4">
    <p className="text-[12px] font-medium text-ink mb-3">{title}</p>
    <div className="aspect-[16/9] bg-surface overflow-hidden mb-3">{image.url ? <img decoding="async" src={image.url} alt={image.alt} className="w-full h-full object-cover" style={{objectPosition:`${image.focalX}% ${image.focalY}%`}}/> : <div className="h-full flex items-center justify-center text-muted"><ImageIcon/></div>}</div>
    <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer"><Upload size={13}/>{busy==='upload'?'Uploading...':'Replace image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { upload(path,e.target.files?.[0]); e.currentTarget.value='' }}/></label>
    <div className="grid md:grid-cols-2 gap-3 mt-4"><label className="text-[11px]">Image URL<input className="input-field mt-1" value={image.url} onChange={e=>update(`${path}.url`,e.target.value)}/></label><label className="text-[11px]">Alt text<input className="input-field mt-1" value={image.alt} onChange={e=>update(`${path}.alt`,e.target.value)}/></label></div>
    <div className="grid md:grid-cols-2 gap-4 mt-3"><label className="text-[11px]">Horizontal focus<input type="range" min="0" max="100" value={image.focalX} className="w-full mt-2" onChange={e=>update(`${path}.focalX`,Number(e.target.value))}/></label><label className="text-[11px]">Vertical focus<input type="range" min="0" max="100" value={image.focalY} className="w-full mt-2" onChange={e=>update(`${path}.focalY`,Number(e.target.value))}/></label></div>
  </div>

  if (loading) return <DashboardShell role="admin" userName="Admin"><div className="skeleton h-72"/></DashboardShell>

  if (loadError) return <DashboardShell role="admin" userName="Admin">
    <div className="mb-7"><p className="dashboard-eyebrow">Website & Brand</p><h1 className="dashboard-title">Public Pages</h1></div>
    <div className="border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
      {loadError} The editor has been kept closed so default content cannot be published over the live pages. Refresh to try again.
    </div>
  </DashboardShell>

  return <DashboardShell role="admin" userName="Admin">
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-7"><div><p className="dashboard-eyebrow">Website & Brand</p><h1 className="dashboard-title">Public Pages</h1><p className="dashboard-intro">Change the wording and photography for each major public page without touching GitHub.</p></div><div className="flex flex-wrap gap-2">{changed && <span className="px-3 py-2 bg-amber-50 text-amber-700 text-[11px]">Unpublished changes</span>}<button onClick={()=>save('save')} disabled={!!busy} className="btn-secondary inline-flex gap-2 items-center"><Save size={14}/>{busy==='save'?'Saving...':'Save draft'}</button><a href={previewHref(selected)} target="_blank" className="btn-secondary inline-flex gap-2 items-center"><Eye size={14}/>Preview page</a><button onClick={()=>save('publish')} disabled={!!busy} className="btn-primary inline-flex gap-2 items-center"><Send size={14}/>{busy==='publish'?'Publishing...':'Publish pages'}</button></div></div>
      {notice && <div className="mb-5 px-4 py-3 bg-white border border-border text-[12px] flex items-center gap-2"><CheckCircle2 size={14} className="text-accent"/>{notice}</div>}

      <section className="dashboard-panel mb-6">
        <p className="dashboard-eyebrow">Sitewide</p>
        <h2 className="dashboard-section-title mt-1">Footer editorial image strip</h2>
        <p className="text-[12px] text-muted mt-2 max-w-3xl">These four photographs appear above the footer across the public website. Change them once here and publish to update the strip everywhere.</p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
          {content.editorialBand.map((image, index) => <div key={index} className="border border-border bg-white p-3">
            <div className="aspect-[4/5] overflow-hidden bg-surface">{image.url ? <img loading="lazy" decoding="async" src={image.url} alt={image.alt} className="w-full h-full object-cover" style={{objectPosition:`${image.focalX}% ${image.focalY}%`}}/> : null}</div>
            <label className="mt-3 btn-secondary inline-flex w-full justify-center items-center gap-2 cursor-pointer"><Upload size={13}/>{busy==='upload'?'Uploading...':'Replace photo'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { upload(`editorialBand.${index}`,e.target.files?.[0],true); e.currentTarget.value='' }}/></label>
            <label className="block text-[11px] mt-3">Caption<input className="input-field mt-1" value={image.label} onChange={e=>updateRoot(`editorialBand.${index}.label`,e.target.value)}/></label>
            <label className="block text-[11px] mt-3">Alt text<input className="input-field mt-1" value={image.alt} onChange={e=>updateRoot(`editorialBand.${index}.alt`,e.target.value)}/></label>
            <div className="grid grid-cols-2 gap-3 mt-3"><label className="text-[10px]">Horizontal<input type="range" min="0" max="100" value={image.focalX} className="w-full mt-1" onChange={e=>updateRoot(`editorialBand.${index}.focalX`,Number(e.target.value))}/></label><label className="text-[10px]">Vertical<input type="range" min="0" max="100" value={image.focalY} className="w-full mt-1" onChange={e=>updateRoot(`editorialBand.${index}.focalY`,Number(e.target.value))}/></label></div>
          </div>)}
        </div>
      </section>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6">
        <aside className="bg-white border border-border p-3 h-fit">{PUBLIC_PAGE_SLUGS.map(slug => <button key={slug} onClick={()=>setSelected(slug)} className={`w-full text-left px-4 py-3 text-[12px] border-l-2 ${selected===slug?'border-accent bg-surface text-ink':'border-transparent text-muted hover:text-ink'}`}>{pageNames[slug]}</button>)}</aside>
        <div className="space-y-6">
          <section className="dashboard-panel"><p className="dashboard-eyebrow">{page.label}</p><h2 className="dashboard-section-title mt-1">Hero wording</h2><div className="grid md:grid-cols-2 gap-4 mt-5"><label className="text-[11px]">Small heading<input className="input-field mt-1" value={page.hero.eyebrow} onChange={e=>update('hero.eyebrow',e.target.value)}/></label><label className="text-[11px]">Main heading<input className="input-field mt-1" value={page.hero.heading} onChange={e=>update('hero.heading',e.target.value)}/></label></div><label className="block text-[11px] mt-4">Introduction<textarea rows={4} className="input-field mt-1 resize-y" value={page.hero.text} onChange={e=>update('hero.text',e.target.value)}/></label></section>
          <ImageEditor path="hero.image" image={page.hero.image} title="Hero image"/>
          {page.blocks.map((b,i)=><section key={i} className="dashboard-panel"><div className="flex items-center justify-between"><div><p className="dashboard-eyebrow">Section {i+1}</p><h2 className="dashboard-section-title">Page section</h2></div><label className="text-[11px] flex items-center gap-2"><input type="checkbox" checked={b.visible} onChange={e=>update(`blocks.${i}.visible`,e.target.checked)}/>Show section</label></div><div className="grid md:grid-cols-2 gap-4 mt-5"><label className="text-[11px]">Small heading<input className="input-field mt-1" value={b.eyebrow} onChange={e=>update(`blocks.${i}.eyebrow`,e.target.value)}/></label><label className="text-[11px]">Heading<input className="input-field mt-1" value={b.heading} onChange={e=>update(`blocks.${i}.heading`,e.target.value)}/></label></div><label className="block text-[11px] mt-4">Wording<textarea rows={4} className="input-field mt-1 resize-y" value={b.text} onChange={e=>update(`blocks.${i}.text`,e.target.value)}/></label><div className="mt-5"><ImageEditor path={`blocks.${i}.image`} image={b.image} title={`Section ${i+1} image`}/></div></section>)}
        </div>
      </div>
    </div>
  </DashboardShell>
}
