// The course shape, with no courses in it.
//
// Client components need to name this type. Taking it from academy.ts is safe
// in principle - types are erased - but it puts the data module one careless
// edit away from every page that does so, and this file cannot carry data at
// all. academy.ts re-exports these, so server code is unaffected.

export type AcademyLesson = { title: string; content: string }
export type AcademyQuestion = { q: string; options: string[] }
export type AcademyCourse = {
  slug: string
  title: string
  tagline: string
  category: 'Guest Experience' | 'Standards' | 'Treatments' | 'Commercial' | 'Brands' | 'Specialist Care'
  minutes: number
  price?: number
  lessons: AcademyLesson[]
  quiz: AcademyQuestion[]
}

/** What a course card shows, and nothing else. No lessons, no quiz, no answers. */
export type CourseSummary = {
  slug: string
  title: string
  tagline: string
  category: string
  minutes: number
  price: number
  image_url: string
  is_core: boolean
  lesson_count: number
}
