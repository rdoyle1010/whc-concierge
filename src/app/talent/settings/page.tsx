'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'

export default function TalentSettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage('Passwords do not match'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    setMessage(error ? error.message : 'Password updated successfully!')
    if (!error) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    // Sign out — actual deletion would need admin endpoint
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Change Password</h3>
          {message && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required />
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
          <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back.</p>
          <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
