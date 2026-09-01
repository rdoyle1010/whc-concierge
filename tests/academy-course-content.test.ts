import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildContentDoc,
  contentMinutes,
  contentStats,
  contentToAnswerKey,
  contentToLessons,
  contentToQuiz,
  contentToRich,
  emptyModule,
  normaliseContent,
  validateContent,
  type AcademyContentDoc,
} from '../src/lib/academy-course-content.ts'

// A complete, publishable course document.
function validDoc(): AcademyContentDoc {
  return normaliseContent({
    title: 'The Perfect Consultation',
    tagline: 'Turn the first five minutes into the whole treatment',
    category: 'Guest Experience',
    minutes: 75,
    aims: 'Teach a consultation that keeps the guest safe and surfaces the real brief.',
    audience: 'Spa therapists working to a luxury standard.',
    outcomes: ['Run a consultation that surfaces the real treatment brief'],
    modules: [
      {
        title: 'Why the consultation is the treatment',
        minutes: 20,
        lessons: [
          { title: 'The first five minutes', body: 'Trust is built before a hand is laid on the guest.\n\nSit at the guest’s level and listen more than you speak.' },
          { title: 'What the form is for', body: 'The written form protects the guest, you and the business.' },
        ],
        keyTerms: [{ term: 'Contraindication', definition: 'A condition that changes or rules out a treatment.' }],
        knowledgeCheck: [{ q: 'What is the first purpose of a consultation?', options: ['Retail', 'Guest safety'], answer: 1, why: 'Safety comes before everything else.' }],
      },
    ],
    assessment: [
      { q: 'What is the FIRST purpose of a consultation?', options: ['To upsell products', 'Guest safety', 'To save time', 'Paperwork'], answer: 1 },
    ],
  })
}

test('a complete course document is accepted', () => {
  assert.equal(validateContent(validDoc()), null)
})

test('a course with no modules is rejected', () => {
  const doc = validDoc()
  doc.modules = []
  const problem = validateContent(doc)
  assert.match(String(problem), /at least one module/i)
})

test('an entirely empty document is rejected rather than served', () => {
  assert.notEqual(validateContent({}), null)
  assert.notEqual(validateContent(null), null)
  assert.notEqual(validateContent({ modules: [], assessment: [] }), null)
})

test('a module with no title is rejected and named', () => {
  const doc = validDoc()
  doc.modules[0].title = ''
  assert.equal(validateContent(doc), 'Module 1 needs a title.')
})

test('a module with no lessons is rejected and named', () => {
  const doc = validDoc()
  doc.modules[0].lessons = []
  const problem = String(validateContent(doc))
  assert.match(problem, /Module 1 "Why the consultation is the treatment"/)
  assert.match(problem, /at least one lesson/)
})

test('a lesson with no body is rejected and named', () => {
  const doc = validDoc()
  doc.modules[0].lessons[1].body = '   \n  '
  const problem = String(validateContent(doc))
  assert.match(problem, /Lesson 2 "What the form is for"/)
  assert.match(problem, /Module 1 "Why the consultation is the treatment"/)
  assert.match(problem, /no written content/)
})

test('a lesson with no title is rejected and named', () => {
  const doc = validDoc()
  doc.modules[0].lessons[0].title = ''
  const problem = String(validateContent(doc))
  assert.match(problem, /Lesson 1 of Module 1/)
  assert.match(problem, /needs a title/)
})

test('a course with no assessment question is rejected', () => {
  const doc = validDoc()
  doc.assessment = []
  assert.match(String(validateContent(doc)), /at least one end-of-course assessment question/i)
})

test('an assessment answer outside the choices is rejected', () => {
  const doc = validDoc()
  doc.assessment[0].answer = 9
  assert.match(String(validateContent(doc)), /Choose the correct answer for assessment question 1/)
})

test('a knowledge check with an empty answer choice is rejected', () => {
  const doc = validDoc()
  doc.modules[0].knowledgeCheck[0].options = ['Retail', '']
  assert.match(String(validateContent(doc)), /Knowledge check 1 in Module 1/)
})

test('an empty new module cannot be published by accident', () => {
  const doc = validDoc()
  doc.modules.push(emptyModule())
  assert.match(String(validateContent(doc)), /Module 2 needs a title/)
})

test('normalising never throws on rubbish and never invents content', () => {
  const doc = normaliseContent({ modules: 'not an array', assessment: 42, outcomes: [null, 'Keep me', ''] })
  assert.deepEqual(doc.modules, [])
  assert.deepEqual(doc.assessment, [])
  assert.deepEqual(doc.outcomes, ['Keep me'])
  assert.equal(doc.title, '')
})

