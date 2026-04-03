import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WHC Concierge | Luxury Wellness Careers Platform',
  description: 'The specialist careers platform for luxury wellness. Connecting exceptional spa, wellness and hospitality professionals with the world\'s finest properties.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
