import { redirect } from 'next/navigation'

// One admin door, not two.
//
// This was a near-identical copy of /admin/login: the same form, the same
// imports, the same submit. They differed in one line, and it was the line
// that mattered. /admin/login gained a "Forgotten your password?" link
// carrying ?role=admin, because an administrator who had forgotten hers was
// otherwise sent to /forgot-password, which returned her to /login, which is
// built to refuse admin accounts. A closed loop, and the reason an
// administrator once concluded her account was broken.
//
// That fix went into one of the two copies. This one - the copy the footer
// links to, which is the only one a person ever finds by looking - kept the
// dead end. A page maintained in two places drifts, and it drifted on the
// half that recovery depended on.
//
// Kept as a redirect rather than deleted, so an old bookmark lands on the
// working door instead of a 404. /admin/login is inside the '/admin' prefix
// that robots already disallows, so the sign-in screen also stops being a
// statically prerendered page any crawler can index.
export default function LegacyAdminSignInRedirect() {
  redirect('/admin/login')
}
