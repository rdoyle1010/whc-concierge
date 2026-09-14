import type { Hazard } from '../plan-types'

// COSHH. Five assessments, and the reason they are separate.
//
// Pool chemicals, cleaning chemicals, treatment products, bromine and alcohol
// gel behave differently, are handled by different people, and go wrong in
// different ways. One combined chemical assessment is the kind that gets
// signed and never used.
//
// Product ranges are named generically. A template that assesses one
// supplier's range is a template for the spas that use that supplier, and
// every property has to confirm its own products against its own safety data
// sheets anyway.

export const COSHH_POOL: Hazard[] = [
  {
    hazard: 'Exposure to pool water treatment chemicals during handling and dosing',
    whoIsAtRisk: 'Pool plant operators, maintenance staff, contractors',
    controlsToVerify: [
      'A COSHH assessment exists for every pool chemical held, and it is current',
      'Safety data sheets are held and reachable without entering the store',
      'Only named, trained people dose or handle chemicals, and the list is current',
      'Personal protective equipment is specified per task, provided, and worn',
      'Eyewash and emergency shower are within reach of the handling area and are checked',
      'Ventilation to the store and plant room works and is verified rather than assumed',
      'Containers are labelled and nothing is decanted into an unlabelled container',
      'A spill kit suitable for these chemicals is present and staff are trained to use it',
    ],
    note:
      'The exposure that hurts somebody is almost never the routine dose. It is the spill, the delivery, or the '
      + 'moment somebody decides to top something up without the protection on.',
  },
  {
    hazard: 'Mixing of incompatible pool chemicals, producing chlorine gas',
    whoIsAtRisk: 'Staff, guests, contractors, anybody in the building',
    controlsToVerify: [
      'Acid and hypochlorite are physically separated, by bunding or by separate stores',
      'Separation is physical rather than a label or a shelf marking',
      'Dosing lines are labelled and cannot be cross connected',
      'Deliveries are supervised so nothing is put in the wrong bund',
      'Empty containers are not reused for a different chemical',
      'Staff know that this one rule is absolute and understand why',
      'Gas detection or an alarm is fitted where the assessment requires it',
    ],
    note:
      'This is the highest consequence event in the building. It has injured more rescuers than bathers, because '
      + 'the instinct is to go in and see.',
  },
  {
    hazard: 'Chemical delivery, unloading and transfer into storage',
    whoIsAtRisk: 'Staff, delivery drivers, guests in adjacent areas',
    controlsToVerify: [
      'Deliveries are accepted only by a named, trained person',
      'A delivery is never accepted into an occupied or unsupervised area',
      'The delivery route avoids guest areas, or the area is cleared for it',
      'Quantities are limited to what the store is assessed to hold',
      'A written procedure covers what happens if the wrong chemical arrives',
      'Manual handling aids are available for drums and containers',
      'The driver is not left to place containers unsupervised',
    ],
  },
]

export const COSHH_CLEANING: Hazard[] = [
  {
    hazard: 'Exposure to cleaning chemicals during routine and deep cleaning',
    whoIsAtRisk: 'Cleaning staff, spa attendants, therapists, guests in adjacent areas',
    controlsToVerify: [
      'A COSHH assessment exists for every cleaning product in use',
      'Safety data sheets are held and accessible to the person using the product',
      'Dilution is controlled by a dosing system or measured equipment, never by judgement',
      'Personal protective equipment is provided, is the right specification, and is worn',
      'Products are never decanted into unlabelled containers',
      'Staff are trained on each product before they use it, and the training is recorded',
      'Contact times are known and observed',
      'No two products are ever used together, and staff know why that rule is absolute',
    ],
    note:
      'A disinfectant wiped off before its contact time has not worked, and the surface looks identical either '
      + 'way. That is a hygiene failure caused by a COSHH misunderstanding.',
  },
  {
    hazard: 'Occupational dermatitis from repeated wet work and chemical contact',
    whoIsAtRisk: 'Cleaning staff, spa attendants, therapists, laundry staff',
    controlsToVerify: [
      'Gloves suitable for the product and the task are provided and used',
      'Hands are dried properly rather than left damp inside gloves',
      'Skin care products are provided and their use is encouraged',
      'Staff are told what early dermatitis looks like and asked to report it',
      'Skin checks happen where the assessment identifies a need',
      'Tasks are rotated where possible so nobody does wet work all day every day',
    ],
    note:
      'Slow, cumulative, and it ends careers in this industry. It is also entirely preventable and almost never '
      + 'on a spa register.',
  },
  {
    hazard: 'Cleaning with chemicals while guests are present',
    whoIsAtRisk: 'Guests, cleaning staff',
    controlsToVerify: [
      'Products assessed as suitable for use around guests are identified, and only those are used',
      'Products requiring the area to be closed and ventilated are identified and used only then',
      'Wet floor signage is used and removed once the floor is dry',
      'Equipment and trailing cables never cross a guest route',
      'Spraying is avoided in occupied areas in favour of wiping',
      'Guests with respiratory conditions are considered in the choice of product',
    ],
  },
]

