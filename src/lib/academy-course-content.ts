// Talent House Academy - the editable course content document.
//
// This is the single shape an admin edits when she takes editorial control of
// a course, and the single validator used by BOTH the admin API route and the
// admin editor UI, so the founder sees a problem before she saves rather than
// after.
//
// WHY THIS FILE EXISTS
// Course content is authored in code (src/lib/academy.ts plus the content
// packs). Historically an academy_courses row could replace that content, and
// rows holding empty or partial content silently blanked good courses. The
// rule now is narrow and enforceable: database content is served ONLY when the
// course is explicitly marked content_source = 'custom' AND the stored
// document passes validateContent() below. Anything else falls back to the
// platform version, so a broken row can never leave a learner with an empty
// course.
//
// It deliberately imports nothing: it is shared by server routes and by the
// client editor, and it must never drag course data into a browser bundle.
//
// NAMING NOTE: this helper is NOT called academy-content.ts, because
// src/lib/academy-content/ is an existing directory (the platform content
// packs). A sibling file of that name would shadow the directory in module
// resolution and silently break every `@/lib/academy-content` import.

export type ContentLesson = {
  // A lesson inside a module. Renders as a headed block of written content on
  // the talent course page (the RichLesson "section" shape).
  title: string
  body: string
}

export type ContentKeyTerm = { term: string; definition: string }

export type ContentKnowledgeCheck = {
  q: string
  options: string[]
  answer: number
  why: string
}

export type ContentCaseStudy = { title: string; scenario: string; insight: string }

// A teaching visual - the same union the course player and the course manual
// already render. Mirrored here rather than imported so this file stays free
// of dependencies; buildContentDoc carries them across unchanged so taking
// editorial control never silently drops a diagram from a course.
export type ContentVisual =
  | { kind: 'flow'; title: string; steps: string[]; caption?: string }
  | { kind: 'table'; title: string; headers: string[]; rows: string[][]; caption?: string }
  | { kind: 'matrix'; title: string; xLabel: string; yLabel: string; quadrants: [string, string, string, string]; caption?: string }
  | { kind: 'image_placeholder'; title: string; description: string }

export type ContentModule = {
  title: string
  minutes: number | null
  whyThisMatters: string
  objectives: string[]
  lessons: ContentLesson[]
  visuals: ContentVisual[]
  keyTerms: ContentKeyTerm[]
  knowledgeCheck: ContentKnowledgeCheck[]
  scenario: string
  activity: string
  caseStudy: ContentCaseStudy
  summary: string
  nextStep: string
}

export type ContentQuestion = { q: string; options: string[]; answer: number }

export type AcademyContentDoc = {
  title: string
  tagline: string
  category: string
  minutes: number
  aims: string
  audience: string
  outcomes: string[]
  modules: ContentModule[]
  assessment: ContentQuestion[]
}

export const CONTENT_CATEGORIES = [
  'Guest Experience',
  'Standards',
  'Treatments',
  'Commercial',
  'Brands',
  'Specialist Care',
] as const

// The formatting the talent course page actually supports for a lesson body:
// plain writing, blank line between paragraphs, single line breaks preserved.
// There is no markdown renderer, so asterisks and hashes would appear as typed.
export const LESSON_BODY_HELP =
  'Write in plain English. Leave a blank line between paragraphs and they appear as separate paragraphs. Single line breaks are kept exactly as you type them. There is no markdown: characters such as *, # or _ will appear on the page exactly as written, so do not use them for formatting.'

