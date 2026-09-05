// The two facts on a leadership profile that are actually facts.
//
// A Director of Spa profile carries "largest team managed: 84" and "revenue
// responsibility: £6.5m annual spa revenue". A Director of Spa advert carries
// the team the person will lead and, in prose, what they will own
// commercially. Both sides were displayed on the applications page and
// neither counted for anything in the score, so the platform showed a hiring
// manager the single most relevant number on the page and then ranked as if
// it had never been written down.
//
// This turns the two into scored factors. The discipline throughout is that a
// figure we cannot read confidently is not a figure: the caller gets -1 and
// the matcher drops the factor, which its confidence arithmetic already
// handles properly. A wrong number here is worse than no number, because a
// wrong one is invisible.

/** A team size that was actually stated. Zero and null both mean "not said". */
export function statedTeamSize(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  // Nobody has managed forty thousand therapists. A number this size is a
  // typo or a revenue figure in the wrong box.
  if (n > 5000) return null
  return Math.round(n)
}

// Words that make a number money, and words that make it plainly not.
const MONEY_WORDS = /(revenue|turnover|budget|p&l|p and l|profit|sales|spend|income|takings|billing|gross|ebitda|target)/i
const NOT_MONEY_AFTER = /^\s*(members?|membership|rooms?|treatments?|staff|people|team|therapists?|guests?|beds?|covers?|sq\s?ft|square|hours?|years?|months?|days?|%|per cent|percent)/i

const MULTIPLIER: Record<string, number> = {
  k: 1e3, thousand: 1e3,
  m: 1e6, mn: 1e6, million: 1e6,
  bn: 1e9, billion: 1e9,
}

// £1.2m · £850k · £450,000 · 6.5 million · 2m
const FIGURE = /(£)?\s?(\d[\d,]*(?:\.\d+)?)\s?(bn|billion|million|mn|m|k|thousand)?\b/gi

/**
 * The largest money figure in a piece of text, or null.
 *
 * Only counts a number as money when it carries a pound sign or sits near a
 * word about money, and never when the thing being counted is named straight
 * after it. That is what keeps "a membership of 40k" and "a team of 12" out
 * of a revenue comparison.
 */
export function parseMoney(value: unknown): number | null {
  const text = String(value ?? '')
  if (!text.trim()) return null

  let best: number | null = null
  FIGURE.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = FIGURE.exec(text)) !== null) {
    const [whole, pound, digits, suffix] = match
    const after = text.slice(match.index + whole.length)
    if (NOT_MONEY_AFTER.test(after)) continue

    // Confidence that this is money at all: a pound sign, or a money word
    // close enough to be describing this number.
    const near = text.slice(Math.max(0, match.index - 30), match.index + whole.length + 30)
    if (!pound && !MONEY_WORDS.test(near)) continue

    const base = Number(digits.replace(/,/g, ''))
    if (!Number.isFinite(base) || base <= 0) continue

    const amount = base * (suffix ? MULTIPLIER[suffix.toLowerCase()] ?? 1 : 1)
    // A bare year reads as a plausible amount and is never a revenue figure.
    if (!suffix && !/,/.test(digits) && amount >= 1900 && amount <= 2100) continue
    // Annual commercial responsibility below a thousand pounds is not a fact
    // anybody meant to state.
    if (amount < 1000) continue
    if (amount > 1e11) continue

    if (best === null || amount > best) best = amount
  }

  return best
}

export type ScaleVerdict = { score: number; note: string; has: number | null; needs: number | null; label: string | null }

/** Shared shape for both comparisons: has it been done at this scale before? */
function scaleScore(has: number, needs: number): number {
  if (has >= needs) return 100
  const ratio = has / needs
  if (ratio >= 0.6) return 85
  if (ratio >= 0.3) return 62
  return 35
}

function tidyMoney(amount: number): string {
  if (amount >= 1e6) return `£${(amount / 1e6).toFixed(amount % 1e6 === 0 ? 0 : 1)}m`
  if (amount >= 1e3) return `£${Math.round(amount / 1e3)}k`
  return `£${Math.round(amount)}`
}

