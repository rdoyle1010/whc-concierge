import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'How Talent House Works | For Professionals and Properties' },
  description: 'One platform for spa careers and recruitment: roles, agency shifts, residency, consultancy and CPD training, and how each side uses it.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/how-to-use' },
  openGraph: {
    title: 'How Talent House Works | For Professionals and Properties',
    description: 'One platform for spa careers and recruitment: roles, agency shifts, residency, consultancy and CPD training, and how each side uses it.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