export const COSHH_TREATMENT: Hazard[] = [
  {
    hazard: 'Exposure to treatment products, essential oils and aromatherapy blends',
    whoIsAtRisk: 'Therapists, guests',
    controlsToVerify: [
      'Product information or safety data is held for everything in use',
      'Essential oils are used at the stated dilution and never neat on skin',
      'Ventilation in treatment rooms is adequate for the products used in them',
      'Therapists doing the same treatment repeatedly are considered separately from guests having it once',
      'Products are stored as the manufacturer requires',
      'Opened product life is tracked, not only shelf life',
      'Staff report any skin or respiratory symptoms, and those reports are acted on',
    ],
    note:
      'A guest meets a product once. A therapist meets it eight times a day for years, which is a completely '
      + 'different exposure and is what a COSHH assessment is actually for.',
  },
  {
    hazard: 'Nail, wax and solvent-based products',
    whoIsAtRisk: 'Therapists, guests, anybody in an adjoining room',
    controlsToVerify: [
      'Local extraction or adequate ventilation is provided where solvents or dust are produced',
      'Acetone and solvent-based removers are stored and used per the safety data sheet',
      'Wax heaters are thermostatically controlled and temperature checked before use',
      'Dust from filing is controlled at source rather than swept afterwards',
      'Gloves and eye protection are available where the product requires them',
      'Products are kept away from heat sources and naked flames',
    ],
  },
  {
    hazard: 'Guest allergic reaction to a product',
    whoIsAtRisk: 'Guests',
    controlsToVerify: [
      'A consultation records known allergies before every treatment',
      'Patch testing is carried out where the treatment requires it, with the stated interval',
      'Ingredient information can be produced for any product on request',
      'The therapist knows what to do if a reaction begins mid-treatment',
      'An adverse reaction procedure exists and the anaphylaxis page of the emergency plan is known',
      'Reactions are recorded, reported to the product house, and reviewed',
    ],
  },
]

export const COSHH_SANITISER: Hazard[] = [
  {
    hazard: 'Alcohol-based hand sanitiser: fire risk and accumulation',
    whoIsAtRisk: 'Guests, staff',
    controlsToVerify: [
      'Dispensers are not sited on escape routes where they would obstruct or add fuel',
      'Dispensers are away from ignition sources, heaters and electrical fittings',
      'Bulk stock is stored in line with the quantity limits in the fire risk assessment',
      'Spillage under a dispenser is cleaned rather than allowed to accumulate',
      'The fire risk assessment has been updated to include them',
    ],
    note:
      'Added to thousands of buildings without being assessed, usually on a wall beside a fire door. Alcohol gel '
      + 'is flammable and a corridor full of it changes the fire loading of an escape route.',
  },
  {
    hazard: 'Ingestion or eye contact with sanitiser, particularly by children',
    whoIsAtRisk: 'Children, guests, staff',
    controlsToVerify: [
      'Dispensers are sited at a height that considers unsupervised children',
      'Eye irritation from splashing is covered in first aid guidance',
      'Product information is held',
      'Sanitiser is not sited immediately beside a drinking water station where it could be confused',
    ],
  },
]
