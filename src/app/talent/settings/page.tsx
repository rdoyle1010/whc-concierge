'use client'

import { useEffect, useState } from 'react'
import { getViewer } from '@/lib/viewer'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Search, ShieldOff, X, Download, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import { deletionSummary } from '@/lib/account-deletion'

// Square-cornered toggle for the notification preference centre (brand rule:
// no new rounded corners).
function PrefSwitch({ on, onClick, disabled, label }: { on: boolean; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={label}
      className={`relative inline-flex h-6 w-11 items-center border transition-colors shrink-0 disabled:opacity-50 ${on ? 'bg-ink border-ink' : 'bg-gray-200 border-border'}`}>
      <span className={`inline-block h-4 w-4 transform bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function PrefRow({ title, description, on, onToggle, disabled }: { title: string; description: string; on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-b-0">
      <div>
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="text-[12px] leading-5 text-muted mt-0.5">{description}</p>
      </div>
      <PrefSwitch on={on} onClick={onToggle} disabled={disabled} label={`${on ? 'Turn off' : 'Turn on'} ${title}`} />
    </div>
  )
}

function TierHeading({ label, note }: { label: string; note: string }) {
  return (
    <div className="pt-5 first:pt-0">
      <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-ink">{label}</p>
      <p className="text-[11px] text-muted mt-0.5">{note}</p>
    </div>
  )
}

export default function TalentSettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // null until we know; then 'consultant' or '' for the ordinary workspace.
  const [accountFocus, setAccountFocus] = useState<string | null>(null)
  const [workspaceBusy, setWorkspaceBusy] = useState(false)

  useEffect(() => {
    fetch('/api/consultancy/mine', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      // Only offered to somebody who has a consultancy listing. Everybody else
      // has no use for a switch between two workspaces they will never see.
      .then(json => { if (json?.profile) setAccountFocus(json.accountFocus || '') })
      .catch(() => {})
  }, [])

  async function setWorkspace(next: 'consultant' | null) {
    setWorkspaceBusy(true)
    await fetch('/api/consultancy/mine', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_focus: next }),
    }).catch(() => {})
    window.location.reload()
  }
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

  // Private Career Mode state
  const [privateMode, setPrivateMode] = useState(false)
  const [privateHidePhoto, setPrivateHidePhoto] = useState(false)
  const [firstNameOnly, setFirstNameOnly] = useState(false)
  const [pcmBlocks, setPcmBlocks] = useState<any[]>([])
  const [pcmSearch, setPcmSearch] = useState('')
  const [pcmResults, setPcmResults] = useState<any[]>([])
  const [pcmMessage, setPcmMessage] = useState('')

  // Job alerts state
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [alertsFrequency, setAlertsFrequency] = useState('instant')
  const [alertsMinScore, setAlertsMinScore] = useState(60)

  // Email notification preferences (privacy_preferences)
  const [emailPrefs, setEmailPrefs] = useState<Record<string, boolean>>({
    job_alerts_email: true,
    application_updates_email: true,
    booking_updates_email: true,
    academy_updates_email: false,
    product_news_email: false,
  })

  // SMS preference (candidate_profiles via the agency settings API)
  const [agencySettings, setAgencySettings] = useState<any>(null)
  const [smsSaving, setSmsSaving] = useState(false)

  useEffect(() => {
    async function loadNotificationPrefs() {
      try {
        const res = await fetch('/api/privacy/preferences')
        if (res.ok) {
          const json = await res.json()
          const p = json.preferences || {}
          setEmailPrefs(prev => {
            const next = { ...prev }
            for (const key of Object.keys(prev)) if (typeof p[key] === 'boolean') next[key] = p[key]
            return next
          })
        }
      } catch { /* defaults stand */ }
      try {
        const res = await fetch('/api/agency/settings')
        if (res.ok) {
          const json = await res.json()
          if (json.settings) setAgencySettings(json.settings)
        }
      } catch { /* SMS card simply shows no number */ }
    }
    loadNotificationPrefs()
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
      alert('Could not save your notification preference - please try again.')
    }
  }

  const saveSmsOptIn = async (value: boolean) => {
    if (!agencySettings) return
    if (value && !agencySettings.phone) {
      alert('Add a mobile number in Agency Settings before turning on text alerts.')
      return
    }
    setSmsSaving(true)
    const previous = agencySettings.sms_opt_in
    setAgencySettings({ ...agencySettings, sms_opt_in: value })
    try {
      // Reuses the agency settings contract: echo the stored practical details
      // back so only sms_opt_in changes.
      const res = await fetch('/api/agency/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourly_rate: agencySettings.hourly_rate,
          phone: agencySettings.phone,
          postcode: agencySettings.postcode,
          travel_radius_miles: agencySettings.travel_radius_miles,
          sms_opt_in: value,
        }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setAgencySettings({ ...agencySettings, sms_opt_in: previous })
      alert('Could not save your SMS preference - please try again.')
    }
    setSmsSaving(false)
  }

  useEffect(() => {
    async function loadStealth() {
      const user = await getViewer()
      if (!user) { setStealthLoading(false); return }
      setUserId(user.id)

      const [profileRes, employersRes] = await Promise.all([
        supabase.from('candidate_profiles').select('id, stealth_mode, show_first_name_only, job_alerts_enabled, job_alerts_frequency, job_alerts_min_score').eq('user_id', user.id).single(),
        supabase.from('employer_profiles').select('id, company_name, property_name').order('company_name'),
      ])

      const profile = profileRes.data
      if (profile) {
        setCandidateId(profile.id)
        setStealthEnabled(!!profile.stealth_mode)
        setFirstNameOnly(!!profile.show_first_name_only)

        // The private-mode columns may not be migrated yet - a failed select
        // simply leaves both toggles off.
        try {
          const { data: priv } = await supabase.from('candidate_profiles').select('private_mode, private_hide_photo').eq('id', profile.id).maybeSingle()
          if (priv) {
            setPrivateMode(!!(priv as any).private_mode)
            setPrivateHidePhoto(!!(priv as any).private_hide_photo)
          }
        } catch { /* toggles stay off */ }

        try {
          const res = await fetch('/api/talent/blocked-employers')
          if (res.ok) {
            const json = await res.json()
            setPcmBlocks(json.blocks || [])
          }
        } catch { /* blocklist simply shows empty */ }
        setAlertsEnabled(profile.job_alerts_enabled !== false)
        setAlertsFrequency(profile.job_alerts_frequency || 'instant')
        setAlertsMinScore(profile.job_alerts_min_score || 60)

        const blocksRes = await fetch('/api/profile/blocks')
        const blocksJson = blocksRes.ok ? await blocksRes.json() : { blocks: [] }
        const blockedIds = new Set((blocksJson.blocks || []).map((b: any) => b.blocked_employer_id))
        setBlockedEmployers((employersRes.data || []).filter((e: any) => blockedIds.has(e.id)))
      }

      setAllEmployers(employersRes.data || [])
      setStealthLoading(false)
    }
    loadStealth()
  }, [])

  const toggleStealth = async (enabled: boolean) => {
    if (!enabled && blockedEmployers.length > 0) {
      alert('Unblock the employers listed below before turning Stealth Mode off. This prevents an accidental privacy change.')
      return
    }
    setStealthEnabled(enabled)
    if (!candidateId) return
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: candidateId, data: { stealth_mode: enabled } }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      setStealthEnabled(!enabled)
      alert('Could not update stealth mode - please try again.')
    }
  }

  const blockEmployer = async (employer: any) => {
    if (!candidateId || blockedEmployers.some(e => e.id === employer.id)) return
    // Service-role route - the old client-side insert was RLS-blocked and
    // silently failed, so blocked employers could still see the profile
    const res = await fetch('/api/profile/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId: employer.id, action: 'block' }),
    })
    if (!res.ok) { alert('Could not block this employer - please try again.'); return }
    setBlockedEmployers([...blockedEmployers, employer])
    setEmployerSearch('')
    if (!stealthEnabled) toggleStealth(true)
  }

  const unblockEmployer = async (employerId: string) => {
    if (!candidateId) return
    const res = await fetch('/api/profile/blocks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId, action: 'unblock' }),
    })
    if (!res.ok) { alert('Could not unblock - please try again.'); return }
    setBlockedEmployers(blockedEmployers.filter(e => e.id !== employerId))
  }

  // Private Career Mode: each toggle saves through the profile update route,
  // which strips unknown columns and retries, so the new columns are safe even
  // before the migration runs.
  const savePrivatePref = async (field: 'private_mode' | 'private_hide_photo' | 'show_first_name_only', value: boolean, revert: (previous: boolean) => void) => {
    if (!candidateId) return
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: candidateId, data: { [field]: value } }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      revert(!value)
      alert('Could not save your privacy preference - please try again.')
    }
  }

  // Employer blocklist search for the Private Career Mode card, debounced so
  // typing does not hammer the endpoint.
  useEffect(() => {
    const term = pcmSearch.trim()
    if (term.length < 2) { setPcmResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/talent/blocked-employers?q=${encodeURIComponent(term)}`)
        if (res.ok) {
          const json = await res.json()
          setPcmResults(json.results || [])
        }
      } catch { /* results simply stay empty */ }
    }, 250)
    return () => clearTimeout(timer)
  }, [pcmSearch])

  const pcmBlockEmployer = async (employer: any) => {
    if (pcmBlocks.some(b => b.employer_id === employer.id)) return
    setPcmMessage('')
    const res = await fetch('/api/talent/blocked-employers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId: employer.id, action: 'add' }),
    }).catch(() => null)
    if (!res?.ok) { setPcmMessage('Could not block this employer - please try again.'); return }
    setPcmBlocks([...pcmBlocks, { employer_id: employer.id, name: employer.name }])
    setBlockedEmployers(prev => prev.some((b: any) => b.id === employer.id) ? prev : [...prev, { id: employer.id, property_name: employer.name }])
    setPcmSearch('')
    setPcmResults([])
  }

  const pcmUnblockEmployer = async (employerId: string) => {
    setPcmMessage('')
    const res = await fetch('/api/talent/blocked-employers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employerId, action: 'remove' }),
    }).catch(() => null)
    if (!res?.ok) { setPcmMessage('Could not remove this block - please try again.'); return }
    setPcmBlocks(pcmBlocks.filter(b => b.employer_id !== employerId))
    setBlockedEmployers(prev => prev.filter((b: any) => b.id !== employerId))
  }

  const saveAlertPref = async (field: string, value: any) => {
    if (!candidateId) return
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: candidateId, data: { [field]: value } }),
      })
      if (!res.ok) throw new Error('save failed')
    } catch {
      alert('Could not save your alert preference - please try again.')
      // Re-sync from the database so the UI reflects what actually persisted
      const { data } = await supabase.from('candidate_profiles')
        .select('job_alerts_enabled, job_alerts_frequency, job_alerts_min_score')
        .eq('id', candidateId).single()
      if (data) {
        setAlertsEnabled(data.job_alerts_enabled !== false)
        setAlertsFrequency(data.job_alerts_frequency || 'instant')
        setAlertsMinScore(data.job_alerts_min_score || 60)
      }
    }
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

    const user = await getViewer()
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
  // Without the enabled flag this dialog counts as open from the moment the
  // page loads, and an open dialog locks page scrolling. The delete
  // confirmation is never on screen, so nothing looked wrong - Settings just
  // would not scroll, and no amount of staring at the layout explained it.
  const deleteDialog = useDialog(() => setShowDeleteRequest(false), 'delete-account-heading', { enabled: showDeleteRequest })
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
    const user = await getViewer()
    if (!user) return
    await fetch('/api/contact-notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Account Deletion Request', email: user.email, subject: `Account Deletion Request - ${user.id}`, message: `User ${user.email} (ID: ${user.id}) has requested account deletion via the settings page.`, type: 'general' }),
    }).catch(() => {})
    setDeleteRequested(true)
    setShowDeleteRequest(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? Your profile, applications, messages and uploaded documents - your CV, insurance certificate and right-to-work evidence - are permanently removed. Booking, payment and Academy records are kept with your name removed from them, because UK company and tax law requires it. This cannot be undone.')) return
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
    <DashboardShell role="talent">
      <div className="mb-6">
        <p className="dashboard-eyebrow">Account</p>
        <h1 className="dashboard-title">Settings</h1>
        <p className="dashboard-intro">Manage your password, privacy, alerts and data.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* An account-level choice, so it lives with the other account-level
            choices. It sat on the consultancy listing page, where it invited
            somebody who had come to consult to take on a jobs dashboard they
            never asked for - but removing it outright would trap anybody who
            later does want roles. */}
        {accountFocus !== null && (
          <div className="dashboard-card">
            <h3 className="font-serif text-lg font-semibold mb-2">What this account is for</h3>
            {accountFocus === 'consultant' ? (
              <>
                <p className="text-[13px] leading-7 text-secondary">
                  Your workspace is set up for consultancy, so agency shifts, Residency and the job tools are hidden.
                  Turn them on if you also want to be found for roles or flexible work.
                </p>
                <button type="button" onClick={() => setWorkspace(null)} disabled={workspaceBusy}
                  className="btn-secondary mt-4 text-[13px] disabled:opacity-50">
                  {workspaceBusy ? 'Switching...' : 'Show roles and agency work too'}
                </button>
              </>
            ) : (
              <>
                <p className="text-[13px] leading-7 text-secondary">
                  You are seeing the full workspace. If you are only here to consult, the agency, shift and job tools
                  can be hidden until you want them.
                </p>
                <button type="button" onClick={() => setWorkspace('consultant')} disabled={workspaceBusy}
                  className="btn-secondary mt-4 text-[13px] disabled:opacity-50">
                  {workspaceBusy ? 'Switching...' : 'Simplify to consultancy only'}
                </button>
              </>
            )}
          </div>
        )}

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
              <p className="text-sm text-gray-500 mt-1">Hide from specific employers without hiding from everyone else. Blocked businesses are removed before your profile reaches search, matching, agency results or shortlists.</p>
              <p className="text-xs text-gray-400 mt-2">This does not withdraw an application or message you already chose to send. Talent House administrators retain access for safety and support.</p>
            </div>
            <button type="button" onClick={() => toggleStealth(!stealthEnabled)}
              aria-label={stealthEnabled ? 'Turn Stealth Mode off' : 'Turn Stealth Mode on'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${stealthEnabled ? 'bg-ink' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${stealthEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {stealthEnabled && (
            <div className="pt-4 border-t border-border space-y-4">
              {blockedEmployers.length === 0 && (
                <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-900">
                  Stealth Mode is on, but you are not hidden from anyone yet. Search for your current employer below and add them to the blocked list.
                </div>
              )}
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

        {/* Private Career Mode */}
        <div className="dashboard-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2"><Lock size={18} /> Private Career Mode</h3>
              <p className="text-sm text-gray-500 mt-1">
                Your profile appears to employers anonymised - first name and initial, no photograph, headline and experience visible - and employers must request an introduction which you approve before they see who you are.
              </p>
            </div>
            <PrefSwitch
              on={privateMode}
              onClick={() => {
                const next = !privateMode
                setPrivateMode(next)
                savePrivatePref('private_mode', next, setPrivateMode)
              }}
              disabled={stealthLoading || !candidateId}
              label="Private Career Mode"
            />
          </div>

          <div className="mt-4 pt-1 border-t border-border">
            <PrefRow
              title="Show first name only"
              description="Your name appears as first name and surname initial wherever employers see it."
              on={firstNameOnly}
              disabled={stealthLoading || !candidateId}
              onToggle={() => {
                const next = !firstNameOnly
                setFirstNameOnly(next)
                savePrivatePref('show_first_name_only', next, setFirstNameOnly)
              }}
            />
            <PrefRow
              title="Hide my photograph"
              description="Employers see a quiet monogram in place of your photograph."
              on={privateHidePhoto}
              disabled={stealthLoading || !candidateId}
              onToggle={() => {
                const next = !privateHidePhoto
                setPrivateHidePhoto(next)
                savePrivatePref('private_hide_photo', next, setPrivateHidePhoto)
              }}
            />

            <div className="py-3">
              <p className="text-[13px] font-medium text-ink">Hide me from specific employers</p>
              <p className="text-[12px] leading-5 text-muted mt-0.5">Blocked employers can never see your profile anywhere on Talent House - use this for your current employer.</p>
              {pcmMessage && <p className="text-[12px] text-red-600 mt-2">{pcmMessage}</p>}

              <div className="relative mt-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" placeholder="Search properties by name..." value={pcmSearch}
                  onChange={e => setPcmSearch(e.target.value)}
                  className="w-full border border-border bg-white pl-9 pr-3 py-2 text-[13px] text-ink" />
                {pcmResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-border shadow-lg max-h-48 overflow-y-auto">
                    {pcmResults.map(e => (
                      <button key={e.id} type="button" onClick={() => pcmBlockEmployer(e)}
                        className="w-full text-left px-3 py-2 text-[13px] hover:bg-surface transition-colors flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-ink truncate">{e.name}</span>
                          {e.location && <span className="block text-[11px] text-muted truncate">{e.location}</span>}
                        </span>
                        <span className="text-[11px] text-muted shrink-0">Block</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {pcmBlocks.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-ink">Blocked employers ({pcmBlocks.length})</p>
                  {pcmBlocks.map(b => (
                    <div key={b.employer_id} className="flex items-center justify-between gap-3 bg-surface border border-border px-3 py-2.5">
                      <span className="text-[13px] text-ink truncate">{b.name}</span>
                      <button type="button" onClick={() => pcmUnblockEmployer(b.employer_id)}
                        className="text-[11px] text-secondary hover:text-ink flex items-center gap-1 font-medium shrink-0">
                        <X size={12} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-muted mt-3">No employers blocked yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Notification preference centre */}
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold">Notifications</h3>
          <p className="text-sm text-gray-500 mt-1 mb-2">In-app notifications always appear here. These controls govern what reaches your inbox and phone.</p>

          {/* INSTANT */}
          <TierHeading label="Instant" note="Sent the moment something happens." />
          <PrefRow
            title="New matched role"
            description="One email the moment a live role scores above your match threshold."
            on={emailPrefs.job_alerts_email && alertsEnabled}
            onToggle={() => {
              const next = !(emailPrefs.job_alerts_email && alertsEnabled)
              saveEmailPref('job_alerts_email', next)
              setAlertsEnabled(next)
              saveAlertPref('job_alerts_enabled', next)
            }}
          />
          <PrefRow
            title="Interview requests and employer messages"
            description="An email when a property invites you to interview, updates your application or messages you."
            on={emailPrefs.application_updates_email}
            onToggle={() => saveEmailPref('application_updates_email', !emailPrefs.application_updates_email)}
          />
          <PrefRow
            title="Agency shift requests and booking updates"
            description="An email when a property offers you a shift, or a booking is accepted, countered, confirmed or declined."
            on={emailPrefs.booking_updates_email}
            onToggle={() => saveEmailPref('booking_updates_email', !emailPrefs.booking_updates_email)}
          />

          {/* DAILY */}
          <TierHeading label="Daily" note="Batched once a day, so your inbox stays quiet." />
          <div className="py-3 border-b border-border">
            <p className="text-[13px] font-medium text-ink">Daily roles digest</p>
            <p className="text-[12px] leading-5 text-muted mt-0.5">Choose how role alerts arrive: the instant they go live, one daily digest, or a weekly round-up.</p>
            <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Role alert frequency">
              {[{ value: 'instant', label: 'Instant' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setAlertsFrequency(opt.value); saveAlertPref('job_alerts_frequency', opt.value) }}
                  className={`px-4 py-2 text-[12px] font-medium border transition-colors ${alertsFrequency === opt.value ? 'bg-ink border-ink text-white' : 'bg-surface border-border text-muted hover:border-ink/20'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <label htmlFor="alerts-min-score" className="text-[12px] text-secondary">Only roles above</label>
              <input id="alerts-min-score" type="number" min={0} max={100} step={5} value={alertsMinScore}
                onChange={e => setAlertsMinScore(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
                onBlur={() => saveAlertPref('job_alerts_min_score', alertsMinScore)}
                className="w-20 border border-border bg-white px-2 py-1.5 text-[12px] text-ink" />
              <span className="text-[12px] text-secondary">% match</span>
            </div>
          </div>
          <PrefRow
            title="Academy suggestions"
            description="Occasional emails about courses, gifted enrolments and Academy resources suited to your profile."
            on={emailPrefs.academy_updates_email}
            onToggle={() => saveEmailPref('academy_updates_email', !emailPrefs.academy_updates_email)}
          />

          {/* WEEKLY */}
          <TierHeading label="Weekly" note="One considered email a week, at most." />
          <PrefRow
            title="Career intelligence and market updates"
            description="The weekly intelligence email: market salary movements, hiring trends and platform news."
            on={emailPrefs.product_news_email}
            onToggle={() => saveEmailPref('product_news_email', !emailPrefs.product_news_email)}
          />

          {/* SMS */}
          <TierHeading label="SMS" note="Texts are reserved for time-critical agency work." />
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-ink">Urgent agency shifts by text</p>
              <p className="text-[12px] leading-5 text-muted mt-0.5">A short text when a property needs same-day cover and has offered you the shift. Details stay inside your account.</p>
              {agencySettings ? (
                <p className="text-[11px] text-muted mt-1.5">
                  {agencySettings.phone ? <>Number on file: <span className="text-ink font-medium">{agencySettings.phone}</span>. </> : <>No mobile number on file. </>}
                  <Link href="/talent/agency/settings" className="underline text-ink">Update your number</Link>
                </p>
              ) : (
                <p className="text-[11px] text-muted mt-1.5">Set up your agency profile to receive shift texts.</p>
              )}
            </div>
            <PrefSwitch
              on={Boolean(agencySettings?.sms_opt_in)}
              onClick={() => saveSmsOptIn(!agencySettings?.sms_opt_in)}
              disabled={smsSaving || !agencySettings}
              label="Urgent agency shifts by text"
            />
          </div>
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
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <div>
              <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
              <p className="text-[11px] text-muted mt-1.5">Deletes your account and data immediately - this cannot be undone.</p>
            </div>
            <div>
              <button type="button" onClick={() => setShowDeleteRequest(true)} disabled={deleteRequested}
                className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleteRequested ? 'Request Sent' : 'Request Account Deletion'}
              </button>
              <p className="text-[11px] text-muted mt-1.5">Sends a request our support team reviews before anything is removed.</p>
            </div>
          </div>
        </div>

        {/* Deletion Request Modal */}
        {showDeleteRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteRequest(false)}>
            <div {...deleteDialog.panelProps} className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <h3 id="delete-account-heading" className="text-[16px] font-medium text-ink mb-2">Request Account Deletion</h3>
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
