import { revalidateTag } from 'next/cache'

// Why the public pages were slow, and what replaced the reason.
//
// Nearly every public page was set to `revalidate = 60`. That number is not a
// caching policy, it is an apology for not having one: nothing invalidated a
// cached page when its content changed, so the window had to be short enough
// that a new advert appeared within a minute of going live.
//
// On a busy site that is invisible, because somebody is always warming the
// cache. On this one it meant the opposite of what it looks like. With a page
// stale after sixty seconds and minutes between visitors, practically every
// visit paid for a full server render and a round trip to Supabase - and the
// person who noticed hardest was Rebecca, because she is the one reloading a
// page she has just changed.
//
// So: long windows, and an edit busts the cache immediately. A visitor gets a
// prerendered page almost every time, and a published change is live at once
// rather than up to a minute later. Both directions improve.
//
// The pattern already existed here for website content, the public pages and
// the taxonomy. It simply never reached the things that change most often.

export const PUBLIC_CACHE_TAGS = {
  /** Live roles: the listings, the homepage's featured three, and every job page. */
  jobs: 'public-jobs',
  /** Approved properties and their pages. */
  properties: 'public-properties',
  /** Published brand pages. */
  brands: 'public-brands',
  /** Published journal posts. */
  blog: 'public-blog',
  /** Reviews and the live counts the homepage prints as proof. */
  proof: 'public-proof',
} as const

export type PublicCacheTag = typeof PUBLIC_CACHE_TAGS[keyof typeof PUBLIC_CACHE_TAGS]

/**
 * Drop the cached copies of everything that shows this kind of content.
 *
 * Best-effort on purpose. A failed invalidation means a page is stale until its
 * window expires, which is a delay; a thrown error here would mean the write
 * that triggered it reports failure, which would be a lost job advert. The
 * write is what matters, so nothing in here may take it down.
 */
export function revalidatePublic(...tags: PublicCacheTag[]): void {
  for (const tag of tags) {
    try {
      // { expire: 0 }, not 'max'. This is the whole difference between a
      // takedown that works and one that does not.
      //
      // 'max' marks the tag stale and serves stale-while-revalidate: the next
      // visitor still gets the old page while a fresh one is built behind them.
      // That is right for a cache warming up and wrong for everything this
      // function is called for. A property closed a role, went to look, and the
      // advert was still on the board - because "stale" is exactly what it had
      // just asked us to stop showing.
      //
      // Expiring at zero makes the next request wait for fresh data instead.
      // That costs one visitor one render, once, after a change somebody made
      // on purpose. Taking an advert down late means applications to a role
      // that is already filled.
      //
      // updateTag() is the documented way to do this, and cannot be used here:
      // it throws outside a Server Action, and every caller of this is a route
      // handler.
      revalidateTag(tag, { expire: 0 })
    } catch {
      /* a missed drop is a stale page; a thrown one loses the write itself */
    }
  }
}
