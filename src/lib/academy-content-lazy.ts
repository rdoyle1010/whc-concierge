import type { CourseContent } from './academy-types'

// The same course content, loaded one course at a time.
//
// academy-content/index.ts imports all forty-six courses statically, which is
// correct on the server and ruinous in the browser: the course page is a
// client component, so importing that index compiled every lesson of every
// course into the bundle. One chunk came to 1.4MB of lesson text, downloaded
// by anyone who opened a single course - and by anyone who loaded a page that
// happened to share the chunk.
//
// Each entry below is its own dynamic import, so the bundler splits them and
// the browser fetches exactly the one course somebody asked to read.

type Loader = () => Promise<{ default: CourseContent }>

const LOADERS: Record<string, Loader> = {
  'consultation-excellence': () => import('./academy-content/consultation-excellence'),
  'retail-excellence': () => import('./academy-content/retail-excellence'),
  'five-star-service': () => import('./academy-content/five-star-service'),
  'lqa-forbes-standards': () => import('./academy-content/lqa-forbes-standards'),
  'health-safety-hygiene': () => import('./academy-content/health-safety-hygiene'),
  'room-standards': () => import('./academy-content/room-standards'),
  'upgrading-treatments': () => import('./academy-content/upgrading-treatments'),
  'personal-presentation': () => import('./academy-content/personal-presentation'),
  'perfect-massage': () => import('./academy-content/perfect-massage'),
  'perfect-facial': () => import('./academy-content/perfect-facial'),
  'brand-knowledge': () => import('./academy-content/brand-knowledge'),
  'spa-revenue-fundamentals': () => import('./academy-content/spa-revenue-fundamentals'),
  '111skin-masterclass': () => import('./academy-more/111skin-masterclass.content').then(m => ({ default: m.content })),
  'aromatherapy-associates-masterclass': () => import('./academy-more/aromatherapy-associates-masterclass.content').then(m => ({ default: m.content })),
  'bamford-masterclass': () => import('./academy-more/bamford-masterclass.content').then(m => ({ default: m.content })),
  'biologique-recherche-masterclass': () => import('./academy-more/biologique-recherche-masterclass.content').then(m => ({ default: m.content })),
  'cancer-care-awareness': () => import('./academy-more/cancer-care-awareness.content').then(m => ({ default: m.content })),
  'clarins-masterclass': () => import('./academy-more/clarins-masterclass.content').then(m => ({ default: m.content })),
  'comfort-zone-masterclass': () => import('./academy-more/comfort-zone-masterclass.content').then(m => ({ default: m.content })),
  'decleor-masterclass': () => import('./academy-more/decleor-masterclass.content').then(m => ({ default: m.content })),
  'dermalogica-masterclass': () => import('./academy-more/dermalogica-masterclass.content').then(m => ({ default: m.content })),
  'elemis-masterclass': () => import('./academy-more/elemis-masterclass.content').then(m => ({ default: m.content })),
  'espa-masterclass': () => import('./academy-more/espa-masterclass.content').then(m => ({ default: m.content })),
  'ground-wellbeing-masterclass': () => import('./academy-more/ground-wellbeing-masterclass.content').then(m => ({ default: m.content })),
  'guinot-masterclass': () => import('./academy-more/guinot-masterclass.content').then(m => ({ default: m.content })),
  'ila-spa-masterclass': () => import('./academy-more/ila-spa-masterclass.content').then(m => ({ default: m.content })),
  'image-skincare-masterclass': () => import('./academy-more/image-skincare-masterclass.content').then(m => ({ default: m.content })),
  'ishga-masterclass': () => import('./academy-more/ishga-masterclass.content').then(m => ({ default: m.content })),
  'kama-ayurveda-masterclass': () => import('./academy-more/kama-ayurveda-masterclass.content').then(m => ({ default: m.content })),
  'la-mer-masterclass': () => import('./academy-more/la-mer-masterclass.content').then(m => ({ default: m.content })),
  'medik8-masterclass': () => import('./academy-more/medik8-masterclass.content').then(m => ({ default: m.content })),
  'menopause-aware-spa': () => import('./academy-more/menopause-aware-spa.content').then(m => ({ default: m.content })),
  'murad-masterclass': () => import('./academy-more/murad-masterclass.content').then(m => ({ default: m.content })),
  'natura-bisse-masterclass': () => import('./academy-more/natura-bisse-masterclass.content').then(m => ({ default: m.content })),
  'pregnancy-postnatal-spa': () => import('./academy-more/pregnancy-postnatal-spa.content').then(m => ({ default: m.content })),
  'sisley-masterclass': () => import('./academy-more/sisley-masterclass.content').then(m => ({ default: m.content })),
  'sodashi-masterclass': () => import('./academy-more/sodashi-masterclass.content').then(m => ({ default: m.content })),
  'spa-director-programme': () => import('./academy-more/spa-director-programme.content').then(m => ({ default: m.content })),
  'spa-manager-programme': () => import('./academy-more/spa-manager-programme.content').then(m => ({ default: m.content })),
  'susanne-kaufmann-masterclass': () => import('./academy-more/susanne-kaufmann-masterclass.content').then(m => ({ default: m.content })),
  'temple-spa-masterclass': () => import('./academy-more/temple-spa-masterclass.content').then(m => ({ default: m.content })),
  'thalgo-masterclass': () => import('./academy-more/thalgo-masterclass.content').then(m => ({ default: m.content })),
  'valmont-masterclass': () => import('./academy-more/valmont-masterclass.content').then(m => ({ default: m.content })),
  'voya-masterclass': () => import('./academy-more/voya-masterclass.content').then(m => ({ default: m.content })),
  'wildsmith-masterclass': () => import('./academy-more/wildsmith-masterclass.content').then(m => ({ default: m.content })),
}

export async function loadCourseContent(slug: string): Promise<CourseContent | null> {
  const load = LOADERS[slug]
  if (!load) return null
  try {
    return (await load()).default ?? null
  } catch {
    // A course whose module fails to load should leave the page saying so,
    // not crash it.
    return null
  }
}