const text = (value: unknown, limit = 30000) => String(value ?? '').replace(/\r\n/g, '\n').slice(0, limit)
const trimmed = (value: unknown, limit = 30000) => text(value, limit).trim()

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const wholeNumber = (value: unknown, fallback: number) => {
  const parsed = Math.round(Number(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

// Coerce anything at all - a database row, a half-typed editor state, an old
// shape - into a complete document. Never throws, never invents content.
export function normaliseContent(raw: unknown): AcademyContentDoc {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const minutes = wholeNumber(source.minutes, 0)
  return {
    title: trimmed(source.title, 140),
    tagline: trimmed(source.tagline, 300),
    category: trimmed(source.category, 60),
    minutes: minutes > 0 ? Math.min(minutes, 600) : 0,
    aims: trimmed(source.aims, 4000),
    audience: trimmed(source.audience, 2000),
    outcomes: list(source.outcomes).map(item => trimmed(item, 400)).filter(Boolean).slice(0, 40),
    modules: list(source.modules).slice(0, 60).map(normaliseModule),
    assessment: list(source.assessment).slice(0, 80).map(normaliseQuestion),
  }
}

function normaliseModule(raw: unknown): ContentModule {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const minutes = wholeNumber(source.minutes, 0)
  const caseStudy = (source.caseStudy && typeof source.caseStudy === 'object' ? source.caseStudy : {}) as Record<string, unknown>
  return {
    title: trimmed(source.title, 180),
    minutes: minutes > 0 ? Math.min(minutes, 600) : null,
    whyThisMatters: text(source.whyThisMatters, 6000),
    objectives: list(source.objectives).map(item => trimmed(item, 400)).filter(Boolean).slice(0, 20),
    lessons: list(source.lessons).slice(0, 40).map(normaliseLesson),
    visuals: list(source.visuals).slice(0, 12).map(normaliseVisual).filter(Boolean) as ContentVisual[],
    keyTerms: list(source.keyTerms).slice(0, 40).map(item => {
      const term = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return { term: trimmed(term.term, 120), definition: trimmed(term.definition, 1200) }
    }),
    knowledgeCheck: list(source.knowledgeCheck).slice(0, 20).map(normaliseKnowledgeCheck),
    scenario: text(source.scenario, 8000),
    activity: text(source.activity, 6000),
    caseStudy: {
      title: trimmed(caseStudy.title, 180),
      scenario: text(caseStudy.scenario, 8000),
      insight: text(caseStudy.insight, 8000),
    },
    summary: text(source.summary, 6000),
    nextStep: text(source.nextStep, 4000),
  }
}

// Carried through untouched apart from coercion. Anything that is not one of
// the four known kinds is dropped rather than half-rendered.
function normaliseVisual(raw: unknown): ContentVisual | null {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const title = trimmed(source.title, 180)
  const caption = trimmed(source.caption, 600)
  const strings = (value: unknown, limit: number) => list(value).slice(0, limit).map(item => trimmed(item, 400))
  switch (source.kind) {
    case 'flow':
      return { kind: 'flow', title, steps: strings(source.steps, 12), ...(caption ? { caption } : {}) }
    case 'table':
      return {
        kind: 'table',
        title,
        headers: strings(source.headers, 8),
        rows: list(source.rows).slice(0, 30).map(row => strings(row, 8)),
        ...(caption ? { caption } : {}),
      }
    case 'matrix': {
      const quadrants = strings(source.quadrants, 4)
      return {
        kind: 'matrix',
        title,
        xLabel: trimmed(source.xLabel, 120),
        yLabel: trimmed(source.yLabel, 120),
        quadrants: [quadrants[0] || '', quadrants[1] || '', quadrants[2] || '', quadrants[3] || ''],
        ...(caption ? { caption } : {}),
      }
    }
    case 'image_placeholder':
      return { kind: 'image_placeholder', title, description: trimmed(source.description, 1000) }
    default:
      return null
  }
}

export function describeVisual(visual: ContentVisual): string {
  switch (visual.kind) {
    case 'flow': return `Flow diagram, ${visual.steps.length} step${visual.steps.length === 1 ? '' : 's'}`
    case 'table': return `Table, ${visual.headers.length} column${visual.headers.length === 1 ? '' : 's'} and ${visual.rows.length} row${visual.rows.length === 1 ? '' : 's'}`
    case 'matrix': return 'Two-by-two matrix'
    case 'image_placeholder': return 'Image slot'
  }
}

function normaliseLesson(raw: unknown): ContentLesson {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { title: trimmed(source.title, 180), body: text(source.body, 40000) }
}

function normaliseKnowledgeCheck(raw: unknown): ContentKnowledgeCheck {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    q: trimmed(source.q, 500),
    options: list(source.options).slice(0, 8).map(option => trimmed(option, 500)),
    answer: Math.max(0, wholeNumber(source.answer, 0)),
    why: text(source.why, 2000),
  }
}

function normaliseQuestion(raw: unknown): ContentQuestion {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    q: trimmed(source.q, 500),
    options: list(source.options).slice(0, 8).map(option => trimmed(option, 500)),
    answer: Math.max(0, wholeNumber(source.answer, 0)),
  }
}

const moduleLabel = (index: number, module: ContentModule) =>
  module.title ? `Module ${index + 1} "${module.title}"` : `Module ${index + 1}`

// The guard that replaces the old blanket ban on database content. Returns a
// specific, plain-English problem naming the offending module or lesson, or
// null when the document is safe to serve to learners.
export function validateContent(raw: unknown): string | null {
  const content = normaliseContent(raw)

  if (!content.title) return 'Give the course a name before saving.'
  if (!content.modules.length) return 'Add at least one module before saving. A course with no modules would leave learners with an empty page.'

  for (const [index, module] of content.modules.entries()) {
    if (!module.title) return `Module ${index + 1} needs a title.`
    if (!module.lessons.length) return `${moduleLabel(index, module)} needs at least one lesson.`
    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      if (!lesson.title) return `Lesson ${lessonIndex + 1} of ${moduleLabel(index, module)} needs a title.`
      if (!lesson.body.trim()) return `Lesson ${lessonIndex + 1} "${lesson.title}" in ${moduleLabel(index, module)} has no written content. Every lesson needs something for the learner to read.`
    }
    for (const [checkIndex, check] of module.knowledgeCheck.entries()) {
      if (!check.q) return `Knowledge check ${checkIndex + 1} in ${moduleLabel(index, module)} needs a question, or remove it.`
      const answered = check.options.filter(Boolean)
      if (answered.length < 2) return `Knowledge check ${checkIndex + 1} in ${moduleLabel(index, module)} needs at least two answer choices.`
      if (check.options.some(option => !option)) return `Knowledge check ${checkIndex + 1} in ${moduleLabel(index, module)} has an empty answer choice.`
      if (check.answer < 0 || check.answer >= check.options.length) return `Choose the correct answer for knowledge check ${checkIndex + 1} in ${moduleLabel(index, module)}.`
    }
    for (const [termIndex, term] of module.keyTerms.entries()) {
      if (!term.term || !term.definition) return `Key term ${termIndex + 1} in ${moduleLabel(index, module)} needs both a term and a definition, or remove it.`
    }
  }

  if (!content.assessment.length) return 'Add at least one end-of-course assessment question. Learners cannot be certified without an assessment.'
  for (const [index, question] of content.assessment.entries()) {
    if (!question.q) return `Assessment question ${index + 1} needs a question.`
    if (question.options.length < 2) return `Assessment question ${index + 1} needs at least two answer choices.`
    if (question.options.some(option => !option)) return `Assessment question ${index + 1} has an empty answer choice.`
    if (question.answer < 0 || question.answer >= question.options.length) return `Choose the correct answer for assessment question ${index + 1}.`
  }

  return null
}

