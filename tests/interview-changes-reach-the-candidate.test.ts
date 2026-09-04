import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { briefingDetailRows, briefingDetailsHtml, describeBriefingChanges, listInWords } from '../src/lib/interview-briefing.ts'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const BRIEFING = 'src/app/api/employer/applications/interview/briefing/route.ts'
const INVITE = 'src/app/api/employer/applications/interview/route.ts'
const HUB = 'src/components/ApplicationPipelineHub.tsx'

// A changed interview nobody was told about is worse than no change at all.
// Saving new details used to drop a bell into an app the candidate might not
// open for days, reading only "details updated" - so even somebody who saw it
// could not tell whether the joining link had moved or a line of the note had
// been reworded.
test('what changed is named, not merely flagged', () => {
  const before = { meetingLink: 'https://teams.microsoft.com/l/old', contactName: 'Anna', preparationRequired: 'Bring uniform' }
  const after = { meetingLink: 'https://teams.microsoft.com/l/new', contactName: 'Anna', preparationRequired: 'Bring uniform and certificates' }
  assert.deepEqual(describeBriefingChanges(before, after), ['the joining link or number', 'what to prepare'])
  assert.equal(listInWords(describeBriefingChanges(before, after)), 'the joining link or number and what to prepare')
})

// Reopening the dialog and pressing save is not news, and a platform that
// texts people about nothing gets muted.
test('a save that changes nothing sends nothing', () => {
  const same = { meetingLink: 'https://teams.microsoft.com/l/x', venueAddress: null, contactName: '', employerNote: 'See you then' }
  assert.deepEqual(describeBriefingChanges(same, { ...same, contactName: undefined }), [], 'blank, null and undefined are the same absence')
  assert.match(read(BRIEFING), /if \(!changes\.length\) return NextResponse\.json\(\{ success: true, interview: updated, notified: false \}\)/)
})

// The assessment is two columns and one fact.
test('one change is reported once', () => {
  const changed = describeBriefingChanges(
    { assessmentType: 'Trade test', assessmentDetails: 'Swedish, 30 minutes' },
    { assessmentType: 'Presentation', assessmentDetails: 'Ten minutes on retail growth' },
  )
  assert.deepEqual(changed, ['the assessment'])
})

test('a change goes out the way the invitation did', () => {
  const route = read(BRIEFING)
  assert.match(route, /api\.resend\.com\/emails/, 'by email')
  assert.match(route, /sendSmsIfOptedIn/, 'and by text if they opted in')
  assert.match(route, /emailAllowed\(admin, candidate\.user_id, 'application_updates'\)/, 'respecting the same opt-out as every other application email')
  assert.match(route, /details changed/, 'and the subject says so')
  // The whole current briefing, so nobody holds two emails side by side to
  // work out where to go.
  assert.match(route, /briefingDetailsHtml\(\{/)
})

// A property that has to move a time had no way to do it. Their only option
// was to leave the platform, which is where a placement fee goes to die.
test('a confirmed interview can be moved', () => {
  const hub = read(HUB)
  assert.match(hub, /Change the time/)
  assert.match(hub, /openReschedule\(item\.id, interview\)/)
  assert.match(hub, /Sending this cancels that time/, 'and it says plainly what it undoes')

  const route = read(INVITE)
  assert.match(route, /const isReschedule = Boolean\(existingRound\)/, 'a round that already exists is a change, not a first invitation')
  assert.match(route, /time changed - \$\{job\.job_title\}/, 'worded as one')
  assert.match(route, /The time you confirmed no longer stands/)
})

// Somebody being asked to clear their diary a second time is owed a reason,
// and asking the browser nicely is not enforcement.
test('a reschedule cannot be sent without a reason', () => {
  assert.match(read(INVITE), /if \(isReschedule && employerNote\.length < 10\)/)
  assert.match(read(HUB), /interviewDraft\.reschedule && interviewDraft\.note\.trim\(\)\.length < 10/)
})

// The reschedule dialog asks for times and a reason. It must not silently
// erase the address and the preparation notes that were already sent.
test('rescheduling keeps the briefing already given', () => {
  const route = read(INVITE)
  for (const column of ['meeting_link', 'venue_address', 'contact_name', 'preparation_required', 'assessment_type', 'assessment_details']) {
    assert.match(route, new RegExp(`${column}: \\w+ \\?\\? existingRound\\?\\.${column} \\?\\? null`), `${column} must be carried forward`)
  }
})

// Messaging existed all along - two screens away, in a separate inbox, with
// no way to get to the right conversation.
test('either side can message the other from the interview itself', () => {
  const hub = read(HUB)
  assert.match(hub, /messages\?to=\$\{partnerId\}/)
  assert.match(hub, /Message \{person\}/)
  // Which needs the other person's id to survive the API hop.
  assert.match(read('src/app/api/employer/applications/pipeline/route.ts'), /select\('id,user_id,full_name,headline'\)/)
  assert.match(read('src/app/api/talent/applications/pipeline-list/route.ts'), /select\('id,user_id,company_name,property_name'\)/)
})

// Both emails come from one place, so the second cannot quietly stop showing
// what the first showed.
test('the invitation and the change email are built by the same code', () => {
  for (const route of [BRIEFING, INVITE]) {
    assert.match(read(route), /from '@\/lib\/interview-briefing'/, `${route} must use the shared briefing`)
  }
  assert.ok(!/function escapeHtml/.test(read(INVITE)), 'and keep no private copy of the escaping')

  // The rows themselves still behave.
  const rows = briefingDetailRows({ interviewMethod: 'in_person', venueAddress: 'Staff entrance\nRear yard', contactName: 'Anna & Co' })
  assert.match(rows[0], /Rear yard/)
  assert.match(rows[0], /<br>/, 'an address typed over two lines keeps both')
  assert.match(rows[1], /Anna &amp; Co/, 'and anything a property types is escaped')
  assert.equal(briefingDetailsHtml({}), '', 'nothing to say means no empty table')
})
