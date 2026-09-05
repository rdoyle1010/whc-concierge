'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type BreakdownData = {
  roleLevel: number
  teamScale?: number
  revenueScale?: number
  treatmentSkills: number
  brands: number
  qualifications: number
  experience: number
  businessSkills: number
  systems: number
  location: number
  shiftCompatibility: number
  transport: number
  accommodation: number
  proficiencyDepth: number
  profileCompleteness: number
  reviewScore: number
  salaryFit?: number
  availability?: number
}

// What the matcher found, per factor, rather than only what it scored. A bar
// that says "Location: Partial" is a claim; "13.1 miles from the role" is the
// working. A hiring director can defend the second one to their GM.
export type MatchEvidence = Record<string, { met?: string[]; missing?: string[]; note?: string }>

const CATEGORIES: { key: keyof BreakdownData; label: string; weight: number }[] = [
  { key: 'roleLevel', label: 'Job Role & Level', weight: 40 },
  { key: 'treatmentSkills', label: 'Treatment Skills', weight: 18 },
  // Leadership appointments only. Everywhere else the matcher returns -1 for
  // these and the filter above drops the rows, so a therapist never sees two
  // empty bars about team size and revenue.
  { key: 'teamScale', label: 'Team Scale', weight: 16 },
  { key: 'revenueScale', label: 'Revenue Scale', weight: 13 },
  { key: 'proficiencyDepth', label: 'Skill Depth', weight: 2 },
  { key: 'brands', label: 'Product Houses', weight: 10 },
  { key: 'qualifications', label: 'Qualifications', weight: 12 },
  { key: 'location', label: 'Location', weight: 8 },
  { key: 'experience', label: 'Experience', weight: 10 },
  { key: 'businessSkills', label: 'Business Skills', weight: 8 },
  { key: 'systems', label: 'Systems', weight: 7 },
  { key: 'shiftCompatibility', label: 'Shift Fit', weight: 5 },
  { key: 'salaryFit', label: 'Salary Fit', weight: 6 },
  { key: 'availability', label: 'Availability', weight: 4 },
  { key: 'transport', label: 'Transport', weight: 3 },
  { key: 'accommodation', label: 'Accommodation', weight: 2 },
]

function barColour(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#1c1c1c'
  if (score >= 40) return '#D97706'
  return '#e5e5e5'
}

function barLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Strong'
  if (score >= 50) return 'Partial'
  if (score > 0) return 'Low'
  return '\u2014'
}

function hasDetail(entry?: MatchEvidence[string]) {
  if (!entry) return false
  return Boolean(entry.note) || Boolean(entry.met?.length) || Boolean(entry.missing?.length)
}

