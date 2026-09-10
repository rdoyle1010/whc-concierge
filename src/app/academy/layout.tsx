import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Spa Therapist Training and CPD Courses | Talent House Academy' },
  description: 'CPD-certified online courses for spa and wellness professionals: treatment craft, guest experience, retail, standards and spa management, with a certificate on completion.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/academy' },
  openGraph: {
    title: 'Spa Therapist Training and CPD Courses | Talent House Academy',
    description: 'CPD-certified online courses for spa and wellness professionals: treatment craft, guest experience, retail, standards and spa management, with a certificate on completion.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
