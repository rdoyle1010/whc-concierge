import type { Metadata } from 'next'

export const metadata: Metadata = {
  // The root layout appends "| Talent House Collective" to any plain title
  // string. Spelling the brand out here printed it twice in every search result.
  title: 'Create Your Account',
  description: 'Four fields, then your spa documents are kept in your account for good.',
}

export default function BuyerRegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
