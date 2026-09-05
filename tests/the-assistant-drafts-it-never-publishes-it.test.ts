import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

const ROUTE = 'src/app/api/employer/jobs/ai/route.ts'
const COMPONENT = 'src/components/JobCopyAssistant.tsx'

test('the assistant writes to a form, never to a listing', () => {
  // A property whose advert says something they did not mean is a problem
  // that surfaces at interview, in front of the person they were trying to
  // impress. So nothing generated here touches the database.
  const route = body(ROUTE)
  assert.doesNotMatch(route, /\.update\(|\.insert\(|\.upsert\(/,
    'the assistant route must not write to the database at all')

  const component = body(COMPONENT)
  assert.match(component, /Use this/, 'a suggestion must be accepted explicitly')
  assert.match(component, /Keep mine/, 'and must be refusable')
})

test('it can only be used by the property that owns the role', () => {
  const route = body(ROUTE)
  assert.match(route, /getRequestUser\(req\)/)
  assert.match(route, /from\('employer_profiles'\)/, 'the caller must be a property')
  assert.match(route, /\.eq\('employer_id', employer\.id\)/,
    'a saved role must belong to the caller before its details are read')
})

test('it is told it may not invent anything', () => {
  const route = body(ROUTE)
  assert.match(route, /Do not invent facts/)
  assert.match(route, /Do not promise salary, benefits, progression or team size/)
  assert.match(route, /British English/)
  assert.match(route, /Never use an em dash/)

  // An empty answer is a valid answer. A model that fills every box with
  // something plausible is worse than one that leaves gaps.
  assert.match(route, /An empty string is the right answer/)
  const component = body(COMPONENT)
  assert.match(component, /not enough in those notes to say anything true/,
    'the screen must handle the model correctly declining to answer')
})

test('only prose fields can be rewritten', () => {
  // reporting_line, team_size and membership_size are facts. Asking a model
  // to improve a number invites it to change one.
  const route = body(ROUTE)
  const polishable = /const POLISHABLE = new Set<string>\(\[([\s\S]*?)\]\)/.exec(route)
  assert.ok(polishable, 'the allowed field list must exist')
  for (const fact of ['team_size', 'membership_size', 'salary_min', 'reporting_line']) {
    assert.ok(!polishable[1].includes(`'${fact}'`), `${fact} is a fact and must not be rewritable`)
  }
})
