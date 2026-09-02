import { checkEmployerPremium } from '@/lib/employer-premium'
import UpgradePanel from '@/components/UpgradePanel'

// Server-side gate. A check inside the page itself would still hand the
// markup to a free account and rely on the browser to hide it; refusing to
// render children is the only version a URL cannot walk past.

export default async function TalentSearchGate({ children }: { children: React.ReactNode }) {
  const { premium } = await checkEmployerPremium('employer_talent_search')
  if (premium) return children

  return (
    <UpgradePanel
      eyebrow="Premium feature"
      heading="Search the whole talent pool"
      intro="Free accounts receive applications to the roles they post. Talent Search works the other way round: you find the person first, before they are on the market."
      points={[
        'Search every approved professional by skill, product house, qualification, location and availability',
        'See verification status, insurance and right to work before you make contact',
        'Approach candidates privately, without posting a role publicly',
        'Shortlist and track people across your whole team',
      ]}
    />
  )
}
