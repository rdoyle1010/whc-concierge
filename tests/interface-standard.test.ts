import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync, existsSync, globSync } from 'node:fs'
import { join } from 'node:path'

const APP = new URL('../src/app/', import.meta.url).pathname
const COMPONENTS = new URL('../src/components/', import.meta.url).pathname

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) files.push(full)
  }
  return files
}

const sources = [...walk(APP), ...walk(COMPONENTS)].map(path => ({ path, text: readFileSync(path, 'utf8') }))

function contrast(foreground: string, background: string) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = (hex: string) => {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// The muted grey carried real information at 10 to 13 pixels across the whole
// platform, at 3.09:1 against white. Legible is not a matter of taste.
test('the muted text colour is legible against white', () => {
  const config = readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8')
  const match = /muted:\s*'(#[0-9a-fA-F]{6})'/.exec(config)
  assert.ok(match, 'the muted token must be defined')
  assert.ok(
    contrast(match![1], '#ffffff') >= 4.5,
    `muted ${match![1]} is ${contrast(match![1], '#ffffff').toFixed(2)}:1 against white, below the 4.5:1 minimum`,
  )
})

test('the secondary text colour is legible against white', () => {
  const config = readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8')
  const match = /secondary:\s*'(#[0-9a-fA-F]{6})'/.exec(config)
  if (!match) return
  assert.ok(contrast(match[1], '#ffffff') >= 4.5, `secondary ${match[1]} is too pale against white`)
})

// #555555 on the brand charcoal is 1.9:1. It was carrying primary calls to
// action and section eyebrows on four public pages.
test('the secondary grey is never used as a fill or a label on charcoal', () => {
  const offenders = sources.filter(file =>
    /bg-\[#555555\][^"'`]*text-\[#1c1c1c\]/.test(file.text)
    || /text-\[#555555\][^"'`]*(?=.*bg-\[#1c1c1c\])/.test(''),
  )
  assert.equal(offenders.length, 0, `unreadable grey-on-charcoal in: ${offenders.map(f => f.path).join(', ')}`)
})

// Tailwind silently drops a spacing value it does not recognise, so the
// element renders with no padding at all rather than failing loudly.
test('no invalid Tailwind spacing values', () => {
  const invalid = /\b(?:sm:|md:|lg:|xl:)?p[xytrbl]?-(?:1[3579]|2[1235679]|3[13579])\b/
  const offenders = sources.filter(file => invalid.test(file.text))
  assert.equal(offenders.length, 0, `invalid spacing utility in: ${offenders.map(f => f.path).join(', ')}`)
})

// The platform's own CSS collapses rounded corners and sets box-shadow to
// none, so a page card asking for both renders as a hard square with a soft
// shadow sitting under it - visibly unresolved. Floating overlays (menus,
// modals, the notification bell) are a different case and keep their
// elevation; this rule is about cards laid out in the page.
test('the public marketing pages carry no card drop shadows', () => {
  const pages = ['pricing/page.tsx', 'academy/page.tsx', 'agency/about/page.tsx', 'testimonials/page.tsx', 'jobs/page.tsx']
  for (const path of pages) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(!/\bshadow-(?:lg|xl|2xl)\b/.test(text), `${path} lays out a card with a drop shadow`)
  }
})

// Invented testimonials with a disclaimer underneath tell a prospective
// customer exactly one thing.
test('no fabricated testimonials are published', () => {
  const page = readFileSync(join(APP, 'testimonials/page.tsx'), 'utf8')
  assert.ok(!/Composite testimonials/i.test(page), 'the composite testimonials must not return')
  assert.ok(!/Illustrative examples/i.test(page), 'the illustrative-examples disclaimer must not return')
  assert.ok(/from\('reviews'\)/.test(page), 'the page must read real reviews')
})

// A reviewer's legal name, permanently attached on the open web to their
// opinion of a named former employer, with no consent anywhere.
test('reviewers are published by role, never by name', () => {
  for (const path of ['page.tsx', 'properties/[id]/page.tsx', 'api/properties/[id]/reviews/route.ts']) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(
      !/reviewer(?:_n|N)ame:\s*reviewer\?\.full_name/.test(text),
      `${path} must not publish the reviewer's name`,
    )
  }
})

// Hotlinking a stock photograph of a stranger as the brand panel of the
// sign-in screen, with the URL visible in view-source.
test('the sign-in funnel carries no third-party stock photography', () => {
  for (const path of ['login/page.tsx', 'forgot-password/page.tsx', 'reset-password/page.tsx']) {
    const text = readFileSync(join(APP, path), 'utf8')
    assert.ok(!/pexels\.com/.test(text), `${path} must not hotlink stock photography`)
  }
})

// The talent dashboard opened with a dark promotional banner, then the
// activity centre, and only then said "Good afternoon" - a greeting
// halfway down the page. The shell renders its own blocks before children,
// so the greeting needs the intro slot to sit where a greeting belongs.
test('the dashboard shell renders its intro before anything else', () => {
  const shell = readFileSync(new URL('../src/components/DashboardShell.tsx', import.meta.url), 'utf8')
  const intro = shell.indexOf('{intro?')
  const activity = shell.indexOf('<DashboardActivityCentre')
  const children = shell.lastIndexOf('{children}')
  assert.ok(intro > -1, 'the shell must accept an intro slot')
  assert.ok(intro < activity, 'the intro must render above the activity centre')
  assert.ok(activity < children, 'the activity centre must still render above the page body')
})

test('the talent dashboard greets the reader through that slot', () => {
  const page = readFileSync(new URL('../src/app/talent/dashboard/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /intro=\{<>/, 'the greeting must be passed as the shell intro')
  assert.match(page, /timeOfDayGreeting\(\)/)
})

// Rebecca's brief was "wherever there is black like this" - the wide charcoal
// bands that broke up the public pages. The sweep that removed them was scoped
// to each <section>, which left three kinds of wreckage worth locking down.

const PUBLIC_PAGES = [
  'page.tsx', 'about/page.tsx', 'academy/page.tsx', 'advertise/page.tsx',
  'advertising-terms/page.tsx', 'agency/about/page.tsx', 'coming-soon/page.tsx',
  'jobs/[id]/page.tsx', 'match/page.tsx', 'pricing/page.tsx', 'privacy/page.tsx',
  'residency/page.tsx', 'blog/[slug]/page.tsx',
]

test('no public page opens on a full-width charcoal band', () => {
  for (const path of PUBLIC_PAGES) {
    const text = readFileSync(join(APP, path), 'utf8')
    const band = text.match(/<section[^>]*\bbg-(?:ink|\[#1c1c1c\]|\[#1c1b1a\])\b/)
    assert.ok(!band, `${path} still carries a charcoal <section>: ${band?.[0]}`)
  }
})

// Inverting a white button on a dark band left the old label colour behind, so
// the text matched the button it sat on. Two colours in one class list is
// always a mistake, whichever of them the cascade happens to pick.
test('no element sets two conflicting text colours', () => {
  for (const path of PUBLIC_PAGES) {
    const text = readFileSync(join(APP, path), 'utf8')
    for (const [, classes] of text.matchAll(/className="([^"]*)"/g)) {
      const light = /(?:^|\s)text-white(?:\s|$)/.test(classes)
      const dark = /(?:^|\s)text-(?:ink|\[#1c1c1c\])(?:\s|$)/.test(classes)
      assert.ok(!(light && dark), `${path} sets both a light and a dark text colour: ${classes}`)
    }
  }
})

// globals.css sets h1-h4 colour as a base element rule, and an element rule
// beats an inherited value however the parent set it. So a heading on a dark
// card that says nothing about colour renders charcoal on charcoal - which is
// exactly how "Featured Talent" and "Employer Group" disappeared.
test('the heading rule that makes dark-card headings vanish is still an element rule', () => {
  const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /h1, h2, h3, h4 \{\s*\n\s*color: var\(--site-ink/, 'if this rule changes, re-check every heading on a dark surface')
})

test('headings on charcoal cards name their own colour', () => {
  const cases: [string, string][] = [
    ['pricing/page.tsx', 'Featured Talent'],
    ['pricing/page.tsx', 'Employer Group'],
    ['academy/page.tsx', 'What do you want to be better at next?'],
  ]
  for (const [path, heading] of cases) {
    const text = readFileSync(join(APP, path), 'utf8')
    const tag = new RegExp(`<h[1-4]([^>]*)>${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`)
    const match = text.match(tag)
    assert.ok(match, `${path} no longer contains the heading "${heading}"`)
    assert.match(match![1], /text-white/, `"${heading}" must set its own colour or it renders charcoal on charcoal`)
  }
})

// The demo card is declared above the section that renders it, so a sweep
// scoped to that section slides straight past it. This is the second time a
// component outside the band it lives in has been left behind.
test('the agency demo card matches the band it renders in', () => {
  const text = readFileSync(join(APP, 'agency/about/page.tsx'), 'utf8')
  const card = text.slice(text.indexOf('function ProfessionalDemoCard'), text.indexOf('export default'))
  assert.ok(!/text-white|bg-white\/|border-white\//.test(card), 'the card sits on a light band and must be styled for one')
})

// The wide bands where the copy fills half the width and the rest is dead
// space are the most valuable empty space on the site. Each one is now a
// picture box or a backdrop that Rebecca fills from Admin -> Pictures, and can
// sell. The rule that matters: an empty slot must change nothing.
test('a picture box draws nothing until something is put in it', () => {
  const picture = readFileSync(new URL('../src/components/PanelPicture.tsx', import.meta.url), 'utf8')
  assert.match(picture, /if \(!picture\) return null/, 'an empty slot must not render an empty box')
  assert.ok(
    !/panel\.mode === 'brand'/.test(picture),
    "a picture is the switch - gating it behind a mode is how uploads appeared to do nothing",
  )
})

test('every panel slot reaches both the Pictures screen and the Website editor', () => {
  // DEFAULT_PANELS moved to site-content-values.ts so the browser can read it
  // without pulling zod in behind it. The rule is unchanged.
  const content = readFileSync(new URL('../src/lib/site-content-values.ts', import.meta.url), 'utf8')
  const block = content.slice(content.indexOf('const DEFAULT_PANELS'), content.indexOf('export const DEFAULT_WEBSITE_CONTENT'))
  const keys = [...block.matchAll(/^\s{2}(\w+):/gm)].map(match => match[1])
  assert.ok(keys.length >= 5, `expected the panel slots, found ${keys.join(', ')}`)

  const images = readFileSync(new URL('../src/app/admin/images/page.tsx', import.meta.url), 'utf8')
  const website = readFileSync(new URL('../src/app/admin/website/page.tsx', import.meta.url), 'utf8')
  for (const key of keys) {
    assert.ok(images.includes(`panels.${key}.image.url`), `${key} is missing from Admin -> Pictures`)
    assert.ok(website.includes(`'${key}' as const`), `${key} is missing from the Website editor`)
  }
})

// Content saved before a panel existed still has to parse, or adding a slot
// logs every administrator out of their own settings.
test('new panels default rather than making stored content invalid', () => {
  const content = readFileSync(new URL('../src/lib/site-content.ts', import.meta.url), 'utf8')
  for (const key of ['intelligenceHero', 'intelligenceJournal', 'agencyProfessional']) {
    const rule = new RegExp(`${key}: panelSchema\\.default\\(`)
    assert.match(content, rule, `${key} must carry a default for content saved before it existed`)
  }
})

// A property saved their company profile and the confirmation came back in
// red, because the banner picked its colour by searching the message for the
// words "success" or "updated". "Profile saved." and "Photo added." contain
// neither, so the two most common successes on the page both read as failures.
// Wording is not a status code.
test('save banners are told the outcome, never asked to guess it', () => {
  const files = [
    'src/app/employer/profile/page.tsx',
    'src/components/ProfileAwardsEditor.tsx',
  ]
  for (const file of files) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    const sniff = text.match(/\.includes\(['"](?:success|updated|saved|error|failed)['"]\)/i)
    assert.ok(!sniff, `${file} decides a banner's meaning from its wording: ${sniff?.[0]}`)
    assert.match(text, /kind: 'success'/, `${file} must carry the outcome alongside the text`)
  }
})

// The Company Profile save drops a column the database does not have and
// carries on, so a schema that has drifted loses the property's answer while
// telling them nothing useful. Two things keep that honest: it must be a
// bounded net rather than an eleven-round-trip guessing game, and whatever it
// drops must be named in the words the form used.
test('the profile save recovery stays a bounded net', () => {
  const page = readFileSync(new URL('../src/app/employer/profile/page.tsx', import.meta.url), 'utf8')
  const bound = page.match(/for \(let i = 0; i < (\d+) && finalError/)
  assert.ok(bound, 'the recovery loop must have an explicit bound')
  assert.ok(Number(bound[1]) <= 3, `retrying ${bound[1]} times is a slow failure, not a recovery`)
  assert.ok(
    !/no field is ever silently dropped/.test(page),
    'the comment must not claim the opposite of what the code does',
  )
})

test('every column the profile saves has a label a property would recognise', () => {
  const page = readFileSync(new URL('../src/app/employer/profile/page.tsx', import.meta.url), 'utf8')
  const payload = page.slice(page.indexOf('const payload: Record<string, any> = {'))
  const columns = [...payload.slice(0, payload.indexOf('\n    }\n')).matchAll(/^\s{8}(\w+):/gm)].map(m => m[1])
  assert.ok(columns.length > 30, `expected the full payload, found ${columns.length} columns`)
  const labels = page.slice(page.indexOf('const FIELD_LABELS'), page.indexOf('const fieldLabel'))
  for (const column of columns) {
    assert.ok(labels.includes(`${column}:`), `${column} would be reported to a property by its database name`)
  }
})

// contact_email lived in the production database by hand and in no migration,
// so every environment but production dropped it on save: the property typed
// where applications should go, was told it saved, and the value vanished.
test('every column the profile saves is created by a migration', () => {
  const page = readFileSync(new URL('../src/app/employer/profile/page.tsx', import.meta.url), 'utf8')
  const payload = page.slice(page.indexOf('const payload: Record<string, any> = {'))
  const columns = [...payload.slice(0, payload.indexOf('\n    }\n')).matchAll(/^\s{8}(\w+):/gm)].map(m => m[1])

  const dir = new URL('../supabase/migrations/', import.meta.url)
  const sql = readdirSync(dir).filter(f => f.endsWith('.sql'))
    .map(f => readFileSync(new URL(f, dir), 'utf8').toLowerCase()).join('\n')

  const declared = new Set<string>()
  for (const block of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?employer_profiles\s+([\s\S]*?);/g)) {
    for (const col of block[1].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?["']?(\w+)/g)) declared.add(col[1])
  }
  for (const block of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?employer_profiles\s*\(([\s\S]*?)\n\)/g)) {
    for (const line of block[1].split('\n')) {
      const col = line.match(/^\s*["']?(\w+)\s+\w/)
      if (col && !['constraint', 'primary', 'unique', 'foreign', 'check'].includes(col[1])) declared.add(col[1])
    }
  }

  const missing = columns.filter(column => !declared.has(column.toLowerCase()))
  assert.deepEqual(missing, [], `these columns are saved but no migration creates them: ${missing.join(', ')}`)
})

// Uploading a replacement logo to a fixed path with upsert returns the same
// public URL, writes the same string to the database, and leaves the browser
// serving the cached image - so the property uploads a new logo and nothing
// appears to happen. This session has now been caught by that shape of bug
// three times.
test('a replacement logo lands on a new URL', () => {
  const page = readFileSync(new URL('../src/app/employer/profile/page.tsx', import.meta.url), 'utf8')
  const path = page.match(/formData\.append\('path', `logos\/[^`]+`\)/)
  assert.ok(path, 'the logo upload path must be findable')
  assert.match(path[0], /Date\.now\(\)/, 'a fixed path returns a cached image after every re-upload')
})

test('a logo is fitted, not cropped', () => {
  const page = readFileSync(new URL('../src/app/employer/profile/page.tsx', import.meta.url), 'utf8')
  // Attribute order is not the contract; the tag carrying logo_url is.
  const img = page.match(/<img [^>]*profile\.logo_url[^>]*>/)
  assert.ok(img, 'the logo preview must be findable')
  assert.match(img[0], /object-contain/, 'object-cover crops the middle out of a wide lockup')
})

// The sidebar nav was sized by subtracting a guessed 156px for the block above
// it and the sign-out bar below. The block is taller than that, so the list ran
// under the sign-out bar and its last item - Settings - could not be reached at
// all, on any screen. A flex column measures itself; an arithmetic guess about
// two other elements is wrong the moment either of them changes.
test('the dashboard sidebar measures itself rather than guessing', () => {
  const shell = readFileSync(new URL('../src/components/DashboardShell.tsx', import.meta.url), 'utf8')
  // The early-return branch above renders its own <main id="main-content">, so
  // slicing to the first one runs backwards and yields nothing.
  const start = shell.indexOf('dashboard-sidebar')
  const aside = shell.slice(start, shell.indexOf('<main id="main-content"', start))

  assert.ok(!/h-\[calc\(100vh-\d+px\)\]/.test(aside), 'a hardcoded height guesses at elements it cannot see')
  assert.match(aside, /dashboard-sidebar[^`]*flex[^`]*flex-col/, 'the sidebar must be a column')
  assert.match(aside, /min-h-0 flex-1 overflow-y-auto/, 'without min-h-0 a flex child never scrolls')
  assert.ok(
    !/absolute bottom-0 left-0 right-0 px-4 py-4 bg-\[#f1f1f1\]/.test(aside),
    'an absolutely positioned sign-out bar sits on top of the last nav item',
  )
})

// Settings is the last item in the talent nav, which is exactly why it was the
// one that disappeared.
test('every talent nav entry points at a page that exists', () => {
  const shell = readFileSync(new URL('../src/components/DashboardShell.tsx', import.meta.url), 'utf8')
  const hrefs = [...shell.matchAll(/href: '(\/talent\/[a-z-]+)'/g)].map(m => m[1])
  assert.ok(hrefs.includes('/talent/settings'), 'Settings must be reachable from the nav')
  for (const href of new Set(hrefs)) {
    assert.ok(
      existsSync(new URL(`../src/app${href}/page.tsx`, import.meta.url)),
      `${href} is in the nav but has no page`,
    )
  }
})

// Nothing on this platform resized an uploaded picture. A property
// photographs its spa on a phone, uploads eight megapixels, and every visitor
// on 4G downloads the lot to fill a box a few hundred pixels wide. On a real
// 5472x3648 photograph that is 5.99MB where 0.71MB looks identical.
test('uploaded pictures are resized before they are stored', () => {
  const route = readFileSync(new URL('../src/app/api/upload/route.ts', import.meta.url), 'utf8')
  assert.match(route, /await shrinkImage\(original/, 'the resized buffer is what must be stored')

  // One implementation, shared with the tool that reprocesses storage. Two
  // copies would drift, and pictures uploaded today would stop matching
  // pictures fixed yesterday.
  const shrink = readFileSync(new URL('../src/lib/image-resize.ts', import.meta.url), 'utf8')
  assert.match(shrink, /MAX_IMAGE_WIDTH = 2400/)
  // An optimisation that loses someone's upload is worse than no optimisation.
  assert.match(shrink, /catch \{[\s\S]*return buffer/, 'a picture sharp cannot read must still be stored')
  assert.match(shrink, /rotate\(\)/, 'a phone photo carries its orientation in EXIF')
  assert.match(shrink, /out\.length < buffer\.length \? out : buffer/, 'never store something larger than we were given')

  for (const user of ['src/app/api/upload/route.ts', 'src/app/api/admin/optimise-images/route.ts']) {
    assert.match(readFileSync(new URL(`../${user}`, import.meta.url), 'utf8'), /from '@\/lib\/image-resize'/, `${user} must share it`)
  }
})

// A script needs a terminal, a checkout and the service role key on somebody's
// own machine. Rebecca works from a browser, so the tool lives where the key
// already is.
test('reprocessing stored pictures is admin-only and survives a timeout', () => {
  const route = readFileSync(new URL('../src/app/api/admin/optimise-images/route.ts', import.meta.url), 'utf8')
  assert.match(route, /adminRequestUser/, 'this rewrites production storage')
  assert.match(route, /Unauthorised/)
  // A bucket can hold hundreds of photographs and a serverless function has a
  // hard timeout, so asking for all of them at once loses the lot. Counting
  // images is the wrong unit: checking one downloads it, applying downloads,
  // re-encodes and uploads it, so the same batch can be three times the work -
  // which is how the check ran to the end while the apply died a dozen in.
  assert.match(route, /TIME_BUDGET_MS/, 'a batch must be bounded by time, not by count')
  assert.match(route, /Date\.now\(\) - startedAt > TIME_BUDGET_MS/)
  assert.match(route, /handled > 0 &&/, 'one slow picture must not stall the run forever')
  assert.match(route, /cursor/, 'the caller must be able to resume')

  // Work already done must survive a failed batch.
  const page = readFileSync(new URL('../src/app/admin/images/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /attempt < 3/, 'a failed batch should be retried before giving up')
  assert.match(page, /carry on from here/, 'and the run must be resumable rather than lost')
  // Evidence must not be re-encoded.
  assert.ok(!/talent-documents|message-attachments/.test(route.slice(route.indexOf('const BUCKETS'), route.indexOf('const IMAGE_EXT'))))
  // Nothing is written unless it was asked for.
  assert.match(route, /const apply = body\.apply === true/)
})

// A 5.99MB photograph sat in the repo and shipped on every deploy.
test('no oversized images are committed to public/', () => {
  const dir = new URL('../public/images/', import.meta.url)
  const heavy = readdirSync(dir)
    .map(name => ({ name, bytes: statSync(new URL(name, dir)).size }))
    .filter(file => file.bytes > 1_200_000)
  assert.deepEqual(heavy, [], `resize these before committing: ${heavy.map(f => `${f.name} ${(f.bytes / 1024 / 1024).toFixed(2)}MB`).join(', ')}`)
})

// supabase.auth.getUser() sends the token to Supabase to be validated, so
// every call is a network round trip rather than a local read. The dashboard
// shell asked three times on mount, the settings pages three more, and several
// widgets on those pages once each - eight round trips to answer one question,
// in sequence, before anything the visitor came for appeared.
test('the signed-in viewer is read once and shared', () => {
  const shell = readFileSync(new URL('../src/components/DashboardShell.tsx', import.meta.url), 'utf8')
  assert.ok(!/auth\.getUser\(\)/.test(shell), 'the shell renders on every dashboard page and must not re-ask')
  assert.match(shell, /getViewer\(\)/)
  // A sign-out that leaves the previous user cached is worse than a slow page.
  assert.match(shell, /forgetViewer\(\)/)

  const viewer = readFileSync(new URL('../src/lib/viewer.ts', import.meta.url), 'utf8')
  assert.match(viewer, /onAuthStateChange/, 'a changed session must invalidate the cached answer')
  assert.match(viewer, /catch\(\(\) => \{ pending = null/, 'a failed lookup must not cache as signed out forever')
})

// Seven round trips in a row, where the last four asked nothing of each other.
test('the employer dashboard does not wait on queries that are independent', () => {
  const page = readFileSync(new URL('../src/app/employer/dashboard/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /await Promise\.all\(\[/, 'independent counts must be fetched together')
  const load = page.slice(page.indexOf('async function load'), page.indexOf('load()\n'))
  const awaits = (load.match(/await supabase\./g) || []).length
  assert.ok(awaits <= 3, `${awaits} sequential queries still wait on each other`)
})

// Images are the bulk of what this site sends down the wire. Three rules, and
// the third is the one that is easy to get backwards.
test('images decode off the main thread and lists wait to be scrolled to', () => {
  const files = [...globSync('src/**/*.tsx')].map(path => ({ path, text: readFileSync(path, 'utf8') }))
  const tags = files.flatMap(f => (f.text.match(/<img [^>]*>/g) || []).map(tag => ({ path: f.path, tag })))
  assert.ok(tags.length > 50, `expected the app's images, found ${tags.length}`)

  const undecoded = tags.filter(t => !/decoding=/.test(t.tag))
  assert.ok(undecoded.length <= 12, `${undecoded.length} images still block the main thread while they decode`)

  // Deferring the page's largest paint is the one place lazy loading costs
  // more than it saves.
  const lazyHeroes = tags.filter(t => /loading="lazy"/.test(t.tag) && /hero\.image\.url/.test(t.tag))
  assert.deepEqual(lazyHeroes.map(t => t.path), [], 'a hero image must not be lazy')
})

// select('*') on a list pulls every long-text column for every row, none of
// which the dashboard renders.
test('the employer dashboard asks for the columns it draws', () => {
  const page = readFileSync(new URL('../src/app/employer/dashboard/page.tsx', import.meta.url), 'utf8')
  const jobs = page.slice(page.indexOf("from('job_listings')"), page.indexOf('.eq(\'employer_id\''))
  assert.ok(!/select\('\*'\)/.test(jobs), 'job_listings must not be fetched whole')
  assert.match(jobs, /job_title/)
  assert.ok(!/job_description/.test(jobs), 'the dashboard lists titles, not descriptions')
})

// Three times now a flag beside a picture has decided the picture does not
// count: the panel backdrops, the sign-in panel, and the academy cards, where
// image_admin_set is hardcoded false for every course defined in code - so a
// stock picture outranked the one an administrator had uploaded and the upload
// appeared to do nothing. The presence of the picture is the decision.
test('an uploaded picture is never outranked by a flag beside it', () => {
  const academy = readFileSync(new URL('../src/app/academy/page.tsx', import.meta.url), 'utf8')
  const chooser = academy.slice(academy.indexOf('const displayCourseImage'), academy.indexOf('const purchaseButton'))
  assert.ok(!/image_admin_set/.test(chooser), 'the upload must not be gated behind a flag')
  assert.match(chooser, /course\.image_url \|\|/, 'the uploaded image comes first')

  const backdrop = readFileSync(new URL('../src/components/PanelBackdrop.tsx', import.meta.url), 'utf8')
  assert.ok(!/mode === 'brand'/.test(backdrop), 'same rule, same reason')
})

// zod validates content on the server. It has no business in a browser, and it
// arrived there because the schemas and the default values lived in the same
// file: SiteBrandProvider wanted a logo url, use-site-content wanted the
// defaults, Footer wanted some fallback wording - and each of them dragged the
// whole validator along. It was 268KB on every page of the site.
//
// The values live in the *-values modules now, which import nothing at
// runtime. A value import from a schema module in anything the browser loads
// puts zod straight back.
test('the browser never imports a schema module for a value', () => {
  const clientFiles = [...globSync('src/components/**/*.tsx'), ...globSync('src/lib/use-*.ts')]
    .map(path => ({ path, text: readFileSync(path, 'utf8') }))
    .filter(f => f.text.includes("'use client'") || f.path.includes('/use-'))

  const schemaModules = ['@/lib/site-content', '@/lib/public-page-content']
  const offenders: string[] = []
  for (const file of clientFiles) {
    for (const module of schemaModules) {
      // `import type { X } from` is erased; `import { X } from` is not.
      const valueImport = new RegExp(`import \\{[^}]*\\} from '${module}'`)
      const match = file.text.match(valueImport)
      if (!match) continue
      const specifiers = match[0].slice(match[0].indexOf('{') + 1, match[0].indexOf('}'))
      // Every specifier being type-only is fine; one that is not is a value.
      if (specifiers.split(',').some(s => s.trim() && !s.trim().startsWith('type '))) {
        offenders.push(`${file.path}: ${match[0]}`)
      }
    }
  }
  assert.deepEqual(offenders, [], 'these put zod back into every page')
})
