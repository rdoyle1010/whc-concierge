'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'

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

        <div className="dashboard-card border-red-100">
          <h3 className="font-serif text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back. All job listings, applications, and data will be permanently removed.</p>
          <button onClick={handleDeleteAccount} disabled={deleting} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
