'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'

export default function EmployerSettingsPage() {
  const supabase = createClient()
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
    if (!error) { setNewPassword(''); setConfirmPassword('') }
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <DashboardShell role="employer">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Settings</h1>
      <div className="max-w-2xl">
        <div className="dashboard-card">
          <h3 className="font-serif text-lg font-semibold mb-4">Change Password</h3>
          {message && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required /></div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center space-x-2 disabled:opacity-50"><Save size={16} /><span>{loading ? 'Updating...' : 'Update Password'}</span></button>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
