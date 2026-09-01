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
    returnFocusTo.current = document.activeElement as HTMLElement | null

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first || panel)?.focus?.()

    function onKeyDown(event: KeyboardEvent) {
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
      document.body.style.overflow = previousOverflow
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
