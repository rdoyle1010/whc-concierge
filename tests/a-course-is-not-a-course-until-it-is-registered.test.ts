import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { courseBySlug } from '../src/lib/academy'
import { getCourseContent } from '../src/lib/academy-content/index'
import { MORE_ANSWERS } from '../src/lib/academy-more-answers/index'
import { MORE_EXTRAS } from '../src/lib/academy-more'
import { PRODUCT_HOUSES_FULL } from '../src/lib/taxonomy'
import { PRODUCT_HOUSES } from '../src/lib/constants'

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

// A course in this Academy is not one file, it is five: the pack, the rich
// content, the answer key, and three separate registries that have to name it
// before a learner can reach it. Miss the lazy loader and the course page
// renders an empty shell in the browser while every server-side test passes.
// Miss the answer key and the final assessment marks every submission wrong.
//
// Carol Joy London is the first brand to agree to appear here as a partner, so
// this is also the first course somebody outside the business will read.

const SLUG = 'carol-joy-london-masterclass'

test('the Carol Joy London masterclass is reachable from every direction', () => {
  const course = courseBySlug(SLUG)
  assert.ok(course, 'the pack is not registered in academy-more/index.ts')
  assert.equal(course!.category, 'Brands')
  assert.ok(MORE_EXTRAS[SLUG], 'the lesson extras are not registered')
  assert.ok(getCourseContent(SLUG), 'the rich content is not registered in academy-more/content.ts')
  assert.ok(MORE_ANSWERS[SLUG], 'the answer key is not registered')

  // The browser loads course content one course at a time. A slug missing here
  // passes every server test and shows the learner nothing.
  assert.match(read('src/lib/academy-content-lazy.ts'), new RegExp(`'${SLUG}':`),
    'the lazy loader has no entry, so the course page would render empty')
})

test('the assessment can actually be marked', () => {
  const course = courseBySlug(SLUG)!
  const answers = MORE_ANSWERS[SLUG]
  assert.equal(answers.length, course.quiz.length,
    'one answer per question, or the pass mark is meaningless')
  course.quiz.forEach((question, index) => {
    const answer = answers[index]
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer < question.options.length,
      `answer ${index} does not point at one of its own options`)
  })
})

test('the rich content teaches the same lessons the course advertises', () => {
  const course = courseBySlug(SLUG)!
  const content = getCourseContent(SLUG)!
  assert.equal(content.lessons.length, course.lessons.length)
  course.lessons.forEach((lesson, index) => {
    assert.equal(content.lessons[index].title, lesson.title,
      'lesson titles are matched by index; a mismatch shows the learner one title and teaches another')
  })
})

test('a therapist can say she has worked with Carol Joy London', () => {
  // A masterclass on a house nobody can select on their profile teaches
  // something the match score will never see.
  assert.ok(PRODUCT_HOUSES_FULL.includes('Carol Joy London'),
    'the profile, onboarding and job requirement pickers all read this list')
  assert.ok((PRODUCT_HOUSES as readonly string[]).includes('Carol Joy London'),
    'the residency form reads this shorter list')
  assert.match(read('src/app/api/seed-taxonomy/route.ts'), /name: 'Carol Joy London'/,
    'a fresh database would seed every other house but not this one')
})
