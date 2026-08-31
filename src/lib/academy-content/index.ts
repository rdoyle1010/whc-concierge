import type { CourseContent } from '../academy-types'

// University-grade course content, one module per course, authored for the
// paid Academy. Lessons are index-matched to academy.ts - if a course's
// lessons ever change, its content file changes in step.

import consultationExcellence from './consultation-excellence'
import retailExcellence from './retail-excellence'
import fiveStarService from './five-star-service'
import lqaForbesStandards from './lqa-forbes-standards'
import healthSafetyHygiene from './health-safety-hygiene'
import roomStandards from './room-standards'
import upgradingTreatments from './upgrading-treatments'
import personalPresentation from './personal-presentation'
import perfectMassage from './perfect-massage'
import perfectFacial from './perfect-facial'
import brandKnowledge from './brand-knowledge'
import spaRevenueFundamentals from './spa-revenue-fundamentals'

const CONTENT: Record<string, CourseContent> = {
  'consultation-excellence': consultationExcellence,
  'retail-excellence': retailExcellence,
  'five-star-service': fiveStarService,
  'lqa-forbes-standards': lqaForbesStandards,
  'health-safety-hygiene': healthSafetyHygiene,
  'room-standards': roomStandards,
  'upgrading-treatments': upgradingTreatments,
  'personal-presentation': personalPresentation,
  'perfect-massage': perfectMassage,
  'perfect-facial': perfectFacial,
  'brand-knowledge': brandKnowledge,
  'spa-revenue-fundamentals': spaRevenueFundamentals,
}

import { MORE_CONTENT } from '../academy-more'

export const getCourseContent = (slug: string): CourseContent | null => CONTENT[slug] || MORE_CONTENT[slug] || null
