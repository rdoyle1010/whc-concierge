// The names of the documents, without the documents.
//
// GENERATED. Run `npx tsx scripts/build-catalogue-index.ts` after changing a
// register, and the test in tests/nothing-paid-in-the-bundle.test.ts will tell
// you if you forget.
//
// The shop lists every title, so the browser needs the titles. It was getting
// them by importing the entry lists out of the plan modules, and each of those
// builds its list from a register that holds the finished text. A generated
// catalogue index was not the point of that import, but a four hundred and
// forty kilobyte chunk containing the hazard prose out of the seven hundred
// and fifty pound risk assessment suite was the result of it: the product,
// readable in the page source, by anyone, for nothing.
//
// So the listing fields are written out here as flat data with no import back
// to the registers, and everything a browser touches reads this. The registers
// stay the source of truth; this is their shadow, and the test keeps the two
// the same shape.

import type { PlannedDocument } from './library-plan'

export const POOL_INDEX: PlannedDocument[] = [
  { reference: 'SPA-OPERATIONS-NOP-001', title: 'Spa and Wellness: Normal Operating Procedure', department: 'SPA OPERATIONS', tier: 'day-1', why: 'Required in writing before a pool opens' },
  { reference: 'SPA-OPERATIONS-EAP-002', title: 'Pool and Wet Areas: Emergency Action Plan', department: 'SPA OPERATIONS', tier: 'day-1', why: 'Required in writing before a pool opens' },
]

