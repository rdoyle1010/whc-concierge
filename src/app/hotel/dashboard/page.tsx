import { redirect } from 'next/navigation'

// The /hotel area is the original employer portal, superseded by /employer.
// Kept as redirects so old bookmarks land somewhere current instead of on a
// copy that stopped being maintained.
export default function LegacyHotelDashboardRedirect() {
  redirect('/employer/dashboard')
}
