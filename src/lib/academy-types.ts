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

export type RichLesson = {
  title: string // MUST match the lesson title in academy.ts exactly
  objectives: string[] // "By the end of this lesson you will be able to..."
  sections: LessonSection[] // 3-4 substantial sections with headings
  keyTerms: KeyTerm[]
  caseStudy: CaseStudy
  summary: string // the takeaway paragraph
}

export type CourseContent = {
  slug: string
  aims: string // one paragraph: what this course sets out to do
  audience: string // who it is for
  outcomes: string[] // course-level outcomes, CV-ready phrasing
  lessons: RichLesson[] // same count and order as academy.ts
}
