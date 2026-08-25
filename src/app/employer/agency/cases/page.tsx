'use client'

import DashboardShell from '@/components/DashboardShell'
import AgencyResolutionCentre from '@/components/AgencyResolutionCentre'

export default function EmployerAgencyCasesPage() {
  return <DashboardShell role="employer">
    <div className="mb-7"><p className="dashboard-eyebrow">Flexible staffing</p><h1 className="dashboard-title">Shift Resolution</h1><p className="dashboard-intro">Raise or respond to issues about confirmed Agency shifts, including no-shows, early departure, changed hours, commission, expenses and payment adjustments.</p></div>
    <AgencyResolutionCentre role="employer" />
  </DashboardShell>
}
