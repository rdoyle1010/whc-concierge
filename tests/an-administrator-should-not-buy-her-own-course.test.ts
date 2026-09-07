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

// "Preview as a learner" sat on the course editor and led to a paywall. An
// administrator has no candidate_profiles row, so the Academy API answered 404
// before it could say anything, and the course page concluded she simply had
// not paid. The only way to read a course you had written was to buy it.

test('an administrator is not refused for having no learner record', () => {
  const route = body('src/app/api/academy/route.ts')
  assert.match(route, /async function callerIsAdmin/)
  assert.match(route, /if \(isAdmin\) return NextResponse\.json\(\{ enrollments: \[\], is_admin: true/,
    'no learner record must not mean no access, for an administrator')
  // A learner without a profile is still refused, exactly as before.
  assert.match(route, /return NextResponse\.json\(\{ error: 'No candidate profile found' \}, \{ status: 404 \}\)/)
})

test('a preview writes absolutely nothing down', () => {
  const route = body('src/app/api/academy/route.ts')
  const start = route.indexOf('const previewing =')
  const end = route.indexOf("if (!cand) return NextResponse.json({ error: 'No candidate profile found' }, { status: 404 })", start)
  assert.ok(start > 0 && end > start, 'the preview branch should have been found')
  const preview = route.slice(start, end)

  // The whole point: a preview that quietly recorded progress, an attempt, a
  // completion or a certificate would be worse than no preview at all.
  for (const write of ['.update(', '.insert(', 'certificate_code: await', 'makeUniqueCertificateCode', 'completed_at']) {
    assert.ok(!preview.includes(write), `a preview must not ${write}`)
  }
  assert.match(preview, /certificate_code: null/, 'a preview issues no certificate')
  assert.match(preview, /preview: true/, 'the browser has to know this was a preview')
  // It still marks the assessment, so the administrator can check it works.
  assert.match(preview, /getAcademyAnswerKey\(slug\)/)
  assert.match(preview, /score >= PASS_MARK/)
})

test('a preview never poses as a finished course', () => {
  const page = body('src/app/talent/academy/[slug]/page.tsx')
  assert.match(page, /if \(j\.passed && !j\.preview\) setCompletedAt/,
    'passing a preview must not show a certificate that does not exist')
  assert.match(page, /if \(!enrolled && !previewing\) \{/,
    'the paywall must let an administrator through')
  assert.match(read('src/app/talent/academy/[slug]/page.tsx'), /Administrator preview/,
    'a preview must say what it is')
})
