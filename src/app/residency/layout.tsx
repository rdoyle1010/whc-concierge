import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spa Residencies & Seasonal Placements',
  description: 'Find and list spa residency opportunities at luxury hotels and wellness retreats. From weekend wellness pop-ups to full-season placements across the UK and Europe.',
  openGraph: {
    title: 'Spa Residencies & Seasonal Placements | WHC Concierge',
    description: 'Find and list spa residency opportunities at luxury hotels and wellness retreats.',
  },
}

export default function ResidencyLayout({ children }: { children: React.ReactNode }) {
  return children
}
