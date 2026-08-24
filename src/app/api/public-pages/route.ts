import { NextResponse } from 'next/server'
import { getPublicPagesContent } from '@/lib/public-page-content-server'

export const revalidate = 300

export async function GET() {
  const content = await getPublicPagesContent(false)
  return NextResponse.json({ content })
}