export function isValidContent(raw: unknown): boolean {
  return validateContent(raw) === null
}

// --- Derived views of a document -----------------------------------------
// Everything the rest of the platform reads is computed from the document, so
// there is exactly one source of truth for a custom course.

const countWords = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0)

export function contentStats(raw: unknown) {
  const content = normaliseContent(raw)
  let lessons = 0
  let words = countWords(content.aims) + countWords(content.audience) + content.outcomes.reduce((sum, item) => sum + countWords(item), 0)
  let statedMinutes = 0
  for (const module of content.modules) {
    lessons += module.lessons.length
    if (module.minutes) statedMinutes += module.minutes
    words += countWords(module.title) + countWords(module.whyThisMatters) + countWords(module.scenario) + countWords(module.activity) + countWords(module.summary) + countWords(module.nextStep)
    words += countWords(module.caseStudy.scenario) + countWords(module.caseStudy.insight)
    words += module.objectives.reduce((sum, item) => sum + countWords(item), 0)
    words += module.keyTerms.reduce((sum, item) => sum + countWords(item.definition), 0)
    for (const lesson of module.lessons) words += countWords(lesson.title) + countWords(lesson.body)
  }
  return {
    modules: content.modules.length,
    lessons,
    words,
    questions: content.assessment.length,
    minutes: statedMinutes || content.minutes,
  }
}

// The flat lesson list the platform has always used: one entry per module,
// with the module's lessons joined into readable plain text. This is what the
// mobile app, the admin preview and the non-rich renderer read, so it must
// always carry the real words rather than a summary line.
export function contentToLessons(raw: unknown): { title: string; content: string }[] {
  return normaliseContent(raw).modules.map(module => ({
    title: module.title,
    content: module.lessons
      .map(lesson => `${lesson.title}\n\n${lesson.body}`.trim())
      .filter(Boolean)
      .join('\n\n'),
  }))
}

export function contentToQuiz(raw: unknown): { q: string; options: string[] }[] {
  return normaliseContent(raw).assessment.map(question => ({ q: question.q, options: question.options }))
}

export function contentToAnswerKey(raw: unknown): number[] {
  return normaliseContent(raw).assessment.map(question => question.answer)
}

export function contentMinutes(raw: unknown): number {
  const content = normaliseContent(raw)
  const stated = content.modules.reduce((sum, module) => sum + (module.minutes || 0), 0)
  return stated || content.minutes
}