// The panel under a row. Deliberately plain: the point is that somebody can
// read it out in a meeting, not that it looks clever.
function EvidencePanel({ entry, id, dense }: { entry: MatchEvidence[string]; id: string; dense?: boolean }) {
  const chip = dense ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  return (
    <div id={id} className={`${dense ? 'ml-[88px] mt-1.5' : 'ml-[100px] mt-2'} rounded-lg border border-[#dddddd] bg-[#f1f1f1] px-3 py-2.5`}>
      {entry.note && <p className={`${dense ? 'text-[10px] leading-4' : 'text-[11px] leading-5'} text-secondary`}>{entry.note}</p>}
      {!!entry.met?.length && (
        <div className={entry.note ? 'mt-2' : ''}>
          <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#555555]">Has</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.met.map(item => (
              <span key={item} className={`${chip} rounded-full border border-emerald-200 bg-emerald-50 font-medium text-emerald-700`}>{item}</span>
            ))}
          </div>
        </div>
      )}
      {!!entry.missing?.length && (
        <div className={entry.note || entry.met?.length ? 'mt-2' : ''}>
          <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#555555]">Not evidenced</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.missing.map(item => (
              <span key={item} className={`${chip} rounded-full border border-[#dddddd] bg-white font-medium text-[#555555]`}>{item}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatchBreakdown({
  breakdown,
  evidence,
  score,
  label,
  colour,
  compact = false,
}: {
  breakdown: BreakdownData
  evidence?: MatchEvidence | null
  score: number
  label: string
  colour: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(!compact)
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({})

  const toggleRow = (key: string) => setOpenRows(rows => ({ ...rows, [key]: !rows[key] }))

  const specified = CATEGORIES.filter(cat => (breakdown[cat.key] ?? -1) >= 0)
  const notAssessedCount = CATEGORIES.length - specified.length

  // Sort categories by weighted contribution (score × weight), highest first
  const sorted = [...specified].sort((a, b) => {
    const aContrib = (breakdown[a.key] || 0) * a.weight
    const bContrib = (breakdown[b.key] || 0) * b.weight
    return bContrib - aContrib
  })

  // Top 3 strengths and weaknesses
  const strengths = sorted.filter(c => (breakdown[c.key] || 0) >= 70).slice(0, 3)
  const gaps = [...specified]
    .filter(c => (breakdown[c.key] || 0) < 60)
    .sort((a, b) => (breakdown[a.key] || 0) - (breakdown[b.key] || 0))
    .slice(0, 3)

  const detailFor = (key: string) => (evidence && hasDetail(evidence[key]) ? evidence[key] : null)
  const anyDetail = sorted.some(cat => detailFor(cat.key))

  if (compact) {
    return (
      <div className="mt-3 pt-3 border-t border-border">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-[12px] text-muted hover:text-ink w-full"
        >
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          Match breakdown
          <span className="ml-auto text-[11px] font-semibold" style={{ color: colour }}>{score}% {label}</span>
        </button>

        {open && (
          <div className="mt-3 space-y-1.5 animate-fade-in">
            {sorted.map(cat => {
              const val = breakdown[cat.key] ?? 0
              const detail = detailFor(cat.key)
              const isOpen = Boolean(openRows[cat.key])
              const panelId = `match-evidence-compact-${cat.key}`
              const row = (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-[80px] shrink-0 text-right">{cat.label}</span>
                  <div className="flex-1 h-[6px] bg-[#f1f1f1] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${val}%`, backgroundColor: barColour(val) }}
                    />
                  </div>
                  <span className="text-[10px] text-muted w-[28px] text-right">{val}%</span>
                  {detail
                    ? <ChevronDown size={11} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    : <span className="w-[11px] shrink-0" />}
                </div>
              )
              return (
                <div key={cat.key}>
                  {detail ? (
                    <button
                      type="button"
                      onClick={() => toggleRow(cat.key)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-label={`Why ${cat.label} scored ${val} per cent`}
                      className="w-full text-left"
                    >
                      {row}
                    </button>
                  ) : row}
                  {detail && isOpen && <EvidencePanel entry={detail} id={panelId} dense />}
                </div>
              )
            })}
            {anyDetail && <p className="pt-1 text-[9px] text-muted">Tap a factor to see why it scored what it did.</p>}
            {notAssessedCount > 0 && (
              <p className="text-[10px] text-muted pt-1">
                {notAssessedCount} factor{notAssessedCount === 1 ? '' : 's'} not assessed because the employer did not provide enough information.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full layout (for match page expanded view or standalone)
  return (
    <div className="space-y-4">
      {/* Score ring + summary */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#f1f1f1" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="16" fill="none" stroke={colour} strokeWidth="2.5"
              strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-ink">{score}%</span>
        </div>
        <div>
          <p className="text-[14px] font-medium text-ink">{label}</p>
          <p className="text-[12px] text-muted leading-relaxed">
            {strengths.length > 0 && `Strong on ${strengths.map(s => s.label.toLowerCase()).join(', ')}.`}
            {gaps.length > 0 && ` Gaps in ${gaps.map(g => g.label.toLowerCase()).join(', ')}.`}
          </p>
        </div>
      </div>

      {/* Category bars, each opening onto the reasoning behind it */}
      <div className="space-y-2">
        {sorted.map(cat => {
          const val = breakdown[cat.key] ?? 0
          const detail = detailFor(cat.key)
          const isOpen = Boolean(openRows[cat.key])
          const panelId = `match-evidence-${cat.key}`
          const row = (
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-muted w-[90px] shrink-0 text-right">{cat.label}</span>
              <div className="flex-1 h-[8px] bg-[#f1f1f1] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${val}%`, backgroundColor: barColour(val) }}
                />
              </div>
              <span className="text-[10px] text-muted w-[52px] text-right">{barLabel(val)}</span>
              {detail
                ? <ChevronDown size={12} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                : <span className="w-[12px] shrink-0" />}
            </div>
          )
          return (
            <div key={cat.key}>
              {detail ? (
                <button
                  type="button"
                  onClick={() => toggleRow(cat.key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`Why ${cat.label} scored ${barLabel(val)}`}
                  className="w-full rounded-lg text-left hover:bg-[#f1f1f1]/70"
                >
                  {row}
                </button>
              ) : row}
              {detail && isOpen && <EvidencePanel entry={detail} id={panelId} />}
            </div>
          )
        })}
      </div>

      {/* How much was actually judged.
          The score is the average of the factors that could be assessed,
          which is the right arithmetic and a misleading headline on its own.
          A role that asks for almost nothing leaves two or three factors
          standing, and everybody who clears those scores ninety-something.
          Saying so in the small print was not enough: the badge above it
          said "Perfect Match" and that is what a hiring manager reads. */}
      {notAssessedCount > 0 && specified.length < 5 && (
        <div className="rounded-lg border border-[#dddddd] bg-[#f1f1f1] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-[#1c1c1c]">
            This score is based on {specified.length} of {specified.length + notAssessedCount} factors.
          </p>
          <p className="mt-1 text-[10.5px] leading-4 text-[#555555]">
            The role does not state the rest, so they could not be judged either way. Add the qualifications, product houses and systems that genuinely matter to the role and the score becomes worth acting on.
          </p>
        </div>
      )}

      <p className="text-[10px] text-muted pt-1 border-t border-border">
        {anyDetail && 'Open any factor to see what it was judged on. '}
        Calculated from {specified.length} specified factor{specified.length === 1 ? '' : 's'}.
        {notAssessedCount > 0 && ` ${notAssessedCount} unassessed factor${notAssessedCount === 1 ? '' : 's'} did not affect the score.`}
      </p>
    </div>
  )
}
