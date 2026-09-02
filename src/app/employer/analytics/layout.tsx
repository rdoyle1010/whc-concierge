import { checkEmployerPremium } from '@/lib/employer-premium'
import UpgradePanel from '@/components/UpgradePanel'

export default async function AnalyticsGate({ children }: { children: React.ReactNode }) {
  const { premium } = await checkEmployerPremium('employer_analytics')
  if (premium) return children

  return (
    <UpgradePanel
      eyebrow="Premium feature"
      heading="See what your roles are really doing"
      intro="Every role you post produces data on how it performs. Analytics turns that into the numbers you need when you are asked why a vacancy is still open."
      points={[
        'Applications, views and conversion for every role you have posted',
        'Which skills and qualifications your applicants actually hold, against what you asked for',
        'Time to first application and time to hire, role by role',
        'Where your strongest candidates are coming from',
      ]}
    />
  )
}
