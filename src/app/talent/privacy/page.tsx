'use client'

import DashboardShell from '@/components/DashboardShell'
import PrivacyPreferences from '@/components/PrivacyPreferences'
import VisibilityControl from '@/components/VisibilityControl'

export default function TalentPrivacyPage() {
  return <DashboardShell role="talent">
    <div className="max-w-4xl">
      <p className="dashboard-eyebrow">Account</p>
      <h1 className="dashboard-title">Privacy & Preferences</h1>
      <p className="dashboard-intro">Manage optional marketing, contact preferences and profile/data sharing. Your consent choices are recorded so Talent House can demonstrate when and how preferences changed.</p>
      {/* First, because it is the question professionals actually ask before
          they join: who can see that I am here. Everything below it is
          marketing consent and data handling, which matters and is not what
          keeps anybody awake. */}
      <div className="mt-8 dashboard-card">
        <p className="eyebrow">Who can see you</p>
        <h2 className="text-[20px] mt-1">Your visibility</h2>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          This decides whether properties can find you, and how much of you they see before you
          agree to an introduction. Change it as often as you like: it takes effect immediately.
        </p>
        <div className="mt-5"><VisibilityControl /></div>
      </div>
      <div className="mt-8"><PrivacyPreferences /></div>
    </div>
  </DashboardShell>
}
