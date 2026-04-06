'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Search, ShieldOff, X, Download, AlertTriangle } from 'lucide-react'

export default function TalentSettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

  // Stealth mode state
  const [stealthEnabled, setStealthEnabled] = useState(false)
  const [blockedEmployers, setBlockedEmployers] = useState<any[]>([])
  const [allEmployers, setAllEmployers] = useState<any[]>([])
  const [employerSearch, setEmployerSearch] = useState('')
  const [stealthLoading, setStealthLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [candidateId, setCandidateId] = useState<string | null>(null)

  // Job alerts state
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [alertsFrequency, setAlertsFrequency] = useState('instant')
  const [alertsMinScore, setAlertsMinScore] = useState(60)

  useEffect(() => {
    async function loadStealth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStealthLoading(false); return }
      setUserId(user.id)

      const [profileRes, employersRes] = await Promise.all([
        supabase.from('candidate_profiles').select('id, stealth_mode, job_alerts_enabled, job_alerts_frequency, job_alerts_min_score').eq('user_id', user.id).single(),
        supabase.from('employer_profiles').select('id, company_name, property_name').order('company_name'),
      ])

      const profile = profileRes.data
      if (profile) {
        setCandidateId(profile.id)
        setStealthEnabled(!!profile.stealth_mode)
        setAlertsEnabled(profile.job_alerts_enabled !== false)
        setAlertsFrequency(profile.job_alerts_frequency || 'instant')
        setAlertsMinScore(profile.job_alerts_min_score || 60)

        const { data: blocks } = await supabase
          .from('profile_blocks')
          .select('blocked_employer_id')
          .eq('candidate_id', profile.id)

        const blockedIds = new Set((blocks || []).map((b: any) => b.blocked_employer_id))
        setBlockedEmployers((employersRes.data || []).filter((e: any) => blockedIds.has(e.id)))
      }

      setAllEmployers(employersRes.data || [])
      setStealthLoading(false)
    }
    loadStealth()
  }, [])

  const toggleStealth = async (enabled: boolean) => {
    setStealthEnabled(enabled)
    if (candidateId) {
      await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: candidateId, data: { stealth_mode: enabled } }),
      })
    }
  }

  const blockEmployer = async (employer: any) => {
    if (!candidateId || blockedEmployers.some(e => e.id === employer.id)) return
    await supabase.from('profile_blocks').insert({ candidate_id: candidateId, blocked_employer_id: employer.id })
    setBlockedEmployers([...blockedEmployers, employer])
    setEmployerSearch('')
    if (!stealthEnabled) toggleStealth(true)
  }

  const unblockEmployer = async (employerId: string) => {
    if (!candidateId) return
    await supabase.from('profile_blocks').delete().eq('candidate_id', candidateId).eq('blocked_employer_id', employerId)
    setBlockedEmployers(blockedEmployers.filter(e => e.id !== employerId))
  }

  const saveAlertPref = (field: string, value: any) => {
    if (!candidateId) return
    fetch('/api/profile/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: candidateId, data: { [field]: value } }),
    }).catch(() => {})
  }

  const filteredEmployers = employerSearch.length >= 2
    ? allEmployers.filter(e =>
        !blockedEmployers.some(b => b.id === e.id) &&
        ((e.property_name || e.company_name || '').toLowerCase().includes(employerSearch.toLowerCase()))
      ).slice(0, 8)
    : []

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
  const [deleteRequested, setDeleteRequested] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/data-export')
      if (!res.ok) { alert('Failed to export data. Please try again.'); setExporting(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 'whc-data-export.json'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { alert('Something went wrong. Please try again.') }
    setExporting(false)
  }

  const handleDeletionRequest = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await fetch('/api/contact-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Account Deletion Request', email: user.email, subject: `Account Deletion Request — ${user.id}`, message: `User ${user.email} (ID: ${user.id}) has requested account deletion via the settings page.`, type: 'general' }),
    }).catch(() => {})
    setDeleteRequested(true)
    setShowDeleteRequest(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? All your data \u2014 profile, applications, messages, and documents \u2014 will be permanently removed. This cannot be undone.')) return
    if (!confirm('Final confirmation: delete your account and all associated data?')) return

    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete account. Please contact support.')
        setDeleting(false)
        return
      }
      await supabase.auth.signOut()
      window.location.href = '/?deleted=true'
    } catch {
      alert('Something went wrong. Please contact support.')
      setDeleting(false)
    }
  }

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Change Password</h3>
          {message && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}
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

        {/* Stealth Mode */}
        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2"><ShieldOff size={18} /> Stealth Mode</h3>
              <p className="text-sm text-gray-500 mt-1">Hide your profile from specific employers. Your profile won&apos;t appear in their search results or matches.</p>
            </div>
            <button type="button" onClick={() => toggleStealth(!stealthEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${stealthEnabled ? 'bg-ink' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stealthEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {stealthEnabled && (
            <div className="pt-4 border-t border-border space-y-4">
              {/* Search employers */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Search employers to block..." value={employerSearch}
                  onChange={e => setEmployerSearch(e.target.value)} className="input-field pl-9 text-[13px]" />
                {filteredEmployers.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredEmployers.map(e => (
                      <button key={e.id} type="button" onClick={() => blockEmployer(e)}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface transition-colors flex items-center justify-between">
                        <span className="text-ink">{e.property_name || e.company_name}</span>
                        <span className="text-[11px] text-muted">Block</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked list */}
              {blockedEmployers.length > 0 ? (
                <div className="space-y-2">
                  <p className="eyebrow">Blocked employers ({blockedEmployers.length})</p>
                  {blockedEmployers.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-2.5 bg-surface rounded-lg">
                      <span className="text-[13px] text-ink">{e.property_name || e.company_name}</span>
                      <button type="button" onClick={() => unblockEmployer(e.id)}
                        className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
                        <X size={12} /> Unblock
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted">No employers blocked. Search above to add employers you&apos;d like to hide from.</p>
              )}
            </div>
          )}
        </div>

        {/* Job Alerts */}
        <div className="dashboard-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2">Job Alerts</h3>
              <p className="text-sm text-gray-500 mt-1">Get notified when new roles match your profile.</p>
            </div>
            <button type="button" onClick={() => { const v = !alertsEnabled; setAlertsEnabled(v); saveAlertPref('job_alerts_enabled', v) }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${alertsEnabled ? 'bg-ink' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {alertsEnabled && (
            <div className="pt-4 border-t border-border space-y-5">
              {/* Frequency */}
              <div>
                <label className="eyebrow block mb-2">Frequency</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'instant', label: 'Instant' },
                    { value: 'daily', label: 'Daily digest' },
                    { value: 'weekly', label: 'Weekly digest' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => { setAlertsFrequency(opt.value); saveAlertPref('job_alerts_frequency', opt.value) }}
                      className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${alertsFrequency === opt.value ? 'bg-ink text-white' : 'bg-surface border border-border text-muted hover:border-ink/20'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum match score */}
              <div>
                <label className="eyebrow block mb-2">Minimum match score</label>
                <div className="flex flex-wrap gap-2">
                  {[60, 70, 80, 90].map(score => (
                    <button key={score} type="button"
                      onClick={() => { setAlertsMinScore(score); saveAlertPref('job_alerts_min_score', score) }}
                      className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${alertsMinScore === score ? 'bg-ink text-white' : 'bg-surface border border-border text-muted hover:border-ink/20'}`}>
                      {score}%+
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-2">Only roles scoring above this threshold will trigger an alert.</p>
              </div>
            </div>
          )}
        </div>

        {/* Data & Privacy */}
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Your Data</h3>
          <p className="text-sm text-gray-500 mb-4">Download a copy of all personal data we hold about you, in compliance with GDPR Article 15.</p>
          <button type="button" onClick={handleExportData} disabled={exporting}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            {exporting ? <><div className="animate-spin w-4 h-4 border-2 border-ink border-t-transparent rounded-full" /> Generating...</> : <><Download size={14} /> Download My Data</>}
          </button>
        </div>

        {/* Account Deletion */}
        <div className="dashboard-card border-red-100">
          <h3 className="font-serif text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back.</p>
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

        {/* Deletion Request Modal */}
        {showDeleteRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteRequest(false)}>
            <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 className="text-[16px] font-medium text-ink mb-2">Request Account Deletion</h3>
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

