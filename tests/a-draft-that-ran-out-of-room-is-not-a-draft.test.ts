import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildWriteRequest, WRITE_FIELDS } from '../src/lib/ai-write'

// "Director of Spa | Authored Mandarin Oriental & Fairmont S"
//
// That reached a real profile, under a heading that said A DRAFT, FOR YOU TO
// READ. It was not a bad headline, it was half a headline: the model stopped
// mid word because it had run out of budget, and the code returned what had
// arrived as a success.
//
// Two mistakes, and the second is the serious one. The ceilings were sized
// against the answer alone, when thinking and the answer share the budget, so
// a hundred-and-twenty-character headline given two hundred tokens spent most
// of them before it started writing. And nothing checked why the model had
// stopped, so a truncated answer was indistinguishable from a finished one.
//
// Half a sentence offered as finished work is worse than an honest failure.
// The person cannot tell whether the platform is broken or whether that is
// genuinely what it thinks of their career.

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//'))
    .join('\n')
}

test('every field has room for the thinking as well as the answer', () => {
  // The short fields are the ones that break. They were given the least room,
  // and the thinking does not get shorter just because the answer does.
  for (const field of WRITE_FIELDS) {
    const built = buildWriteRequest({ field, mode: 'write', facts: { 'Role level': 'Spa Director' } })
    assert.ok(built.ok, `${field} should build a request`)
    assert.ok(built.maxTokens >= 1200,
      `${field} has a ceiling of ${built.maxTokens}, which thinking alone can spend before a word is written`)
  }
})

test('a truncated answer is refused rather than returned', () => {
  for (const file of ['src/lib/ai-write.ts', 'src/lib/ai.ts', 'src/lib/cv-read.ts']) {
    const source = body(file)
    assert.match(source, /stop_reason === 'max_tokens'/,
      `${file} returns whatever arrived without asking why the model stopped`)
  }
})

test('the person is told it was cut off, not that it failed vaguely', () => {
  // "Something went wrong" sends somebody to the contact form. "It came out
  // too long, press it again" they can act on without help.
  const writer = body('src/lib/ai-write.ts')
  const cut = writer.match(/stop_reason === 'max_tokens'\)[\s\S]*?error: '([^']+)'/)
  assert.ok(cut, 'the truncation branch must return a sentence')
  assert.match(cut[1], /cut off/)
  assert.match(cut[1], /again|shorten/)
})