export const RISK_ASSESSMENT_INDEX: PlannedDocument[] = [
  { reference: 'SPA-COSHH-RA-001', title: 'Risk Assessment: Substances Hazardous to Health', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-ELECTRICAL-RA-002', title: 'Risk Assessment: Electrical Safety', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-FIRE-RA-003', title: 'Risk Assessment: Fire Safety', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-INFECTION-RA-004', title: 'Risk Assessment: Infection Control and Water Hygiene', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-HANDLING-RA-005', title: 'Risk Assessment: Manual Handling and Work at Height', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-SLIPS-RA-006', title: 'Risk Assessment: Slips, Trips and Falls', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-ENVIRONMENT-RA-007', title: 'Risk Assessment: Noise, Heat, Burns and Environmental', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-PEOPLE-RA-008', title: 'Risk Assessment: Lone Working, Violence and Ergonomics', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-VULNERABLE-RA-009', title: 'Risk Assessment: Vulnerable Persons, Contractors and First Aid', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-POOL-RA-010', title: 'Risk Assessment: Swimming Pool and Surround', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-COLD-RA-011', title: 'Risk Assessment: Cold Plunge and Ice Experiences', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-HYDRO-RA-012', title: 'Risk Assessment: Hydrotherapy and Spa Pools', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
  { reference: 'SPA-THERMAL-RA-013', title: 'Risk Assessment: Saunas, Steam Rooms and Heat Experiences', department: 'HEALTH AND SAFETY', tier: 'day-1', why: 'A written risk assessment is required before the area is used' },
]

export const GUIDE_INDEX: PlannedDocument[] = [
  { reference: 'SPA-OPERATIONS-GDE-003', title: 'How to Complete Your Spa Safety Operating Procedure', department: 'SPA OPERATIONS', tier: 'day-1', why: 'Included free with the safety operating procedure' },
  { reference: 'SPA-OPERATIONS-TRG-004', title: 'Training Your Team on the Safety Operating Procedure', department: 'SPA OPERATIONS', tier: 'day-1', why: 'Included free with the safety operating procedure' },
]

export const CHECKLIST_INDEX: PlannedDocument[] = [
  { reference: 'REC-OPENING-CHK-501', title: 'Checklist: Reception Opening Shift', department: 'RECEPTION TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'REC-MIDSHIFT-CHK-502', title: 'Checklist: Reception Mid Shift', department: 'RECEPTION TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'REC-CLOSING-CHK-503', title: 'Checklist: Reception Late Shift and Close', department: 'RECEPTION TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'THER-OPENING-CHK-504', title: 'Checklist: Therapist Opening', department: 'SPA THERAPISTS', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'THER-CLOSING-CHK-505', title: 'Checklist: Therapist Closing', department: 'SPA THERAPISTS', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'CLN-OPENING-CHK-506', title: 'Checklist: Cleaning Opening Shift', department: 'HOUSEKEEPING TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'CLN-CLOSING-CHK-507', title: 'Checklist: Cleaning Closing Shift', department: 'HOUSEKEEPING TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'OPS-DUTYDAY-CHK-508', title: 'Checklist: Duty Manager Daily', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'OPS-WEEKLY-CHK-509', title: 'Checklist: Weekly Maintenance, Safety and Training', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'THER-OPEN-SAFETY-CHK-221', title: 'Checklist: Pool and Thermal Opening', department: 'POOL TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'THER-CLOSE-SAFETY-CHK-222', title: 'Checklist: Pool and Thermal Closing', department: 'POOL TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'THER-WATER-HOURLY-CHK-SOP-226', title: 'Checklist: Hourly Water Quality Spot Check', department: 'POOL TEAM', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'GYM-OPEN-SAFETY-CHK-245', title: 'Checklist: Gym Floor and Studio Opening', department: 'GYM FLOOR TEAM - PERSONAL TRAINERS', tier: 'day-1', why: 'The daily running sheet for that shift.' },
  { reference: 'GYM-CLOSE-CHK-246', title: 'Checklist: Gym Floor and Studio Closing', department: 'GYM FLOOR TEAM - PERSONAL TRAINERS', tier: 'day-1', why: 'The daily running sheet for that shift.' },
]

export const FINANCE_INDEX: PlannedDocument[] = [
  { reference: 'FIN-DASHBOARD-RPT-601', title: 'Spa Director Dashboard', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-TRADING-RPT-602', title: 'Daily Trading Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Daily management reporting.' },
  { reference: 'FIN-CAPACITY-RPT-603', title: 'Revenue and Capacity Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Weekly management reporting.' },
  { reference: 'FIN-PACE-RPT-604', title: 'Forward Booking and Pace Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Weekly management reporting.' },
  { reference: 'FIN-TREATMENT-RPT-605', title: 'Treatment Performance Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-THERAPIST-RPT-606', title: 'Therapist Productivity Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-RETAIL-RPT-607', title: 'Retail Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-MEMBERSHIP-RPT-608', title: 'Membership Dashboard', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-GUEST-RPT-609', title: 'Guest and CRM Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-CHANNEL-RPT-610', title: 'Commercial Channel Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-DISCOUNT-RPT-611', title: 'Discount and Yield Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-VOUCHER-RPT-612', title: 'Gift Voucher Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-PAYROLL-RPT-613', title: 'Payroll and Labour Productivity Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-PANDL-RPT-614', title: 'Departmental Profit and Loss', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-STOCK-RPT-615', title: 'Stock and Inventory Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-COMPLAINTS-RPT-616', title: 'Complaints and Service Recovery Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-QUALITY-RPT-617', title: 'Quality and Standards Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-SAFETY-RPT-618', title: 'Health, Safety and Compliance Dashboard', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-MARKETING-RPT-619', title: 'Marketing Performance Report', department: 'FINANCE TEAM', tier: 'month-1', why: 'Monthly management reporting.' },
  { reference: 'FIN-ACTIONS-RPT-620', title: 'Management Action Tracker', department: 'FINANCE TEAM', tier: 'month-1', why: 'Continuous management reporting.' },
]

export const JOB_DESCRIPTION_INDEX: PlannedDocument[] = [
  { reference: 'MGT-SPADIRECTOR-JD-701', title: 'Spa Director', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'MGT-SPAMANAGER-JD-702', title: 'Spa Manager', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'MGT-ASSTMANAGER-JD-703', title: 'Assistant Spa Manager', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'MGT-FITNESSMANAGER-JD-704', title: 'Fitness Manager', department: 'GYM FLOOR TEAM - PERSONAL TRAINERS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'SUP-SPASUPERVISOR-JD-731', title: 'Spa Supervisor', department: 'SPA SUPERVISORS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'REC-RECEPTION-SUPERVISOR-JD-732', title: 'Reception Supervisor', department: 'RECEPTION TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'RET-RETAILSUPERVISOR-JD-733', title: 'Retail Supervisor', department: 'RETAIL TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'HK-HEADHOUSEKEEPER-JD-734', title: 'Spa Head Housekeeper', department: 'HOUSEKEEPING TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-LEADTHERAPIST-JD-711', title: 'Lead Spa Therapist', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-SPATHERAPIST-JD-712', title: 'Spa Therapist', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-BEAUTYTHERAPIST-JD-713', title: 'Beauty Therapist', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-MASSAGETHERAPIST-JD-714', title: 'Massage Therapist', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-NAILTECH-JD-715', title: 'Nail Technician', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'THER-AESTHETICIAN-JD-716', title: 'Advanced Aesthetician', department: 'SPA THERAPISTS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'REC-RECEPTIONIST-JD-721', title: 'Spa Receptionist', department: 'RECEPTION TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'REC-SENIOR-RECEPTIONIST-JD-722', title: 'Senior Spa Receptionist', department: 'RECEPTION TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'REC-SPAHOST-JD-723', title: 'Spa Host', department: 'RECEPTION TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'MEM-MEMBERSHIP-ADVISOR-JD-724', title: 'Membership Advisor', department: 'MEMBERSHIP', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'POOL-LIFEGUARD-JD-741', title: 'Pool Attendant and Lifeguard', department: 'POOL TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'GYM-PERSONALTRAINER-JD-742', title: 'Personal Trainer', department: 'GYM FLOOR TEAM - PERSONAL TRAINERS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'GYM-CLASSINSTRUCTOR-JD-743', title: 'Group Exercise Instructor', department: 'GYM FLOOR TEAM - PERSONAL TRAINERS', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'CLN-SPACLEANER-JD-751', title: 'Spa Cleaner', department: 'HOUSEKEEPING TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'HK-LINENATTENDANT-JD-752', title: 'Spa Linen Attendant', department: 'HOUSEKEEPING TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'MAINT-TECHNICIAN-JD-753', title: 'Spa Maintenance Technician', department: 'MAINTENANCE & ENGINEERING TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
  { reference: 'TRN-SPATRAINER-JD-754', title: 'Spa Trainer', department: 'TRAINING TEAM', tier: 'day-1', why: 'Every role needs one before somebody is appointed to it.' },
]

export const POLICY_INDEX: PlannedDocument[] = [
  { reference: 'SAF-HEALTHSAFETY-POL-801', title: 'Health and Safety Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'SAF-SAFEGUARDING-POL-802', title: 'Safeguarding Children and Vulnerable Adults Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'SAF-LONEWORKING-POL-803', title: 'Lone Working Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'SAF-INFECTION-POL-804', title: 'Infection Prevention and Control Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'SAF-INCIDENT-POL-805', title: 'Incident Reporting and Investigation Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'SAF-ALCOHOLDRUGS-POL-806', title: 'Alcohol, Drugs and Intoxication Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-CHAPERONE-POL-811', title: 'Chaperone and Intimate Treatments Policy', department: 'SPA THERAPISTS', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-UNDER18S-POL-812', title: 'Under Eighteens and Spa Access Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-PREGNANCY-POL-813', title: 'Pregnancy and Treatment Suitability Policy', department: 'SPA THERAPISTS', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-CONTRAINDICATION-POL-814', title: 'Medical Conditions and Contraindications Policy', department: 'SPA THERAPISTS', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-PHOTOGRAPHY-POL-815', title: 'Photography, Filming and Privacy Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-QUIETAREAS-POL-816', title: 'Mobile Phones and Quiet Areas Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'GST-COMPLAINTS-POL-817', title: 'Complaints and Guest Recovery Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'FIN-CANCELLATION-POL-821', title: 'Cancellation, No-Show and Lateness Policy', department: 'RECEPTION TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'FIN-REFUNDS-POL-822', title: 'Refunds and Goodwill Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'FIN-VOUCHERS-POL-823', title: 'Gift Voucher Policy', department: 'FINANCE TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'FIN-DISCOUNTS-POL-824', title: 'Discounts, Complimentary and Staff Rates Policy', department: 'SPA MANAGEMENT TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'HR-EQUALITY-POL-831', title: 'Equality, Diversity and Inclusion Policy', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'HR-SOCIALMEDIA-POL-832', title: 'Social Media and Personal Devices Policy', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
  { reference: 'HR-PRESENTATION-POL-833', title: 'Uniform, Appearance and Personal Presentation Policy', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'A written position an assessor, an insurer or an investigator will ask to see.' },
]

export const HIRING_INDEX: PlannedDocument[] = [
  { reference: 'HR-ADVERT-GDE-901', title: 'Writing a Spa Job Advert', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-SCREENING-GDE-902', title: 'The Screening Call', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-QUESTIONS-GDE-903', title: 'Interview Question Bank', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-SCORECARD-GDE-904', title: 'Interview Scorecard', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-TRADETEST-THER-GDE-905', title: 'Trade Test: Spa Therapist', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-TRADETEST-REC-GDE-906', title: 'Trade Test: Reception', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-TRADETEST-MGT-GDE-907', title: 'Trade Test: Supervisor and Duty Manager', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-PREBOARD-GDE-908', title: 'Before Day One', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-DAYONE-GDE-909', title: 'Day One and Week One', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-NINETYDAYS-GDE-910', title: 'The First Ninety Days', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-PANEL-GDE-911', title: 'Hiring Fairly and Consistently', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
  { reference: 'HR-EXIT-GDE-912', title: 'Exit Interviews', department: 'HR & PEOPLE TEAM', tier: 'day-1', why: 'Used in a room with a candidate in it.' },
]

/** Everything the registers add to the build plan, in listing order. */
export const REGISTER_INDEX: PlannedDocument[] = [
  ...POOL_INDEX,
  ...RISK_ASSESSMENT_INDEX,
  ...GUIDE_INDEX,
  ...CHECKLIST_INDEX,
  ...FINANCE_INDEX,
  ...JOB_DESCRIPTION_INDEX,
  ...POLICY_INDEX,
  ...HIRING_INDEX,
]
