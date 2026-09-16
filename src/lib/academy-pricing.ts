// Academy prices, with no course content attached.
//
// These four numbers and two one-line helpers lived in academy.ts, next to the
// full text of every lesson in the Academy. A client component importing
// `coursePrice` therefore pulled the entire catalogue into the browser bundle:
// 109KB gzipped, 374KB raw, of teaching material that no public page renders
// and that people pay for.
//
// Nothing here imports data, so importing a price stays the cost of a price.

/** Pence. £10 per course for members. */
export const COURSE_PRICE = 1000
/** Pence. All courses together. */
export const BUNDLE_PRICE = 7900
/** Pence. £15 for a non-member buying from the public page. */
export const PUBLIC_COURSE_PRICE = 1500
/** Percent required on the final quiz. */
export const PASS_MARK = 80

export const coursePrice = (c: { price?: number }) => c.price ?? COURSE_PRICE
export const publicCoursePrice = (c: { price?: number }) => (c.price ?? COURSE_PRICE) + 500
