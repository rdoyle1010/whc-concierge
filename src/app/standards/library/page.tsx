import type { Metadata } from 'next'
import BuyerLibrary from '@/components/BuyerLibrary'

export const metadata: Metadata = {
  title: 'Your documents | Talent House Collective',
  description: 'The operational documents you have bought, ready to download and complete.',
  robots: { index: false, follow: false },
}

export default function StandardsLibraryPage() {
  return <BuyerLibrary />
}
