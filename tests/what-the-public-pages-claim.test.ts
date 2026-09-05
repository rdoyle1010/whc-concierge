import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

function body(path: string) {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter(line => !line.trimStart().startsWith('//') && !line.trimStart().startsWith('--'))
    .join('\n')
}

test('a website somebody typed cannot become a link to our own 404', () => {
  const { externalUrl } = require('../src/lib/external-url') as typeof import('../src/lib/external-url')

  // The reported bug: stored without a scheme, rendered raw, resolved as a
  // relative path to /jobs/www.example.co.uk.
  assert.equal(externalUrl('www.wellnesshousecollective.co.uk'), 'https://www.wellnesshousecollective.co.uk/')
  assert.equal(externalUrl('  example.co.uk/spa  '), 'https://example.co.uk/spa')
  assert.equal(externalUrl('https://example.co.uk/spa'), 'https://example.co.uk/spa')
  assert.equal(externalUrl('http://example.co.uk'), 'http://example.co.uk/')

  // A stored field that strangers can read is not a place to trust a scheme.
  assert.equal(externalUrl('javascript:alert(1)'), null)
  assert.equal(externalUrl('data:text/html,<script>'), null)
  assert.equal(externalUrl('ftp://example.co.uk'), null)
  assert.equal(externalUrl('not a website'), null)
  assert.equal(externalUrl(''), null)
  assert.equal(externalUrl(null), null)
})

test('public pages route every external address through it', () => {
  for (const page of ['src/app/jobs/[id]/page.tsx', 'src/app/properties/[id]/page.tsx']) {
    const source = body(page)
    assert.match(source, /externalUrl\(/, `${page} must normalise addresses before linking to them`)
    assert.doesNotMatch(source, /href=\{(employer|property)\.(website|tripadvisor_url)\}/,
      `${page} still links a raw stored address`)
  }
})

test('a number that is nought does not print itself onto the page', () => {
  // {0 && <Thing/>} renders "0" in JSX. Every numeric fact on the job page
  // was written that way, so an unfilled team size published a bare nought.
  const source = body('src/app/jobs/[id]/page.tsx')
  for (const field of ['team_size', 'num_treatment_rooms', 'star_rating']) {
    assert.doesNotMatch(source, new RegExp(`\\{(employer|job)\\.${field} &&`),
      `${field} renders a bare zero when it is not set`)
  }
  assert.match(source, /function count\(/, 'a numeric guard must exist')
  assert.match(source, /n === 1 \? 'person' : 'people'/, '"1 people" needs a plural rule')
})

test('the Academy price on the pricing page comes from the Academy', () => {
  const source = body('src/app/pricing/page.tsx')
  assert.doesNotMatch(source, /£29–£199\+/, 'the hard-coded Academy range disagreed with the live catalogue')
  assert.match(source, /api\/academy\/catalog/, 'the pricing page must read the real prices')
})

test('the database keeps a star rating tied to real reviews', () => {
  const migration = body('supabase/migrations/20260905120000_a_rating_needs_a_review_behind_it.sql')
  assert.match(migration, /AFTER INSERT OR UPDATE OR DELETE ON public\.reviews/,
    'the counters must be recomputed on every change to a review, deletion included')
  assert.match(migration, /IF v_count = 0 THEN v_score := 0/,
    'no reviews must mean no score, or the phantom rating survives')
  // The backfill has to start from the profiles. A rating with no review
  // behind it is invisible to anything that starts from the reviews table.
  assert.match(migration, /FROM public\.employer_profiles WHERE user_id IS NOT NULL/,
    'the backfill must visit every profile, not only the reviewed ones')
})
