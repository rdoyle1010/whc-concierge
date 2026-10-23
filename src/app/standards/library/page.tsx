import type { Metadata } from 'next'
import BuyerLibrary from '@/components/BuyerLibrary'

export const metadata: Metadata = {
  // The root layout appends "| Talent House Collective" to any plain title
  // string. Spelling the brand out here printed it twice in every search result.
  title: 'Your Documents',
  description: 'The operational documents you have bought, ready to download and complete.',
  robots: { index: false, follow: false },
}

export default function StandardsLibraryPage() {
  return <BuyerLibrary />
}
