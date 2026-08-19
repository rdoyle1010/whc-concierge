'use client'

import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import TalentApplicationsWorkspace from '@/components/TalentApplicationsWorkspace'

export default function TalentApplicationsPage() {
  return (
    <DashboardShell role="talent">
      <div className="mb-5 flex justify-end">
        <Link href="/talent/hired" className="btn-secondary text-[12px]">View hired placements</Link>
      </div>
      <TalentApplicationsWorkspace />
    </DashboardShell>
  )
}
