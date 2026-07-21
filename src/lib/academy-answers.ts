// WHC Academy answer keys - SERVER-SIDE ONLY. Imported exclusively by
// /api/academy; never import this from a client component, or the answers
// ship in the browser bundle.

import { MORE_ANSWERS } from './academy-more-answers'

export const ACADEMY_ANSWERS: Record<string, number[]> = {
  ...MORE_ANSWERS,
  'consultation-excellence': [1, 1, 2, 1, 1, 1, 1, 1],
  'retail-excellence': [1, 1, 1, 1, 1, 1, 1, 0],
  'five-star-service': [1, 1, 1, 1, 1, 0, 1, 1],
  'lqa-forbes-standards': [1, 1, 1, 1, 0, 1, 1, 1],
  'health-safety-hygiene': [1, 1, 1, 1, 1, 1, 1, 1, 1],
  'room-standards': [1, 1, 1, 1, 1, 1, 1, 1],
  'upgrading-treatments': [1, 1, 1, 1, 1, 1, 1, 1],
  'personal-presentation': [1, 1, 1, 1, 1, 1, 1, 1],
  'perfect-massage': [1, 1, 1, 1, 1, 0, 1, 1],
  'perfect-facial': [1, 1, 1, 1, 0, 1, 1, 1],
  'brand-knowledge': [1, 1, 1, 1, 0, 1, 1, 1],
}
