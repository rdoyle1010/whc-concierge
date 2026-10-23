'use client'

import { useState } from 'react'
import { BUILD_CONSENT_WORDING, CV_MAX_BYTES, cvTypeAllowed } from '@/lib/profile-build'
import { BUILD_QUESTIONS, unanswered, sanitiseAnswers, type BuildAnswers } from '@/lib/profile-build-questions'

// Send us your CV, answer eight things, and we build the rest.
//
// The eight are the ones a CV never says: when you could start, how far you
// would go, what languages you hold, how visible you want to be. Without them
// a built profile stops at eighty per cent and looks like somebody else
// filled it in. With them it looks like yours, which is the whole point.
//
// Five of the eight are one tap. It has to be quicker than the fifteen-field
// form people already declined to fill in, or it is that form with a better
// name on it.

export default function ProfileBuildForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [trap, setTrap] = useState('')
  const [consent, setConsent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [answers, setAnswers] = useState<BuildAnswers>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const answer = (key: string, value: unknown) => setAnswers(current => ({ ...current, [key]: value }))
  const toggle = (key: string, value: string) => setAnswers(current => {
    const held = Array.isArray(current[key]) ? current[key] as string[] : []
    return { ...current, [key]: held.includes(value) ? held.filter(item => item !== value) : [...held, value] }
  })

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Please tell us your name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please give us an email address we can reach you on.')

    // Checked against the same rules the server uses, so somebody finds out
    // now rather than after the upload.
    const missing = unanswered(sanitiseAnswers(answers))
    if (missing.length) return setError(`Still to answer: ${missing.join(', ')}.`)

    if (!consent) return setError('We need your permission before we can build anything.')
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
      form.set('answers', JSON.stringify(answers))
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
        <p className="mt-2 text-[14px] leading-relaxed text-[#222321]">
          We have sent you a note confirming it. Give us a couple of days and your profile will land
          in your inbox for you to look at. Nothing goes anywhere until you have said yes.
        </p>
      </div>
    )
  }

  const label = (text: string, hint?: string) => (
    <>
      <span className="block text-[12px] font-semibold text-[#222321]">{text}</span>
      {hint && <span className="mt-0.5 block text-[11px] leading-4 text-[#777777]">{hint}</span>}
    </>
  )

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          {label('Your name')}
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          {label('Email')}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          {label('Phone (optional)')}
          <input value={phone} onChange={e => setPhone(e.target.value)}
            className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]" />
        </label>
        <label className="block">
          {label('Your CV', 'PDF or Word. Optional, but it is what we build from.')}
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)}
            className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2 text-[13px]" />
        </label>
      </div>

      <div className="border-t border-[#e7e1d6] pt-5">
        <p className="text-[13px] font-semibold text-[#222321]">The bits a CV never says</p>
        <p className="mt-1 text-[12px] leading-5 text-[#777777]">
          Eight questions, most of them one tap. Everything else we take from your CV.
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {BUILD_QUESTIONS.map(question => {
            if (question.kind === 'many') {
              const held = Array.isArray(answers[question.key]) ? answers[question.key] as string[] : []
              return (
                <div key={question.key} className="sm:col-span-2">
                  {label(question.label, question.hint)}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(question.options || []).map(option => {
                      const on = held.includes(option.value)
                      return (
                        <button type="button" key={option.value} onClick={() => toggle(question.key, option.value)}
                          className={`border px-2.5 py-1 text-[12px] ${on ? 'border-[#222321] bg-[#222321] text-white' : 'border-[#dcd4c8] text-[#57544c]'}`}>
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }

            if (question.kind === 'choose') {
              const wide = question.key === 'visibility'
              return (
                <label key={question.key} className={`block ${wide ? 'sm:col-span-2' : ''}`}>
                  {label(question.label, question.hint)}
                  <select value={String(answers[question.key] || '')}
                    onChange={e => answer(question.key, e.target.value)}
                    className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]">
                    <option value="">Choose one</option>
                    {(question.options || []).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              )
            }

            return (
              <label key={question.key} className="block">
                {label(question.label, question.hint)}
                <input type={question.kind === 'number' ? 'number' : 'text'}
                  value={String(answers[question.key] ?? '')} placeholder={question.placeholder}
                  onChange={e => answer(question.key, e.target.value)}
                  className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]" />
              </label>
            )
          })}
        </div>
      </div>

      <label className="block">
        {label('Anything else worth knowing (optional)', 'The treatments you are best at, the houses you have trained with, what you are hoping for next.')}
        <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
          className="mt-1.5 w-full border border-[#dcd4c8] px-3 py-2.5 text-[14px]" />
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
        <span className="text-[12px] leading-5 text-[#57544c]">{BUILD_CONSENT_WORDING}</span>
      </label>

      {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

      <button type="submit" disabled={sending}
        className="bg-[#222321] px-6 py-3 text-[13px] font-semibold text-white disabled:opacity-50">
        {sending ? 'Sending...' : 'Send it over'}
      </button>
    </form>
  )
}
