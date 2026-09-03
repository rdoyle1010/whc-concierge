'use client'

import { useEffect, useRef } from 'react'

// Dialog behaviour for the overlays that already exist.
//
// There were twenty-five hand-rolled `fixed inset-0` overlays on this
// platform and not one role="dialog" or aria-modal among them. Exactly one
// had an Escape handler. None trapped focus. So a keyboard or screen-reader
// user who opened the candidate drawer, the application composer, an
// interview or offer modal, or the delete-account confirmation could not get
// back out of it: Tab walked off behind the overlay into the page underneath,
// Escape did nothing, and nothing announced that a dialog had opened at all.
//
// That is not a nicety. The delete-account confirmation is the last thing
// between a professional and the permanent loss of their profile.
//
// This is written as a hook rather than a wrapper component so it can be
// added to an existing overlay without touching its markup or its styling -
// two lines at each site, and every panel keeps the design it already has.
//
// Usage:
//
//   const dialog = useDialog(() => setOpen(null), 'delete-account-heading')
//   ...
//   <div className="fixed inset-0 ..." onClick={() => setOpen(null)}>
//     <div {...dialog.panelProps} className="...">
//       <h3 id="delete-account-heading">Delete your account?</h3>
//     </div>
//   </div>
//
// What it provides:
//   - announced as a modal dialog, labelled by its own heading
//   - Escape closes it
//   - focus moves in on open and returns to where it was on close
//   - Tab and Shift+Tab cycle inside and cannot leave
//   - the page behind cannot scroll while it is open
//   - a click inside never reaches the backdrop's close handler

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export type DialogPanelProps = {
  ref: React.RefObject<HTMLDivElement | null>
  role: 'dialog'
  'aria-modal': true
  'aria-labelledby'?: string
  'aria-label'?: string
  tabIndex: -1
  onClick: (event: React.MouseEvent) => void
}

// Dialogs stack. The admin user drawer opens a reject modal on top of itself;
// the campaign studio opens a preview on top of itself. Every open dialog
// listens on `document`, and stopPropagation does not silence a sibling
// listener on the same node, so without this one Escape press closed both
// layers at once - the person meant to dismiss the confirmation and lost the
// record they were working on behind it.
//
// A module-level stack, rather than a guard at each call site, because the
// alternative is disabling the dialog underneath, which then re-runs its
// effect when the top one closes and yanks focus to its first field instead
// of returning it to the button the person pressed.
const stack: symbol[] = []

// The page's own overflow, remembered once when the first dialog opens rather
// than by each dialog separately.
//
// Capturing it per dialog looks equivalent and is not: a second dialog opening
// on top of the first records 'hidden' as the page's normal state, and if the
// two then close in the wrong order that is what gets restored. The page stays
// locked with no dialog on screen and nothing to explain it.
let pageOverflow: string | null = null

export function useDialog(
  onClose: () => void,
  labelledBy?: string,
  options?: { label?: string; enabled?: boolean },
): { panelProps: DialogPanelProps } {
  const enabled = options?.enabled !== false
  const panelRef = useRef<HTMLDivElement | null>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)
  // Held in a ref so a caller passing an inline arrow does not re-run the
  // effect on every render and steal focus back mid-typing.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!enabled) return
    const token = Symbol('dialog')
    stack.push(token)
    const isTopmost = () => stack[stack.length - 1] === token
    returnFocusTo.current = document.activeElement as HTMLElement | null

    if (stack.length === 1) pageOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first || panel)?.focus?.()

    function onKeyDown(event: KeyboardEvent) {
      // Only the dialog on top of the stack reacts. The ones underneath stay
      // open, keep their focus trap, and take over again when it closes.
      if (!isTopmost()) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter(element => element.offsetParent !== null || element === document.activeElement)
      if (focusable.length === 0) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }
      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const index = stack.lastIndexOf(token)
      if (index !== -1) stack.splice(index, 1)
      // Only the last dialog out unlocks the page. A nested dialog closing
      // must not hand scrolling back while the drawer behind it is still up.
      if (stack.length === 0) {
        document.body.style.overflow = pageOverflow ?? ''
        pageOverflow = null
      }
      returnFocusTo.current?.focus?.()
    }
  }, [enabled])

  return {
    panelProps: {
      ref: panelRef,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': labelledBy,
      'aria-label': labelledBy ? undefined : options?.label,
      tabIndex: -1,
      onClick: (event: React.MouseEvent) => event.stopPropagation(),
    },
  }
}