test('the flat lesson list, quiz and answer key are derived from the document', () => {
  const doc = validDoc()
  const lessons = contentToLessons(doc)
  assert.equal(lessons.length, 1)
  assert.equal(lessons[0].title, 'Why the consultation is the treatment')
  assert.match(lessons[0].content, /The first five minutes/)
  assert.match(lessons[0].content, /What the form is for/)
  assert.deepEqual(contentToQuiz(doc), [{ q: 'What is the FIRST purpose of a consultation?', options: ['To upsell products', 'Guest safety', 'To save time', 'Paperwork'] }])
  assert.deepEqual(contentToAnswerKey(doc), [1])
  // Scoring depends on these two staying the same length.
  assert.equal(contentToQuiz(doc).length, contentToAnswerKey(doc).length)
})

test('module minutes add up, and fall back to the course figure', () => {
  const doc = validDoc()
  assert.equal(contentMinutes(doc), 20)
  doc.modules[0].minutes = null
  assert.equal(contentMinutes(doc), 75)
})

test('live counts report modules, lessons, words and questions', () => {
  const stats = contentStats(validDoc())
  assert.equal(stats.modules, 1)
  assert.equal(stats.lessons, 2)
  assert.equal(stats.questions, 1)
  assert.ok(stats.words > 20)
})

test('the rich view maps lessons onto the shape the course player renders', () => {
  const rich = contentToRich('consultation-excellence', validDoc())
  assert.equal(rich.slug, 'consultation-excellence')
  assert.equal(rich.lessons.length, 1)
  assert.equal(rich.lessons[0].sections.length, 2)
  assert.equal(rich.lessons[0].sections[0].heading, 'The first five minutes')
  assert.equal(rich.lessons[0].knowledgeCheck?.length, 1)
})

test('taking editorial control copies a complete, publishable copy of the platform course', () => {
  const doc = buildContentDoc({
    title: 'Spa Revenue Fundamentals',
    tagline: 'Read your spa the way a director does',
    category: 'Commercial',
    minutes: 75,
    lessons: [{ title: 'Understanding Spa Capacity', content: 'Two ceilings cap revenue.' }],
    quiz: [{ q: 'What caps revenue?', options: ['Rooms', 'The lower of the two ceilings'] }],
    answerKey: [1],
    rich: {
      aims: 'Read a spa commercially.',
      audience: 'Managers and directors.',
      outcomes: ['Diagnose a spa from its numbers'],
      lessons: [{
        title: 'Understanding Spa Capacity',
        objectives: ['Separate room-hours from therapist-hours'],
        sections: [{ heading: 'The two ceilings', body: 'Room-hours and sellable therapist-hours.' }],
        keyTerms: [{ term: 'Sellable hours', definition: 'Hours a therapist can actually be booked.' }],
        caseStudy: { title: 'The 12-room spa', scenario: 'A spa runs at 96% on Saturdays.', insight: 'Price the peak.' },
        summary: 'Capacity is the lower ceiling.',
      }],
    },
  })
  assert.equal(validateContent(doc), null, 'a copied platform course must be publishable as it stands')
  assert.equal(doc.modules[0].lessons[0].title, 'The two ceilings')
  assert.equal(doc.assessment[0].answer, 1)
  assert.equal(doc.outcomes.length, 1)
})

test('diagrams and tables survive taking editorial control, and rubbish ones are dropped', () => {
  const doc = buildContentDoc({
    title: 'A course with visuals',
    tagline: 'Short and useful',
    category: 'Commercial',
    minutes: 30,
    lessons: [{ title: 'Module one', content: 'Body.' }],
    quiz: [{ q: 'A question?', options: ['No', 'Yes'] }],
    answerKey: [1],
    rich: {
      lessons: [{
        title: 'Module one',
        sections: [{ heading: 'A section', body: 'Written content.' }],
        visuals: [
          { kind: 'table', title: 'Total spa contribution', headers: ['Stream', 'Evidence'], rows: [['Rate support', 'ADR premium']], caption: 'Keep it current.' },
          { kind: 'flow', title: 'Translating an ask', steps: ['State it', 'Cost it', 'Return'] },
          { kind: 'nonsense', title: 'Not a real visual' } as never,
        ],
      }],
    },
  })
  assert.equal(doc.modules[0].visuals.length, 2, 'known visuals are carried across unchanged')
  assert.equal(doc.modules[0].visuals[0].kind, 'table')
  assert.equal(validateContent(doc), null)
  const rich = contentToRich('a-course', doc)
  assert.equal(rich.lessons[0].visuals?.length, 2, 'the course player still receives them')
})

test('a platform course with no rich content still copies to a publishable document', () => {
  const doc = buildContentDoc({
    title: 'A simple course',
    tagline: 'Short and useful',
    category: 'Standards',
    minutes: 30,
    lessons: [{ title: 'Module one', content: 'The written content of module one.' }],
    quiz: [{ q: 'A question?', options: ['No', 'Yes'] }],
    answerKey: [1],
    rich: null,
  })
  assert.equal(validateContent(doc), null)
  assert.equal(doc.modules[0].lessons[0].title, 'Overview')
  assert.equal(doc.modules[0].lessons[0].body, 'The written content of module one.')
})
