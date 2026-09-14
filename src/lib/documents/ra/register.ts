import type { PlanSection } from '../plan-types'
import { HOW_TO_USE, SCORING, SIGN_OFF, ACTION_PLAN } from './method'
import { COSHH_POOL, COSHH_CLEANING, COSHH_TREATMENT, COSHH_SANITISER } from './coshh'
import { ELECTRICAL, FIRE, HEIGHT_AND_HANDLING, SLIPS, ENVIRONMENT } from './physical'
import { INFECTION, PEOPLE_HAZARDS, VULNERABLE } from './people-and-infection'
import {
  POOL_SURROUND_HAZARDS, COLD_PLUNGE_HAZARDS, HYDROTHERAPY_HAZARDS, HEAT_EXPERIENCE_HAZARDS,
} from '../risk-assessments'

// The register, organised by hazard type.
//
// This started as twelve assessments by area. Organised by hazard is how an
// inspector reads one and how the frameworks are written, and it removes the
// duplication that by-area produces: manual handling appeared in five of the
// twelve, and each copy drifted.
//
// Each document is one hazard category containing several assessments. The
// alternative, one document per line, produces five hundred documents and is
// paperwork theatre: nobody reads them, nobody reviews them, and the register
// becomes a cupboard rather than a control.

export type RegisterEntry = {
  reference: string
  title: string
  intro: string
  sections: PlanSection[]
}

const assess = (heading: string, intro: string, hazards: any[]): PlanSection => ({
  part: 'Hazards, controls and risk rating',
  heading,
  intro,
  hazards,
  mustBeChecked: true,
})

const document = (
  reference: string,
  title: string,
  intro: string,
  assessments: PlanSection[],
): RegisterEntry => ({
  reference,
  title,
  intro,
  sections: [HOW_TO_USE, SCORING, ...assessments, ACTION_PLAN, SIGN_OFF],
})

export const RISK_REGISTER: RegisterEntry[] = [
  document(
    'SPA-COSHH-RA-001',
    'Risk Assessment: Substances Hazardous to Health',
    'Every chemical and product used anywhere in the spa: pool water treatment, cleaning, treatment products '
    + 'and hand sanitiser. Confirm each against your own safety data sheets.',
    [
      assess('Pool water treatment chemicals', 'Handling, dosing, delivery and storage of chemicals used to treat the water.', COSHH_POOL),
      assess('Cleaning chemicals', 'Products used to clean and disinfect the spa, in occupied and closed areas.', COSHH_CLEANING),
      assess('Spa treatment products', 'Oils, aromatherapy blends, wax, nail products and everything applied to a guest.', COSHH_TREATMENT),
      assess('Alcohol-based hand sanitiser', 'Added to most buildings without being assessed, usually beside a fire door.', COSHH_SANITISER),
    ],
  ),
  document(
    'SPA-ELECTRICAL-RA-002',
    'Risk Assessment: Electrical Safety',
    'Fixed installation and equipment across the spa, in an environment that is wet, humid and chemically '
    + 'corrosive, which degrades equipment faster than a dry building assumes.',
    [assess('Electrical equipment across the spa', 'Plant room, heat cabins, gym, treatment rooms and the general installation.', ELECTRICAL)],
  ),
  document(
    'SPA-FIRE-RA-003',
    'Risk Assessment: Fire Safety',
    'The fire hazards specific to a spa, and evacuating people who are wet, barefoot and behind closed doors. '
    + 'It does not replace the premises fire risk assessment: read it alongside.',
    [assess('Fire hazards and means of escape', 'Chemical store, sauna, linen, gym, escape routes and alcohol gel.', FIRE)],
  ),
  document(
    'SPA-INFECTION-RA-004',
    'Risk Assessment: Infection Control and Water Hygiene',
    'Legionella, pool water contamination, blood and body fluids, fungal infection, linen and treatment room '
    + 'cross-contamination.',
    [assess('Infection and water hygiene', 'The hazards that spread rather than injure, and the ones an outbreak is traced back to.', INFECTION)],
  ),
  document(
    'SPA-HANDLING-RA-005',
    'Risk Assessment: Manual Handling and Work at Height',
    'Linen, chemical containers, furniture and equipment, and the work done above head height in a corrosive '
    + 'building.',
    [assess('Manual handling and work at height', 'Including work over water, which needs its own arrangement.', HEIGHT_AND_HANDLING)],
  ),
  document(
    'SPA-SLIPS-RA-006',
    'Risk Assessment: Slips, Trips and Falls',
    'The most common injury in a spa, across every area, on floors that are wet by design and walked on '
    + 'barefoot.',
    [assess('Slips, trips and falls by area', 'Pool surround, changing and showers, thermal suite, gym floor and treatment rooms.', SLIPS)],
  ),
  document(
    'SPA-ENVIRONMENT-RA-007',
    'Risk Assessment: Noise, Heat, Burns and Environmental',
    'Noise in the gym and the plant room, heat stress in staff who are in it all shift, burns from hot '
    + 'surfaces, and discharge to drain.',
    [assess('Physical environment and discharge', 'The hazards of the building itself, including the one where the harm is not to a person.', ENVIRONMENT)],
  ),
  document(
    'SPA-PEOPLE-RA-008',
    'Risk Assessment: Lone Working, Violence and Ergonomics',
    'Working alone, being on the receiving end of aggression, sitting at a screen, and the slow injury that '
    + 'ends a therapist’s career.',
    [assess('Staff safety and wellbeing', 'The hazards that rarely produce an incident report and regularly end careers.', PEOPLE_HAZARDS)],
  ),
  document(
    'SPA-VULNERABLE-RA-009',
    'Risk Assessment: Vulnerable Persons, Contractors and First Aid',
    'New and expectant mothers, young workers, vulnerable guests, contractors, and whether first aid provision '
    + 'is adequate for a spa rather than inherited from a hotel.',
    [assess('People needing particular consideration', 'The groups the frameworks name specifically, and the provision that protects them.', VULNERABLE)],
  ),
  document(
    'SPA-POOL-RA-010',
    'Risk Assessment: Swimming Pool and Surround',
    'Every pool of swimming depth, its surround, its entry points and the walkways serving it.',
    [assess('Swimming pool hazards', 'Drowning, entrapment, diving, slips and glass.', POOL_SURROUND_HAZARDS)],
  ),
  document(
    'SPA-COLD-RA-011',
    'Risk Assessment: Cold Plunge and Ice Experiences',
    'Every cold plunge, ice bath, ice fountain and cold experience shower. Assessed separately from the pool '
    + 'because cold water shock is a different mechanism with a different severity.',
    [assess('Cold immersion hazards', 'Cold water shock, cardiac events, and the surround.', COLD_PLUNGE_HAZARDS)],
  ),
  document(
    'SPA-HYDRO-RA-012',
    'Risk Assessment: Hydrotherapy and Spa Pools',
    'Every warm, aerated or agitated pool. Assessed separately because warm plus aerated plus agitated is the '
    + 'highest-risk water configuration there is.',
    [assess('Hydrotherapy and spa pool hazards', 'Scalding, legionella, overheating and dosing.', HYDROTHERAPY_HAZARDS)],
  ),
  document(
    'SPA-THERMAL-RA-013',
    'Risk Assessment: Saunas, Steam Rooms and Heat Experiences',
    'Every sauna, steam room, laconium, caldarium, infrared cabin and heated experience space.',
    [assess('Heat experience hazards', 'Heat exhaustion, burns, slips and the products used inside them.', HEAT_EXPERIENCE_HAZARDS)],
  ),
]
