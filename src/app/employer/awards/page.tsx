import DashboardShell from '@/components/DashboardShell'
import ProfileAwardsEditor from '@/components/ProfileAwardsEditor'

export default function EmployerAwardsPage() {
  return <DashboardShell role="employer"><div className="max-w-3xl"><div className="mb-6"><p className="dashboard-eyebrow">Property profile</p><h1 className="dashboard-title">Awards & recognition</h1><p className="dashboard-intro">Add genuine spa, hotel and employer awards so prospective professionals can see the recognition behind your property.</p></div><ProfileAwardsEditor kind="employer" /></div></DashboardShell>
}
