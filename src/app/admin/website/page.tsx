'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import WebsiteEditorPreview from '@/components/WebsiteEditorPreview'
import {
  cloneDefaultWebsiteContent,
  type WebsiteContent,
  type WebsiteHistoryEntry,
  type WebsiteSectionId,
} from '@/lib/site-content'
import {
  ArrowDown, ArrowUp, Check, ChevronRight, Eye, History, Image as ImageIcon,
  LayoutTemplate, Menu, Palette, RefreshCw, Save, Send, Type, Upload,
} from 'lucide-react'

type Tab = 'content' | 'images' | 'brand' | 'navigation' | 'sections' | 'history'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'content', label: 'Wording', icon: <Type size={15} /> },
  { id: 'images', label: 'Photos', icon: <ImageIcon size={15} /> },
  { id: 'brand', label: 'Fonts & colours', icon: <Palette size={15} /> },
  { id: 'navigation', label: 'Menu & footer', icon: <Menu size={15} /> },
  { id: 'sections', label: 'Page sections', icon: <LayoutTemplate size={15} /> },
  { id: 'history', label: 'Version history', icon: <History size={15} /> },
]

const SECTION_NAMES: Record<WebsiteSectionId, string> = {
  proof: 'Trust strip', howItWorks: 'How it works', product: 'Product preview',
  trust: 'Property types', roles: 'Featured roles', cta: 'Talent & employer callouts',
  services: 'Agency, Academy & Residency', testimonials: 'Testimonials',
}

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <label className="block">
    <span className="block text-[11px] font-medium text-ink mb-1.5">{label}</span>
    <input value={value} onChange={event => onChange(event.target.value)} className="input-field" />
    {hint && <span className="block text-[10px] text-muted mt-1">{hint}</span>}
  </label>
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return <label className="block">
    <span className="block text-[11px] font-medium text-ink mb-1.5">{label}</span>
    <textarea value={value} onChange={event => onChange(event.target.value)} rows={rows} className="input-field resize-y" />
  </label>
}

