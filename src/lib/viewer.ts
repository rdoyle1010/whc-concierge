'use client'

import type { User } from '@supabase/supabase-js'
import { supabaseLazy } from '@/lib/supabase/lazy'

// supabase.auth.getUser() is not a local read. It sends the token to Supabase
// to be validated, so every call is a network round trip.
//
// The dashboard shell called it three times on mount, the settings pages three
// more, and several of the widgets on those pages one each - eight round trips
// to answer the same question, in sequence, before anything the visitor came
// for appeared. That is a large part of why the platform feels slow to someone
// who is signed in.
//
// One in-flight promise, shared. Cleared whenever the session actually changes,
// so signing out or refreshing a token is never served from a stale answer.
//
// The client itself is fetched on first use rather than imported at the top.
// This module is reached from the dashboard shell, so a static import put 57KB
// gzipped of auth and database client into the first load of every page using
// that shell - including /agency, which is public and where most visitors are
// signed out and the answer is "nobody".

let pending: Promise<User | null> | null = null
let listening = false

function listen() {
  if (listening) return
  listening = true
  // Any change of session invalidates the answer: a sign-out must not leave
  // the previous user cached behind it.
  void supabaseLazy().then(supabase => supabase.auth.onAuthStateChange(() => { pending = null }))
}

export function getViewer(): Promise<User | null> {
  listen()
  if (!pending) {
    pending = supabaseLazy()
      .then(supabase => supabase.auth.getUser())
      .then(({ data }) => data.user ?? null)
      // A failed lookup must not be cached as "signed out" forever.
      .catch(() => { pending = null; return null })
  }
  return pending
}

/** Forget the cached viewer. For flows that change the session themselves. */
export function forgetViewer() { pending = null }
