'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [config, setConfig] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('platform_config').select('*')
      const configMap: Record<string, any> = {}
      for (const row of data || []) {
        configMap[row.key] = row.value
      }
      setConfig(configMap)
      setLoading(false)
    }
    load()
  }, [])

  const updateConfig = async (key: string, value: string) => {
    setSaving(true)
    setMessage('')

    // Upsert into platform_config
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key, value }, { onConflict: 'key' })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setConfig({ ...config, [key]: value })
      setMessage('Settings saved!')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const configFields = [
    { key: 'site_name', label: 'Site Name', placeholder: 'WHC Concierge' },
    { key: 'site_description', label: 'Site Description', placeholder: 'The specialist careers platform for luxury wellness' },
    { key: 'contact_email', label: 'Contact Email', placeholder: 'hello@wellnesshousecollective.co.uk' },
    { key: 'silver_price', label: 'Silver Tier Price (pence)', placeholder: '15000' },
    { key: 'gold_price', label: 'Gold Tier Price (pence)', placeholder: '20000' },
    { key: 'platinum_price', label: 'Platinum Tier Price (pence)', placeholder: '25000' },
    { key: 'maintenance_mode', label: 'Maintenance Mode (true/false)', placeholder: 'false' },
  ]

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Platform Settings</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {message && (
            <div className={`px-4 py-3 rounded-xl text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>
          )}

          <div className="dashboard-card space-y-6">
            <h3 className="font-serif text-lg font-semibold flex items-center space-x-2">
              <Settings size={20} className="text-gold" /><span>Configuration</span>
            </h3>
            <p className="text-sm text-gray-400">Settings are stored in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">platform_config</code> table.</p>

            {configFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={config[field.key] || ''}
                    onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                    className="input-field flex-1"
                    placeholder={field.placeholder}
                  />
                  <button
                    onClick={() => updateConfig(field.key, config[field.key] || '')}
                    disabled={saving}
                    className="btn-primary !px-4 flex items-center space-x-1 disabled:opacity-50"
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-card">
            <h3 className="font-serif text-lg font-semibold mb-4">Infrastructure</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div><p className="text-sm font-medium text-ink">Supabase Project</p><p className="text-xs text-gray-400">klfsemvrxvgrbuzrqyer.supabase.co</p></div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Connected</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div><p className="text-sm font-medium text-ink">Stripe</p><p className="text-xs text-gray-400">Live keys via Netlify env vars</p></div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Connected</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div><p className="text-sm font-medium text-ink">Storage Bucket</p><p className="text-xs text-gray-400">site-images (public)</p></div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
