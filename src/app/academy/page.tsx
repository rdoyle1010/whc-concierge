import AcademyBrowser from './AcademyBrowser'
import { getAcademySummaries } from '@/lib/academy-catalog-server'

// The course cards, built on the server.
//
// The page was a client component that imported the whole ACADEMY constant to
// seed its list, then fetched /api/academy/catalog to replace it. The constant
// put 109KB gzipped of lesson text into the browser bundle and the fetch pulled
// 305KB more, all to draw cards showing a title, a tagline, minutes, a price
// and a number of modules.
//
// The summaries are computed here instead. Nothing changes on screen, the cards
// are still in the served HTML for a crawler, and the paid teaching material
// stops being handed to anyone who opens the network tab.
export const revalidate = 3600

export default async function PublicAcademyPage() {
  return <AcademyBrowser initialCourses={await getAcademySummaries()} />
}
