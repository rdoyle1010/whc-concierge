'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'
import { Plus, Copy, Edit2, Trash2, Send, Eye, Save, Upload, Mail, X, TestTube2 } from 'lucide-react'
import { renderNewsletterHtml } from '@/lib/newsletter-template'

type Pick = { type: string; id: string; label: string }
type Form = {
  name: string; description: string; type: string; status: string; target_audience: string;
  content: string; preheader: string; header_image_url: string; body_image_url: string; cta_label: string; cta_url: string; footer_text: string; layout_style: string;
}

const empty: Form = { name: '', description: '', type: 'Email', status: 'draft', target_audience: 'All', content: '', preheader: '', header_image_url: '', body_image_url: '', cta_label: '', cta_url: '', footer_text: 'Better matches. Better careers. Better teams.', layout_style: 'editorial' }

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [promotion, setPromotion] = useState<any>(null)
  const [audiences, setAudiences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<Form>(empty)
  const [featuredSel, setFeaturedSel] = useState<Pick[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: 'ok'|'error'; text: string } | null>(null)

  // The studio stands down while the full preview sits on top of it, so Escape
  // in the preview closes only the preview.
  const formDialog = useDialog(() => setShowForm(false), 'admin-campaign-editor-heading', { enabled: showForm })
  const previewDialog = useDialog(() => setShowPreview(false), undefined, { label: 'Newsletter preview', enabled: showPreview })

  async function load() {
    const res = await fetch('/api/admin/campaigns', { cache: 'no-store' })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) setBanner({ type: 'error', text: j.error || 'Could not load newsletters.' })
    else { setCampaigns(j.campaigns || []); setPromotion(j.promotion || null); setAudiences(j.audiences || null) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const previewHtml = useMemo(() => renderNewsletterHtml(form, { test: true, featuredHtml: featuredSel.length ? `<div style="margin:28px 0;padding:18px;border:1px solid #e5e5e5;border-radius:12px"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#57534e;font-weight:600">Featured this week</div><div style="margin-top:9px;color:#4d4d4d;font-size:13px">${featuredSel.map(f => f.label).join(' · ')}</div></div>` : '' }), [form, featuredSel])

  const openNew = () => { setEditing(null); setForm(empty); setFeaturedSel([]); setBanner(null); setShowForm(true) }
  const picksFrom = (c: any): Pick[] => (c.featured_ids || []).map((f: any) => {
    const pool = f.type === 'candidate' ? [...(promotion?.featured_candidates || []), ...(promotion?.agency_featured || [])] : (promotion?.preferred_employers || [])
    const m = pool.find((x: any) => x.id === f.id)
    return { type: f.type, id: f.id, label: m?.full_name || m?.property_name || m?.company_name || 'Member' }
  })
  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ ...empty, ...Object.fromEntries(Object.keys(empty).map(k => [k, c[k] ?? (empty as any)[k]])) } as Form)
    setFeaturedSel(picksFrom(c)); setBanner(null); setShowForm(true)
  }
  const duplicate = (c: any) => {
    // A fresh draft copied from an existing newsletter - saved as a new row.
    setEditing(null)
    setForm({
      ...empty,
      ...Object.fromEntries(Object.keys(empty).map(k => [k, c[k] ?? (empty as any)[k]])),
      name: `${c.name || 'Untitled newsletter'} copy`,
      status: 'draft',
    } as Form)
    setFeaturedSel(picksFrom(c)); setBanner(null); setShowForm(true)
  }

  // Newsletter-only subscribers are reached only by sends to All - a
  // Candidates or Employers send goes to confirmed marketing profiles alone.
  const reachableFor = (aud: string) => {
    const a = String(aud || 'All').toLowerCase()
    if (a.includes('candidate')) return audiences?.candidates ?? 0
    if (a.includes('employer')) return audiences?.employers ?? 0
    return (audiences?.candidates ?? 0) + (audiences?.employers ?? 0) + (audiences?.newsletterOnly ?? 0)
  }

  async function uploadImage(field: 'header_image_url'|'body_image_url', file: File) {
    setBusy(field)
    const fd = new FormData(); fd.append('file', file); fd.append('bucket', 'site-images'); fd.append('path', `newsletter-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`)
    const res = await fetch('/api/upload', { method: 'POST', body: fd }); const j = await res.json().catch(() => ({})); setBusy(null)
    if (!res.ok) return setBanner({ type: 'error', text: j.error || 'Image upload failed.' })
    setForm(v => ({ ...v, [field]: j.url }))
  }

  async function saveDraft(close = true) {
    if (!form.name.trim()) return setBanner({ type: 'error', text: 'Add a newsletter subject/name first.' })
    setBusy('save'); setBanner(null)
    const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id: editing?.id, data: { ...form, featured_ids: featuredSel.map(({type,id}) => ({type,id})) } }) })
    const j = await res.json().catch(() => ({})); setBusy(null)
    if (!res.ok) return setBanner({ type: 'error', text: j.error || 'Could not save newsletter.' })
    await load(); setBanner({ type: 'ok', text: 'Newsletter draft saved.' })
    if (close) { setShowForm(false); setEditing(null); setForm(empty) }
    else if (!editing) setEditing({ id: j.id })
    return j.id || editing?.id
  }

  async function sendTest() {
    const id = await saveDraft(false); if (!id) return
    setBusy('test')
    const res = await fetch('/api/admin/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'send_test',id}) }); const j = await res.json().catch(()=>({})); setBusy(null)
    setBanner(res.ok ? { type:'ok', text:`Test email sent${j.email ? ` to ${j.email}` : ''}.` } : { type:'error', text:j.error || 'Test send failed.' })
  }

  async function sendLive(c: any) {
    if (!confirm(`Send “${c.name}” now to the confirmed ${c.target_audience || 'All'} audience? This cannot be undone.`)) return
    setBusy(`send-${c.id}`); setBanner(null)
    const res = await fetch('/api/admin/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'send',id:c.id}) }); const j=await res.json().catch(()=>({})); setBusy(null)
    if (!res.ok) return setBanner({ type:'error', text:j.error || 'Send failed.' })
    setBanner({ type:'ok', text:`Newsletter sent to ${j.sent} confirmed recipient${j.sent===1?'':'s'}${j.failed?` · ${j.failed} failed`:''}.` }); await load()
  }

  async function remove(id:string) {
    if (!confirm('Delete this newsletter draft?')) return
    const res = await fetch('/api/admin/campaigns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id})})
    if (res.ok) setCampaigns(v=>v.filter(c=>c.id!==id)); else setBanner({type:'error',text:'Could not delete newsletter.'})
  }

  const choices: Pick[] = [
    ...(promotion?.featured_candidates || []).map((c:any)=>({type:'candidate',id:c.id,label:c.full_name || 'Professional'})),
    ...(promotion?.agency_featured || []).filter((c:any)=>!(promotion?.featured_candidates || []).some((f:any)=>f.id===c.id)).map((c:any)=>({type:'candidate',id:c.id,label:c.full_name || 'Professional'})),
    ...(promotion?.preferred_employers || []).map((e:any)=>({type:'employer',id:e.id,label:e.property_name || e.company_name || 'Property'})),
  ]

  return <DashboardShell role="admin" userName="Admin">
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><p className="dashboard-eyebrow">Content & revenue</p><h1 className="dashboard-title">Newsletters & Campaigns</h1><p className="dashboard-intro">Create polished WHC newsletters, preview them, test them and send only to confirmed subscribers.</p></div>
      <button onClick={openNew} className="btn-primary inline-flex items-center gap-2"><Plus size={15}/>Write Newsletter</button>
    </div>

    {banner && <div className={`mb-6 rounded-xl px-4 py-3 text-[13px] ${banner.type==='ok'?'bg-emerald-50 text-emerald-800':'bg-red-50 text-red-700'}`}>{banner.text}</div>}

    {audiences && <div className="mb-8">
      <div className="dashboard-metrics">
        <Metric label="Reachable inboxes" value={reachableFor('All')} detail="for a send to All"/><Metric label="Talent" value={audiences.candidates} detail="confirmed marketing"/><Metric label="Properties" value={audiences.employers} detail="confirmed marketing"/><Metric label="Newsletter-only" value={audiences.newsletterOnly ?? 0} detail="reached by All sends only"/>
      </div>
      <p className="mt-2 text-[11px] text-muted">Talent {audiences.candidates} + Properties {audiences.employers} + newsletter-only {audiences.newsletterOnly ?? 0}. Sends targeted at Talent or Properties do not reach newsletter-only subscribers.</p>
    </div>}

    <section className="dashboard-panel !p-0 overflow-hidden">
      <div className="border-b border-border px-5 py-4"><p className="text-[13px] font-semibold text-ink">Newsletter library</p><p className="text-[11px] text-muted mt-1">Draft, test, review and send from here.</p></div>
      {loading ? <div className="p-8 text-[13px] text-muted">Loading…</div> : campaigns.length===0 ? <div className="p-10 text-center"><Mail className="mx-auto text-muted mb-3"/><p className="text-[13px] text-muted">No newsletters yet.</p></div> : campaigns.map(c=><div key={c.id} className="flex flex-col gap-4 border-b border-border px-5 py-5 last:border-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold text-ink truncate">{c.name || 'Untitled newsletter'}</p><span className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] ${c.status==='sent'?'bg-emerald-50 text-emerald-700':'bg-[#e9e4dd] text-[#57534e]'}`}>{c.status || 'draft'}</span></div><p className="mt-1 text-[11px] text-muted">{c.target_audience || 'All'} · {c.layout_style || 'editorial'} layout{c.sent_at?` · sent ${new Date(c.sent_at).toLocaleDateString('en-GB')}`:''}{c.recipients_count?` · ${c.recipients_count} recipients`:''}</p></div>
        <div className="flex flex-wrap items-center gap-2">{c.status==='sent'?<span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-secondary">Sent{c.sent_at?` ${new Date(c.sent_at).toLocaleDateString('en-GB')}`:''} · {c.recipients_count || 0} recipient{(c.recipients_count || 0)===1?'':'s'}</span>:<><button onClick={()=>openEdit(c)} className="btn-secondary inline-flex items-center gap-2 !px-3 !py-2"><Edit2 size={13}/>Edit</button><button onClick={()=>{openEdit(c);setTimeout(()=>setShowPreview(true),0)}} className="btn-secondary inline-flex items-center gap-2 !px-3 !py-2"><Eye size={13}/>Preview</button><button disabled={busy===`send-${c.id}`} onClick={()=>sendLive(c)} className="btn-primary inline-flex items-center gap-2 !px-3 !py-2"><Send size={13}/>{busy===`send-${c.id}`?'Sending…':'Send'}</button><button onClick={()=>remove(c.id)} className="btn-secondary !p-2.5" aria-label="Delete"><Trash2 size={13}/></button></>}<button onClick={()=>duplicate(c)} className="btn-secondary inline-flex items-center gap-2 !px-3 !py-2"><Copy size={13}/>Duplicate</button></div>
      </div>)}
    </section>

    {showForm && <div className="fixed inset-0 z-[70] bg-[#0f0e0d]/70 p-3 md:p-6 overflow-y-auto"><div {...formDialog.panelProps} className="mx-auto max-w-6xl rounded-[24px] bg-white shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4"><div><p className="text-[10px] uppercase tracking-[.16em] text-muted">Newsletter studio</p><h2 id="admin-campaign-editor-heading" className="text-[24px] text-[#1c1b1a] mt-1">{editing?'Edit newsletter':'Create newsletter'}</h2></div><button onClick={()=>setShowForm(false)} className="p-2 text-muted"><X size={20}/></button></div>
      <div className="grid lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-6 md:p-8 space-y-7 border-r border-border">
          <Section title="1. Email details"><Field label="Email subject / campaign name" value={form.name} onChange={v=>setForm({...form,name:v})}/><Field label="Preheader text" value={form.preheader} onChange={v=>setForm({...form,preheader:v})} hint="The short line many inboxes show after the subject."/><div className="grid sm:grid-cols-2 gap-4"><Select label="Audience" value={form.target_audience} onChange={v=>setForm({...form,target_audience:v})} options={['All','Candidates','Employers']}/><Select label="Layout" value={form.layout_style} onChange={v=>setForm({...form,layout_style:v})} options={['editorial','feature','simple']}/></div>{audiences && <p className="text-[11px] text-muted">Reachable inboxes for this audience: <span className="font-semibold text-ink">{reachableFor(form.target_audience)}</span> · Talent {form.target_audience==='Employers'?0:audiences.candidates} · Properties {form.target_audience==='Candidates'?0:audiences.employers} · newsletter-only {form.target_audience==='All'?(audiences.newsletterOnly ?? 0):0}</p>}</Section>
          <Section title="2. Header image"><ImagePicker value={form.header_image_url} busy={busy==='header_image_url'} onUrl={v=>setForm({...form,header_image_url:v})} onFile={f=>uploadImage('header_image_url',f)} label="Wide hero image"/></Section>
          <Section title="3. Newsletter content"><TextArea label="Main copy" value={form.content} onChange={v=>setForm({...form,content:v})} rows={12} hint="Use blank lines between paragraphs. The email template will space it properly."/><ImagePicker value={form.body_image_url} busy={busy==='body_image_url'} onUrl={v=>setForm({...form,body_image_url:v})} onFile={f=>uploadImage('body_image_url',f)} label="Optional image inside the article"/></Section>
          <Section title="4. Call to action"><div className="grid sm:grid-cols-2 gap-4"><Field label="Button wording" value={form.cta_label} onChange={v=>setForm({...form,cta_label:v})} placeholder="View the latest roles"/><Field label="Button link" value={form.cta_url} onChange={v=>setForm({...form,cta_url:v})} placeholder="https://..."/></div></Section>
          <Section title="5. Featured members"><p className="text-[12px] text-muted mb-3">Optional paid-feature cards are inserted into the email automatically.</p><div className="flex flex-wrap gap-2">{choices.length?choices.map(opt=>{const on=featuredSel.some(f=>f.id===opt.id&&f.type===opt.type);return <button type="button" key={`${opt.type}-${opt.id}`} onClick={()=>setFeaturedSel(on?featuredSel.filter(f=>!(f.id===opt.id&&f.type===opt.type)):[...featuredSel,opt])} className={`rounded-full border px-3 py-1.5 text-[11px] ${on?'bg-[#1c1b1a] text-white border-[#1c1b1a]':'border-border text-secondary'}`}>{on?'✓ ':''}{opt.label}</button>}):<span className="text-[12px] text-muted">No featured members currently available.</span>}</div></Section>
          <Section title="6. Footer"><TextArea label="Footer message" value={form.footer_text} onChange={v=>setForm({...form,footer_text:v})} rows={2} hint="Unsubscribe and privacy links are added automatically for live sends."/></Section>
          <div className="flex flex-wrap gap-2 pt-2"><button onClick={()=>setShowPreview(true)} className="btn-secondary inline-flex items-center gap-2"><Eye size={14}/>Preview</button><button onClick={()=>saveDraft(true)} disabled={busy==='save'} className="btn-secondary inline-flex items-center gap-2"><Save size={14}/>{busy==='save'?'Saving…':'Save draft'}</button><button onClick={sendTest} disabled={busy==='test'} className="btn-primary inline-flex items-center gap-2"><TestTube2 size={14}/>{busy==='test'?'Sending…':'Send test to me'}</button></div>
        </div>
        <div className="bg-[#e9e4dd] p-5 md:p-7 lg:sticky lg:top-0 lg:h-[calc(100vh-70px)] overflow-auto"><p className="text-[10px] uppercase tracking-[.16em] text-[#57534e] mb-3">Live preview</p><iframe title="Newsletter preview" srcDoc={previewHtml} className="w-full h-[760px] bg-white rounded-[16px] shadow-sm border border-[#e0dad2]"/></div>
      </div>
    </div></div>}

    {showPreview && <div className="fixed inset-0 z-[90] bg-[#0f0e0d]/80 p-4 md:p-8 overflow-y-auto"><div {...previewDialog.panelProps} className="max-w-4xl mx-auto"><div className="flex justify-between items-center mb-3 text-white"><span className="text-[12px] uppercase tracking-[.15em]">Newsletter preview</span><button onClick={()=>setShowPreview(false)} className="p-2"><X/></button></div><iframe title="Full newsletter preview" srcDoc={previewHtml} className="w-full min-h-[850px] bg-white rounded-[20px]"/></div></div>}
  </DashboardShell>
}

function Metric({label,value,detail}:{label:string;value:any;detail:string}){return <div className="dashboard-metric"><p className="dashboard-metric-value">{value}</p><p className="dashboard-metric-label">{label}</p><p className="text-[10px] text-muted mt-1">{detail}</p></div>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section><h3 className="text-[13px] font-semibold text-[#1c1b1a] mb-4">{title}</h3><div className="space-y-4">{children}</div></section>}
function Field({label,value,onChange,hint,placeholder}:{label:string;value:string;onChange:(v:string)=>void;hint?:string;placeholder?:string}){return <label className="block"><span className="text-[11px] font-medium text-ink block mb-1.5">{label}</span><input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="input-field"/>{hint&&<span className="text-[10px] text-muted block mt-1">{hint}</span>}</label>}
function TextArea({label,value,onChange,rows,hint}:{label:string;value:string;onChange:(v:string)=>void;rows:number;hint?:string}){return <label className="block"><span className="text-[11px] font-medium text-ink block mb-1.5">{label}</span><textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} className="input-field resize-y"/>{hint&&<span className="text-[10px] text-muted block mt-1">{hint}</span>}</label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}){return <label className="block"><span className="text-[11px] font-medium text-ink block mb-1.5">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="input-field">{options.map(o=><option key={o} value={o}>{o[0].toUpperCase()+o.slice(1)}</option>)}</select></label>}
function ImagePicker({value,onUrl,onFile,busy,label}:{value:string;onUrl:(v:string)=>void;onFile:(f:File)=>void;busy:boolean;label:string}){return <div><p className="text-[11px] font-medium text-ink mb-2">{label}</p>{value&&<div className="mb-3 aspect-[16/6] overflow-hidden rounded-xl bg-surface"><img src={value} alt="" className="w-full h-full object-cover"/></div>}<div className="grid sm:grid-cols-[1fr_auto] gap-2"><input value={value} onChange={e=>onUrl(e.target.value)} placeholder="Paste image URL or upload" className="input-field"/><label className="btn-secondary cursor-pointer inline-flex items-center justify-center gap-2"><Upload size={14}/>{busy?'Uploading…':'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)onFile(f);e.target.value=''}}/></label></div></div>}
