import type { Metadata } from 'next'
import { doorsClosedFor } from '@/lib/platform-access'
import DoorsClosed from '@/components/DoorsClosed'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Talent House Collective account to access your dashboard, messages and job matches.',
}

// Admin sign-in lives at /admin/login and is deliberately never gated:
// closing the doors must not lock the owner out of her own platform.
// /admin-sign-in is the old address for it and now redirects there.
export default async function Layout({ children }: { children: React.ReactNode }) {
  if (await doorsClosedFor()) return <DoorsClosed audience="both" />
  return <>{children}</>
}
