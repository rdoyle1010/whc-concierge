// Course slugs and titles, and nothing else.
//
// A checkbox list, a dropdown and a certificate line all needed to turn a slug
// into a title. They did it with courseTitle() from academy.ts, which carries
// the full text of every lesson in the Academy - so three small controls put
// 109KB gzipped of paid teaching material into pages that never show a lesson.
//
// This file is generated from ACADEMY and a test compares the two on every run,
// so it cannot drift: add a course and the test says so.

export type CourseTitle = { slug: string; title: string }

export const COURSE_TITLES: CourseTitle[] = [
  { slug: 'consultation-excellence', title: "The Perfect Consultation" },
  { slug: 'retail-excellence', title: "Retail & Recommendation" },
  { slug: 'five-star-service', title: "Five-Star Customer Service" },
  { slug: 'lqa-forbes-standards', title: "LQA & Forbes Standards" },
  { slug: 'health-safety-hygiene', title: "Health, Safety & Hygiene in the Spa" },
  { slug: 'room-standards', title: "Treatment Room Standards" },
  { slug: 'upgrading-treatments', title: "Upgrading Treatments" },
  { slug: 'personal-presentation', title: "Personal Presentation & Hygiene" },
  { slug: 'perfect-massage', title: "The Perfect Massage" },
  { slug: 'perfect-facial', title: "The Perfect Facial" },
  { slug: 'brand-knowledge', title: "Product House Knowledge" },
  { slug: 'spa-revenue-fundamentals', title: "Spa Revenue Fundamentals" },
  { slug: 'espa-masterclass', title: "ESPA Masterclass" },
  { slug: 'elemis-masterclass', title: "Elemis Masterclass" },
  { slug: 'dermalogica-masterclass', title: "Dermalogica Masterclass" },
  { slug: 'comfort-zone-masterclass', title: "Comfort Zone Masterclass" },
  { slug: 'aromatherapy-associates-masterclass', title: "Aromatherapy Associates Masterclass" },
  { slug: 'natura-bisse-masterclass', title: "Natura Bisse Masterclass" },
  { slug: 'voya-masterclass', title: "VOYA Masterclass" },
  { slug: 'bamford-masterclass', title: "Bamford Masterclass" },
  { slug: 'wildsmith-masterclass', title: "Wildsmith Skin Masterclass" },
  { slug: 'temple-spa-masterclass', title: "Temple Spa Masterclass" },
  { slug: '111skin-masterclass', title: "111SKIN Masterclass" },
  { slug: 'biologique-recherche-masterclass', title: "Biologique Recherche Masterclass" },
  { slug: 'sisley-masterclass', title: "Sisley Paris Masterclass" },
  { slug: 'la-mer-masterclass', title: "La Mer Masterclass" },
  { slug: 'valmont-masterclass', title: "Valmont Masterclass" },
  { slug: 'ground-wellbeing-masterclass', title: "Ground Wellbeing Masterclass" },
  { slug: 'kama-ayurveda-masterclass', title: "Kama Ayurveda Masterclass" },
  { slug: 'clarins-masterclass', title: "Clarins Masterclass" },
  { slug: 'sodashi-masterclass', title: "Sodashi Masterclass" },
  { slug: 'ila-spa-masterclass', title: "ila Spa Masterclass" },
  { slug: 'susanne-kaufmann-masterclass', title: "Susanne Kaufmann Masterclass" },
  { slug: 'ishga-masterclass', title: "ishga Masterclass" },
  { slug: 'thalgo-masterclass', title: "Thalgo Masterclass" },
  { slug: 'guinot-masterclass', title: "Guinot Masterclass" },
  { slug: 'decleor-masterclass', title: "Decleor Masterclass" },
  { slug: 'image-skincare-masterclass', title: "IMAGE Skincare Masterclass" },
  { slug: 'medik8-masterclass', title: "Medik8 Masterclass" },
  { slug: 'murad-masterclass', title: "Murad Masterclass" },
  { slug: 'carol-joy-london-masterclass', title: "Carol Joy London Masterclass" },
  { slug: 'cancer-care-awareness', title: "Cancer Care Awareness in the Spa" },
  { slug: 'menopause-aware-spa', title: "Menopause-Aware Treatments" },
  { slug: 'pregnancy-postnatal-spa', title: "Pregnancy & Post-Natal Treatments" },
  { slug: 'spa-manager-programme', title: "Talent House Professional Certificate in Spa Management" },
  { slug: 'spa-director-programme', title: "Talent House Professional Certificate in Spa & Wellness Leadership" },
]

const BY_SLUG = new Map(COURSE_TITLES.map(c => [c.slug, c.title]))

/** The course's title, or the slug back when nothing matches. */
export const courseTitle = (slug: string): string => BY_SLUG.get(slug) || slug

