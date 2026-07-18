'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Upload, FileText, X } from 'lucide-react'

// WHC Verified - therapists submit insurance + qualification documents once,
// WHC checks them, and the badge shows everywhere properties are choosing.

export default function TalentVerificationPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [v, setV] = useState<any>(null)
  const [expiry, setExpiry] = useState('')
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null)
  const [qualFiles, setQualFiles] = useState<File[]>([])

  async function load() {
    try {
      const res = await fetch('/api/verification')
      if (res.ok) {
        const j = await res.json()
        setV(j.verification)
        setExpiry(j.verification?.insurance_expiry_date || '')
      }
    } catch { /* shown as empty */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function uploadOne(file: File, sub: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', 'talent-documents')
    fd.append('path', `${user.id}/verification/${sub}-${Date.now()}-${file.name}`)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const j = await res.json()
    return res.ok ? j.url : null
  }

  async function submit() {
    setError('')
    if (!expiry) { setError('Please add your insurance expiry date.'); return }
    if (!insuranceFile && !v?.insurance_document_url) { setError('Please upload your insurance certificate.'); return }
    setSaving(true)
    try {
      let insuranceUrl: string | null = null
      if (insuranceFile) {
        insuranceUrl = await uploadOne(insuranceFile, 'insurance')
        if (!insuranceUrl) { setError('The insurance certificate failed to upload - please try again.'); setSaving(false); return }
      }
      const docs: { name: string; url: string }[] = []
      for (const f of qualFiles) {
        const url = await uploadOne(f, 'qualification')
        if (url) docs.push({ name: f.name, url })
      }
      const res = await fetch('/api/verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurance_expiry_date: expiry,
          insurance_document_url: insuranceUrl || undefined,
          docs,
        }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not submit - please try again.'); return }
      setNotice('Submitted - WHC will review your documents and you’ll hear back by email.')
      setInsuranceFile(null)
      setQualFiles([])
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>

  const status = v?.verification_status

  return (
    <DashboardShell role="talent">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-serif font-bold text-ink mb-2">WHC Verified</h1>
        <p className="text-[13px] text-gray-500 mb-6">One check, one badge, more bookings. We verify your insurance and qualifications so properties can book you with total confidence - verified therapists appear with the badge in the directory and on your profile.</p>

        {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Status banner */}
        {v?.whc_verified ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <ShieldCheck size={20} className="text-green-700 shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-green-800">You are WHC Verified</p>
              <p className="text-[12px] text-green-700 mt-0.5">
                Verified {v.whc_verified_at ? new Date(v.whc_verified_at).toLocaleDateString('en-GB') : ''}.
                {v.insurance_expiry_date ? ` Insurance on file until ${new Date(v.insurance_expiry_date).toLocaleDateString('en-GB')} - we'll remind you before it expires.` : ''}
              </p>
            </div>
          </div>
        ) : status === 'pending' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-[14px] font-medium text-amber-800">Under review</p>
            <p className="text-[12px] text-amber-700 mt-0.5">Your documents are with the WHC team - you&apos;ll hear back by email. You can resubmit below if anything needs updating.</p>
          </div>
        ) : status === 'rejected' ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-[14px] font-medium text-red-700">Not verified{v?.verification_notes ? ` - ${v.verification_notes}` : ''}</p>
            <p className="text-[12px] text-red-600 mt-0.5">Fix the issue and resubmit below.</p>
          </div>
        ) : status === 'lapsed' ? (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-[14px] font-medium text-red-700">Badge paused - insurance expired</p>
            <p className="text-[12px] text-red-600 mt-0.5">Upload your renewed certificate below and the badge comes straight back after review.</p>
          </div>
        ) : null}

        {/* Submission form */}
        <div className="dashboard-card space-y-5">
          <h3 className="font-serif text-lg font-semibold">{v?.whc_verified ? 'Update your documents' : 'Submit for verification'}</h3>

          <div>
            <label className="eyebrow block mb-1.5">Insurance certificate *</label>
            <label className="flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-ink/30">
              <Upload size={16} className="text-gray-400 shrink-0" />
              <span className="text-[13px] text-gray-500 truncate">
                {insuranceFile ? insuranceFile.name : v?.insurance_document_url ? 'Certificate on file - upload to replace' : 'Upload your public liability insurance certificate (PDF or photo)'}
              </span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden"
                onChange={e => setInsuranceFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Insurance expiry date *</label>
            <input type="date" value={expiry} min={new Date().toLocaleDateString('en-CA')}
              onChange={e => setExpiry(e.target.value)} className="input-field" />
            <p className="text-[11px] text-muted mt-1">We chase renewals before this date so your badge never lapses silently.</p>
          </div>

          <div>
            <label className="eyebrow block mb-1.5">Qualification certificates (optional but recommended)</label>
            <label className="flex items-center gap-3 border border-dashed border-border rounded-xl px-4 py-3 cursor-pointer hover:border-ink/30">
              <Upload size={16} className="text-gray-400 shrink-0" />
              <span className="text-[13px] text-gray-500">Add diplomas, NVQs, brand training certificates...</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden"
                onChange={e => setQualFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 10))} />
            </label>
            {qualFiles.length > 0 && (
              <ul className="mt-2 space-y-1">
                {qualFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-gray-600">
                    <FileText size={12} className="text-gray-400" /><span className="truncate flex-1">{f.name}</span>
                    <button type="button" onClick={() => setQualFiles(qs => qs.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
            {Array.isArray(v?.verification_docs) && v.verification_docs.length > 0 && (
              <p className="text-[11px] text-muted mt-2">{v.verification_docs.length} document{v.verification_docs.length > 1 ? 's' : ''} already on file - new uploads replace them.</p>
            )}
          </div>

          <button onClick={submit} disabled={saving} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Uploading...' : status === 'pending' ? 'Resubmit for review' : 'Submit for review'}
          </button>
          <p className="text-[11px] text-muted text-center">Free for everyone on the platform. Documents are only visible to the WHC team.</p>
        </div>
      </div>
    </DashboardShell>
  )
}
