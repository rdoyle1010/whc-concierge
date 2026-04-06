import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wellness Industry Insights & Career Advice',
  description: 'Expert articles on luxury spa careers, wellness industry trends, interview tips, and professional development for spa and hospitality professionals.',
  openGraph: {
    title: 'Wellness Industry Insights & Career Advice | WHC Blog',
    description: 'Expert articles on luxury spa careers, wellness industry trends, and professional development.',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
