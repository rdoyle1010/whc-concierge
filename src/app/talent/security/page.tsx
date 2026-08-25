'use client'

import DashboardShell from '@/components/DashboardShell'
import AuthenticatorSecurity from '@/components/AuthenticatorSecurity'

export default function TalentSecurityPage() {
  return <DashboardShell role="talent">
    <div className="max-w-3xl">
      <p className="dashboard-eyebrow">Account security</p>
      <h1 className="dashboard-title">Sign-in security</h1>
      <p className="dashboard-intro mb-7">Add an authenticator app to protect your profile, documents, Agency earnings and Residency activity even if somebody learns your password.</p>
      <AuthenticatorSecurity />
    </div>
  </DashboardShell>
}
