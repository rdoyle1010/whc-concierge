'use client'

import DashboardShell from '@/components/DashboardShell'
import PrivacyPreferences from '@/components/PrivacyPreferences'

export default function EmployerPrivacyPage() {
  return <DashboardShell role="employer">
    <div className="max-w-4xl">
      <p className="dashboard-eyebrow">Account</p>
      <h1 className="dashboard-title">Privacy & Preferences</h1>
      <p className="dashboard-intro">Control optional marketing and data-sharing choices separately from the service communications required to run recruitment, bookings and payments.</p>
      <div className="mt-8"><PrivacyPreferences /></div>
    </div>
  </DashboardShell>
}
