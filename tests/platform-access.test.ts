import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// Before launch the shop window stays lit and the doors stay shut. The gate
// has to sit in a layout: a page that renders and then hides itself has
// already shipped the sign-in form to the browser.

test('sign-in and registration are gated in a layout, not in the page', () => {
  for (const gate of ['src/app/login/layout.tsx', 'src/app/register/layout.tsx']) {
    const source = read(gate)
    assert.match(source, /doorsClosedFor/, `${gate} must check the platform access state`)
    assert.match(source, /DoorsClosed/, `${gate} must show the waiting list rather than the form`)
  }
})

test('admin sign-in is never gated', () => {
  // Closing the doors must not lock the owner out of her own platform. The
  // page is only one link in that chain: a layout beside it, the auth route
  // behind it, the admin area it lands in, or the middleware in front of all
  // three would each shut the door just as firmly.
  assert.doesNotMatch(read('src/app/admin-sign-in/page.tsx'), /doorsClosedFor/)
  for (const link of [
    'src/app/api/auth/login/route.ts',
    'src/app/admin/layout.tsx',
    'src/proxy.ts',
  ]) {
    assert.doesNotMatch(read(link), /doorsClosedFor/, `${link} would lock the owner out`)
  }
  assert.equal(
    existsSync(new URL('../src/app/admin-sign-in/layout.tsx', import.meta.url)),
    false,
    'a layout here would gate admin sign-in the same way it gates /login',
  )
})

// A property or professional already signed in keeps working while the doors
// are shut. Only new sign-ins and registrations are held back, so closing up
// for a launch does not throw out the accounts that already exist.
test('closing the doors holds the front door, not the people already inside', () => {
  for (const area of ['src/app/talent/layout.tsx', 'src/app/employer/layout.tsx']) {
    if (!existsSync(new URL(`../${area}`, import.meta.url))) continue
    assert.doesNotMatch(read(area), /doorsClosedFor/, `${area} must not evict existing accounts`)
  }
})

test('the closed panel captures the email rather than sending people away', () => {
  const panel = read('src/components/DoorsClosed.tsx')
  assert.match(panel, /api\/newsletter\/subscribe/, 'it must join the same double opt-in list')
  assert.match(panel, /Join the list/)
})

test('access fails open, and the preview cannot be an open redirect', () => {
  const lib = read('src/lib/platform-access.ts')
  // A database wobble must not close the platform to everyone.
  assert.match(lib, /closed: false, previewCode: ''/, 'a failed read must leave the doors open')
  const route = read('src/app/api/preview/route.ts')
  assert.match(route, /startsWith\('\/'\) && !nextPath\.startsWith\('\/\/'\)/, 'the return path must stay on this site')
  assert.match(route, /supplied !== previewCode/, 'a wrong code must not set the cookie')
})

// platform_config.value is a json column, and the migration file that says
// otherwise is out of date. A value set by hand in the SQL editor therefore
// arrives as the JSON string "closed" while the admin form writes it parsed.
test('the access flag is read the same whichever route set it', async () => {
  const { readConfigString } = await import('../src/lib/platform-access')
  assert.equal(readConfigString('closed'), 'closed')
  assert.equal(readConfigString('"closed"'), 'closed')
  assert.equal(readConfigString('  "closed"  '), 'closed')
  assert.equal(readConfigString(null), '')
  assert.equal(readConfigString(undefined), '')
})

// Rebecca typed "closed" into Admin -> Settings, saved, refreshed, and the
// sign-in form was still there - so she reported the switch did nothing. It
// worked; it was just behind a 30 second cache that the save never cleared,
// and on Netlify each server instance holds its own copy, so the doors
// appeared to open and shut at random between refreshes.
test('saving the access setting clears the cache in front of it', () => {
  const route = readFileSync(new URL('../src/app/api/admin/content/route.ts', import.meta.url), 'utf8')
  const handler = route.slice(route.indexOf("action === 'config_upsert'"))
  const body = handler.slice(0, handler.indexOf('\n    }'))
  assert.match(body, /revalidateTag\('platform-access'/, 'a change to the doors must take effect on the next request')
  assert.match(route, /ACCESS_KEYS = new Set\(\['platform_access', 'platform_preview_code'\]\)/)
})

// The middleware bounces an unauthenticated visitor out of a portal to /login
// carrying the role they were heading for, so the panel can address the person
// who actually arrived. A hotel director who typed /employer/dashboard should
// not be read talent copy.
test('the closed panel speaks to whoever the middleware sent it', () => {
  const panel = read('src/components/DoorsClosed.tsx')
  assert.match(panel, /params\.get\('role'\)/, 'the role on the URL must reach the copy')
  for (const audience of ['talent', 'employer', 'both']) {
    assert.match(panel, new RegExp(`${audience}: \\{`), `${audience} needs its own wording`)
  }
  // Staff bounced out of the admin area have no use for a waiting list.
  assert.match(panel, /admin-sign-in/, 'someone sent here from /admin needs the staff route')
})

test('the panel sells rather than apologises', () => {
  const panel = read('src/components/DoorsClosed.tsx')
  // Anyone who reaches this page went looking for an account. The page has to
  // ask for something.
  assert.match(panel, /Join the list|Request early access/)
  assert.match(panel, /api\/newsletter\/subscribe/, 'it must join the same double opt-in list')
})

// The launch runs on the list, so the site asks for the list first: a
// coming-soon sign-up in front of whatever page the visitor landed on, again
// on the next page, until they join.
test('the arrival gate is decided on the server', () => {
  const lib = read('src/lib/platform-access.ts')
  assert.match(lib, /export async function showEntryGate/)
  const layout = read('src/app/layout.tsx')
  assert.match(layout, /await showEntryGate\(\)/, 'deciding this on the client shows the page first and the gate after')
  assert.match(layout, /\{gate && <ComingSoonGate/)
})

test('joining the list is the way through, and it is remembered', () => {
  const gate = read('src/components/ComingSoonGate.tsx')
  assert.match(gate, /thc_joined=1/, 'a visitor who joined must not meet the gate again')
  assert.match(gate, /api\/newsletter\/subscribe/)
  // Rebecca has to keep working while the doors are shut.
  assert.match(gate, /const SKIP = \['\/admin', '\/admin-sign-in'\]/)
  const lib = read('src/lib/platform-access.ts')
  assert.match(lib, /JOINED_COOKIE/)
  assert.match(lib, /PREVIEW_COOKIE/, 'the preview code must still walk a demo straight past')
})

// Double opt-in means the signup is not finished when the form posts. A gate
// that simply vanishes leaves the confirmation email arriving unexplained.
test('the gate says there is a confirmation email coming', () => {
  const gate = read('src/components/ComingSoonGate.tsx')
  assert.match(gate, /confirm/i, 'the visitor must be told to confirm')
})
