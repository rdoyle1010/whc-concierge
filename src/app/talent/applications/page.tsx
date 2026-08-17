'use client'

import DashboardShell from '@/components/DashboardShell'
import TalentApplicationsWorkspace from '@/components/TalentApplicationsWorkspace'

export default function TalentApplicationsPage() {
  return (
    <DashboardShell role="talent">
      <TalentApplicationsWorkspace />
    </DashboardShell>
  )
}
