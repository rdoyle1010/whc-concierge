import type { PlanDocument } from './plan-types'
import { POOL_NOP_SECTIONS } from './pool-nop'
import { GOVERNANCE_SECTIONS } from './nop/governance'
import { HEAT_SECTIONS } from './nop/heat-and-hydro'
import { TREATMENT_SECTIONS } from './nop/treatments'
import { GYM_SECTIONS, FRONT_SECTIONS } from './nop/gym-and-front'
import { PLANT_SECTIONS, HYGIENE_SECTIONS, ROUTINE_SECTIONS } from './nop/plant-and-routines'
import { PEOPLE_SECTIONS, SECURITY_SECTIONS, CONTINUITY_SECTIONS } from './nop/people-and-continuity'
import { APPENDIX_SECTIONS } from './nop/appendices'
import { POOL_EAP_SECTIONS, FIRE_EAP_SECTIONS } from './pool-eap'
import { COMMAND_SECTIONS } from './eap/command'
import { MEDICAL_SECTIONS } from './eap/medical'
import { CHEMICAL_SECTIONS, HEALTH_SECTIONS, BUILDING_SECTIONS } from './eap/facility'
import {
  PEOPLE_EMERGENCY_SECTIONS, AFTER_SECTIONS, DRILL_SECTIONS, EAP_APPENDIX_SECTIONS,
} from './eap/people-and-after'

// The two halves of a Pool Safety Operating Procedure, as documents.
//
// They are issued separately because they are used separately: the NOP lives
// in a folder and is read once by each new starter, and the EAP is laminated
// and goes on a wall. Each points at the other, because an emergency plan
// that does not name the bather load and a normal procedure that does not say
// how to raise the alarm are each half an answer.

const asDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

// The framework, named plainly.
//
// An assessor expects to see it and a document that dances around it reads as
// evasive. What is never done is citing a section number or telling a
// property what the law requires of them: this says what each framework
// covers, and the property confirms what applies to it and where.
export const UK_SPA_FRAMEWORK = [
  { name: 'Health and Safety at Work etc. Act 1974', covers: 'The general duty on an employer to protect employees and anybody else affected by the work, so far as is reasonably practicable.' },
  { name: 'Management of Health and Safety at Work Regulations', covers: 'The requirement to assess risk, record the assessment, appoint competent people and put arrangements in place.' },
  { name: 'HSG179 Health and safety in swimming pools', covers: 'The guidance a pool operator is judged against, including the requirement for a written pool safety operating procedure in two parts: the normal operating procedure and the emergency action plan.' },
  { name: 'HSG282 Control of legionella and other infectious agents in spa-pool systems', covers: 'Warm water systems that create an aerosol, including hydrotherapy pools, spa baths and hot tubs.' },
  { name: 'Approved Code of Practice L8, legionnaires disease', covers: 'The duty to assess and control the risk of legionella across the whole water system, not only the pools.' },
  { name: 'Control of Substances Hazardous to Health Regulations', covers: 'Assessment and control of every chemical used, including pool chemicals, cleaning products and treatment products.' },
  { name: 'Regulatory Reform (Fire Safety) Order 2005', covers: 'The fire risk assessment, the means of escape and the arrangements for evacuating everybody present.' },
  { name: 'Provision and Use of Work Equipment Regulations', covers: 'Equipment being suitable, maintained, inspected and used by people trained to use it.' },
  { name: 'Reporting of Injuries, Diseases and Dangerous Occurrences Regulations', covers: 'What must be reported to the enforcing authority, by when, and by whom.' },
  { name: 'Health and Safety (First-Aid) Regulations', covers: 'Adequate first aid provision, equipment and trained people for the operation and its risks.' },
  { name: 'Manual Handling Operations Regulations', covers: 'Avoiding, assessing and reducing manual handling risk, including the handling therapists do all day.' },
  { name: 'Equality Act 2010', covers: 'Reasonable adjustments for disabled guests and employees, and access to the facilities offered.' },
  { name: 'UK GDPR and the Data Protection Act 2018', covers: 'Guest records generally, and health information in particular, which is special category data.' },
  { name: 'Food Information Regulations', covers: 'Allergen information, where the spa serves anything to eat or drink.' },
]

export const POOL_NOP_REFERENCE = 'SPA-OPERATIONS-NOP-001'
export const POOL_EAP_REFERENCE = 'SPA-OPERATIONS-EAP-002'

function base(reference: string) {
  const issued = new Date()
  const review = new Date(issued)
  review.setFullYear(review.getFullYear() + 1)

  return {
    reference,
    version: '0.1',
    issued: asDate(issued),
    reviewBy: asDate(review),
    property: '[property name]',
    department: 'SPA OPERATIONS',
    accountability: {
      author: 'Talent House Collective',
      authorRole: 'Spa operations',
      owner: '[owner role]',
    },
    governance: [
      'HSG179 Health and safety in swimming pools',
      'Talent House Collective operational standards',
    ],
    revisions: [{ date: asDate(issued), by: 'Talent House Collective', description: 'Issued as a template, version 0.1.' }],
  }
}

