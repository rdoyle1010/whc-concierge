import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'Verify a Talent House Certificate | Talent House Collective' },
  description: 'Check that a Talent House Academy certificate is genuine. Enter the verification code from the certificate to confirm the course, the holder and the date.',
  alternates: { canonical: 'https://talenthousecollective.co.uk/verify' },
  openGraph: {
    title: 'Verify a Talent House Certificate | Talent House Collective',
    description: 'Check that a Talent House Academy certificate is genuine. Enter the verification code from the certificate to confirm the course, the holder and the date.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
