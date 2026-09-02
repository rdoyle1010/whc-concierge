'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Upload, RefreshCw, Send, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { cloneDefaultWebsiteContent, type WebsiteContent } from '@/lib/site-content'
import { cloneDefaultPublicPagesContent, PUBLIC_PAGE_SLUGS, type PublicPagesContent } from '@/lib/public-page-content'

// Every picture on the public site, on one screen. The two content stores
// behind the site (homepage/brand, and the standalone public pages) each
// have their own editor with wording, cropping and section controls; this
// page exists for the one job those editors make slow - finding the picture
// you want to change and swapping it - so it lists them all together and
// publishes both stores in a single action.

type Store = 'website' | 'pages'
type PanelKey = 'homepageCta' | 'authPanel' | 'intelligenceHero' | 'intelligenceJournal' | 'agencyProfessional'
type Slot = { store: Store; field: string; group: string; label: string; url: string; href?: string; panelKey?: PanelKey }

const pageNames: Record<string, string> = {
  properties: 'Properties', agency: 'Agency', residency: 'Residency',
  pricing: 'Pricing', 'coming-soon': 'Coming Soon',
}
const pagePaths: Record<string, string> = {
  properties: '/properties', agency: '/agency/about', residency: '/residency',
  pricing: '/pricing', 'coming-soon': '/coming-soon',
}

function websiteSlots(content: WebsiteContent): Slot[] {
  const slots: Slot[] = [
    { store: 'website', field: 'brand.logo.url', group: 'Brand', label: 'Logo', url: content.brand.logo.url, href: '/admin/website' },
  ]
  content.hero.slides.forEach((slide, index) => slots.push({
    store: 'website', field: `hero.slides.${index}.image.url`, group: 'Homepage',
    label: `Hero slide ${index + 1}`, url: slide.image.url, href: '/',
  }))
  slots.push({ store: 'website', field: 'howItWorks.image.url', group: 'Homepage', label: 'How it works', url: content.howItWorks.image.url, href: '/' })
  slots.push({ store: 'website', field: 'cta.background.url', group: 'Homepage', label: 'Closing panel background', url: content.cta.background.url, href: '/' })
  content.roles.images.forEach((item, index) => slots.push({
    store: 'website', field: `roles.images.${index}.url`, group: 'Homepage',
    label: `Featured role card ${index + 1}`, url: item.url, href: '/',
  }))
  slots.push({ store: 'website', field: 'panels.homepageCta.image.url', group: 'Dark panels', label: 'Homepage closing panel', url: content.panels.homepageCta.image.url, href: '/', panelKey: 'homepageCta' })
  slots.push({ store: 'website', field: 'panels.authPanel.image.url', group: 'Dark panels', label: 'Sign-in panel', url: content.panels.authPanel.image.url, href: '/login', panelKey: 'authPanel' })
  slots.push({ store: 'website', field: 'panels.intelligenceHero.image.url', group: 'Dark panels', label: 'Intelligence masthead picture', url: content.panels.intelligenceHero.image.url, href: '/intelligence', panelKey: 'intelligenceHero' })
  slots.push({ store: 'website', field: 'panels.intelligenceJournal.image.url', group: 'Dark panels', label: 'Intelligence closing panel', url: content.panels.intelligenceJournal.image.url, href: '/intelligence', panelKey: 'intelligenceJournal' })
  slots.push({ store: 'website', field: 'panels.agencyProfessional.image.url', group: 'Dark panels', label: 'Agency professional band picture', url: content.panels.agencyProfessional.image.url, href: '/agency/about', panelKey: 'agencyProfessional' })
  return slots
}

function pageSlots(content: PublicPagesContent): Slot[] {
  const slots: Slot[] = []
  content.editorialBand.forEach((item, index) => slots.push({
    store: 'pages', field: `editorialBand.${index}.url`, group: 'Footer strip',
    label: item.label || `Strip image ${index + 1}`, url: item.url,
  }))
  for (const slug of PUBLIC_PAGE_SLUGS) {
    const page = content.pages[slug]
    slots.push({ store: 'pages', field: `pages.${slug}.hero.image.url`, group: pageNames[slug], label: 'Hero image', url: page.hero.image.url, href: pagePaths[slug] })
    page.blocks.forEach((block, index) => slots.push({
      store: 'pages', field: `pages.${slug}.blocks.${index}.image.url`, group: pageNames[slug],
      label: `Section ${index + 1}${block.visible ? '' : ' (hidden)'}`, url: block.image.url, href: pagePaths[slug],
    }))
  }
  return slots
}

function setPath<T>(content: T, field: string, value: string): T {
  const next = JSON.parse(JSON.stringify(content))
  const parts = field.split('.')
  let target: any = next
  for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]]
  target[parts[parts.length - 1]] = value
  return next
}

