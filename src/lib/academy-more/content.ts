import type { CourseContent } from '../academy-types'

// Every masterclass lesson, statically. This is for the server, which
// renders and validates courses and has no reason to load them one at a
// time. The browser must never import this: use academy-content-lazy,
// which fetches the single course somebody asked to read.

import { content as c0 } from './111skin-masterclass.content'
import { content as c1 } from './aromatherapy-associates-masterclass.content'
import { content as c2 } from './bamford-masterclass.content'
import { content as c3 } from './biologique-recherche-masterclass.content'
import { content as c4 } from './cancer-care-awareness.content'
import { content as c5 } from './clarins-masterclass.content'
import { content as c6 } from './comfort-zone-masterclass.content'
import { content as c7 } from './decleor-masterclass.content'
import { content as c8 } from './dermalogica-masterclass.content'
import { content as c9 } from './elemis-masterclass.content'
import { content as c10 } from './espa-masterclass.content'
import { content as c11 } from './ground-wellbeing-masterclass.content'
import { content as c12 } from './guinot-masterclass.content'
import { content as c13 } from './ila-spa-masterclass.content'
import { content as c14 } from './image-skincare-masterclass.content'
import { content as c15 } from './ishga-masterclass.content'
import { content as c16 } from './kama-ayurveda-masterclass.content'
import { content as c17 } from './la-mer-masterclass.content'
import { content as c18 } from './medik8-masterclass.content'
import { content as c19 } from './menopause-aware-spa.content'
import { content as c20 } from './murad-masterclass.content'
import { content as c21 } from './natura-bisse-masterclass.content'
import { content as c22 } from './pregnancy-postnatal-spa.content'
import { content as c23 } from './sisley-masterclass.content'
import { content as c24 } from './sodashi-masterclass.content'
import { content as c25 } from './spa-director-programme.content'
import { content as c26 } from './spa-manager-programme.content'
import { content as c27 } from './susanne-kaufmann-masterclass.content'
import { content as c28 } from './temple-spa-masterclass.content'
import { content as c29 } from './thalgo-masterclass.content'
import { content as c30 } from './valmont-masterclass.content'
import { content as c31 } from './voya-masterclass.content'
import { content as c32 } from './wildsmith-masterclass.content'

export const MORE_CONTENT: Record<string, CourseContent> = {
  '111skin-masterclass': c0,
  'aromatherapy-associates-masterclass': c1,
  'bamford-masterclass': c2,
  'biologique-recherche-masterclass': c3,
  'cancer-care-awareness': c4,
  'clarins-masterclass': c5,
  'comfort-zone-masterclass': c6,
  'decleor-masterclass': c7,
  'dermalogica-masterclass': c8,
  'elemis-masterclass': c9,
  'espa-masterclass': c10,
  'ground-wellbeing-masterclass': c11,
  'guinot-masterclass': c12,
  'ila-spa-masterclass': c13,
  'image-skincare-masterclass': c14,
  'ishga-masterclass': c15,
  'kama-ayurveda-masterclass': c16,
  'la-mer-masterclass': c17,
  'medik8-masterclass': c18,
  'menopause-aware-spa': c19,
  'murad-masterclass': c20,
  'natura-bisse-masterclass': c21,
  'pregnancy-postnatal-spa': c22,
  'sisley-masterclass': c23,
  'sodashi-masterclass': c24,
  'spa-director-programme': c25,
  'spa-manager-programme': c26,
  'susanne-kaufmann-masterclass': c27,
  'temple-spa-masterclass': c28,
  'thalgo-masterclass': c29,
  'valmont-masterclass': c30,
  'voya-masterclass': c31,
  'wildsmith-masterclass': c32,
}
