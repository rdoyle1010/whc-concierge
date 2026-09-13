import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
const body = (file: string) =>
  read(file)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const fulfilment = body('src/lib/stripe-checkout-fulfilment.ts')

// Stripe delivers a webhook more than once as a matter of course. Every
// handler here has to survive that, and surviving means the money is recorded
// once AND the person is written to once. The first buyer of an Academy
// course was told it was ready twice, five seconds apart, which reads as a
// platform that has lost track of her order.
test('a repeated webhook does not send a second course email', () => {
  const block = fulfilment.slice(fulfilment.indexOf("from('course_enrollments').upsert"))

  // The rows are asked for, because an ignored duplicate returns none and
  // that is the only way to tell a first enrolment from a repeat.
  assert.match(block.slice(0, 700), /ignoreDuplicates: true \}\s*\)\s*\.select\('id'\)/)
  assert.match(block, /const alreadyEnrolled = !enrolled \|\| enrolled\.length === 0/)
  // And the email is behind that check.
  assert.ok(
    block.indexOf('alreadyEnrolled') < block.indexOf('sendCourseAccessEmail'),
    'the email must be gated by whether this enrolment is new',
  )
  assert.match(block, /if \(!alreadyEnrolled\)/)
})

// The money is still recorded exactly once, which it always was. Nothing here
// may weaken that to fix the email.
test('the enrolment itself is still written once and only once', () => {
  assert.match(fulfilment, /onConflict: 'candidate_id,course_slug', ignoreDuplicates: true/)
  // A failure to record the enrolment is still a failure, not a shrug: she
  // has paid.
  assert.match(fulfilment, /could not record the enrolment: /)
})

// A repeat is normal, not an error, and the log should say which it was.
test('a repeat is noted rather than passed over in silence', () => {
  assert.match(fulfilment, /repeat webhook for/)
})
