'use client'

import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import TalentApplicationsWorkspace from '@/components/TalentApplicationsWorkspace'
import TalentPendingInterviewActions from '@/components/TalentPendingInterviewActions'

export default function TalentApplicationsPage() {
  return (
    <DashboardShell role="talent">
      <TalentPendingInterviewActions />
      <div className="mb-5 flex justify-end">
        <Link href="/talent/hired" className="btn-secondary text-[12px]">View hired placements</Link>
      </div>
      <TalentApplicationsWorkspace />
    </DashboardShell>
  )
}
