// WHC Academy - the university-grade course content model. Each course's
// full content lives in src/lib/academy-content/<slug>.ts conforming to
// these types. Quizzes and answer keys remain in academy.ts /
// academy-answers.ts and are untouched by this layer.

export type KeyTerm = { term: string; definition: string }

export type CaseStudy = {
  title: string
  scenario: string // a realistic named scenario from a luxury spa setting
  insight: string  // what the professional response is, and why
}

export type LessonSection = { heading: string; body: string }

// A visual that teaches something - never decoration.
export type LessonVisual =
  | { kind: 'flow'; title: string; steps: string[]; caption?: string }
  | { kind: 'table'; title: string; headers: string[]; rows: string[][]; caption?: string }
  | { kind: 'matrix'; title: string; xLabel: string; yLabel: string; quadrants: [string, string, string, string]; caption?: string }
  | { kind: 'image_placeholder'; title: string; description: string }

// A formative knowledge check inside the lesson (practice, not the final
// assessment - answers may ship to the client).
export type KnowledgeCheck = { q: string; options: string[]; answer: number; why: string }

export type RichLesson = {
  title: string // MUST match the lesson title in academy.ts exactly
  objectives: string[] // "By the end of this lesson you will be able to..."
  sections: LessonSection[] // 3-4 substantial sections with headings
  keyTerms: KeyTerm[]
  caseStudy: CaseStudy
  summary: string // the takeaway paragraph
  // WHC course standard (optional - existing courses render unchanged):
  whyThisMatters?: string // the operational/commercial stake, up front
  visuals?: LessonVisual[] // diagrams, tables, matrices, image slots
  scenario?: string // a situation the learner thinks through
  activity?: string // something the learner must actually DO
  knowledgeCheck?: KnowledgeCheck[] // 2-5 formative questions with answers
  nextStep?: string // what to apply at work now
}

export type CourseContent = {
  slug: string
  aims: string // one paragraph: what this course sets out to do
  audience: string // who it is for
  outcomes: string[] // course-level outcomes, CV-ready phrasing
  lessons: RichLesson[] // same count and order as academy.ts
  // Accreditation-readiness fields (optional):
  prerequisites?: string
  author?: { name: string; role: string; note?: string }
  references?: { label: string; url?: string }[] // further reading - no reproduced material
  lastReviewed?: string // ISO date the content was last reviewed
  version?: string
}
