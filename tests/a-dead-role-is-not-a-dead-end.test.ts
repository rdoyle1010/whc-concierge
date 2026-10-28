import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

function listTsx(dir: string): string[] {
  return readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap(entry => {
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) return listTsx(rel)
    return rel.endsWith('.tsx') ? [rel] : []
  })
}

// Saved Roles offered "View & Apply" on a role that had closed, with "This role
// is no longer active" printed underneath it. /jobs/[id] selects on is_live and
// calls notFound(), so the button was a guaranteed 404: the card knew the role
// was dead and sent somebody there anyway.
test('a saved role that has closed does not offer a link that 404s', () => {
  const page = read('src/app/talent/saved/page.tsx')
  assert.match(page, /\{job\.is_live \? \(/, 'the apply link must be behind is_live')
  const applyLine = page.split('\n').find(line => line.includes('View &amp; Apply') || line.includes('View & Apply'))
  assert.ok(applyLine, 'the apply link should still exist for a live role')
  assert.match(page, /Find similar roles/, 'a closed role needs somewhere to go')
  // The route it 404s from is the reason, so hold that too: if /jobs/[id] ever
  // stops filtering on is_live this rule can be relaxed deliberately.
  const role = read('src/app/jobs/[id]/page.tsx')
  assert.match(role, /\.eq\('is_live', true\)/)
  assert.match(role, /notFound\(\)/)
})

// Forest carries anything you press. The dashboard stylesheet repainted every
// primary and accent button with the ink, so the whole signed-in product sat at
// charcoal and turned forest only on hover. It survived the palette move
// because it took the neutral-to-warm translation (#1c1c1c -> #222321) instead
// of the ink-to-accent one, and no check looked at CSS.
test('no rule repaints a primary or accent button with the ink', () => {
  const css = read('src/app/globals.css')
  const INK = ['#222321', '#161814', '#1c1b1a', '#1c1c1c']
  const offenders: string[] = []
  // Each rule block: selector { declarations }
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim()
    const body = match[2]
    if (!/\.btn-(primary|accent)\b/.test(selector)) continue
    if (/:disabled/.test(selector)) continue // a disabled button is not pressed
    const background = body.match(/background(?:-color)?:\s*([^;]+)/)
    if (!background) continue
    const value = background[1].trim().toLowerCase()
    if (INK.some(ink => value.includes(ink))) {
      offenders.push(`${selector.replace(/\s+/g, ' ')} -> ${value}`)
    }
  }
  assert.deepEqual(offenders, [], 'a pressable surface must not be painted the reading colour')
})

// The CSS rule was only half of it. Thirty-five buttons and links were painted
// the ink inline, as bg-ink or bg-[#222321] in a className, where no stylesheet
// check could see them: the navbar dashboard button, the footer share and
// newsletter submits, sign-in, register, the Academy and Agency calls to
// action, and the on-state of every settings toggle.
test('no button or link is painted the reading colour in JSX', () => {
  const INK = /(?:bg-ink\b|bg-\[#(?:222321|161814|1c1b1a|1c1c1c)\](?!\/))/
  const offenders: string[] = []
  for (const file of listTsx('src')) {
    const source = read(file)
    for (const match of source.matchAll(/<(button|a|Link)\b([^>]{0,700}?)>/gs)) {
      const tag = match[0]
      if (!INK.test(tag)) continue
      // A large dark panel is a surface somebody reads, not a button face, and
      // the site paints those with the ink by design.
      if (tag.includes('p-7') && tag.includes('rounded-[24px]')) continue
      offenders.push(`${file}:${source.slice(0, match.index).split('\n').length}`)
    }
  }
  assert.deepEqual(offenders, [], 'forest carries anything you press')
})

// Saved Roles was not the only one. The applications workspace linked to the
// role from the job-description panel without checking, while working out
// thirteen lines later that the same role had closed.
test('an application to a role that has closed does not link to it', () => {
  const workspace = read('src/components/TalentApplicationsWorkspace.tsx')
  assert.match(workspace, /const roleGone=/, 'the panel must work out whether the role is gone')
  assert.match(workspace, /\{roleGone/, 'and the link must be behind it')
  assert.ok(
    !/^\s*<Link href=\{`\/jobs\/\$\{job\.id\}`\}/m.test(workspace),
    'the role link must not be rendered unconditionally',
  )
})
