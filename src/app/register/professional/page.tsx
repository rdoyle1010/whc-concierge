import { redirect } from 'next/navigation'

// Legacy URL kept alive for old inbound links and bookmarks -
// professionals register at /register/talent.
export default function RegisterProfessionalRedirect() {
  redirect('/register/talent')
}
