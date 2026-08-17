// Registry of additional Academy courses: brand masterclasses, specialist
// care and premium management programmes. Each pack exports { course,
// extras, content }. Answer keys remain server-only.

import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

import * as espa from './espa-masterclass'
import * as elemis from './elemis-masterclass'
import * as dermalogica from './dermalogica-masterclass'
import * as comfortZone from './comfort-zone-masterclass'
import * as aromatherapyAssociates from './aromatherapy-associates-masterclass'
import * as naturaBisse from './natura-bisse-masterclass'
import * as voya from './voya-masterclass'
import * as bamford from './bamford-masterclass'
import * as wildsmith from './wildsmith-masterclass'
import * as templeSpa from './temple-spa-masterclass'
import * as oneElevenSkin from './111skin-masterclass'
import * as biologiqueRecherche from './biologique-recherche-masterclass'
import * as sisley from './sisley-masterclass'
import * as laMer from './la-mer-masterclass'
import * as valmont from './valmont-masterclass'
import * as groundWellbeing from './ground-wellbeing-masterclass'
import * as kamaAyurveda from './kama-ayurveda-masterclass'
import * as clarins from './clarins-masterclass'
import * as sodashi from './sodashi-masterclass'
import * as ilaSpa from './ila-spa-masterclass'
import * as susanneKaufmann from './susanne-kaufmann-masterclass'
import * as ishga from './ishga-masterclass'
import * as thalgo from './thalgo-masterclass'
import * as guinot from './guinot-masterclass'
import * as decleor from './decleor-masterclass'
import * as imageSkincare from './image-skincare-masterclass'
import * as medik8 from './medik8-masterclass'
import * as murad from './murad-masterclass'
import * as cancerCare from './cancer-care-awareness'
import * as menopause from './menopause-aware-spa'
import * as pregnancy from './pregnancy-postnatal-spa'
import * as spaManager from './spa-manager-programme'
import * as spaDirector from './spa-director-programme'

type Pack = { course: AcademyCourse; extras: CourseExtras; content: CourseContent }

const PACKS: Pack[] = [
  espa, elemis, dermalogica, comfortZone, aromatherapyAssociates, naturaBisse, voya, bamford, wildsmith, templeSpa, oneElevenSkin, biologiqueRecherche, sisley, laMer, valmont, groundWellbeing, kamaAyurveda, clarins, sodashi, ilaSpa, susanneKaufmann, ishga, thalgo, guinot, decleor, imageSkincare, medik8, murad, cancerCare, menopause, pregnancy, spaManager, spaDirector,
] as unknown as Pack[]

export const MORE_COURSES: AcademyCourse[] = PACKS.map(p => p.course)
export const MORE_EXTRAS: Record<string, CourseExtras> = Object.fromEntries(PACKS.map(p => [p.course.slug, p.extras]))
export const MORE_CONTENT: Record<string, CourseContent> = Object.fromEntries(PACKS.map(p => [p.course.slug, p.content]))
