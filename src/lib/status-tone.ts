// One meaning per colour, across every screen that shows money or state.
//
// The Agency money tiles all rendered as quiet grey cards with a coloured
// number, so four very different situations - paid, waiting on us, waiting on
// the property, and an open dispute - looked identical at a glance. Somebody
// scanning that row could not tell which one needed them.
//
//   done    green   finished, nothing to do
//   waiting amber   in progress, somebody else's move
//   action  red     yours to do something about
//   quiet   grey    nothing here, and that is fine
export type StatusTone = 'done' | 'waiting' | 'action' | 'quiet'

const TONES: Record<StatusTone, { card: string; value: string; label: string }> = {
  done: {
    card: 'border-l-4 border-l-emerald-600 bg-emerald-50/40',
    value: 'text-emerald-700',
    label: 'text-emerald-800',
  },
  waiting: {
    card: 'border-l-4 border-l-amber-500 bg-amber-50/40',
    value: 'text-amber-700',
    label: 'text-amber-800',
  },
  action: {
    card: 'border-l-4 border-l-red-600 bg-red-50/40',
    value: 'text-red-700',
    label: 'text-red-800',
  },
  quiet: {
    card: 'border-l-4 border-l-[#dddddd]',
    value: 'text-secondary',
    label: 'text-muted',
  },
}

export function toneClasses(tone: StatusTone) {
  return TONES[tone]
}

// A zero is not an achievement and not a problem. Nothing owed, nothing on
// hold and nothing paid all read as quiet, so the colour on the row is only
// ever on the figures that are real.
export function moneyTone(amount: number, whenPresent: StatusTone): StatusTone {
  return amount > 0 ? whenPresent : 'quiet'
}
