import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// Every form anyone can submit without an account is a door left open: to spam,
// to someone else's inbox, to a Stripe bill or an AI bill. The audit that wrote
// this found four doors with nothing on them but an in-memory count, which a
// serverless platform resets with every new container, and one Stripe route that
// had been copied, limits left behind.

test('the contact form is saved by the server, limited, honeypotted and escaped', () => {
  const route = read('src/app/api/contact-notify/route.ts')
  assert.match(route, /enforceRateLimit\(req, 'contact-notify'/)
  assert.doesNotMatch(route, /rateLimit\('contact-notify'/, 'the per-container count is not a limit')
  assert.match(route, /body\?\.company/, 'the honeypot is checked')
  assert.match(route, /createAdminClient\(\)\.from\('contact_queries'\)\.insert/)
  for (const field of ['name', 'email', 'subject', 'message']) {
    assert.match(route, new RegExp(`\\$\\{escape\\(${field}\\)\\}`), `${field} is escaped in the email`)
    assert.doesNotMatch(route, new RegExp(`>\\$\\{${field}\\}<`), `${field} goes into the email raw`)
  }
  for (const page of ['src/app/contact/page.tsx', 'src/app/academy/AcademyBrowser.tsx']) {
    assert.doesNotMatch(read(page), /from\('contact_queries'\)\.insert/, `${page} writes to the table from the browser`)
  }
})

test('registration uses the shared limit and a honeypot on every sign-up form', () => {
  const route = read('src/app/api/register/init/route.ts')
  assert.match(route, /enforceRateLimit\(req, 'register-init'/)
  assert.doesNotMatch(route, /rateLimit\('register-init'/)
  assert.match(route, /body\?\.company/)
  for (const page of ['talent', 'employer', 'buyer']) {
    const src = read(`src/app/register/${page}/page.tsx`)
    assert.match(src, /<Honeypot /, `${page} sign-up has no honeypot`)
    assert.match(src, /company: honeypot/, `${page} sign-up does not send it`)
  }
  // a field called "company" is filled by browser autofill, which would turn real employers away
  assert.doesNotMatch(read('src/components/Honeypot.tsx'), /name="company"/)
})

test('a guest checkout is limited, and adverts start only where the terms are checked', () => {
  const route = read('src/app/api/stripe/checkout/route.ts')
  const guest = route.slice(route.indexOf("type === 'course_public'"), route.indexOf('stripe.checkout.sessions.create'))
  assert.match(guest, /enforceRateLimit\(req, 'course-public-checkout'/)
  const advert = route.slice(route.indexOf("type === 'sponsored_ad'"), route.indexOf('Everything below requires a signed-in user'))
  assert.doesNotMatch(advert, /sessions\.create/, 'a second advert checkout without the terms or the limit')
})

test('every AI writing tool is limited per account', () => {
  for (const r of ['applications/ai', 'employer/applications/communication-ai', 'employer/applications/message-ai', 'employer/jobs/ai']) {
    assert.match(read(`src/app/api/${r}/route.ts`), /enforceRateLimit\([^)]*key: user\.id/, `${r} has no per-account limit`)
  }
})