export default function MediaLibraryPage() {
  const [website, setWebsite] = useState<WebsiteContent>(cloneDefaultWebsiteContent())
  const [pages, setPages] = useState<PublicPagesContent>(cloneDefaultPublicPagesContent())
  const [publishedWebsite, setPublishedWebsite] = useState('')
  const [publishedPages, setPublishedPages] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Defaults must never be published over live content, so a failed load
  // disables the page rather than showing an editable set of defaults.
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/content?kind=website_editor').then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) })),
      fetch('/api/admin/public-pages').then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) })),
    ])
      .then(([site, publicPages]) => {
        if (!site.ok || !publicPages.ok) { setLoadError('The current pictures could not be loaded. Refresh and try again.'); return }
        if (site.data.draft) { setWebsite(site.data.draft); setPublishedWebsite(JSON.stringify(site.data.published || site.data.draft)) }
        if (publicPages.data.draft) { setPages(publicPages.data.draft); setPublishedPages(JSON.stringify(publicPages.data.published || publicPages.data.draft)) }
      })
      .catch(() => setLoadError('The current pictures could not be loaded. Refresh and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const slots = useMemo(
    () => (loadError ? [] : [...websiteSlots(website), ...pageSlots(pages)]),
    [website, pages, loadError],
  )
  const groups = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) map.set(slot.group, [...(map.get(slot.group) || []), slot])
    return [...map.entries()]
  }, [slots])

  const changed = JSON.stringify(website) !== publishedWebsite || JSON.stringify(pages) !== publishedPages

  async function replace(slot: Slot, file: File) {
    setBusy(slot.field); setNotice(null)
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'site-images')
    form.append('path', 'website-' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '-'))
    const response = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) { setNotice({ type: 'error', text: data.error || 'That picture could not be uploaded.' }); return }
    if (slot.store === 'website') setWebsite(current => setPath(current, slot.field, data.url))
    else setPages(current => setPath(current, slot.field, data.url))
    setNotice({ type: 'success', text: 'Uploaded. Press Publish pictures to put it live.' })
  }

  async function publish() {
    setBusy('publish'); setNotice(null)
    try {
      const [site, publicPages] = await Promise.all([
        fetch('/api/admin/content', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'website_publish', content: website }),
        }),
        fetch('/api/admin/public-pages', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'publish', content: pages }),
        }),
      ])
      if (!site.ok || !publicPages.ok) throw new Error('The pictures could not be published. Nothing has changed publicly.')
      setPublishedWebsite(JSON.stringify(website))
      setPublishedPages(JSON.stringify(pages))
      setNotice({ type: 'success', text: 'Published. The new pictures are live.' })
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The pictures could not be published.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="dashboard-eyebrow">Pictures</p>
          <h1 className="dashboard-title">Every picture on the site</h1>
          <p className="dashboard-intro max-w-2xl">Swap any picture on the public site from here. For wording, cropping and section order, use <Link href="/admin/website" className="underline">Website &amp; Brand</Link> or <Link href="/admin/website/pages" className="underline">Public pages</Link>.</p>
        </div>
        <button type="button" onClick={publish} disabled={!changed || busy !== null || loading || Boolean(loadError)} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
          {busy === 'publish' ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Publish pictures
        </button>
      </div>

      {notice && <div role="status" className={`mt-5 border px-4 py-3 text-[13px] ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>{notice.text}</div>}
      {loadError && <div role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">{loadError}</div>}
      {loading && <p className="mt-6 text-[13px] text-secondary">Loading pictures...</p>}

      {!loading && !loadError && changed && (
        <div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 border border-ink bg-ink px-4 py-3 shadow-lg">
          <p className="text-[12px] text-white">You have unpublished changes. Nothing is live until you publish.</p>
          <button type="button" onClick={publish} disabled={busy !== null} className="inline-flex items-center gap-2 bg-white px-4 py-2 text-[12px] font-semibold text-ink disabled:opacity-50">
            {busy === 'publish' ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />} Publish pictures
          </button>
        </div>
      )}

      {groups.map(([group, items]) => (
        <section key={group} className="dashboard-panel mt-6">
          <h2 className="dashboard-section-title">{group}</h2>
          {group === 'Dark panels' && <p className="mt-1 text-[12px] text-secondary max-w-2xl">The two large charcoal areas on the site. A picture here shows on the site; remove it and the panel goes back to plain charcoal. Tick the box to sell the space - a sponsor&apos;s advert replaces your picture while their campaign runs.</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(slot => (
              <div key={slot.field} className="border border-border bg-white p-3">
                <div className="aspect-video overflow-hidden bg-surface">
                  {slot.url
                    ? <img loading="lazy" decoding="async" src={slot.url} alt="" className="h-full w-full object-cover" />
                    : <div className="flex h-full items-center justify-center text-gray-300"><ImageIcon size={26} /></div>}
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <p className="text-[12px] font-medium text-ink">{slot.label}</p>
                  {slot.href && <a href={slot.href} target="_blank" rel="noopener" className="shrink-0 text-muted hover:text-ink" aria-label={`Open ${slot.label} on the site`}><ExternalLink size={13} /></a>}
                </div>
                {!slot.url && <p className="mt-0.5 text-[11px] text-muted">No picture set</p>}
                {slot.panelKey && (
                  <div className="mt-2 space-y-1.5">
                    <label className="flex items-center gap-2 text-[11px] text-secondary">
                      <input
                        type="checkbox"
                        checked={website.panels[slot.panelKey].mode === 'advert'}
                        onChange={event => setWebsite(current => setPath(current, `panels.${slot.panelKey}.mode`, event.target.checked ? 'advert' : 'image'))}
                      />
                      Sell this panel to sponsors
                    </label>
                    {slot.url && (
                      <button type="button" onClick={() => setWebsite(current => setPath(current, slot.field, ''))} className="text-[11px] text-muted underline hover:text-ink">
                        Remove picture
                      </button>
                    )}
                  </div>
                )}
                <label className="mt-2.5 flex cursor-pointer items-center justify-center gap-1.5 border border-border py-2 text-[11px] font-medium hover:bg-surface">
                  {busy === slot.field ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
                  {slot.url ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" disabled={busy !== null} onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) replace(slot, file)
                    event.target.value = ''
                  }} />
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}
    </DashboardShell>
  )
}
