import type { SopDocument } from './types'

// The six the model kept returning half-finished.
//
// Every one of these came back without steps and was stored as written
// anyway, which is how a hundred and five document department pack sat at a
// hundred and four ready and could not be sold. One document at thirty-nine
// pounds was holding a two hundred and ninety-nine pound pack off the shelf,
// six times over.
//
// Redrafting them is a coin toss inside a twenty-six second function. Writing
// them is not. So they are here, in the repository, in the same voice and
// under the same rules as everything else: a fact that belongs to one
// building is a placeholder, every step has a standard somebody can audit,
// and nothing claims a control is in place.

type Authored = Omit<SopDocument,
  'kind' | 'reference' | 'title' | 'version' | 'issued' | 'reviewBy' | 'property' | 'department'
  | 'accountability' | 'governance' | 'references' | 'revisions'>

export const THE_LAST_SIX: Record<string, Authored> = {

  'REC-BOOK-CLASS-SOP-054': {
    purpose:
      'To take a booking for a group exercise class correctly, so the class runs to its safe capacity, the '
      + 'right people are on the register, and nobody arrives to find there is no space.',
    scope:
      'Applies to reception and anybody taking class bookings by telephone, in person, or through the booking '
      + 'system, for every studio and group class the property runs.',
    whyItMatters:
      'A class is the one booking where overselling has a physical limit. A treatment room double booked is an '
      + 'apology; a studio with more people than mats, or more than the fire capacity of the room, is an '
      + 'incident waiting for an inspector. The register is also the only record of who was in the room if '
      + 'somebody is hurt.',
    equipment: [
      'Booking system with the class timetable loaded and capacities set',
      '[Studio name and its stated capacity] for each room used for classes',
      'Current timetable, including any instructor change for the day',
      'Health commitment or screening questions used for first-time attendees',
      'Waiting list function, or a written list where the system has none',
      'Card terminal or account facility for anything chargeable',
    ],
    measuredBy: [
      'No class is ever booked above the capacity stated for that studio, in the system or on paper',
      'Every booked attendee appears on the register the instructor holds at the start of the class',
      'Cancellations made inside the stated notice period are recorded against the booking with the reason',
      'First-time attendees have completed screening before they are on the mat, not after',
    ],
    responsibilities: [
      { role: 'Reception', responsibility: 'Takes the booking, confirms capacity before promising a place, and records screening for first-time attendees.' },
      { role: 'Duty manager', responsibility: 'Authorises any change to a class capacity and decides whether a class runs when an instructor is unavailable.' },
      { role: 'Instructor', responsibility: 'Holds the register at the start of class, checks who is present, and refuses anybody not on it and not screened.' },
      { role: '[Fitness lead]', responsibility: 'Sets and reviews the capacity for each studio against the space, the equipment and the fire capacity.' },
    ],
    steps: [
      {
        name: 'Confirm the class is running',
        action: 'Check the timetable in the system for that date rather than a printed copy, and confirm the class is live, has an instructor, and has not been cancelled or moved.',
        standard: 'No booking is taken against a class that has no instructor allocated, whatever the timetable on the wall says.',
      },
      {
        name: 'Check the space before you promise it',
        action: 'Look at the remaining places against the capacity set for that studio, and say what is actually available rather than taking the booking and checking afterwards.',
        standard: 'The number offered to the guest is the number the system shows. A place is never promised on the expectation that somebody will drop out.',
      },
      {
        name: 'Identify the guest',
        action: 'Find the existing record by name or membership number, or create one. Confirm the spelling of the name and a contact number, because the register and any incident record depend on it.',
        standard: 'Every booking is attached to a named record with a working contact number, and no class booking is held under a first name alone.',
      },
      {
        name: 'Screen a first-time attendee',
        action: 'For anybody attending this class type for the first time, ask the health screening questions the property uses, and record the answers against their record before the booking is confirmed.',
        standard: 'Screening is completed and recorded before the guest is told they have a place. Anything disclosed that the screening flags is referred to [the role that decides on medical referrals] before the booking stands.',
      },
      {
        name: 'Tell them what the class actually is',
        action: 'State the level, the duration, what to bring or wear, what is provided, and the arrival time. Say plainly if the class is unsuitable for beginners or for anybody with a stated condition.',
        standard: 'Nobody arrives at a class expecting a different one. Where a class is advertised as advanced, that is said aloud at the point of booking rather than left on the timetable.',
      },
      {
        name: 'Take payment or apply the entitlement',
        action: 'Charge the class rate, or apply the membership entitlement, package or class pass, and record which was used against the booking.',
        standard: 'Every attendance is accounted for against a payment, an entitlement or a recorded complimentary approval. No class place is given away without one of the three.',
      },
      {
        name: 'Confirm and state the cancellation terms',
        action: 'Confirm the date, time, studio and instructor, and state the notice period for cancelling and what happens if it is missed. Send the written confirmation the system produces.',
        standard: 'The guest is told the cancellation terms at the point of booking, not when they are charged for missing one.',
      },
      {
        name: 'Offer the waiting list when it is full',
        action: 'Where the class is full, offer the waiting list and record the guest on it, explaining how and when they will be told if a place comes up.',
        standard: 'A full class is never oversold to accommodate somebody. The waiting list is worked in the order it was taken.',
      },
      {
        name: 'Make sure the register reaches the instructor',
        action: 'Confirm the booking appears on the register the instructor will use, and pass on any note recorded at booking that affects how the class is run.',
        standard: 'The register the instructor holds at the start of the class matches the system, including anybody booked in the last hour.',
      },
    ],
    commonFailures: [
      'The booking system is down and a guest wants to book a class. Take the booking on the manual list '
        + 'held at reception with name, contact number and class, tell the guest it is provisional until '
        + 'confirmed, and enter every one of them into the system before the class runs.',
      'A class is full and the guest is insistent. The capacity does not move. Offer the waiting list, an '
        + 'alternative class, or a different time. Only [the role that owns studio capacity] may change a '
        + 'capacity, and only against the space and the fire capacity, never against a queue at the desk.',
      'The instructor is unavailable at short notice. Tell the duty manager immediately. Follow the '
        + 'substitute instructor procedure. If the class cannot run, contact every booked attendee by telephone '
        + 'rather than email, and record the refund or credit given.',
      'Somebody discloses a condition during screening that you are not qualified to judge. Do not decide. '
        + 'Do not book them in and resolve it later. Refer it to [the role that decides on medical referrals] '
        + 'and tell the guest you will confirm shortly.',
    ],
    definitions: [
      { term: 'Capacity', meaning: 'The maximum number of people who may be in a class, set against the floor space, the equipment and the fire capacity of the studio. A limit, not a target.' },
      { term: 'Register', meaning: 'The list of who is booked into a class, held by the instructor when it starts. The only record of who was in the room if somebody is hurt.' },
      { term: 'Screening', meaning: 'The health questions asked of a first-time attendee before they are given a place, and the recorded answers to them.' },
      { term: 'Waiting list', meaning: 'The ordered list of people who wanted a place in a full class. Worked in the order it was taken.' },
    ],
  },

  'GYM-PREVENTIVE-MAINT-SOP-260': {
    purpose:
      'To raise, track and close preventive maintenance on gym and studio equipment, so faults are found on a '
      + 'schedule rather than by a member mid-set.',
    scope:
      'Applies to the gym floor team, personal trainers, the maintenance team and the spa manager, and covers '
      + 'all fixed resistance equipment, cardiovascular machines, free weights, studio equipment and the '
      + 'flooring and mirrors around them.',
    whyItMatters:
      'Gym equipment fails progressively and quietly. A cable frays, a pin sticks, a treadmill belt drifts, and '
      + 'each is a small note until the day it is an injury with a maintenance record that shows nothing was '
      + 'scheduled. Preventive maintenance is also the cheapest form of maintenance there is: a serviced machine '
      + 'lasts years longer than a reactive one.',
    equipment: [
      'Asset register listing every item, its location, its serial number and its service interval',
      'Maintenance request system, or the log book where there is none',
      '[Maintenance contractor and contact] for each equipment manufacturer under contract',
      'Manufacturer service schedules for each machine type',
      'Out of use tags, and a means of physically isolating a machine',
      'Daily equipment readiness checklist',
    ],
    measuredBy: [
      'Every asset on the register has a service interval set and a last service date recorded',
      'Planned services due in the period are completed within the interval, and any overrun has a reason and a date',
      'The average age of open maintenance requests, and the count of any older than the agreed limit',
      'No item is in use while tagged out, on any check during the period',
    ],
    responsibilities: [
      { role: 'Gym floor team', responsibility: 'Carries out the daily readiness walk, raises a request the same shift for anything found, and tags out anything unsafe.' },
      { role: 'Personal trainers', responsibility: 'Reports anything noticed during a session, whether or not it stopped the session.' },
      { role: 'Maintenance', responsibility: 'Owns the schedule, books contractor visits, carries out what is done in house, and closes each request with what was done.' },
      { role: 'Spa manager', responsibility: 'Reviews open requests weekly, decides when an item comes out of service permanently, and owns the capital case when it does.' },
    ],
    steps: [
      {
        name: 'Keep the asset register true',
        action: 'Record every item with its location, serial number, install date, service interval and last service. Update it whenever equipment is added, moved or disposed of.',
        standard: 'Every machine on the floor appears on the register, and no entry on the register points at a machine that is no longer there.',
      },
      {
        name: 'Set the interval from the manufacturer, not from habit',
        action: 'Take the service interval for each item from the manufacturer schedule, and shorten it where the machine is in heavy use.',
        standard: 'Each asset has a stated interval with a source. Where an interval has been shortened, the reason is recorded against the asset.',
      },
      {
        name: 'Raise a request the same shift',
        action: 'Anything found on the daily walk, reported by a member, or noticed during a session is raised as a request the same shift, with the asset, the location, what is wrong and whether it is safe to use.',
        standard: 'Nothing is carried in memory to the next shift. A request exists before the person who found it goes home.',
      },
      {
        name: 'Decide whether it stays in use',
        action: 'Judge whether the fault affects safety. If it does, or if you are not sure, tag the item out of use and isolate it so it cannot be used.',
        standard: 'Anything with a fault affecting a moving part, a cable, a weight stack, a guard or an electrical component is tagged out until a competent person clears it. The doubt is resolved by tagging out, not by leaving it.',
      },
      {
        name: 'Schedule the planned work',
        action: 'Book planned services in advance against the interval, at a time that minimises the equipment out of use at peak, and tell the floor team what will be unavailable and when.',
        standard: 'Planned work is in the diary before it is due rather than after, and members are told about anything out of use for more than [maximum unannounced downtime].',
      },
      {
        name: 'Control the contractor on site',
        action: 'Confirm the contractor holds the permit the property requires, sign them in, make the area safe while work is carried out, and sign them out with a record of what was done.',
        standard: 'No contractor works on the gym floor unsupervised during opening hours, and every visit produces a written record against the asset.',
      },
      {
        name: 'Close the request with what was done',
        action: 'Record what was found, what was done, what was replaced, and the date. Where a fault will recur, say so and raise the follow-up.',
        standard: 'A request is closed with a description of the work, not with the word done. The asset record shows the service date afterwards.',
      },
      {
        name: 'Review what is still open',
        action: 'At the weekly review, list every open request with its age, confirm each has an owner and a date, and escalate anything older than the agreed limit.',
        standard: 'No request sits open with no owner. Anything older than [the agreed limit for an open fault] is on the manager action list with a reason.',
      },
    ],
    commonFailures: [
      'A machine fails while a member is using it. Stop the session, check the member, tag the machine out '
        + 'immediately, and record it as an incident as well as a maintenance request. Do not put the machine '
        + 'back into use on a visual inspection.',
      'The contractor cannot attend within the interval. Record the overrun with the reason and a new date. '
        + 'Where the interval is a safety interval rather than a performance one, take the item out of use '
        + 'until it is serviced.',
      'The same fault keeps coming back. Stop closing it as a repair. Raise it to the spa manager as a '
        + 'repeat, with the dates, so it is judged as a replacement decision rather than another visit.',
      'An item is tagged out and somebody has used it anyway. Treat it as a safety failure, not an '
        + 'inconvenience. Isolate the machine physically, report it to the duty manager, and check whether '
        + 'anybody was hurt.',
    ],
    definitions: [
      { term: 'Preventive maintenance', meaning: 'Work carried out on a schedule to stop a fault happening, as distinct from a repair carried out after one has.' },
      { term: 'Asset register', meaning: 'The list of every item of equipment with its location, serial number, service interval and last service date. An item not on it is an item nobody is maintaining.' },
      { term: 'Service interval', meaning: 'The period between planned services, taken from the manufacturer schedule rather than from custom.' },
      { term: 'Tagged out', meaning: 'Physically marked and, where the machine allows it, isolated so it cannot be used. A tag is an instruction, not a warning.' },
      { term: 'Repeat fault', meaning: 'The same failure on the same asset inside [the period the property treats as a repeat]. Judged as a replacement decision rather than as another visit.' },
    ],
  },

  'THER-TOWELWARMER-SOP-360': {
    purpose:
      'To check, clean and record the condition of towel warmers and heated cabinets, so nothing is issued to a '
      + 'guest above a safe temperature and nothing is stored in a cabinet that grows bacteria.',
    scope:
      'Applies to therapists, the maintenance team and housekeeping, and covers every towel warmer, hot cabinet, '
      + 'heated mitt unit and hot stone heater in treatment rooms, the thermal suite and back of house.',
    whyItMatters:
      'A heated cabinet is two hazards in one appliance. It burns, because a wet towel at cabinet temperature '
      + 'holds far more heat against skin than the air temperature suggests, and guests on a couch are relaxed, '
      + 'often face down, and slow to react. And it incubates, because a warm damp box is close to ideal for '
      + 'bacterial growth if anything is left in it.',
    equipment: [
      'Calibrated probe or surface thermometer, in date for its own check',
      'Temperature log for each appliance',
      '[Maximum safe issue temperature for a heated towel] as set by the property',
      'Approved cleaning and descaling products with in-date safety data sheets',
      'Out of use tags and a means of isolating an appliance at the socket',
      'Manufacturer instructions for each appliance in use',
    ],
    measuredBy: [
      'A temperature reading is recorded for every appliance in use on every day it is used',
      'No reading above the stated maximum is left without a recorded action and a re-check',
      'Every appliance is emptied and cleaned to the stated frequency, with the cleaning recorded',
      'No appliance is in use past its stated electrical test date',
    ],
    responsibilities: [
      { role: 'Therapist', responsibility: 'Checks and records the temperature before first use, tests every item against their own forearm before it touches a guest, and empties the cabinet at the end of the day.' },
      { role: 'Housekeeping', responsibility: 'Cleans and descales the appliances to the stated frequency and records it.' },
      { role: 'Maintenance', responsibility: 'Keeps the appliances in electrical test, responds to faults, and removes anything that cannot hold a stable temperature.' },
      { role: 'Spa manager', responsibility: 'Sets the maximum issue temperature, reviews the logs, and decides when an appliance leaves service.' },
    ],
    steps: [
      {
        name: 'Check before the first treatment',
        action: 'Before the first use of the day, check the appliance is undamaged, the cable and plug are sound, the door or lid seals, and the unit is not sitting in water.',
        standard: 'Any damage to a cable, plug, seal or casing takes the appliance out of use immediately. It is not used until a competent person has cleared it.',
      },
      {
        name: 'Take and record the temperature',
        action: 'Take a reading with the probe at the point items are stored, not at the thermostat, and record it on the log with the time and your initials.',
        standard: 'A reading exists for every appliance for every day it is used. A blank on the log is treated as a check not carried out, not as a check that passed.',
      },
      {
        name: 'Act on a reading above the maximum',
        action: 'If the reading is above the stated maximum, take the appliance out of use, let it cool, adjust the setting, and re-check before anything is issued from it.',
        standard: 'Nothing is issued from an appliance reading above the maximum, however busy the diary is. The action taken and the re-check are both recorded.',
      },
      {
        name: 'Test every item on yourself first',
        action: 'Before any heated towel, mitt, compress or stone touches a guest, hold it against the inside of your own forearm for a few seconds.',
        standard: 'Every item is tested on the therapist before the guest, every time, regardless of the logged temperature. A log is a record of the appliance, not of the item in your hand.',
      },
      {
        name: 'Tell the guest and watch them',
        action: 'Say that the item is warm before it is applied, ask them to say at once if it is uncomfortable, and watch the response on the first application rather than turning away.',
        standard: 'No heated item is applied to a guest without warning them first. Anybody who cannot reliably report discomfort has the heat reduced or the step left out.',
      },
      {
        name: 'Reduce or leave it out where it is not safe',
        action: 'Check the consultation for anything affecting heat tolerance or sensation, and reduce the temperature or leave the heated element out where indicated.',
        standard: 'Where the consultation flags reduced sensation, a circulatory condition, diabetes, pregnancy, recent injury or medication affecting heat tolerance, the heated element is reduced or omitted and the decision is recorded on the treatment note.',
      },
      {
        name: 'Never store overnight',
        action: 'Empty the appliance completely at the end of every day. Nothing damp is left in a warm cabinet overnight.',
        standard: 'Every appliance is emptied at close. A cabinet found with linen in it at opening has its contents sent to the laundry and the appliance cleaned before use.',
      },
      {
        name: 'Clean and descale to the schedule',
        action: 'Clean the interior with the approved product at the stated frequency, descale where the appliance holds water, and record both.',
        standard: 'Cleaning and descaling are recorded against the appliance. Visible scale, residue or smell takes it out of use until it is dealt with.',
      },
      {
        name: 'Switch off at the appliance',
        action: 'At close, switch the appliance off at the appliance itself and at the socket, not only at the wall switch for the room.',
        standard: 'No heating appliance is left energised overnight. The closing checklist records it.',
      },
    ],
    commonFailures: [
      'A guest reports a burn or marked reddening. Stop the treatment, cool the area under cool running '
        + 'water, do not apply product, record it as an incident, and have the appliance taken out of use and '
        + 'checked before it is used again. Report it under the accident procedure the property uses.',
      'The reading is unstable, or the appliance cycles between readings. Take it out of use and raise it '
        + 'with maintenance. An appliance that will not hold a stable temperature cannot be made safe by '
        + 'watching it.',
      'The probe is out of date for its own calibration. Readings taken with it are not evidence of '
        + 'anything. Get a calibrated probe before the appliance is used, and record that the previous readings '
        + 'were taken on an uncalibrated instrument.',
    ],
    definitions: [
      { term: 'Towel warmer', meaning: 'Any heated cabinet or unit used to hold towels, compresses or products at temperature for treatment use.' },
      { term: 'Safe working temperature', meaning: 'The temperature at which an item may be taken from the cabinet and placed on a guest, set at [the temperature the property works to] and checked rather than judged by hand.' },
      { term: 'Calibrated probe', meaning: 'A thermometer with a current calibration record. A reading taken on an uncalibrated probe is not evidence of anything.' },
      { term: 'Out of use', meaning: 'Switched off, emptied, labelled and not used again until the fault is signed off as resolved.' },
    ],
  },

  'SYS-PROMO-CODES-SOP-127': {
    purpose:
      'To create, control and retire promotional codes in the booking system, so a discount is deliberate, '
      + 'limited, attributable and cannot be spent by anybody who was not offered it.',
    scope:
      'Applies to the spa management team and anybody with configuration access to the booking system, and '
      + 'covers every promotional code, campaign rule, member offer and voucher code that reduces a price.',
    whyItMatters:
      'A promotional code is a permission to charge less, and it is the easiest permission in a spa to leave '
      + 'switched on. Codes outlive their campaigns, circulate on discount sites, get applied to peak Saturdays '
      + 'they were never meant for, and appear in the accounts as unexplained margin loss months later. The '
      + 'controls that prevent all of that are set at the moment the code is created and almost never afterwards.',
    equipment: [
      'Booking system with configuration access, held by named people only',
      'Approval record for the campaign the code belongs to',
      '[Role authorised to approve a promotional code] and the limit of their authority',
      'Campaign brief stating the audience, the dates, the offer and the expected volume',
      'Discount and yield report, for reading the effect afterwards',
    ],
    measuredBy: [
      'Every live code maps to an approved campaign with a named owner and an end date',
      'No code is live past its campaign end date on any check during the period',
      'Discount given by code, read monthly against the value the campaign was approved for',
      'No code is redeemable in a period or on a service the campaign did not cover',
    ],
    responsibilities: [
      { role: '[Role authorised to approve a promotional code]', responsibility: 'Approves the offer, the audience, the dates and the maximum value before any code is created.' },
      { role: 'Spa management team', responsibility: 'Configures the code exactly as approved, including every restriction, and retires it on the stated date.' },
      { role: 'Reception', responsibility: 'Applies codes as configured and never overrides a refusal at the desk.' },
      { role: 'Finance', responsibility: 'Reads discount by code monthly and raises anything running beyond the value approved.' },
    ],
    steps: [
      {
        name: 'Require an approved campaign first',
        action: 'Do not create a code without a written campaign brief stating the audience, the offer, the start and end dates, the services included, and the approval.',
        standard: 'Every code in the system traces to an approved brief. A code created on a verbal request is not created.',
      },
      {
        name: 'Make the code itself hard to guess',
        action: 'Use a code that is specific to the campaign and not a word anybody would try. Avoid anything that reads as a generic discount word.',
        standard: 'No code is a common word or an obvious pattern. A code that could be guessed by somebody typing at the checkout is not used.',
      },
      {
        name: 'Set the dates before anything else',
        action: 'Set the start and end date to the campaign dates at the moment the code is created, rather than intending to switch it off later.',
        standard: 'Every code has an end date set at creation. A code with no end date is not created, whatever the campaign owner says about reviewing it.',
      },
      {
        name: 'Restrict what it applies to',
        action: 'Restrict the code to the services, durations and packages the campaign covers, and exclude everything else explicitly rather than by omission.',
        standard: 'The code cannot be applied to a service the campaign did not include. Where the system cannot exclude something, the code is not used for that campaign.',
      },
      {
        name: 'Restrict when it can be used',
        action: 'Set the days and times the code is valid for, and exclude peak periods unless the campaign was explicitly approved to include them.',
        standard: 'Peak capacity is excluded by default. Including it takes a stated decision on the brief, because discounting time that would have sold at full price costs money for nothing.',
      },
      {
        name: 'Limit the volume',
        action: 'Set a total redemption limit and a per-guest limit that match the campaign, so the exposure is capped even if the code circulates.',
        standard: 'Every code has a total limit and a per-customer limit. An uncapped code is not created.',
      },
      {
        name: 'Decide how it stacks',
        action: 'Set explicitly whether the code combines with member rates, packages, vouchers or other offers, and test that the system behaves as decided.',
        standard: 'Codes do not stack unless the brief says they do. The behaviour is tested with a real booking before the code is released, not assumed from the setting.',
      },
      {
        name: 'Test it before it is released',
        action: 'Make a test booking that should work and one that should be refused, for the wrong service, the wrong day and a second use, and confirm the system behaves as configured.',
        standard: 'A code is not released until both a valid and an invalid booking have been tried against it, and the refusals actually refused.',
      },
      {
        name: 'Record it on the register',
        action: 'Record the code, the campaign, the owner, the dates, the restrictions and the approved value on the promotional code register.',
        standard: 'The register matches the system. Anybody can answer what a live code is for, who approved it and when it ends, without opening the booking system.',
      },
      {
        name: 'Retire it on the date',
        action: 'On the end date, confirm the code is no longer redeemable, and remove or disable it rather than leaving it dormant.',
        standard: 'A code is checked as dead on its end date and the check is recorded. No code is left enabled because the campaign might return.',
      },
    ],
    commonFailures: [
      'A code has appeared on a discount site. Disable it immediately rather than waiting for its end date. '
        + 'Honour bookings already made, record how many, and replace it with a single-use or audience-specific '
        + 'code for the rest of the campaign.',
      'A guest presents a code that has expired. Reception does not override it. Refer it to [role '
        + 'authorised to approve a promotional code], who decides and records the decision as a complimentary '
        + 'or discount approval against that booking.',
      'A code is discounting more than the campaign approved. Disable it, read the discount report to '
        + 'establish the value, and raise it as a finding rather than adjusting the report. Establish whether '
        + 'the restriction was wrong or absent before another code is created.',
      'Nobody can say what a live code is for. Treat it as an unapproved code. Disable it, then find out. A '
        + 'discount nobody owns is a discount nobody is reading.',
    ],
    definitions: [
      { term: 'Promotional code', meaning: 'A code that changes the price or the terms of a booking when it is applied. A discount that keeps working whether or not anybody is watching it.' },
      { term: 'Restriction', meaning: 'The conditions that limit a code: dates, treatments, days, times, number of uses, and whether it can be combined with anything else.' },
      { term: 'Single use', meaning: 'A code that stops working after one redemption. The only safe shape for a goodwill or recovery code.' },
      { term: 'Campaign owner', meaning: 'The named person accountable for what a code costs. A code with no owner is an unapproved code.' },
    ],
  },

  'SYS-HOLIDAY-HOURS-SOP-132': {
    purpose:
      'To configure public holidays, seasonal hours and closures in the booking system, so the diary can only '
      + 'ever offer time the spa is actually open and staffed.',
    scope:
      'Applies to the spa management team and anybody with configuration access, and covers every change to '
      + 'opening hours, bank and public holidays, seasonal timetables, planned closures and reduced-service days.',
    whyItMatters:
      'The booking system is the only thing a guest believes. A diary that is open on a day the building is '
      + 'closed sells time that does not exist, and somebody arrives at a locked door having paid. The reverse '
      + 'costs less and is still expensive: hours left closed after a seasonal change sell nothing at all and '
      + 'nobody notices until the revenue report.',
    equipment: [
      'Booking system with configuration access, held by named people only',
      '[Agreed opening hours for each day, and the seasonal variations]',
      'Public holiday dates for the jurisdiction the property is in',
      'Rota, so hours are never opened that cannot be staffed',
      'Website, telephone message and any third party listing that states opening hours',
    ],
    measuredBy: [
      'No booking exists on a day or at a time the property was closed, on any check during the period',
      'Every hour open in the diary has cover on the rota',
      'Opening hours in the system, on the website and on any third party listing agree on every check',
      'Seasonal changes are configured before the first booking is taken for the affected period',
    ],
    responsibilities: [
      { role: 'Spa manager', responsibility: 'Agrees the hours, the holiday opening and any closure, and approves the change before it is configured.' },
      { role: 'Spa management team', responsibility: 'Configures the change, checks the diary afterwards, and updates every other place the hours are stated.' },
      { role: 'Reception', responsibility: 'Reports any booking that appears outside the hours it should be possible to book.' },
      { role: '[Role that owns the rota]', responsibility: 'Confirms the hours can be staffed before they are opened.' },
    ],
    steps: [
      {
        name: 'Get the decision before the configuration',
        action: 'Confirm in writing what the hours will be, for which dates, and whether the service is full or reduced. Do not configure from a conversation.',
        standard: 'Every change traces to a written decision with a date and an approver. Nobody changes opening hours on their own judgement.',
      },
      {
        name: 'Check it can be staffed',
        action: 'Confirm with whoever owns the rota that the hours can be covered, including reception, therapists and the qualifications the hours require.',
        standard: 'No hour is opened in the diary that has no cover. Where the pool or thermal suite is open, the hours match the hours the required qualification is on site.',
      },
      {
        name: 'Configure the exception, not the pattern',
        action: 'Set public holidays and one-off closures as dated exceptions rather than by editing the standard weekly pattern.',
        standard: 'The standard week is unchanged after a one-off closure is configured. A holiday is never applied by editing the ordinary hours and putting them back afterwards.',
      },
      {
        name: 'Do it before bookings are taken',
        action: 'Configure seasonal and holiday changes at least [how far ahead the diary is open] before the period, so the diary never offers hours that are about to be withdrawn.',
        standard: 'No change is configured for a period that is already selling. Where one has to be, existing bookings are dealt with under the steps below before the hours change.',
      },
      {
        name: 'Check for bookings already taken',
        action: 'Before closing any period, list every booking already in it, and contact each guest by telephone to move or refund rather than cancelling in the system.',
        standard: 'No booking is cancelled by a configuration change without the guest being spoken to. The contact and the outcome are recorded against the booking.',
      },
      {
        name: 'Check the diary afterwards',
        action: 'Open the diary for the affected dates and confirm it shows what was intended: closed where closed, open where open, and the right resources available.',
        standard: 'Every change is checked in the diary by the person who made it, on the actual dates, before it is called done.',
      },
      {
        name: 'Try to make a booking that should fail',
        action: 'Attempt a booking on a closed day and outside the new hours, and confirm the system refuses both.',
        standard: 'A closure is not trusted until a booking has been attempted against it and refused.',
      },
      {
        name: 'Change every other place the hours are stated',
        action: 'Update the website, the telephone message, the door, any third party listing and any automated confirmation that states opening hours.',
        standard: 'The hours agree everywhere on the day the change takes effect. A guest checking any source gets the same answer.',
      },
      {
        name: 'Tell the team',
        action: 'Tell reception, therapists and the duty manager what has changed and from when, and put it in the handover.',
        standard: 'Nobody on shift learns about a closure from a guest.',
      },
    ],
    commonFailures: [
      'A guest is booked on a day the property is closed. Telephone them, apologise plainly, and offer a '
        + 'move or a full refund. Do not wait for them to arrive. Record it, and find out which configuration '
        + 'step was missed.',
      'The system will not allow the hours to be configured as decided. Do not work around it by opening '
        + 'wider hours and relying on the team to refuse bookings. Raise it with [the booking system contact] '
        + 'and keep the hours closed until it can be set correctly.',
      'The hours on the website disagree with the system. The system is what sells time. Correct the '
        + 'website the same day, and check every other listing at the same time rather than fixing one.',
      'A closure has to be made at short notice. Close the diary first so nothing more is sold, then '
        + 'contact every booked guest by telephone in order of arrival time, then update the public sources.',
    ],
    definitions: [
      { term: 'Trading hours', meaning: 'The hours the booking system will sell. What appears on the website is a description of these, never the other way round.' },
      { term: 'Closure', meaning: 'A date or period on which nothing may be booked, configured in the system rather than managed by the team refusing bookings.' },
      { term: 'Last bookable appointment', meaning: 'The latest start time that allows the treatment, the changeover and the close down to finish inside the hours. Set from the longest treatment on the menu, not the shortest.' },
      { term: 'Public source', meaning: 'Anywhere the hours appear to a guest: the website, the listing sites, the booking engine, the voicemail and the signage.' },
    ],
  },

  'SEC-CCTV-EVIDENCE-SOP-366': {
    purpose:
      'To handle a request to review CCTV, and to retrieve, record and release footage, so that a legitimate '
      + 'request is answered properly and nothing is viewed, copied or passed on without authority.',
    scope:
      'Applies to the security team, the duty manager and anybody who receives a request to view footage, and '
      + 'covers every camera the property operates in and around the spa.',
    whyItMatters:
      'Footage is personal data about identifiable people, and a spa is a setting where those people may be in '
      + 'a robe. Viewing it casually, copying it to a phone, or handing it to somebody who asks confidently is a '
      + 'data breach with a regulator attached. It is also evidence: footage watched by four people and then '
      + 'overwritten is worth nothing to an investigation, and retention periods are short.',
    equipment: [
      'CCTV system with named individual accounts, never a shared login',
      'CCTV review request form',
      'Disclosure log, recording every view and every release',
      '[Data protection lead or equivalent role] and their contact',
      '[Retention period set for this system], and the date footage is overwritten',
      'Secure means of transferring a copy, and a lockable place to hold one',
    ],
    measuredBy: [
      'Every view of recorded footage appears on the disclosure log with a requester, a reason and an authoriser',
      'No release is made without the authorisation the request type requires',
      'Requests are actioned inside the retention period, with the time from request to retrieval recorded',
      'No account is shared, on any check of the system during the period',
    ],
    responsibilities: [
      { role: 'Duty manager', responsibility: 'Receives requests, establishes what is being asked for and why, and refers anything beyond a routine internal review.' },
      { role: '[Data protection lead or equivalent role]', responsibility: 'Authorises any release outside the property, decides on subject access requests, and owns the disclosure log.' },
      { role: 'Security team', responsibility: 'Retrieves footage under authorisation, records the view, and holds any copy securely.' },
      { role: 'Spa manager', responsibility: 'Authorises internal reviews relating to an incident or a complaint within the spa.' },
    ],
    steps: [
      {
        name: 'Record the request before anything is viewed',
        action: 'Complete the review request form: who is asking, in what capacity, the date, time and location wanted, and the reason. Do not open the system first.',
        standard: 'No footage is viewed before the request is written down. A verbal request that is not recorded is not actioned.',
      },
      {
        name: 'Establish who is actually asking',
        action: 'Identify the requester and their authority. Where the request is from a police officer or another authority, record the name, the number, the force or body and the power relied on, and take it in writing.',
        standard: 'Nobody is given access on the strength of a uniform, a business card or a telephone call alone. A request from an authority is in writing before footage is viewed.',
      },
      {
        name: 'Get the right authorisation',
        action: 'Route the request to the person who can authorise it: the spa manager for an internal incident, the data protection lead for anything leaving the property or any request from an individual about themselves.',
        standard: 'Nothing is viewed or released on the authority of the person who wants to see it. The authoriser is named on the form before retrieval.',
      },
      {
        name: 'Narrow it to what is needed',
        action: 'Reduce the request to the smallest camera, date and time window that answers the question.',
        standard: 'Footage is retrieved for a stated window, not for a day. A request to browse is refused and referred back.',
      },
      {
        name: 'Act inside the retention period',
        action: 'Check how long footage is held and retrieve it before it is overwritten, treating anything close to the limit as urgent.',
        standard: 'Where the window is inside the retention period, the footage is secured on the same day the request is authorised. Where it has already been overwritten, that is recorded and the requester is told.',
      },
      {
        name: 'View it with two people, and log it',
        action: 'View under a named individual account with the authoriser or a second named person present. Record the date, time, who viewed, what was viewed and why on the disclosure log.',
        standard: 'Every view appears on the log. Nobody views recorded footage alone, and no shared account is ever used.',
      },
      {
        name: 'Consider who else is in the frame',
        action: 'Before releasing anything, consider other identifiable people in the footage and whether they should be obscured.',
        standard: 'Where the footage shows people unconnected with the request, they are obscured before release or the release is refused and referred to the data protection lead.',
      },
      {
        name: 'Release only by the approved route',
        action: 'Transfer a copy only by the secure means the property uses, to a named recipient, with a record of what was released and when.',
        standard: 'No footage is photographed off a screen, sent by personal message, or handed over on an unencrypted device. A release that cannot be made securely is not made.',
      },
      {
        name: 'Hold and dispose of any copy',
        action: 'Hold any retained copy securely with a stated reason and a review date, and destroy it when the reason ends.',
        standard: 'Every copy has an owner and a disposal date. No copy is held indefinitely because it might be useful.',
      },
      {
        name: 'Close the request',
        action: 'Record the outcome on the form and the log, including a refusal and the reason for it.',
        standard: 'Every request is closed with an outcome. A refused request is recorded as fully as a granted one.',
      },
    ],
    commonFailures: [
      'An individual asks to see footage of themselves. This is a subject access request, not a viewing. Do '
        + 'not show them anything at the desk. Record it and refer it to [data protection lead or equivalent '
        + 'role] the same day, and tell the person it has been referred and when they will hear.',
      'Somebody has already viewed footage without authorisation. Record what was viewed, by whom and when, '
        + 'and report it to the data protection lead as a possible breach the same day. Do not resolve it '
        + 'informally.',
      'The footage has already been overwritten. Record that plainly on the form with the retention period '
        + 'and the dates, and tell the requester. Do not describe from memory what the footage showed.',
      'An authority wants footage immediately and will not put it in writing. Refer it to the duty manager '
        + 'and the data protection lead rather than refusing or agreeing at the desk. Record the request, the '
        + 'name and the time.',
      'The request relates to an area cameras should not cover. Stop. Report it: a camera covering a '
        + 'changing area, a treatment room or anywhere with an expectation of privacy is a finding in its own '
        + 'right and goes to the data protection lead immediately.',
    ],
    definitions: [
      { term: 'CCTV', meaning: 'Camera surveillance of the property. Personal data from the moment somebody is identifiable in it.' },
      { term: 'Retention period', meaning: 'How long footage is held before it is overwritten, stated at [the retention period the property operates]. Once it has passed there is nothing left to review.' },
      { term: 'Subject access request', meaning: 'A request by an individual for footage of themselves. Handled under data protection law by the data protection lead, never at the desk.' },
      { term: 'Disclosure', meaning: 'Footage released outside the property. Every one is recorded with who asked, on what grounds, what was given and who authorised it.' },
      { term: 'Data protection lead', meaning: 'The named person accountable for personal data at the property, footage included. The single point every CCTV request goes to.' },
    ],
  },
}
