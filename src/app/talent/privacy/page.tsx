'use client'

import DashboardShell from '@/components/DashboardShell'
import PrivacyPreferences from '@/components/PrivacyPreferences'

export default function TalentPrivacyPage() {
  return <DashboardShell role="talent">
    <div className="max-w-4xl">
      <p className="dashboard-eyebrow">Account</p>
      <h1 className="dashboard-title">Privacy & Preferences</h1>
      <p className="dashboard-intro">Manage optional marketing, contact preferences and profile/data sharing. Your consent choices are recorded so WHC can demonstrate when and how preferences changed.</p>
      <div className="mt-8"><PrivacyPreferences /></div>
    </div>
  </DashboardShell>
}
