'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Clock, FileText, Plus, ShieldQuestion, X } from 'lucide-react'
import { useDialog } from '@/components/useDialog'

// Structured certificate manager: each document gets a name, an awarding
// body, a country and a year, then goes to WHC for review. Verified
// certificates show to employers with a trust badge instead of an
// unexplained "Certificate 1" link.

type Certificate = {
  id: string
  title: string
  awarding_body: string | null
  country: string | null
  year_awarded: number | null
  document_url: string
  status: 'submitted' | 'verified' | 'rejected' | 'more_info'
  review_note: string | null
  verified_at: string | null
  created_at: string
}

const STATUS_META: Record<Certificate['status'], { label: string; className: string }> = {
  submitted: { label: 'Under review', className: 'bg-amber-50 text-amber-700' },
  verified: { label: 'WHC verified', className: 'bg-green-50 text-green-700' },
  rejected: { label: 'Not verified', className: 'bg-red-50 text-red-600' },
  more_info: { label: 'More info needed', className: 'bg-blue-50 text-blue-700' },
}

export default function CertificateManager({ userId }: { userId: string | null }) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [legacy, setLegacy] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [formDoc, setFormDoc] = useState('')          // uploaded or legacy document url
  const [formDocName, setFormDocName] = useState('')  // display name of the chosen file
  const [title, setTitle] = useState('')
  const [awardingBody, setAwardingBody] = useState('')
  const [country, setCountry] = useState('')
  const [yearAwarded, setYearAwarded] = useState('')
  const [uploading, setUploading] = useState(false)
  const formDialog = useDialog(() => setFormOpen(false), 'certificate-manager-form-heading', { enabled: formOpen })

  async function load() {
    try {
      const res = await fetch('/api/talent/certificates')
      const json = await res.json()
      if (res.ok) { setCertificates(json.certificates || []); setLegacy(json.legacy || []) }
    } catch { /* leave empty state */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openForm(documentUrl = '', documentName = '') {
    setFormDoc(documentUrl)
    setFormDocName(documentName)
    setTitle(''); setAwardingBody(''); setCountry(''); setYearAwarded('')
    setMessage('')
    setFormOpen(true)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true); setMessage('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'talent-documents')
      fd.append('path', `${userId}/cert_${Date.now()}_${file.name}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setMessage(json.error || 'Upload failed.'); return }
      setFormDoc(json.url)
      setFormDocName(file.name)
    } catch { setMessage('Upload failed. Please try again.') } finally { setUploading(false) }
  }

  async function submit() {
    if (busy) return
    setBusy(true); setMessage('')
    try {
      const res = await fetch('/api/talent/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: formDoc, title, awardingBody, country, yearAwarded }),
      })
      const json = await res.json()
      if (!res.ok) { setMessage(json.error || 'Could not save the certificate.'); return }
      setFormOpen(false)
      setLegacy(current => current.filter(url => url !== formDoc))
      setCertificates(current => [json.certificate, ...current.filter(c => c.id !== json.certificate.id)])
    } catch { setMessage('Could not save the certificate.') } finally { setBusy(false) }
  }

  async function remove(certificate: Certificate) {
    if (!window.confirm(`Remove ${certificate.title} from your profile?`)) return
    const res = await fetch('/api/talent/certificates', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: certificate.id }),
    })
    if (res.ok) setCertificates(current => current.filter(c => c.id !== certificate.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] font-semibold text-ink">Qualifications & certificates</p>
        <button type="button" onClick={() => openForm()} className="btn-secondary inline-flex items-center gap-1.5 text-[12px]"><Plus size={13} /> Add certificate</button>
      </div>
      <p className="text-[11.5px] text-muted mb-3">Name each certificate so employers understand it - especially if you trained outside the UK. WHC reviews every submission; verified certificates carry a trust badge on your profile.</p>
      <details className="mb-3 rounded-lg border border-border bg-[#f3f0eb] px-3 py-2">
        <summary className="cursor-pointer text-[12px] font-semibold text-ink">Help with certificates - lost documents, overseas training, questions</summary>
        <div className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-secondary">
          <p><strong className="text-ink">Lost or missing certificate?</strong> Contact your awarding body or training school - most (CIDESCO, CIBTAC, ITEC, VTCT, City &amp; Guilds) can reissue certificates or provide a verification letter.</p>
          <p><strong className="text-ink">Trained outside the UK?</strong> Submit your certificate in its original language with an English translation if you have one. For a formal UK comparison of an international qualification, UK ENIC provides a <a href="https://www.enic.org.uk/individuals/statement-of-comparability" target="_blank" rel="noopener noreferrer" className="underline text-ink">Statement of Comparability</a>.</p>
          <p><strong className="text-ink">Not sure what to submit?</strong> Upload what you have and add honest details - the WHC review will tell you exactly what is needed, and asking is never held against you.</p>
          <p><strong className="text-ink">Anything else:</strong> message us through the Contact page and choose &quot;certification&quot; - a real person reads every one.</p>
        </div>
      </details>

      {loading ? <p className="text-[12px] text-muted">Loading...</p> : (
        <div className="space-y-2">
          {certificates.length === 0 && legacy.length === 0 && (
            <p className="text-[12px] text-muted border border-dashed border-border rounded-lg px-3 py-4 text-center">No certificates yet. Add your qualifications so employers can trust your training at a glance.</p>
          )}

          {certificates.map(certificate => (
            <div key={certificate.id} className="rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink inline-flex items-center gap-1.5">
                    {certificate.status === 'verified' && <BadgeCheck size={14} className="text-green-600 shrink-0" />}
                    {certificate.title}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {[certificate.awarding_body, certificate.country, certificate.year_awarded].filter(Boolean).join(' · ') || 'No details added'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${STATUS_META[certificate.status].className}`}>{STATUS_META[certificate.status].label}</span>
                  <a href={certificate.document_url} target="_blank" rel="noopener noreferrer" className="text-[11px] underline text-secondary">View</a>
                  {certificate.status !== 'verified' && <button type="button" onClick={() => remove(certificate)} aria-label="Remove certificate" className="p-2 -m-2 text-gray-300 hover:text-red-600"><X size={14} /></button>}
                </div>
              </div>
              {(certificate.status === 'rejected' || certificate.status === 'more_info') && certificate.review_note && (
                <p className="mt-1.5 text-[11.5px] text-secondary bg-[#f3f0eb] rounded px-2.5 py-1.5"><ShieldQuestion size={12} className="inline mr-1 -mt-0.5" />WHC: {certificate.review_note} <button type="button" onClick={() => openForm(certificate.document_url, certificate.title)} className="underline font-medium">Resubmit</button></p>
              )}
            </div>
          ))}

          {legacy.map((url, i) => (
            <div key={url} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium text-ink inline-flex items-center gap-1.5"><FileText size={13} className="shrink-0 text-amber-600" /> Uploaded certificate {i + 1}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Needs details before WHC can review it</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] underline text-secondary">View</a>
                <button type="button" onClick={() => openForm(url, `Uploaded certificate ${i + 1}`)} className="btn-secondary text-[11px]">Add details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div {...formDialog.panelProps} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 id="certificate-manager-form-heading" className="font-serif text-lg font-bold text-ink">Add a certificate</h2>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close" className="p-2 -m-2 text-gray-300 hover:text-ink"><X size={20} /></button>
            </div>
            <p className="text-[12px] text-secondary mb-4">Tell us what this certificate is. WHC reviews it, and once verified it shows to employers with a trust badge.</p>

            <label className="block text-[12px] font-semibold text-ink mb-1.5">Qualification name *</label>
            <input aria-label="Qualification name" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. CIDESCO Diploma in Beauty & Spa Therapy" className="input-field text-[13px] w-full mb-3" />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[12px] font-semibold text-ink mb-1.5">Awarding body</label>
                <input aria-label="Awarding body" value={awardingBody} onChange={e => setAwardingBody(e.target.value)} placeholder="e.g. CIDESCO, CIBTAC, VTCT" className="input-field text-[13px] w-full" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-ink mb-1.5">Country of training</label>
                <input aria-label="Country of training" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. South Africa" className="input-field text-[13px] w-full" />
              </div>
            </div>
            <label className="block text-[12px] font-semibold text-ink mb-1.5">Year awarded</label>
            <input aria-label="Year awarded" value={yearAwarded} onChange={e => setYearAwarded(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} inputMode="numeric" placeholder="e.g. 2019" className="input-field text-[13px] w-full mb-3" />

            <label className="block text-[12px] font-semibold text-ink mb-1.5">Certificate document *</label>
            {formDoc ? (
              <p className="text-[12px] text-green-700 mb-3 inline-flex items-center gap-1.5"><FileText size={13} /> {formDocName || 'Document attached'} <button type="button" onClick={() => { setFormDoc(''); setFormDocName('') }} className="underline text-secondary">change</button></p>
            ) : (
              <label className="btn-secondary inline-flex cursor-pointer text-[12px] mb-3">{uploading ? 'Uploading...' : 'Upload PDF or photo'}<input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} disabled={uploading} /></label>
            )}

            {message && <p className="text-[12px] text-red-600 mb-3">{message}</p>}
            <button type="button" onClick={submit} disabled={busy || uploading || !formDoc || title.trim().length < 3} className="btn-primary w-full text-[13px] disabled:opacity-50">{busy ? 'Sending...' : 'Send to WHC for review'}</button>
            <p className="text-[11px] text-muted mt-2 inline-flex items-center gap-1"><Clock size={11} /> Reviews usually complete within two working days.</p>
          </div>
        </div>
      )}
    </div>
  )
}
