import DashboardShell from '@/components/DashboardShell'
import ProfileAwardsEditor from '@/components/ProfileAwardsEditor'

export default function TalentAwardsPage() {
  return <DashboardShell role="talent"><div className="max-w-3xl"><div className="mb-6"><p className="dashboard-eyebrow">Career profile</p><h1 className="dashboard-title">Awards & recognition</h1><p className="dashboard-intro">Add genuine professional awards so approved employers can see the recognition behind your experience.</p></div><ProfileAwardsEditor kind="talent" /></div></DashboardShell>
}
