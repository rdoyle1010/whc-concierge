import { redirect } from 'next/navigation'

// Retired. This was the original job-posting wizard, and it inserted a listing
// straight from the browser with is_live: true - no checkout, no Stripe, no
// record of a purchase. Nothing has linked to it for a long time, but the URL
// still worked, and a signed-in employer who reached it posted a live advert
// for nothing. Adverts are paid for at /employer/post-role.
export default function LegacyHotelJobsNewRedirect() {
  redirect('/employer/post-role')
}
