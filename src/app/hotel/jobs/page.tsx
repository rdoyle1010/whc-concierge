import { redirect } from 'next/navigation'

// Retired alongside /hotel/jobs/new. This one both inserted live listings from
// the browser and offered a switch that took an advert live again afterwards.
export default function LegacyHotelJobsRedirect() {
  redirect('/employer/jobs')
}
