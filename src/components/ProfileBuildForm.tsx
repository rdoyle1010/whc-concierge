'use client'

import { useState } from 'react'
import { BUILD_CONSENT_WORDING, CV_MAX_BYTES, cvTypeAllowed } from '@/lib/profile-build'

// Four fields and a file, because every extra one is somebody deciding to do
// it later. The CV is optional on purpose: a person who has not got one to
// hand can still say "I am a head therapist at a country house spa, I know
// ESPA and Book4Time" and that is enough for us to start.

export default function ProfileBuildForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [trap, setTrap] = useState('')
  const [consent, setConsent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Please tell us your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please give us an email address we can reach you on.')
    if (!consent) return setError('We need your permission before we can build anything.')
    // Checked here as well as on the server, so somebody with a 40MB scan
    // finds out now rather than after waiting for the upload.
    if (file) {
      if (!cvTypeAllowed(file.type)) return setError('Send a PDF or a Word document, and we will take it from there.')
      if (file.size > CV_MAX_BYTES) return setError('That file is over 8MB. Send a smaller one, or just tell us where to find you.')
    }

    setSending(true)
    try {
      const form = new FormData()
      form.set('full_name', fullName)
      form.set('email', email)
      form.set('phone', phone)
      form.set('note', note)
      form.set('thc_hp', trap)
      form.set('consent', String(consent))
      if (file) form.set('cv', file)

      const res = await fetch('/api/profile-build', { method: 'POST', body: form })
      const body = await res.json().catch(() => ({}))
      // Read the answer rather than assuming the request finishing meant it
      // worked. A CV that vanished silently is the worst outcome here.
      if (!res.ok) { setError(body.error || 'That did not send. Please try again.'); return }
      setDone(true)
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="border border-[#166534] bg-[#f3fbf5] p-6">
        <p className="text-[16px] font-semibold text-[#166534]">That is with us.</p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#1c1c1c]">
          We have sent you a note confirming it. Give us a couple of days and your profile will land
          in your inbox for you to look at. Nothing goes anywhere until you have said yes.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[12px] font-semibold text-[#1c1c1c]">Your name</span>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="mt-1.5 w-full border border-[#dddddd] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-semibold text-[#1c1c1c]">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full border border-[#dddddd] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-semibold text-[#1c1c1c]">Phone (optional)</span>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            className="mt-1.5 w-full border border-[#dddddd] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-semibold text-[#1c1c1c]">Your CV (optional)</span>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)}
            className="mt-1.5 w-full border border-[#dddddd] px-3 py-2 text-[13px]" />
        </label>
      </div>

      <label className="block">
        <span className="block text-[12px] font-semibold text-[#1c1c1c]">Anything a CV would not say (optional)</span>
        <textarea rows={4} value={note} onChange={e => setNote(e.target.value)}
          placeholder="The treatments you are best at, the houses you have trained with, what you are hoping for next."
          className="mt-1.5 w-full border border-[#dddddd] px-3 py-2.5 text-[14px]" />
      </label>

      {/* Not visible to a person, and named so no browser recognises it.
          This was a hidden field labelled "Company", which is exactly what
          autofill exists to complete - so a real professional with autofill
          on tripped the spam check, was told her CV had arrived, and nothing
          was saved. No word a browser knows, no label, and nothing an
          autocomplete heuristic can match. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <input
          name="thc_hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={trap}
          onChange={e => setTrap(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={consent} onChange={e => { setError(''); setConsent(e.target.checked) }}
          className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="text-[12px] leading-5 text-[#555555]">{BUILD_CONSENT_WORDING}</span>
      </label>

      {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

      <button type="submit" disabled={sending}
        className="bg-[#1c1c1c] px-6 py-3 text-[13px] font-semibold text-white disabled:opacity-50">
        {sending ? 'Sending...' : 'Send it over'}
      </button>
    </form>
  )
}
