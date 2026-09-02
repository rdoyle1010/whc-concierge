'use client'

import { useEffect, useState } from 'react'
import { getViewer } from '@/lib/viewer'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Upload, FileText, X } from 'lucide-react'

export default function TalentVerificationPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Honest staged indicator: uploads give no byte-level progress events, so
  // we show the real stage (uploading, then saving) with no fake percentages.
  const [stage, setStage] = useState<'' | 'uploading' | 'saving'>('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [v, setV] = useState<any>(null)
  const [rightUk, setRightUk] = useState(false)
  const [rightIreland, setRightIreland] = useState(false)
  const [rtwExpiry, setRtwExpiry] = useState('')
  const [rtwFile, setRtwFile] = useState<File | null>(null)
  const [hasInsurance, setHasInsurance] = useState(false)
  const [insuranceExpiry, setInsuranceExpiry] = useState('')
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)
  const [qualFiles, setQualFiles] = useState<File[]>([])

  async function load() {
    try {
      const res = await fetch('/api/verification')
      if (res.ok) {
        const j = await res.json()
        const verification = j.verification
        setV(verification)
        setRightUk(Boolean(verification?.right_to_work_uk))
        setRightIreland(Boolean(verification?.right_to_work_ireland))
        setRtwExpiry(verification?.right_to_work_expiry_date || '')
        setHasInsurance(Boolean(verification?.has_insurance))
        setInsuranceExpiry(verification?.insurance_expiry_date || '')
      }
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function uploadOne(file: File, sub: string): Promise<string | null> {
    const user = await getViewer()
    if (!user) return null
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'talent-documents')
    fd.append('path', `${user.id}/verification/${sub}-${Date.now()}-${file.name}`)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await res.json().catch(() => ({}))
    return res.ok ? j.url : null
  }

  async function submit() {
    setError('')
    if (!rightUk && !rightIreland) { setError('Please confirm whether you have the right to work in the UK, Ireland, or both.'); return }
    if (!rtwFile && !v?.right_to_work_document_url) { setError('Please upload evidence of your right to work.'); return }
    if (hasInsurance && !insuranceExpiry) { setError('Please add the expiry date for your insurance.'); return }
    if (hasInsurance && !insuranceFile && !v?.insurance_document_url) { setError('Please upload your insurance certificate, or choose that you do not currently hold insurance.'); return }

    setSaving(true)
    setStage('uploading')
    try {
      let rtwUrl: string | null = null
      let insuranceUrl: string | null = null
      if (rtwFile) {
        rtwUrl = await uploadOne(rtwFile, 'right-to-work')
        if (!rtwUrl) { setError('Your right-to-work document failed to upload - please try again.'); return }
      }
      if (hasInsurance && insuranceFile) {
        insuranceUrl = await uploadOne(insuranceFile, 'insurance')
        if (!insuranceUrl) { setError('The insurance certificate failed to upload - please try again.'); return }
      }
      const docs: { name: string; url: string }[] = []
      for (const f of qualFiles) {
        const url = await uploadOne(f, 'qualification')
        if (url) docs.push({ name: f.name, url })
      }

      setStage('saving')
      const res = await fetch('/api/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          right_to_work_uk: rightUk,
          right_to_work_ireland: rightIreland,
          right_to_work_document_url: rtwUrl || undefined,
          right_to_work_expiry_date: rtwExpiry || null,
          has_insurance: hasInsurance,
          insurance_expiry_date: hasInsurance ? insuranceExpiry : null,
          insurance_document_url: hasInsurance ? (insuranceUrl || undefined) : null,
          docs,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setError(j.error || 'Could not submit - please try again.'); return }
      setNotice('Submitted - WHC will review your right-to-work evidence and any optional documents you provided.')
      setRtwFile(null); setInsuranceFile(null); setQualFiles([])
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally { setSaving(false); setStage('') }
  }

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div></DashboardShell>

  const status = v?.right_to_work_status || 'not_submitted'

  return <DashboardShell role="talent">
    <div className="max-w-2xl">
      <p className="dashboard-eyebrow">Trust & compliance</p>
      <h1 className="dashboard-title">WHC Verified</h1>
      <p className="dashboard-intro mb-6">Right to work is essential for Agency and employment opportunities. WHC reviews your evidence for the UK, Ireland or both. Insurance is separate and optional because not every role or professional requires their own policy.</p>

      {notice && <div role="status" className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
      {error && <div role="alert" className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {status === 'approved' ? <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6"><ShieldCheck size={20} className="text-green-700"/><div><p className="text-sm font-medium text-green-800">Right to work verified</p><p className="text-xs text-green-700 mt-1">{rightUk ? 'United Kingdom' : ''}{rightUk && rightIreland ? ' and ' : ''}{rightIreland ? 'Ireland' : ''}{v?.right_to_work_expiry_date ? ` · valid to ${new Date(v.right_to_work_expiry_date).toLocaleDateString('en-GB')}` : ''}</p></div></div>
      : status === 'pending' ? <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6"><p className="text-sm font-medium text-amber-800">Right-to-work evidence under review</p><p className="text-xs text-amber-700 mt-1">WHC will review the documents before marking your account verified.</p></div>
      : status === 'rejected' || status === 'expired' ? <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6"><p className="text-sm font-medium text-red-700">Right-to-work verification needs attention</p><p className="text-xs text-red-600 mt-1">{v?.right_to_work_notes || 'Update your evidence and resubmit below.'}</p></div> : null}

      <div className="dashboard-card space-y-6">
        <div><h2 className="font-serif text-lg font-semibold">Right to work <span className="text-red-500">*</span></h2><p className="text-xs text-secondary mt-1">This is required. Select every country where you currently have the legal right to work.</p></div>
        <div className="flex flex-col sm:flex-row gap-3"><label className="flex items-center gap-2 border border-border rounded-xl px-4 py-3 cursor-pointer"><input type="checkbox" checked={rightUk} onChange={e=>setRightUk(e.target.checked)}/><span className="text-sm">United Kingdom</span></label><label className="flex items-center gap-2 border border-border rounded-xl px-4 py-3 cursor-pointer"><input type="checkbox" checked={rightIreland} onChange={e=>setRightIreland(e.target.checked)}/><span className="text-sm">Ireland</span></label></div>
        <div><label className="eyebrow block mb-1.5">Right-to-work evidence *</label><label className="flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-ink/30"><Upload size={16} className="text-muted"/><span className="text-[13px] text-secondary truncate">{rtwFile ? rtwFile.name : v?.right_to_work_document_url ? 'Evidence on file - upload to replace' : 'Upload right-to-work evidence'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={e=>setRtwFile(e.target.files?.[0]||null)}/></label><p className="text-[11px] text-muted mt-1">Only WHC administrators can view this document.</p></div>
        <div><label className="eyebrow block mb-1.5">Right-to-work expiry date</label><input aria-label="Right-to-work expiry date" type="date" value={rtwExpiry} onChange={e=>setRtwExpiry(e.target.value)} className="input-field"/><p className="text-[11px] text-muted mt-1">Leave blank if your right to work has no expiry date.</p></div>

        <div className="pt-5 border-t border-border"><div className="flex items-start justify-between gap-4"><div><h2 className="font-serif text-lg font-semibold">Personal insurance</h2><p className="text-xs text-secondary mt-1">Optional. Turn this on only if you hold your own current professional/public liability insurance.</p></div><button type="button" onClick={()=>setHasInsurance(!hasInsurance)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasInsurance?'bg-ink':'bg-gray-200'}`}><span className={`h-4 w-4 rounded-full bg-white transition-transform ${hasInsurance?'translate-x-6':'translate-x-1'}`}/></button></div></div>
        {hasInsurance && <><div><label className="eyebrow block mb-1.5">Insurance certificate</label><label className="flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-ink/30"><Upload size={16} className="text-muted"/><span className="text-[13px] text-secondary truncate">{insuranceFile ? insuranceFile.name : v?.insurance_document_url ? 'Certificate on file - upload to replace' : 'Upload insurance certificate'}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={e=>setInsuranceFile(e.target.files?.[0]||null)}/></label></div><div><label className="eyebrow block mb-1.5">Insurance expiry date</label><input aria-label="Insurance expiry date" type="date" value={insuranceExpiry} min={new Date().toLocaleDateString('en-CA')} onChange={e=>setInsuranceExpiry(e.target.value)} className="input-field"/></div></>}

        <div className="pt-5 border-t border-border"><label className="eyebrow block mb-1.5">Qualification certificates (optional but recommended)</label><label className="flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-ink/30"><Upload size={16} className="text-muted"/><span className="text-[13px] text-secondary">Add diplomas, NVQ/BTEC certificates, brand training - or your home country's qualifications (CIDESCO, BISA, TESDA and others welcome; WHC reviews international equivalence for you)...</span><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={e=>setQualFiles(prev=>[...prev,...Array.from(e.target.files||[])].slice(0,10))}/></label>{qualFiles.length>0&&<ul className="mt-2 space-y-1">{qualFiles.map((f,i)=><li key={i} className="flex items-center gap-2 text-xs text-gray-600"><FileText size={12}/><span className="truncate flex-1">{f.name}</span><button type="button" onClick={()=>setQualFiles(q=>q.filter((_,j)=>j!==i))} aria-label="Remove file" className="p-1.5 -m-1"><X size={13}/></button></li>)}</ul>}</div>

        {saving && <div aria-live="polite"><div className="progress-track"><div className="progress-indeterminate"/></div><p className="mt-2 text-[11px] text-secondary">{stage==='saving'?'Saving...':'Uploading your documents...'}</p></div>}
        <button onClick={submit} disabled={saving} className="btn-primary w-full disabled:opacity-50">{saving?(stage==='saving'?'Saving...':'Uploading...'):status==='pending'?'Resubmit for review':'Submit for review'}</button>
        <p className="text-[11px] text-muted text-center">Right-to-work evidence is required. Insurance and qualification uploads are optional unless a specific role or property requires them.</p>
      </div>
    </div>
  </DashboardShell>
}
