'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Download, AlertTriangle } from 'lucide-react'

export default function EmployerSettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

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
      body: JSON.stringify({ name: 'Account Deletion Request', email: user.email, subject: `Account Deletion Request — ${user.id}`, message: `User ${user.email} (ID: ${user.id}) has requested account deletion via employer settings.`, type: 'general' }),
    }).catch(() => {})
    setDeleteRequested(true)
    setShowDeleteRequest(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? All your data \u2014 profile, job listings, applications, and messages \u2014 will be permanently removed. This cannot be undone.')) return
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
    <DashboardShell role="employer">
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

        {/* Data & Privacy */}
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