// The rich view the talent course page renders: structurally the same
// CourseContent shape the platform content packs use, so the course player
// needs no separate code path for a custom course.
export function contentToRich(slug: string, raw: unknown) {
  const content = normaliseContent(raw)
  return {
    slug,
    aims: content.aims,
    audience: content.audience,
    outcomes: content.outcomes,
    lessons: content.modules.map(module => ({
      title: module.title,
      objectives: module.objectives,
      sections: module.lessons.map(lesson => ({ heading: lesson.title, body: lesson.body })),
      visuals: module.visuals.length ? module.visuals : undefined,
      keyTerms: module.keyTerms,
      caseStudy: module.caseStudy,
      summary: module.summary,
      whyThisMatters: module.whyThisMatters || undefined,
      scenario: module.scenario || undefined,
      activity: module.activity || undefined,
      knowledgeCheck: module.knowledgeCheck.length ? module.knowledgeCheck : undefined,
      nextStep: module.nextStep || undefined,
    })),
  }
}

// --- Building a starting document ----------------------------------------

export function emptyLesson(): ContentLesson {
  return { title: '', body: '' }
}

export function emptyModule(): ContentModule {
  return {
    title: '',
    minutes: null,
    whyThisMatters: '',
    objectives: [],
    lessons: [emptyLesson()],
    visuals: [],
    keyTerms: [],
    knowledgeCheck: [],
    scenario: '',
    activity: '',
    caseStudy: { title: '', scenario: '', insight: '' },
    summary: '',
    nextStep: '',
  }
}

export function emptyQuestion(): ContentQuestion {
  return { q: '', options: ['', '', '', ''], answer: 0 }
}

export function blankContent(): AcademyContentDoc {
  return {
    title: '',
    tagline: '',
    category: 'Guest Experience',
    minutes: 30,
    aims: '',
    audience: '',
    outcomes: [],
    modules: [emptyModule()],
    assessment: [emptyQuestion()],
  }
}

// A structural view of whatever the platform currently serves for a course.
// Passed in by the caller so this file never imports course data.
export type PlatformCourseSource = {
  title: string
  tagline: string
  category: string
  minutes: number
  lessons: { title: string; content: string }[]
  quiz: { q: string; options: string[] }[]
  answerKey: number[]
  rich?: {
    aims?: string
    audience?: string
    outcomes?: string[]
    lessons?: {
      title?: string
      objectives?: string[]
      sections?: { heading?: string; body?: string }[]
      visuals?: unknown[]
      keyTerms?: { term?: string; definition?: string }[]
      caseStudy?: { title?: string; scenario?: string; insight?: string }
      summary?: string
      whyThisMatters?: string
      scenario?: string
      activity?: string
      knowledgeCheck?: { q?: string; options?: string[]; answer?: number; why?: string }[]
      nextStep?: string
    }[]
  } | null
}

// Copy the full current platform content into an editable document. This is
// what "Take editorial control of this course" saves, so the founder always
// starts from a complete, working copy rather than an empty row.
export function buildContentDoc(source: PlatformCourseSource): AcademyContentDoc {
  const richLessons = source.rich?.lessons || []
  const modules = source.lessons.map((lesson, index) => {
    const rich = richLessons[index]
    const sections = (rich?.sections || []).filter(section => String(section?.body || '').trim())
    const lessons: ContentLesson[] = sections.length
      ? sections.map((section, sectionIndex) => ({
          title: String(section.heading || '').trim() || `Part ${sectionIndex + 1}`,
          body: String(section.body || ''),
        }))
      : [{ title: 'Overview', body: String(lesson.content || '') }]
    return normaliseModule({
      title: lesson.title,
      minutes: null,
      whyThisMatters: rich?.whyThisMatters || '',
      objectives: rich?.objectives || [],
      lessons,
      visuals: rich?.visuals || [],
      keyTerms: rich?.keyTerms || [],
      knowledgeCheck: rich?.knowledgeCheck || [],
      scenario: rich?.scenario || '',
      activity: rich?.activity || '',
      caseStudy: rich?.caseStudy || {},
      summary: rich?.summary || '',
      nextStep: rich?.nextStep || '',
    })
  })

  return normaliseContent({
    title: source.title,
    tagline: source.tagline,
    category: source.category,
    minutes: source.minutes,
    aims: source.rich?.aims || '',
    audience: source.rich?.audience || '',
    outcomes: source.rich?.outcomes || [],
    modules,
    assessment: source.quiz.map((question, index) => ({
      q: question.q,
      options: question.options,
      answer: Number.isInteger(source.answerKey[index]) ? source.answerKey[index] : 0,
    })),
  })
}
