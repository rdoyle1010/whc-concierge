import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During build time, return a dummy client that won't be used.
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  // Reuse one browser client for the lifetime of the page. Creating many auth
  // clients against the same storage/cookie key can cause competing auth locks
  // and leave sign-in requests sitting indefinitely on "Signing in...".
  if (!browserClient) browserClient = createBrowserClient(url, key)
  return browserClient
}
