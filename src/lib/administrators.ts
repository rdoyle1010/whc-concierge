import { createAdminClient } from '@/lib/supabase/admin'

// Who runs this platform, in the plural.
//
// Every internal alert used to reach exactly one person. Two of them named a
// personal address in the source, and the third read the administrator list
// from the database and then took the oldest row with limit(1), so a second
// administrator could be given the full run of the platform - every CV, the
// revenue, the verification queue - and still never be told that anybody had
// signed up, that a property had asked for a managed search, or that somebody
// had used the contact form.
//
// That is not an access problem, which is why it survived an audit that
// checked access. It is a business one: a partner who has to be forwarded the
// alerts is not really a partner.
//
// Order is by created_at so the founder stays first wherever a single address
// is genuinely all that fits.

export async function administratorEmails(): Promise<string[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('profiles')
      .select('email, created_at')
      .eq('role', 'admin')
      .not('email', 'is', null)
      .order('created_at', { ascending: true })

    const seen = new Set<string>()
    const emails: string[] = []
    for (const row of data || []) {
      const email = String((row as any).email || '').trim()
      if (!email) continue
      const key = email.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      emails.push(email)
    }
    return emails
  } catch {
    // An alert that cannot find its recipients must not take down the thing it
    // was reporting on. The caller treats an empty list as "nowhere to send".
    return []
  }
}

/**
 * The founder's address, for the rare place that can only carry one.
 * Prefer administratorEmails() - a single recipient is now the exception.
 */
export async function primaryAdministratorEmail(): Promise<string> {
  return (await administratorEmails())[0] || ''
}

/**
 * Everyone an internal alert should reach.
 *
 * A configured override wins outright, because an owner who has typed a shared
 * inbox into Admin Settings has said where they want these to land. Otherwise
 * every administrator gets it.
 */
export function alertRecipients(configured: string, admins: string[]): string[] {
  const override = String(configured || '').trim()
  if (override) return [override]
  return admins
}
