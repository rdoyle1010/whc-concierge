import { NextResponse } from 'next/server'
import { getPublicPagesContent } from '@/lib/public-page-content-server'

export const revalidate = 300

export async function GET() {
  const content = await getPublicPagesContent(false)
  return NextResponse.json(
    { content },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      },
    }
  )
}
