import { redirect } from 'next/navigation'

// '/admin' is the address a person types from memory, and it was a 404.
//
// Signed out, the middleware turns it into the admin sign-in page. Signed in,
// this runs and goes straight to the dashboard, so the URL works from either
// state rather than depending on which one you happen to be in.
export default function AdminEntry() {
  redirect('/admin/dashboard')
}
