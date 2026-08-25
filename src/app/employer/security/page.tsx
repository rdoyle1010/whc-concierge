'use client'

import DashboardShell from '@/components/DashboardShell'
import AuthenticatorSecurity from '@/components/AuthenticatorSecurity'

export default function EmployerSecurityPage() {
  return <DashboardShell role="employer">
    <div className="max-w-3xl">
      <p className="dashboard-eyebrow">Account security</p>
      <h1 className="dashboard-title">Sign-in security</h1>
      <p className="dashboard-intro mb-7">Protect candidate data, Agency payments, Residency bookings and property information with an authenticator app.</p>
      <AuthenticatorSecurity />
    </div>
  </DashboardShell>
}
