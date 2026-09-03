'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { Plus, Trash2, Save, ExternalLink, Send, Star } from 'lucide-react'
import {
  BUDGET_BANDS, CONSULTANCY_SPECIALISMS, ENGAGEMENT_TYPES, WORKS_WITH,
  missingForPublication, type ConsultancyProject,
} from '@/lib/consultancy'

const EMPTY_PROJECT: ConsultancyProject = {
  title: '', client: '', confidential: false, year: '', location: '', summary: '', outcome: '', image_url: '',
}

const budgetLabel = (value: string) => BUDGET_BANDS.find(band => band.value === value)?.label || ''

export default function TalentConsultancyPage() {
  const [profile, setProfile] = useState<any>(null)
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [featuring, setFeaturing] = useState(false)
  const [focus, setFocus] = useState<string | null>(null)

  // The trimmed workspace is inferred from the fact that somebody listed a
  // practice on an otherwise empty talent profile. An inference has to be
  // reversible in one click by the person it was made about.
  async function switchWorkspace(next: 'consultant' | null) {
    await fetch('/api/consultancy/mine', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_focus: next }),
    })
    window.location.reload()
  }

  async function feature() {
    setFeaturing(true); setNotice(null)
    const res = await fetch('/api/commercial/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'consultancy_featured', returnUrl: window.location.origin }),
    })
    const body = await res.json().catch(() => ({}))
    if (body.url) { window.location.href = body.url; return }
    setFeaturing(false)
    setNotice({ kind: 'error', text: body.error || 'Could not open the payment page.' })
  }

  useEffect(() => {
    fetch('/api/consultancy/mine', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProfile(data?.profile || { practice_name: '', specialisms: [], engagement_types: [], projects: [], works_with: 'uk', is_live: false })
        setEnquiries(data?.enquiries || [])
        setFocus(data?.accountFocus || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: any) => setProfile((current: any) => ({ ...current, [key]: value }))
  const projects: ConsultancyProject[] = Array.isArray(profile?.projects) ? profile.projects : []
  const specialisms: string[] = Array.isArray(profile?.specialisms) ? profile.specialisms : []
  const engagements: string[] = Array.isArray(profile?.engagement_types) ? profile.engagement_types : []
  const missing = profile ? missingForPublication(profile) : []

  // The form is long. Without this a consultant sees one section, a greyed-out
  // Publish button and a list of things they have not done, with no sense of
  // how much is left or where any of it is.
  const steps = [
    {
      n: 1, title: 'The practice', hint: 'Who you are and what you do',
      done: Boolean(profile?.practice_name && profile?.headline && String(profile?.summary || '').length >= 120),
    },
    {
      n: 2, title: 'Specialisms', hint: 'What properties can filter you by',
      done: specialisms.length > 0,
    },
    {
      n: 3, title: 'Selected work', hint: 'The projects that make the case',
      done: projects.filter(project => project.title).length > 0,
    },
  ]

  const toggle = (key: string, list: string[], value: string) =>
    set(key, list.includes(value) ? list.filter(item => item !== value) : [...list, value])

  const setProject = (index: number, patch: Partial<ConsultancyProject>) =>
    set('projects', projects.map((project, i) => i === index ? { ...project, ...patch } : project))

  async function save(publish: boolean) {
    setSaving(true); setNotice(null)
    const res = await fetch('/api/consultancy/mine', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, is_live: publish }),
    })
    const body = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { setNotice({ kind: 'error', text: body.error || 'Could not save.' }); return }
    setProfile(body.profile)
    setNotice({
      kind: 'ok',
      text: publish
        ? 'Sent for review. It goes live in the directory once WHC has read it.'
        : body.returnedToReview
          ? 'Saved. Because the listing was live, the change goes back for review before it reappears.'
          : 'Saved as a draft. Nobody can see it yet.',
    })
    setTimeout(() => setNotice(null), 6000)
  }

  if (loading) return <DashboardShell role="talent"><div className="skeleton h-64 w-full" /></DashboardShell>

  const status = profile?.approval_status
  const live = profile?.is_live && status === 'approved'

  return (
    <DashboardShell role="talent">
      <div className="mb-7">
        <p className="dashboard-eyebrow">Consultancy</p>
        <h1 className="dashboard-title">Your consultancy listing</h1>
        <p className="dashboard-intro">
          Free to list. Properties browse by specialism and contact you directly - this is where the work that shaped a
          spa goes, not another biography.
        </p>
      </div>

      {/* What good looks like, before asking anybody to produce it. A consultant
          arriving cold from the public directory has never seen one of these. */}
      {!live && (
        <div className="dashboard-card mb-6">
          <p className="text-[13px] font-medium text-ink">Three steps, about ten minutes</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {steps.map(step => (
              <div key={step.n} className={`border p-4 ${step.done ? 'border-ink bg-[#f1f1f1]' : 'border-border'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${step.done ? 'bg-ink text-white' : 'border border-border text-muted'}`}>
                    {step.done ? '✓' : step.n}
                  </span>
                  <p className="text-[13px] font-medium text-ink">{step.title}</p>
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-muted">{step.hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-4 text-[12px] leading-6 text-secondary">
            <span className="font-semibold text-ink">What makes one work.</span> A property is buying judgement, and
            judgement is proved by outcomes. &ldquo;Rebuilt the retail calendar&rdquo; is a description. &ldquo;Retail
            per treatment from £6.10 to £14.40 in two quarters&rdquo; is a reason to call you. Work under NDA can be
            listed as the property type instead of the name, so nothing has to be left out.
          </p>
        </div>
      )}

      {/* State: a consultant needs to know whether anybody can see this. */}
      <div className="dashboard-card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-ink">
            {live ? 'Live in the directory' : status === 'pending' && profile?.is_live ? 'With WHC for review'
              : status === 'rejected' ? 'Not approved' : 'Draft - not visible to anyone'}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {live ? `${profile.view_count || 0} view${profile.view_count === 1 ? '' : 's'} · ${profile.enquiry_count || 0} enquir${profile.enquiry_count === 1 ? 'y' : 'ies'}`
              : status === 'rejected' && profile?.approval_notes ? profile.approval_notes
              : 'Listings are read by WHC before they appear, because every one of them carries the platform’s name.'}
          </p>
        </div>
        {live && <Link href={`/consultancy/${profile.id}`} target="_blank" className="btn-secondary text-[12px] inline-flex items-center gap-1.5"><ExternalLink size={12} /> View public listing</Link>}
      </div>

      {enquiries.length > 0 && (
        <div className="dashboard-card mb-6">
          <p className="text-[14px] font-medium text-ink mb-4">Enquiries</p>
          <div className="space-y-3">
            {enquiries.map(enquiry => (
              <div key={enquiry.id} className="border border-border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-ink">{enquiry.property_name || 'A property'}{enquiry.subject ? ` - ${enquiry.subject}` : ''}</p>
                  <p className="text-[11px] text-muted">{new Date(enquiry.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-body whitespace-pre-line">{enquiry.message}</p>
                <p className="mt-2 text-[11px] text-muted">
                  {[budgetLabel(enquiry.budget_band || ''), enquiry.timeline].filter(Boolean).join(' · ') || 'No budget or timing given'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="dashboard-card mb-6 space-y-4">
        <p className="eyebrow">Step 1 &middot; The practice</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="practice" className="eyebrow block mb-1.5">Practice or trading name *</label>
            <input id="practice" value={profile?.practice_name || ''} onChange={e => set('practice_name', e.target.value)} className="input-field" placeholder="e.g. Doyle Spa Consulting" />
          </div>
          <div>
            <label htmlFor="contact" className="eyebrow block mb-1.5">Your name</label>
            <input id="contact" value={profile?.contact_name || ''} onChange={e => set('contact_name', e.target.value)} className="input-field" />
          </div>
        </div>
        <div>
          <label htmlFor="headline" className="eyebrow block mb-1.5">Headline *</label>
          <input id="headline" value={profile?.headline || ''} onChange={e => set('headline', e.target.value)} className="input-field"
            placeholder="e.g. Pre-opening and commercial turnaround for five-star spas" />
          <p className="mt-1 text-[11px] text-muted">One line. This is what a hotel reads before deciding whether to open your listing.</p>
        </div>
        <div>
          <label htmlFor="summary" className="eyebrow block mb-1.5">About the practice *</label>
          <textarea id="summary" rows={6} value={profile?.summary || ''} onChange={e => set('summary', e.target.value)} className="input-field"
            placeholder="What you do, who you do it for, and what changes when you are involved." />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="based" className="eyebrow block mb-1.5">Based in</label>
            <input id="based" value={profile?.based_in || ''} onChange={e => set('based_in', e.target.value)} className="input-field" placeholder="e.g. Yorkshire" />
          </div>
          <div>
            <label htmlFor="works" className="eyebrow block mb-1.5">Works</label>
            <select id="works" value={profile?.works_with || 'uk'} onChange={e => set('works_with', e.target.value)} className="input-field">
              {WORKS_WITH.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="years" className="eyebrow block mb-1.5">Years in the industry</label>
            <input id="years" type="number" min={0} max={70} value={profile?.years_experience ?? ''} onChange={e => set('years_experience', e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="website" className="eyebrow block mb-1.5">Website</label>
            <input id="website" value={profile?.website_url || ''} onChange={e => set('website_url', e.target.value)} className="input-field" placeholder="yourpractice.com" />
          </div>
          <div>
            <label htmlFor="linkedin" className="eyebrow block mb-1.5">LinkedIn</label>
            <input id="linkedin" value={profile?.linkedin_url || ''} onChange={e => set('linkedin_url', e.target.value)} className="input-field" placeholder="linkedin.com/in/..." />
          </div>
        </div>
      </section>

      <section className="dashboard-card mb-6 space-y-5">
        <div>
          <p className="eyebrow">Step 2 &middot; Specialisms</p>
          <p className="mt-1 text-[12px] text-muted">Properties filter on these. Pick what you genuinely lead on, not everything you have touched.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONSULTANCY_SPECIALISMS.map(item => (
            <button type="button" key={item} onClick={() => toggle('specialisms', specialisms, item)}
              className={`border px-3 py-1.5 text-[12px] transition-colors ${specialisms.includes(item) ? 'border-ink bg-ink text-white' : 'border-border text-secondary hover:border-ink'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="border-t border-border pt-5">
          <p className="eyebrow mb-1">How the work is bought</p>
          <p className="mb-3 text-[12px] text-muted">A two-day diagnostic and an interim directorship are not the same enquiry. Saying which you take saves you both a call.</p>
          <div className="flex flex-wrap gap-2">
            {ENGAGEMENT_TYPES.map(type => (
              <button type="button" key={type.value} onClick={() => toggle('engagement_types', engagements, type.value)} title={type.hint}
                className={`border px-3 py-1.5 text-[12px] transition-colors ${engagements.includes(type.value) ? 'border-ink bg-ink text-white' : 'border-border text-secondary hover:border-ink'}`}>
                {type.label}
              </button>
            ))}
          </div>
          <div className="mt-4 max-w-xs">
            <label htmlFor="rate" className="eyebrow block mb-1.5">Day rate from (£, optional)</label>
            <input id="rate" type="number" min={0} value={profile?.day_rate_from ?? ''} onChange={e => set('day_rate_from', e.target.value)} className="input-field" />
            <p className="mt-1 text-[11px] text-muted">Leave blank if you would rather price each piece of work.</p>
          </div>
        </div>
      </section>

      <section className="dashboard-card mb-6 space-y-4">
        <div>
          <p className="eyebrow">Step 3 &middot; Selected work</p>
          <p className="mt-1 text-[12px] leading-6 text-muted max-w-2xl">
            This is what the listing is for. A hotel buys judgement on evidence, so the outcome line matters more than
            the description - what actually changed, in numbers where you have them. Work under NDA can be marked
            confidential and shown as the property type instead of the name.
          </p>
        </div>

        {projects.map((project, index) => (
          <div key={index} className="border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <input value={project.title} onChange={e => setProject(index, { title: e.target.value })}
                placeholder="Project title" aria-label={`Project ${index + 1} title`} className="input-field font-medium" />
              <button type="button" onClick={() => set('projects', projects.filter((_, i) => i !== index))}
                aria-label={`Remove project ${index + 1}`} className="mt-2 shrink-0 text-muted hover:text-red-600"><Trash2 size={15} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input value={project.client} onChange={e => setProject(index, { client: e.target.value })}
                placeholder={project.confidential ? 'e.g. Five-star London' : 'Client or property'} aria-label={`Project ${index + 1} client`} className="input-field" />
              <input value={project.location} onChange={e => setProject(index, { location: e.target.value })}
                placeholder="Location" aria-label={`Project ${index + 1} location`} className="input-field" />
              <input value={project.year} onChange={e => setProject(index, { year: e.target.value })}
                placeholder="Year" aria-label={`Project ${index + 1} year`} className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-[12px] text-secondary cursor-pointer">
              <input type="checkbox" checked={project.confidential} onChange={e => setProject(index, { confidential: e.target.checked })} className="w-4 h-4" />
              Under NDA - show the property type rather than the name
            </label>
            <textarea rows={3} value={project.summary} onChange={e => setProject(index, { summary: e.target.value })}
              placeholder="What the work was - the brief, the state you found it in, what you did" aria-label={`Project ${index + 1} description`} className="input-field" />
            <textarea rows={2} value={project.outcome} onChange={e => setProject(index, { outcome: e.target.value })}
              placeholder="What changed. e.g. Opened on schedule at 71% utilisation against a 55% plan, £1.2m first-year revenue" aria-label={`Project ${index + 1} outcome`} className="input-field" />
          </div>
        ))}

        {projects.length === 0 && (
          <div className="border border-dashed border-border p-6 text-center">
            <p className="text-[13px] text-ink">No projects yet</p>
            <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-6 text-muted">
              One is enough to publish. Start with the piece of work you would want a property to judge you on.
            </p>
          </div>
        )}

        {projects.length < 12 && (
          <button type="button" onClick={() => set('projects', [...projects, { ...EMPTY_PROJECT }])}
            className="btn-secondary text-[12px] inline-flex items-center gap-2"><Plus size={13} /> Add a project</button>
        )}
      </section>

      {/* This used to be a sticky card. Sticky puts it at the foot of the
          viewport while the page is scrolled to the top, so it sat on top of
          Specialisms and Selected work and the form appeared to end after the
          first section - which is exactly what a consultant reported. */}
      <div className="border-t border-border bg-white p-5">
        {missing.length > 0 && (
          <p className="mb-4 text-[12px] leading-6 text-secondary">
            <span className="font-semibold text-ink">Still to do before this can go live:</span> {missing.join(', ')}.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => save(false)} disabled={saving} className="btn-secondary text-[13px] inline-flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" onClick={() => save(true)} disabled={saving || missing.length > 0} className="btn-primary text-[13px] inline-flex items-center gap-2 disabled:opacity-50">
            <Send size={14} /> {profile?.is_live ? 'Save and resubmit' : 'Publish listing'}
          </button>
          {live && !profile?.featured && (
            <button type="button" onClick={feature} disabled={featuring} className="text-[12px] font-semibold text-ink underline inline-flex items-center gap-1.5 disabled:opacity-50">
              <Star size={12} /> {featuring ? 'Opening payment...' : 'Feature this listing'}
            </button>
          )}
          {profile?.featured && <span className="text-[12px] font-semibold text-ink inline-flex items-center gap-1.5"><Star size={12} fill="currentColor" /> Featured</span>}
          {notice && <p className={`text-[12px] ${notice.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5 text-[12px] leading-6 text-muted">
        {focus === 'consultant' ? (
          <>
            Your workspace is set up for consultancy, so the agency and shift tools are hidden.{' '}
            <button type="button" onClick={() => switchWorkspace(null)} className="font-semibold text-ink underline">
              Show everything
            </button>{' '}
            if you also want roles, agency shifts or Residency.
          </>
        ) : (
          <>
            Only here to consult?{' '}
            <button type="button" onClick={() => switchWorkspace('consultant')} className="font-semibold text-ink underline">
              Simplify my workspace
            </button>{' '}
            and the agency, shift and job tools are hidden until you want them.
          </>
        )}
      </div>
    </DashboardShell>
  )
}
