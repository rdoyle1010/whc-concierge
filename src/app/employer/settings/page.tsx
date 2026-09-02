'use client'

import { useEffect, useState } from 'react'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Download, AlertTriangle } from 'lucide-react'
import { deletionSummary } from '@/lib/account-deletion'

// Square-cornered toggle row for the notification preference centre (brand
// rule: no new rounded corners).
function PrefRow({ title, description, on, onToggle }: { title: string; description: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div>
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-[12px] leading-5 text-muted mt-0.5">{description}</p>
      </div>
      <button type="button" onClick={onToggle} aria-pressed={on} aria-label={`${on ? 'Turn off' : 'Turn on'} ${title}`}
        className={`relative inline-flex h-6 w-11 items-center border transition-colors shrink-0 ${on ? 'bg-ink border-ink' : 'bg-gray-200 border-border'}`}>
        <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function EmployerSettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [employerId, setEmployerId] = useState<string | null>(null)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')
  const [smsSaving, setSmsSaving] = useState(false)

  // Email notification preferences (privacy_preferences)
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({
    application_updates_email: true,
    booking_updates_email: true,
    product_news_email: false,
  })

  useEffect(() => {
    async function loadSmsSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('employer_profiles').select('id,contact_phone,sms_opt_in').eq('user_id', user.id).maybeSingle()
      if (!data) return
      setEmployerId(data.id)
      setSmsPhone(data.contact_phone || '')
      setSmsEnabled(Boolean(data.sms_opt_in))
    }
    async function loadEmailPrefs() {
      try {
        const res = await fetch('/api/privacy/preferences')
        if (!res.ok) return
        const json = await res.json()
        const p = json.preferences || {}
        setEmailPrefs(prev => {
          const next = { ...prev }
          for (const key of Object.keys(prev)) if (typeof p[key] === 'boolean') next[key] = p[key]
          return next
        })
      } catch { /* defaults stand */ }
    }
    loadSmsSettings()
    loadEmailPrefs()
  }, [])

  const saveEmailPref = async (field: string, value: boolean) => {
    const previous = emailPrefs[field]
    setEmailPrefs(prev => ({ ...prev, [field]: value }))
    try {
      const res = await fetch('/api/privacy/preferences', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setEmailPrefs(prev => ({ ...prev, [field]: previous }))
      setMessage('Could not save your notification preference - please try again.')
      setMessageType('error')
      setTimeout(() => setMessage(''), 4000)
    }
  }

  const saveSmsSettings = async (enabled = smsEnabled) => {
    if (!employerId) return
    if (enabled && !smsPhone.trim()) {
      setMessage('Add a mobile number before turning SMS alerts on.')
      setMessageType('error')
      return
    }
    setSmsSaving(true)
    const { error } = await supabase.from('employer_profiles').update({ contact_phone: smsPhone.trim() || null, sms_opt_in: enabled }).eq('id', employerId)
    setSmsSaving(false)
    if (error) {
      setMessage(error.message)
      setMessageType('error')
      return
    }
    setSmsEnabled(enabled)
    setMessage('SMS notification settings saved.')
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters')
      setMessageType('error')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      setMessageType('error')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setLoading(false)
      setMessage('Unable to verify your identity. Please sign in again.')
      setMessageType('error')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setLoading(false)
      setMessage('Current password is incorrect')
      setMessageType('error')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      setMessage('Password updated successfully!')
      setMessageType('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setTimeout(() => setMessage(''), 4000)
  }

  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showDeleteRequest, setShowDeleteRequest] = useState(false)
  const deleteDialog = useDialog(() => setShowDeleteRequest(false), 'employer-delete-account-heading', { enabled: showDeleteRequest })
  const [deleteRequested, setDeleteRequested] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/data-export')
      if (!res.ok) { alert('Failed to export data.'); setExporting(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'whc-data-export.json'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { alert('Something went wrong.') }
    setExporting(false)
  }

  const handleDeletionRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await fetch('/api/contact-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Account Deletion Request', email: user.email, subject: `Account Deletion Request - ${user.id}`, message: `User ${user.email} (ID: ${user.id}) has requested account deletion via employer settings.`, type: 'general' }),
    }).catch(() => {})
    setDeleteRequested(true)
    setShowDeleteRequest(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? Your property profile, job listings, applications, shortlists and messages are permanently removed. Booking and payment records are kept with the property link removed from them, because UK company and tax law requires it. This cannot be undone.')) return
    if (!confirm('Final confirmation: delete your account and all associated data?')) return

    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        alert(data.error || 'Failed to delete account. Please contact support.')
        setDeleting(false)
        return
      }
      alert(deletionSummary(data))
      await supabase.auth.signOut()
      window.location.href = '/?deleted=true'
    } catch {
      alert('Something went wrong. Please contact support.')
      setDeleting(false)
    }
  }
  return (
    <DashboardShell role="employer">
      <div className="mb-6">
        <p className="dashboard-eyebrow">Account</p>
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-intro">Notifications, password and your data in one place.</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {message && <div className={`px-4 py-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

        {/* Email notification preference centre */}
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold">Email Notifications</h3>
          <p className="text-sm text-gray-500 mt-1 mb-2">In-app notifications always appear here. These controls govern what reaches your inbox.</p>
          <PrefRow
            title="Applications and candidate replies"
            description="An email when a candidate applies, responds to an interview, or messages you."
            on={emailPrefs.application_updates_email}
            onToggle={() => saveEmailPref('application_updates_email', !emailPrefs.application_updates_email)}
          />
          <PrefRow
            title="Agency booking updates"
            description="An email when a therapist accepts, counters or declines a shift, or a booking changes."
            on={emailPrefs.booking_updates_email}
            onToggle={() => saveEmailPref('booking_updates_email', !emailPrefs.booking_updates_email)}
          />
          <PrefRow
            title="Market intelligence and featured talent"
            description="The weekly intelligence email plus occasional featured-professional announcements."
            on={emailPrefs.product_news_email}
            onToggle={() => saveEmailPref('product_news_email', !emailPrefs.product_news_email)}
          />
        </div>

        <div className="dashboard-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold">SMS Notifications</h3>
              <p className="text-sm text-gray-500 mt-1">Get short text alerts when something important needs attention. Full details stay inside Talent House Collective.</p>
            </div>
            <button type="button" onClick={() => saveSmsSettings(!smsEnabled)} disabled={smsSaving}
              aria-label={smsEnabled ? 'Turn SMS notifications off' : 'Turn SMS notifications on'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:opacity-50 ${smsEnabled ? 'bg-ink' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="pt-4 border-t border-border space-y-3">
            <div>
              <label className="eyebrow block mb-1.5">Mobile number for alerts</label>
              <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} className="input-field" placeholder="07700 900123" />
            </div>
            <p className="text-[12px] leading-5 text-muted">Alerts can include new messages, new applications, candidate responses, interview updates, Agency Cover responses, urgent cover updates and Residency activity. Texts only tell you that there is an update waiting; sensitive details remain in your account.</p>
            <button type="button" onClick={() => saveSmsSettings()} disabled={smsSaving} className="btn-secondary text-[13px] disabled:opacity-50">{smsSaving ? 'Saving...' : 'Save SMS settings'}</button>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required minLength={8} />
              <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
              <Save size={16} /><span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Your Data</h3>
          <p className="text-sm text-gray-500 mb-4">Download a copy of all personal data we hold about you, in compliance with GDPR Article 15.</p>
          <button type="button" onClick={handleExportData} disabled={exporting}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            {exporting ? <><div className="animate-spin w-4 h-4 border-2 border-ink border-t-transparent rounded-full" /> Generating...</> : <><Download size={14} /> Download My Data</>}
          </button>
        </div>

        <div className="dashboard-card border-red-100">
          <h3 className="font-serif text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. All job listings, applications, and data will be permanently removed.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
            <button type="button" onClick={() => setShowDeleteRequest(true)} disabled={deleteRequested}
              className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
              {deleteRequested ? 'Request Sent' : 'Request Account Deletion'}
            </button>
          </div>
        </div>

        {showDeleteRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteRequest(false)}>
            <div {...deleteDialog.panelProps} className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 id="employer-delete-account-heading" className="text-[16px] font-medium text-ink mb-2">Request Account Deletion</h3>
              <p className="text-[13px] text-muted mb-2">This will send a deletion request to our team. We will:</p>
              <ul className="text-[12px] text-muted text-left mb-6 space-y-1 pl-4">
                <li>&bull; Verify your identity</li>
                <li>&bull; Remove all personal data within 30 days</li>
                <li>&bull; Send confirmation when complete</li>
              </ul>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeleteRequest(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleDeletionRequest} className="flex-1 px-4 py-2 bg-red-500 text-white text-[13px] font-medium rounded-lg hover:bg-red-600 transition-colors">Send Request</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
