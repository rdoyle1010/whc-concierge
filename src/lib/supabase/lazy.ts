// The Supabase client, fetched when something needs it.
//
// The client is 57KB gzipped. Imported at the top of a component it lands in
// the page's first load, before anything is on screen - and almost every use of
// it on this platform happens after paint: reading a session to decide a
// button's wording, looking up a membership tier, inserting a form.
//
// The Navbar has done this by hand for a while. This is the same trick with one
// promise shared across callers, so a page that wants it in three places still
// fetches and constructs it once.

import type { createClient as createClientType } from './client'

let pending: Promise<ReturnType<typeof createClientType>> | null = null

/** The browser Supabase client, loading the library on first use. */
export function supabaseLazy(): Promise<ReturnType<typeof createClientType>> {
  if (!pending) pending = import('./client').then(module => module.createClient())
  return pending
}
