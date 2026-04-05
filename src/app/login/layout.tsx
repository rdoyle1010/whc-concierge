import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your WHC Concierge account to access your dashboard, messages and job matches.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
