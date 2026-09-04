// Everything a candidate needs in order to turn up, in one place.
//
// The invitation email and the "details changed" email have to say the same
// thing in the same shape - a candidate reading the second one should not have
// to dig out the first. Two copies of this markup would drift, and the one
// that drifts is the one nobody is watching.

export type InterviewBriefing = {
  interviewMethod?: string | null
  meetingLink?: string | null
  venueAddress?: string | null
  contactName?: string | null
  preparationRequired?: string | null
  assessmentType?: string | null
  assessmentDetails?: string | null
  employerNote?: string | null
}

export function escapeHtml(value: string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

const clean = (value?: string | null) => String(value ?? '').trim()

// What a property changed, named the way a person would say it. Used for the
// notification and the email subject, so somebody reading a phone screen at a
// bus stop knows whether this affects where they are going.
const CHANGE_LABELS: [keyof InterviewBriefing, string][] = [
  ['interviewMethod', 'the interview format'],
  ['meetingLink', 'the joining link or number'],
  ['venueAddress', 'the address'],
  ['contactName', 'who they will meet'],
  ['preparationRequired', 'what to prepare'],
  ['assessmentType', 'the assessment'],
  ['assessmentDetails', 'the assessment'],
  ['employerNote', 'the note from the property'],
]

export function describeBriefingChanges(before: InterviewBriefing, after: InterviewBriefing): string[] {
  const changed: string[] = []
  for (const [field, label] of CHANGE_LABELS) {
    if (clean(before[field]) === clean(after[field])) continue
    // assessmentType and assessmentDetails are one thing to a candidate.
    if (!changed.includes(label)) changed.push(label)
  }
  return changed
}

// "The joining link and what to prepare" reads better than a bulleted list of
// two items, and fits in a notification line.
export function listInWords(items: string[]): string {
  if (items.length <= 1) return items[0] || ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function briefingDetailRows(briefing: InterviewBriefing): string[] {
  const rows: string[] = []
  const cell = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#555555;">${label}</td><td style="padding:6px 0;">${value}</td></tr>`

  const venueAddress = clean(briefing.venueAddress)
  const meetingLink = clean(briefing.meetingLink)
  if (briefing.interviewMethod === 'in_person' && venueAddress) {
    rows.push(cell('Where', escapeHtml(venueAddress).replace(/\n/g, '<br>')))
  } else if (meetingLink) {
    const label = briefing.interviewMethod === 'phone' ? 'Number' : 'Joining link'
    // A link is made clickable; a phone number is not a URL and must not be
    // dressed up as one.
    const value = /^https?:\/\//i.test(meetingLink)
      ? `<a href="${escapeHtml(meetingLink)}" style="color:#1c1c1c;">${escapeHtml(meetingLink)}</a>`
      : escapeHtml(meetingLink)
    rows.push(`<tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#555555;">${label}</td><td style="padding:6px 0;word-break:break-all;">${value}</td></tr>`)
  }

  const contactName = clean(briefing.contactName)
  if (contactName) rows.push(cell('You will meet', escapeHtml(contactName)))

  const preparationRequired = clean(briefing.preparationRequired)
  if (preparationRequired) rows.push(cell('To prepare', escapeHtml(preparationRequired).replace(/\n/g, '<br>')))

  const assessment = [clean(briefing.assessmentType), clean(briefing.assessmentDetails)].filter(Boolean).join(' - ')
  if (assessment) rows.push(cell('Assessment', escapeHtml(assessment)))

  return rows
}

export function briefingDetailsHtml(briefing: InterviewBriefing): string {
  const rows = briefingDetailRows(briefing)
  if (!rows.length) return ''
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;font-size:14px;line-height:1.6;">${rows.join('')}</table>`
}

// The frame both emails sit in, so an invitation and a change look like they
// came from the same platform.
export function briefingEmailHtml(options: {
  eyebrow: string
  heading: string
  intro: string
  bodyHtml?: string
  detailsHtml?: string
  ctaLabel: string
  ctaHref: string
}) {
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;"><div style="max-width:560px;margin:32px auto;background:#ffffff;border:1px solid #e5e5e5;"><div style="background:#1c1c1c;padding:24px 32px;"><p style="margin:0 0 6px;color:#ffffff;opacity:.8;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(options.eyebrow)}</p><h1 style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:23px;font-weight:600;">Talent House Collective</h1></div><div style="padding:28px 32px;"><h2 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:19px;">${escapeHtml(options.heading)}</h2><p>${options.intro}</p>${options.bodyHtml || ''}${options.detailsHtml || ''}<p><a href="${escapeHtml(options.ctaHref)}" style="display:inline-block;background:#1c1c1c;color:#ffffff;text-decoration:none;padding:12px 18px;">${escapeHtml(options.ctaLabel)}</a></p></div></div></body></html>`
}
