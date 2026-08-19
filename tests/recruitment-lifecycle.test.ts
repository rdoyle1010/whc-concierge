import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

function read(path: string) {
  return readFileSync(path, 'utf8')
}

test('interview pipeline supports up to three rounds and candidate confirmation', () => {
  const employer = read('src/app/api/employer/applications/interview/route.ts')
  const talent = read('src/app/api/talent/applications/interview/route.ts')
  assert.match(employer, /roundNumber/)
  assert.match(employer, /roundNumber\s*>\s*3/)
  assert.match(employer, /application_interviews/)
  assert.match(talent, /application_interviews/)
  assert.match(talent, /selected_slot/)
  assert.match(talent, /status:\s*'confirmed'/)
})

test('offer flow requires candidate response and records accepted state', () => {
  const employer = read('src/app/api/employer/applications/offer/route.ts')
  const talent = read('src/app/api/talent/applications/offer/route.ts')
  assert.match(employer, /application_offers/)
  assert.match(talent, /action === 'accept'/)
  assert.match(talent, /'accepted'/)
  assert.match(talent, /'declined'/)
  assert.match(talent, /from\('applications'\)\.update/)
})

test('complete hire closes the role and archives the successful placement', () => {
  const route = read('src/app/api/employer/applications/complete-hire/route.ts')
  assert.match(route, /application\.status !== 'accepted'/)
  assert.match(route, /hired_at/)
  assert.match(route, /archived_at/)
  assert.match(route, /status:\s*'filled'/)
  assert.match(route, /sendRoleFilledEmail/)
  assert.match(route, /Privacy & account settings/)
})

test('hired archive can reopen the recruitment record without relisting the vacancy', () => {
  const route = read('src/app/api/employer/hired/route.ts')
  assert.match(route, /reopen_record/)
  assert.match(route, /archived_at:\s*null/)
  assert.doesNotMatch(route, /is_live\s*:\s*true/)
})

test('post-hire platform reviews require a completed placement', () => {
  const route = read('src/app/api/platform-reviews/route.ts')
  assert.match(route, /hired_at/)
  assert.match(route, /platform_experience_reviews/)
  assert.match(route, /reviewer_role/)
  assert.equal(existsSync('supabase/migrations/046_platform_experience_reviews.sql'), true)
})

test('post-hire review workspace is visible to both employer and talent', () => {
  const shell = read('src/components/DashboardShell.tsx')
  const workspace = read('src/components/PostHireReviews.tsx')
  assert.match(shell, /PostHireReviews/)
  assert.match(shell, /pathname === '\/employer\/hired'/)
  assert.match(shell, /pathname === '\/talent\/applications'/)
  assert.match(workspace, /PlatformExperienceReview/)
  assert.match(workspace, /counterpartReviewType === 'candidate'/)
  assert.match(workspace, /'professional'\s*:\s*'property'/)
})
