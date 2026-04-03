'use client'

import DashboardShell from '@/components/DashboardShell'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Platform Settings</h1>
      <div className="dashboard-card max-w-2xl">
        <div className="flex items-center space-x-4 text-gray-400">
          <Settings size={24} />
          <div>
            <p className="font-medium text-ink">Platform Configuration</p>
            <p className="text-sm">Platform settings are managed through Supabase and Netlify environment variables.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-ink">Supabase Project</p>
            <p className="text-xs text-gray-400 mt-1">klfsemvrxvgrbuzrqyer.supabase.co</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-ink">Stripe Integration</p>
            <p className="text-xs text-gray-400 mt-1">Live keys connected via Netlify environment variables</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-ink">Deployment</p>
            <p className="text-xs text-gray-400 mt-1">Netlify with @netlify/plugin-nextjs</p>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
