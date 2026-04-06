import { Suspense } from 'react'

export default function PostRoleLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>
}