export default function WebsiteEditorPage() {
  const [tab, setTab] = useState<Tab>('content')
  const [content, setContent] = useState<WebsiteContent>(cloneDefaultWebsiteContent())
  const [published, setPublished] = useState<WebsiteContent>(cloneDefaultWebsiteContent())
  const [history, setHistory] = useState<WebsiteHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'save' | 'publish' | 'upload' | 'restore' | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/content?kind=website_editor')
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Website settings could not be loaded.')
      if (data?.draft) setContent(data.draft)
      if (data?.published) setPublished(data.published)
      if (Array.isArray(data?.history)) setHistory(data.history)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Website settings could not be loaded.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const changed = useMemo(() => JSON.stringify(content) !== JSON.stringify(published), [content, published])

  const update = (path: string, value: unknown) => {
    setContent(previous => {
      const next = JSON.parse(JSON.stringify(previous)) as any
      const parts = path.split('.')
      let target = next
      for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]]
      target[parts[parts.length - 1]] = value
      return next
    })
  }

  const flash = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4500)
  }

  const saveDraft = async () => {
    setBusy('save')
    const response = await fetch('/api/admin/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'website_save_draft', content }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) {
      flash('error', data.error || 'Draft could not be saved.')
      return false
    }
    flash('success', 'Draft saved. The public website has not changed.')
    return true
  }

  const openFullPreview = async () => {
    const preview = window.open('', '_blank')
    const saved = await saveDraft()
    if (saved && preview) preview.location.href = '/?websitePreview=draft'
    else preview?.close()
  }

  const publishWebsite = async () => {
    if (!window.confirm('Publish this wording, imagery and brand styling to the website? A previous version will be kept.')) return
    setBusy('publish')
    const response = await fetch('/api/admin/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'website_publish', content }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) return flash('error', data.error || 'Website could not be published.')
    setPublished(content)
    setHistory(data.history || history)
    flash('success', 'Website published successfully.')
  }

  const uploadImage = async (path: string, file: File) => {
    setBusy('upload')
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'site-images')
    form.append('path', 'website-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '-'))
    const response = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) return flash('error', data.error || 'Image upload failed.')
    update(path + '.url', data.url)
    flash('success', 'Photo uploaded to the draft. Press Save Draft when ready.')
  }

  const restore = async (id: string) => {
    if (!window.confirm('Restore this version into the draft editor? The public website will not change until you publish.')) return
    setBusy('restore')
    const response = await fetch('/api/admin/content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'website_restore_draft', id }),
    })
    const data = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) return flash('error', data.error || 'Version could not be restored.')
    setContent(data.content)
    setTab('content')
    flash('success', 'Previous version restored as a draft.')
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= content.sections.length) return
    const sections = [...content.sections]
    ;[sections[index], sections[target]] = [sections[target], sections[index]]
    update('sections', sections)
  }

  const ImageEditor = ({ label, path, image }: { label: string; path: string; image: { url: string; alt: string; focalX: number; focalY: number } }) => (
    <div className="border border-border p-4 bg-white">
      <div className="grid sm:grid-cols-[180px_1fr] gap-5">
        <div>
          <div className="aspect-video bg-surface overflow-hidden">
            {image.url && <img src={image.url} alt={image.alt} className="w-full h-full object-cover" style={{ objectPosition: image.focalX + '% ' + image.focalY + '%' }} />}
          </div>
          <label className="mt-2 flex items-center justify-center gap-1.5 py-2 border border-border text-[11px] font-medium cursor-pointer hover:bg-surface">
            {busy === 'upload' ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />} Replace photo
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={event => {
              const file = event.target.files?.[0]
              if (file) uploadImage(path, file)
              event.target.value = ''
            }} />
          </label>
        </div>
        <div className="space-y-3">
          <p className="text-[13px] font-medium text-ink">{label}</p>
          <Field label="Image URL" value={image.url} onChange={value => update(path + '.url', value)} />
          <Field label="Alt text" value={image.alt} onChange={value => update(path + '.alt', value)} hint="Describe the image for accessibility and search engines." />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px]">Horizontal focus
              <input type="range" min="0" max="100" value={image.focalX} onChange={event => update(path + '.focalX', Number(event.target.value))} className="w-full mt-2" />
            </label>
            <label className="text-[11px]">Vertical focus
              <input type="range" min="0" max="100" value={image.focalY} onChange={event => update(path + '.focalY', Number(event.target.value))} className="w-full mt-2" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) return <DashboardShell role="admin" userName="Admin"><div className="h-72 flex items-center justify-center"><RefreshCw className="animate-spin text-muted" /></div></DashboardShell>

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-2">Website control</p>
            <h1 className="text-[30px] font-medium text-ink">Website & Brand</h1>
            <p className="text-[13px] text-muted mt-1">Change the homepage wording, photos, fonts, colours, buttons and menu from one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {changed && <span className="text-[11px] text-amber-700 bg-amber-50 px-3 py-2">Unpublished changes</span>}
            <button type="button" onClick={saveDraft} disabled={!!busy} className="btn-secondary flex items-center gap-2"><Save size={14} />{busy === 'save' ? 'Saving…' : 'Save Draft'}</button>
            <button type="button" onClick={openFullPreview} disabled={!!busy} className="btn-secondary flex items-center gap-2"><Eye size={14} />Full Preview</button>
            <button type="button" onClick={publishWebsite} disabled={!!busy} className="btn-primary flex items-center gap-2"><Send size={14} />{busy === 'publish' ? 'Publishing…' : 'Publish'}</button>
          </div>
        </div>

        {notice && <div className={'mb-5 px-4 py-3 text-[13px] ' + (notice.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>{notice.text}</div>}

        <div className="grid xl:grid-cols-[minmax(0,1fr)_430px] gap-7 items-start">
          <div className="bg-white border border-border min-w-0">
            <div className="flex overflow-x-auto border-b border-border">
              {TABS.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)}
                className={'shrink-0 flex items-center gap-2 px-4 py-3 text-[12px] border-b-2 ' + (tab === item.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')}>
                {item.icon}{item.label}
              </button>)}
            </div>

            <div className="p-5 md:p-7">
              {tab === 'content' && <div className="space-y-9">
                <section>
                  <h2 className="text-[17px] font-medium mb-4">Homepage hero</h2>
                  <div className="space-y-5">
                    {content.hero.slides.map((slide, index) => <div key={index} className="p-5 bg-surface/60 border border-border space-y-3">
                      <p className="text-[12px] font-semibold">Slide {index + 1}</p>
                      <Field label="Small heading" value={slide.eyebrow} onChange={value => update('hero.slides.' + index + '.eyebrow', value)} />
                      <Field label="Main heading" value={slide.heading} onChange={value => update('hero.slides.' + index + '.heading', value)} />
                      <TextArea label="Paragraph" value={slide.text} onChange={value => update('hero.slides.' + index + '.text', value)} />
                    </div>)}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="First button" value={content.hero.primaryLabel} onChange={value => update('hero.primaryLabel', value)} />
                      <Field label="Second button" value={content.hero.secondaryLabel} onChange={value => update('hero.secondaryLabel', value)} />
                      <Field label="First button link" value={content.hero.primaryHref} onChange={value => update('hero.primaryHref', value)} />
                      <Field label="Second button link" value={content.hero.secondaryHref} onChange={value => update('hero.secondaryHref', value)} />
                    </div>
                  </div>
                </section>
                <section className="border-t border-border pt-7 space-y-4">
                  <h2 className="text-[17px] font-medium">Homepage sections</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="How it works label" value={content.howItWorks.eyebrow} onChange={value => update('howItWorks.eyebrow', value)} />
                    <Field label="How it works heading" value={content.howItWorks.heading} onChange={value => update('howItWorks.heading', value)} />
                    <Field label="Product label" value={content.product.eyebrow} onChange={value => update('product.eyebrow', value)} />
                    <Field label="Product heading" value={content.product.heading} onChange={value => update('product.heading', value)} />
                  </div>
                  <TextArea label="Product introduction" value={content.product.intro} onChange={value => update('product.intro', value)} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    {content.product.cards.map((card, index) => <div key={index} className="space-y-3 border border-border p-4">
                      <Field label={`Product card ${index + 1} label`} value={card.label} onChange={value => update(`product.cards.${index}.label`, value)} />
                      <TextArea label="Card wording" value={card.text} onChange={value => update(`product.cards.${index}.text`, value)} rows={4} />
                    </div>)}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Featured roles label" value={content.roles.eyebrow} onChange={value => update('roles.eyebrow', value)} />
                    <Field label="Featured roles heading" value={content.roles.heading} onChange={value => update('roles.heading', value)} />
                    <Field label="Featured roles link" value={content.roles.linkLabel} onChange={value => update('roles.linkLabel', value)} />
                    <Field label="Testimonials label" value={content.testimonials.eyebrow} onChange={value => update('testimonials.eyebrow', value)} />
                    <Field label="Testimonials heading" value={content.testimonials.heading} onChange={value => update('testimonials.heading', value)} />
                    <Field label="Testimonials link" value={content.testimonials.linkLabel} onChange={value => update('testimonials.linkLabel', value)} />
                  </div>
                </section>
                <section className="border-t border-border pt-7 space-y-5">
                  <h2 className="text-[17px] font-medium">Trust wording</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {content.proof.items.map((item, index) => <Field key={index} label={`Trust strip item ${index + 1}`} value={item} onChange={value => update(`proof.items.${index}`, value)} />)}
                  </div>
                  <Field label="Property types heading" value={content.trust.eyebrow} onChange={value => update('trust.eyebrow', value)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {content.trust.items.map((item, index) => <Field key={index} label={`Property type ${index + 1}`} value={item} onChange={value => update(`trust.items.${index}`, value)} />)}
                  </div>
                </section>
                <section className="border-t border-border pt-7 space-y-5">
                  <h2 className="text-[17px] font-medium">Talent and employer callouts</h2>
                  {(['talent', 'employer'] as const).map(kind => <div key={kind} className="p-5 border border-border space-y-3">
                    <p className="text-[12px] font-semibold capitalize">{kind}</p>
                    <Field label="Small heading" value={content.cta[kind].eyebrow} onChange={value => update('cta.' + kind + '.eyebrow', value)} />
                    <Field label="Main heading" value={content.cta[kind].heading} onChange={value => update('cta.' + kind + '.heading', value)} />
                    <TextArea label="Paragraph" value={content.cta[kind].text} onChange={value => update('cta.' + kind + '.text', value)} />
                    <Field label="Button wording" value={content.cta[kind].buttonLabel} onChange={value => update('cta.' + kind + '.buttonLabel', value)} />
                    <Field label="Button link" value={content.cta[kind].buttonHref} onChange={value => update('cta.' + kind + '.buttonHref', value)} />
                  </div>)}
                </section>
                <section className="border-t border-border pt-7 space-y-5">
                  <h2 className="text-[17px] font-medium">Agency, Academy and Residency</h2>
                  {content.services.cards.map((card, index) => <div key={index} className="space-y-3 border border-border p-5">
                    <Field label="Small heading" value={card.eyebrow} onChange={value => update(`services.cards.${index}.eyebrow`, value)} />
                    <Field label="Main heading" value={card.heading} onChange={value => update(`services.cards.${index}.heading`, value)} />
                    <TextArea label="Paragraph" value={card.text} onChange={value => update(`services.cards.${index}.text`, value)} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Button wording" value={card.buttonLabel} onChange={value => update(`services.cards.${index}.buttonLabel`, value)} />
                      <Field label="Button link" value={card.buttonHref} onChange={value => update(`services.cards.${index}.buttonHref`, value)} />
                    </div>
                  </div>)}
                </section>
              </div>}

              {tab === 'images' && <div className="space-y-5">
                <div><h2 className="text-[17px] font-medium">Homepage photos</h2><p className="text-[12px] text-muted mt-1">Replace, crop by focal point, and add alt text. Nothing changes publicly until you publish.</p></div>
                {content.hero.slides.map((slide, index) => <ImageEditor key={index} label={'Hero slide ' + (index + 1)} path={'hero.slides.' + index + '.image'} image={slide.image} />)}
                <ImageEditor label="How it works" path="howItWorks.image" image={content.howItWorks.image} />
                <ImageEditor label="Callout background" path="cta.background" image={content.cta.background} />
                {content.roles.images.map((item, index) => <ImageEditor key={index} label={'Featured role card ' + (index + 1)} path={'roles.images.' + index} image={item} />)}
              </div>}

              {tab === 'brand' && <div className="space-y-7">
                <div><h2 className="text-[17px] font-medium">Fonts & brand style</h2><p className="text-[12px] text-muted mt-1">The default is now a clean modern sans-serif style, closer to your Squarespace website.</p></div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <label className="text-[11px] font-medium">Heading font<select value={content.brand.headingFont} onChange={event => update('brand.headingFont', event.target.value)} className="input-field mt-1.5"><option value="modern">Modern sans-serif</option><option value="editorial">Editorial serif</option><option value="classic">Classic serif</option></select></label>
                  <label className="text-[11px] font-medium">Body font<select value={content.brand.bodyFont} onChange={event => update('brand.bodyFont', event.target.value)} className="input-field mt-1.5"><option value="system">Modern system</option><option value="clean">Clean Arial</option><option value="friendly">Friendly sans-serif</option></select></label>
                  <label className="text-[11px] font-medium">Button shape<select value={content.brand.buttonStyle} onChange={event => update('brand.buttonStyle', event.target.value)} className="input-field mt-1.5"><option value="square">Square</option><option value="soft">Soft corners</option><option value="pill">Rounded pill</option></select></label>
                  <label className="text-[11px] font-medium">Section spacing<select value={content.brand.spacing} onChange={event => update('brand.spacing', event.target.value)} className="input-field mt-1.5"><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="airy">Airy</option></select></label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {([['accent', 'Accent / buttons'], ['ink', 'Main text'], ['background', 'Page background'], ['surface', 'Section background']] as const).map(([key, label]) =>
                    <label key={key} className="border border-border p-4 flex items-center gap-3 text-[12px] font-medium">
                      <input type="color" value={content.brand[key]} onChange={event => update('brand.' + key, event.target.value.toUpperCase())} className="w-10 h-10 border-0 bg-transparent" />
                      <span>{label}<span className="block text-[10px] text-muted font-mono mt-0.5">{content.brand[key]}</span></span>
                    </label>)}
                </div>
              </div>}

              {tab === 'navigation' && <div className="space-y-7">
                <div><h2 className="text-[17px] font-medium">Menu wording</h2><p className="text-[12px] text-muted mt-1">Change labels without changing where the links go.</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(content.navigation).map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} value={value} onChange={next => update('navigation.' + key, next)} />)}
                </div>
                <div className="border-t border-border pt-7 grid sm:grid-cols-2 gap-4">
                  <Field label="Copyright wording" value={content.footer.copyright} onChange={value => update('footer.copyright', value)} />
                  <Field label="Staff link wording" value={content.footer.staffLabel} onChange={value => update('footer.staffLabel', value)} />
                </div>
              </div>}

              {tab === 'sections' && <div className="space-y-5">
                <div><h2 className="text-[17px] font-medium">Show, hide and reorder</h2><p className="text-[12px] text-muted mt-1">The homepage follows this order from top to bottom.</p></div>
                <div className="space-y-2">{content.sections.map((section, index) => <div key={section.id} className="flex items-center gap-3 p-3 border border-border">
                  <span className="w-7 h-7 flex items-center justify-center bg-surface text-[11px]">{index + 1}</span>
                  <span className="flex-1 text-[13px] font-medium">{SECTION_NAMES[section.id]}</span>
                  <label className="flex items-center gap-2 text-[11px] text-muted"><input type="checkbox" checked={section.visible} onChange={event => update('sections.' + index + '.visible', event.target.checked)} />Show</label>
                  <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-2 border border-border disabled:opacity-25"><ArrowUp size={13} /></button>
                  <button type="button" onClick={() => moveSection(index, 1)} disabled={index === content.sections.length - 1} className="p-2 border border-border disabled:opacity-25"><ArrowDown size={13} /></button>
                </div>)}</div>
              </div>}

              {tab === 'history' && <div className="space-y-5">
                <div><h2 className="text-[17px] font-medium">Version history</h2><p className="text-[12px] text-muted mt-1">Each publish keeps the previous version. Restoring creates a draft first.</p></div>
                {history.length === 0 ? <div className="py-16 text-center text-[13px] text-muted border border-dashed border-border">No previous published versions yet.</div> :
                  <div className="space-y-2">{history.map(version => <div key={version.id} className="flex items-center justify-between p-4 border border-border">
                    <div><p className="text-[13px] font-medium">{new Date(version.publishedAt).toLocaleString('en-GB')}</p><p className="text-[10px] text-muted mt-1">Previous published homepage</p></div>
                    <button type="button" disabled={busy === 'restore'} onClick={() => restore(version.id)} className="btn-secondary !py-2 flex items-center gap-1.5"><RefreshCw size={12} />Restore to draft</button>
                  </div>)}</div>}
              </div>}
            </div>
          </div>

          <aside className="xl:sticky xl:top-6">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-[12px] font-medium text-ink">Live draft preview</p><p className="text-[10px] text-muted">Updates while you type</p></div>
              <ChevronRight size={15} className="text-muted" />
            </div>
            <WebsiteEditorPreview content={content} />
            <div className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-muted"><Check size={12} className="shrink-0 mt-0.5 text-emerald-600" />Draft changes are private until Publish is pressed.</div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  )
}