export function poolNop(): PlanDocument {
  return {
    ...base(POOL_NOP_REFERENCE),
    kind: 'nop',
    title: 'Spa and Wellness: Normal Operating Procedure',
    department: 'SPA OPERATIONS',
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      'How this property runs its entire spa and wellness operation on an ordinary day. Nine parts: who is '
      + 'accountable and who is competent; the pools and wet areas; the heat, cold and hydrotherapy experiences; '
      + 'the treatment rooms; the gym and studios; reception, retail and back of house; the plant, water safety '
      + 'and chemicals; cleaning and hygiene; the routine that holds it together, day by day and year by year; '
      + 'children, groups and conduct; security, keys and information; and incidents, complaints and continuity. '
      + 'The final part is the blank record sheets the rest of it refers to, ready to print. It is one half of '
      + 'the safety operating procedure. The other half is the Emergency Action Plan.',
    scope:
      'Applies to every person who works in, supervises, cleans, tests, doses, instructs or manages any part of '
      + 'the spa, and to any outside organisation using it. Most of this document is blank when it arrives, and '
      + 'those blanks are the document: the dimensions, the loads, the positions, the names and the hours are '
      + 'facts about one building, and nobody who has not walked it may state them.',
    sections: [
      ...GOVERNANCE_SECTIONS,
      ...POOL_NOP_SECTIONS,
      ...HEAT_SECTIONS,
      ...TREATMENT_SECTIONS,
      ...GYM_SECTIONS,
      ...FRONT_SECTIONS,
      ...PLANT_SECTIONS,
      ...HYGIENE_SECTIONS,
      ...ROUTINE_SECTIONS,
      ...PEOPLE_SECTIONS,
      ...SECURITY_SECTIONS,
      ...CONTINUITY_SECTIONS,
      ...APPENDIX_SECTIONS,
    ],
    references: [
      { name: 'Spa and Wellness: Emergency Action Plan', reference: POOL_EAP_REFERENCE },
    ],
  }
}

export function poolEap(): PlanDocument {
  return {
    ...base(POOL_EAP_REFERENCE),
    kind: 'eap',
    title: 'Spa and Wellness: Emergency Action Plan',
    legalFramework: UK_SPA_FRAMEWORK,
    summary:
      'What each person does, in order, in the first minutes of an emergency anywhere in the spa. Every '
      + 'emergency a spa gets: in the water, in a treatment room, in a heat cabin, in the gym, in the plant room '
      + 'and in the building itself. Written to be read at speed by somebody with wet hands, so it is one '
      + 'emergency per page with short actions and a named role against each. It is one half of the safety '
      + 'operating procedure. The other half is the Normal Operating Procedure.',
    scope:
      'Applies to every person working in or supervising any part of the spa, and to any outside organisation '
      + 'using it. The actions are general and hold in any building. Everything specific to this one - where the '
      + 'alarm is, the assembly point, the door the ambulance comes to, who holds the plant room key, who leads '
      + '- is blank, and must be completed and briefed before this plan is relied on. A plan nobody has been '
      + 'briefed on is a plan nobody follows.',
    sections: [
      ...COMMAND_SECTIONS,
      ...POOL_EAP_SECTIONS,
      ...MEDICAL_SECTIONS,
      ...FIRE_EAP_SECTIONS,
      ...CHEMICAL_SECTIONS,
      ...HEALTH_SECTIONS,
      ...BUILDING_SECTIONS,
      ...PEOPLE_EMERGENCY_SECTIONS,
      ...AFTER_SECTIONS,
      ...DRILL_SECTIONS,
      ...EAP_APPENDIX_SECTIONS,
    ],
    references: [
      { name: 'Spa and Wellness: Normal Operating Procedure', reference: POOL_NOP_REFERENCE },
    ],
  }
}

export const POOL_PLANS = [
  { reference: POOL_NOP_REFERENCE, build: poolNop },
  { reference: POOL_EAP_REFERENCE, build: poolEap },
]

/**
 * The two plans as catalogue entries, so they can be listed and sold.
 *
 * Deliberately not in LIBRARY_PLAN. That list drives the department packs,
 * and a two-document department would be offered at seventy-eight pounds by
 * the "never more than its parts" rule, which is the right rule applied to
 * the wrong thing: a pool safety operating procedure is the document an
 * insurer asks for first and a consultancy charges four figures to produce.
 * It is priced as its own pack instead.
 */
export const POOL_PLAN_ENTRIES = [
  {
    reference: POOL_NOP_REFERENCE,
    title: 'Spa and Wellness: Normal Operating Procedure',
    department: 'SPA OPERATIONS',
    tier: 'day-1' as const,
    why: 'Required in writing before a pool opens',
  },
  {
    reference: POOL_EAP_REFERENCE,
    title: 'Pool and Wet Areas: Emergency Action Plan',
    department: 'SPA OPERATIONS',
    tier: 'day-1' as const,
    why: 'Required in writing before a pool opens',
  },
]