/**
 * Team scale. Not assessable unless both sides stated a number, and never a
 * penalty for silence: the profile page promises that leaving the leadership
 * questions blank never counts against anybody, and that promise is kept here.
 */
export function teamScaleVerdict(candidate: any, job: any): ScaleVerdict {
  const has = statedTeamSize(candidate?.team_size_managed)
  const needs = statedTeamSize(job?.team_size)

  if (needs === null) return { score: -1, note: 'The role does not say how big the team is.', has, needs, label: null }
  if (has === null) return { score: -1, note: 'They have not said what size team they have managed.', has, needs, label: null }

  // Well beyond the role's scale is a fact the employer should see, not a
  // mark against the candidate. The matcher advises, it does not decide who
  // is too senior to want a job.
  if (has >= needs * 3 && needs > 0) {
    return { score: 100, note: `They have led ${has}, well beyond the ${needs} this role leads.`, has, needs, label: `having led a team of ${has}` }
  }

  const score = scaleScore(has, needs)
  const note = has >= needs
    ? `They have led ${has}; this role leads ${needs}.`
    : `They have led ${has}; this role leads ${needs}, so it is a step up.`
  return { score, note, has, needs, label: `having led a team of ${has}` }
}

/**
 * Revenue scale. The candidate states theirs in a free-text box and the role
 * states its own inside a paragraph, so both are parsed and the factor drops
 * out entirely whenever either side cannot be read with confidence.
 */
export function revenueScaleVerdict(candidate: any, job: any): ScaleVerdict {
  const has = parseMoney(candidate?.revenue_responsibility)
    ?? parseMoney(candidate?.commercial_experience)
  const needs = parseMoney(job?.commercial_responsibility)

  if (needs === null) return { score: -1, note: 'The role does not put a figure on what this person owns.', has, needs, label: null }
  if (has === null) return { score: -1, note: 'They have not put a figure on revenue they have owned.', has, needs, label: null }

  if (has >= needs * 3) {
    return { score: 100, note: `They have owned ${tidyMoney(has)}, well beyond the ${tidyMoney(needs)} on this role.`, has, needs, label: `having owned ${tidyMoney(has)}` }
  }

  const score = scaleScore(has, needs)
  const note = has >= needs
    ? `They have owned ${tidyMoney(has)}; this role owns ${tidyMoney(needs)}.`
    : `They have owned ${tidyMoney(has)}; this role owns ${tidyMoney(needs)}, so it is a step up.`
  return { score, note, has, needs, label: `having owned ${tidyMoney(has)}` }
}

/**
 * The ceiling a scale shortfall puts on a leadership score.
 *
 * Weighting alone cannot express this. A Director by title who has led four
 * people and owned £280k, applying to run a team of sixty on a £5m book,
 * scores 100 on level, 100 on experience and 100 on qualifications, and no
 * defensible weight on the two scale factors pulls the average below the
 * high seventies. Averaging cannot say "no, but" - it can only say "mostly
 * yes". So this works the way the role-level policy already does in the
 * matcher: a structural mismatch caps the number rather than nudging it.
 *
 * Title inflation is the reason this is worth doing at all. "Director of Spa"
 * at a four-room day spa and "Director of Spa" at a sixty-strong resort are
 * the same words and different jobs, and the scale figures are the only thing
 * on the profile that tells them apart.
 *
 * Silence never caps anything. A ceiling only ever applies where both sides
 * put a number on the table.
 */
export function scaleCeiling(...verdicts: ScaleVerdict[]): number | null {
  let ceiling: number | null = null

  for (const verdict of verdicts) {
    if (verdict.score < 0 || verdict.has === null || verdict.needs === null || verdict.needs <= 0) continue
    const ratio = verdict.has / verdict.needs
    // At half the scale or better it is a step up, which is a normal thing to
    // hire and is already priced into the score.
    if (ratio >= 0.5) continue
    const cap = ratio >= 0.25 ? 74 : 58
    ceiling = ceiling === null ? cap : Math.min(ceiling, cap)
  }

  return ceiling
}
