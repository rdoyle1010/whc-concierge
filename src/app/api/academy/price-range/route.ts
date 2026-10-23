import { NextResponse } from 'next/server'
import { getAcademyCatalog } from '@/lib/academy-catalog-server'

// The cheapest and dearest course, and nothing else.
//
// /pricing needed two numbers and was fetching the whole catalogue to get
// them: 305KB of course bodies, uncompressed, downloaded by every visitor to
// the pricing page so that a single line could read "£10-£15". That is the
// heaviest asset on the site arriving on a page that does not show a course.
export const revalidate = 300

export async function GET() {
  try {
    const courses = await getAcademyCatalog(false)
    const prices = (courses || [])
      .map((course: any) => Number(course?.price))
      .filter((price: number) => Number.isFinite(price) && price > 0)
    if (!prices.length) return NextResponse.json({ low: null, high: null })
    return NextResponse.json({ low: Math.min(...prices), high: Math.max(...prices) })
  } catch {
    // The page falls back to "See the Academy", which is a worse line but not
    // a broken one.
    return NextResponse.json({ low: null, high: null })
  }
}
