import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { PLAN_KIND_LABEL } from '../src/lib/documents/plan-types'

// The check constraint that was two kinds behind the code.
//
// operational_documents.kind is checked against a list in Postgres, and that
// list was widened by hand each time a new kind of document was written. It
// was last widened for the pool plans and never learnt about the two guides
// that ship free with the pool safety pack, so every import of that pack
// failed at the first guide. The action stops on the first write error, so
// the operating procedure and the emergency plan went in and the guides did
// not, and the shop reported "2 of 4 in that pack are signed off" as though
// the work were merely unfinished.
//
// A list maintained in two places drifts. This is the check that notices.

/** The kind list as the database currently enforces it. */
function kindsInDatabase(): string[] {
  const dir = 'supabase/migrations'
  const files = readdirSync(dir).filter(name => name.endsWith('.sql')).sort()
  let latest = ''
  for (const file of files) {
    const sql = readFileSync(`${dir}/${file}`, 'utf8')
    // The last migration that sets the constraint is the one in force.
    const match = /add constraint operational_documents_kind_check\s*check \(kind in \(([\s\S]*?)\)\)/.exec(sql)
    if (match) latest = match[1]
  }
  assert.ok(latest, 'no migration sets the kind constraint')
  return latest.split(',').map(part => part.trim().replace(/^'|'$/g, '')).filter(Boolean)
}

test('the database accepts every kind of document the code can write', () => {
  const allowed = new Set(kindsInDatabase())

  // Every plan kind, plus the two the plan machinery does not cover: a
  // drafted procedure, and the job descriptions the original register held.
  const codeKinds = [...Object.keys(PLAN_KIND_LABEL), 'sop', 'job-description']

  const missing = codeKinds.filter(kind => !allowed.has(kind))
  assert.deepEqual(missing, [],
    `the code writes these and the database would refuse them: ${missing.join(', ')}`)
})

test('the constraint does not allow a kind nothing writes', () => {
  // The other direction matters less but catches a typo in a migration, which
  // is a constraint that silently permits 'risk-assesment' forever.
  const codeKinds = new Set([...Object.keys(PLAN_KIND_LABEL), 'sop', 'job-description'])
  const stray = kindsInDatabase().filter(kind => !codeKinds.has(kind))
  assert.deepEqual(stray, [], `the database allows kinds nothing writes: ${stray.join(', ')}`)
})
