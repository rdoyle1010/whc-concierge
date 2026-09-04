// One meaning per colour, in a portal that deliberately strips some colours.
//
// The dashboard shell repaints every text-amber-* to grey and every bg-amber-50
// to near-white, on purpose: grey is the brand and a portal full of warning
// colours reads as panic. See src/app/portal-clean.css.
//
// So a status cannot be carried by amber text - it will be grey by the time
// anybody sees it. It is carried instead by a solid left border and a small
// filled pill, neither of which the shell touches, with the figure itself left
// in ink where it is easiest to read.
//
//   done    green   finished, nothing to do
//   waiting amber   in progress, somebody else's move
//   action  red     yours to do something about
//   quiet   grey    nothing here, and that is fine
export type StatusTone = 'done' | 'waiting' | 'action' | 'quiet'

// Saturated fills and borders survive the portal's neutralising rules; the
// pale tints and the amber text do not, which is why none are used here.
const TONES: Record<StatusTone, { card: string; pill: string; word: string }> = {
  done: {
    card: 'border-l-4 border-l-emerald-600',
    pill: 'bg-emerald-600 text-white',
    word: 'Paid',
  },
  waiting: {
    card: 'border-l-4 border-l-amber-500',
    pill: 'bg-amber-500 text-white',
    word: 'Waiting',
  },
  action: {
    card: 'border-l-4 border-l-red-600',
    pill: 'bg-red-600 text-white',
    word: 'Needs you',
  },
  quiet: {
    card: 'border-l-4 border-l-[#dddddd]',
    pill: '',
    word: '',
  },
}

export function toneClasses(tone: StatusTone) {
  return TONES[tone]
}

// A zero is not an achievement and not a problem. Nothing owed, nothing on
// hold and nothing paid all read as quiet, so the colour on a row is only ever
// on the figures that are real.
export function moneyTone(amount: number, whenPresent: StatusTone): StatusTone {
  return amount > 0 ? whenPresent : 'quiet'
}
