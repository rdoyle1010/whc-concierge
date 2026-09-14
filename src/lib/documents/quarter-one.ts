import type { SopDocument } from './types'

// The last nine, written rather than drafted.
//
// The single Draft button gives the model twenty seconds inside a function
// the host kills at twenty-six, and on a document of this length that is a
// coin toss. Nine coin tosses is an afternoon, so these are written here
// instead: same house voice, same rules, same placeholders where a fact
// belongs to one building and nobody here has walked round it.
//
// They are held as content in the repository rather than pasted into the
// database as SQL, so they can be reviewed in a diff, corrected in a diff,
// and put back if a row is ever lost. Keyed by reference, which is unique.

type Authored = Omit<SopDocument,
  'kind' | 'reference' | 'title' | 'version' | 'issued' | 'reviewBy' | 'property' | 'department'
  | 'accountability' | 'governance' | 'references' | 'revisions'>

export const QUARTER_ONE_DRAFTS: Record<string, Authored> = {

  'CLN-SEASONAL-DEEP-SOP-345': {
    purpose:
      'To plan, carry out and close out a full deep clean of the spa on a seasonal cycle, so that the areas '
      + 'daily cleaning cannot reach are restored to standard and the work is recorded.',
    scope:
      'Applies to the spa cleaning team, maintenance and the duty manager, and covers every treatment room, wet '
      + 'area, relaxation space, changing room, back of house store and plant access point within the spa footprint.',
    whyItMatters:
      'Daily cleaning holds a standard; it does not restore one. Grout, extract grilles, mattress covers, '
      + 'behind fixed furniture and inside cupboards decline invisibly across a season, and the first person to '
      + 'notice is usually a guest or an environmental health officer.',
    equipment: [
      'Deep clean schedule listing every area and its frequency',
      'Room by room checklist with a signature line per area',
      'Approved chemicals with in-date safety data sheets and correct dilution equipment',
      'Steam or extraction equipment appropriate to the surfaces in use',
      'Access equipment for high level cleaning, with a competent operator',
      '[Deep clean contractor contact] where specialist work is outsourced',
      'Photographic record, before and after, for each area',
    ],
    measuredBy: [
      'Every area on the seasonal schedule is completed and signed within the planned window, with no area '
      + 'carried over more than once',
      'A before and after photograph exists for each area, filed against the schedule',
      'Defects found during the deep clean are logged on the maintenance system on the same day, with a target date',
    ],
    responsibilities: [
      { role: 'Spa manager', responsibility: 'Owns the seasonal schedule, agrees the closure or reduced capacity window with operations, and signs the closeout.' },
      { role: 'Cleaning supervisor', responsibility: 'Allocates areas, briefs the team on chemicals and dilution, and checks each area before it is signed off.' },
      { role: 'Maintenance', responsibility: 'Provides safe access to plant, ducting and high level areas, and receives every defect raised.' },
      { role: 'Duty manager', responsibility: 'Controls guest access to areas under deep clean and authorises any change to the agreed window.' },
    ],
    steps: [
      {
        name: 'Plan the window',
        action: 'Agree the deep clean window with operations at least [deep clean notice period] in advance, confirm which areas close and when, and publish the plan to reception, therapists and maintenance.',
        standard: 'The window is agreed and published before any booking is taken for the affected period, and no treatment room is cleaned while a guest is booked into it.',
      },
      {
        name: 'Brief the team',
        action: 'Before work starts, brief everyone on the areas allocated, the chemicals to be used, the dilution for each, contact times, and the personal protective equipment required.',
        standard: 'Every person working on the deep clean has been briefed and has signed the briefing record, and no chemical is in use by anyone who has not been briefed on it.',
      },
      {
        name: 'Photograph the starting condition',
        action: 'Photograph each area before work begins, from a consistent position, and file the images against the schedule.',
        standard: 'A dated before photograph exists for every area on the schedule, taken before the first product is applied.',
      },
      {
        name: 'Work top down, area by area',
        action: 'Clean from the highest surface to the floor, moving fixed furniture where it is safe to do so, and complete each area fully before moving on rather than part-completing several.',
        standard: 'Each area is signed off on the checklist by the person who cleaned it and checked by the supervisor before the team moves on.',
      },
      {
        name: 'Raise every defect found',
        action: 'Log damaged grout, failed seals, corroded fittings, blocked extracts and worn surfaces on the maintenance system as they are found, rather than at the end.',
        standard: 'Every defect is logged on the day it is found, with a photograph and the area reference, and a target date agreed with maintenance.',
      },
      {
        name: 'Check and reopen',
        action: 'The supervisor inspects each completed area against the checklist, confirms surfaces are dry and ventilation restored, and only then releases it back to operations.',
        standard: 'No area is reopened to guests until it has been inspected, signed and recorded as dry and ventilated.',
      },
      {
        name: 'Close out',
        action: 'Complete the closeout record: areas done, areas deferred with a reason and a date, defects raised, and chemicals used. The spa manager signs it.',
        standard: 'The closeout record is signed within [closeout deadline] of the window ending and retained for at least [record retention period].',
      },
    ],
    commonFailures: [
      'The window gets squeezed because a booking was taken into it, so the last two areas are rushed on the final evening and signed anyway.',
      'Defects are noticed and mentioned verbally instead of logged, so the same failed seal is found again at the next deep clean.',
      'A room is reopened while the floor is still wet or the grout sealant is still curing, and the first guest in gets the smell and the slip risk.',
    ],
    definitions: [
      { term: 'Deep clean', meaning: 'A planned, recorded clean of surfaces and spaces that routine daily cleaning does not reach, carried out on a seasonal cycle.' },
      { term: 'Contact time', meaning: 'The time a chemical must remain on a surface, wet, to work as the manufacturer intends. Wiping it off early means it has not worked.' },
      { term: 'Closeout', meaning: 'The signed record confirming what was completed, what was deferred and what defects were raised.' },
      { term: 'Carry over', meaning: 'An area moved to the next window because it could not be completed. Recorded with a reason, never simply dropped.' },
    ],
  },

  'MEM-ARREARS-ESCALATION-SOP-169': {
    purpose:
      'To recover unpaid membership fees promptly and consistently, so that arrears are resolved while they are '
      + 'small and the member relationship survives the conversation.',
    scope:
      'Applies to membership, reception and the spa manager, and covers every failed collection on a recurring '
      + 'membership from the first failure to either recovery, suspension or write-off.',
    whyItMatters:
      'A failed payment is usually an expired card, not a decision to leave. Chased in the first week it is a '
      + 'thirty second conversation. Left for sixty days it becomes a debt the member disputes, a membership '
      + 'that has been used without payment, and a cancellation that was avoidable.',
    equipment: [
      'Membership management system with an arrears report',
      'Payment collection provider with a retry schedule',
      'Approved contact templates for each stage, held centrally',
      'Access control system able to flag or suspend an account',
      '[Escalation contact for disputed accounts]',
      'Record of every contact attempt, dated, against the member account',
    ],
    measuredBy: [
      'Every failed collection is actioned within [first contact window] of the failure showing on the report',
      'Arrears older than sixty days are below [arrears threshold] of total membership revenue, reviewed monthly',
      'Every account that reaches suspension has a documented contact history showing each stage was completed in order',
    ],
    responsibilities: [
      { role: 'Membership coordinator', responsibility: 'Runs the arrears report, makes first contact, records every attempt and escalates on the stated timeline.' },
      { role: 'Reception', responsibility: 'Raises a flagged account discreetly at the desk, never in front of other guests, and passes it to membership rather than handling it.' },
      { role: 'Spa manager', responsibility: 'Authorises suspension, payment plans and write-offs, and reviews the arrears position monthly.' },
      { role: 'Finance', responsibility: 'Reconciles recovered payments and confirms write-offs against the ledger.' },
    ],
    steps: [
      {
        name: 'Run the report',
        action: 'Run the arrears report on a fixed day each week and list every failed collection with the member name, amount, date of failure and number of previous failures.',
        standard: 'The report is run on the same day every week without exception, and every line on it is either actioned or noted with a reason before the next run.',
      },
      {
        name: 'Make first contact',
        action: 'Contact the member within [first contact window], by their stated preferred method, treating it as an administrative issue: the payment did not go through, here is how to update it.',
        standard: 'First contact is made within the stated window, is recorded against the account with the date, method and outcome, and does not use the words debt, arrears or overdue.',
      },
      {
        name: 'Retry the collection',
        action: 'Once the member has updated their details, retry the collection immediately rather than waiting for the next cycle, and confirm to the member when it succeeds.',
        standard: 'The retry is attempted on the same day the details are updated, and the member receives confirmation of success or a further contact on failure.',
      },
      {
        name: 'Escalate on the timeline',
        action: 'Where there is no response, escalate at [second contact point] and again at [final notice point], each time in writing, each time stating the amount, the period it covers and what happens next.',
        standard: 'Each escalation is sent on time, states the amount and the consequence, and is recorded against the account. No stage is skipped, and no stage is repeated in place of the next one.',
      },
      {
        name: 'Offer a plan before a suspension',
        action: 'Before suspending, offer a payment plan where the member engages. Record the terms and the dates agreed.',
        standard: 'Every account reaching suspension shows either a refused or unanswered offer of a payment plan, recorded with the date it was made.',
      },
      {
        name: 'Suspend, with authority',
        action: 'Suspend access only on the spa manager authority, after the final notice period has passed, and notify the member in writing on the day it takes effect.',
        standard: 'No suspension takes effect without a recorded manager authorisation and a written notification dated the same day. A member is never turned away at the desk without prior written notice.',
      },
      {
        name: 'Close the account or recover it',
        action: 'On recovery, restore access the same day and confirm in writing. On non-recovery, refer for write-off or external recovery under [debt referral policy] and record the outcome.',
        standard: 'Every arrears case reaches a recorded outcome: recovered, plan in progress, written off, or referred. No case is left open with no action for more than [maximum open period].',
      },
    ],
    commonFailures: [
      'The report is run when somebody remembers, so a card that expired in January is first chased in March and the member has used the spa eight times unpaid.',
      'A member is stopped at reception in front of other guests because nobody made the phone call, and a recoverable fifty pounds becomes a cancellation and a review.',
      'Contact is made verbally and not recorded, so at escalation there is no evidence any stage happened and the whole timeline restarts.',
    ],
    definitions: [
      { term: 'Arrears', meaning: 'Membership fees due and not collected. Used internally; never used in a first contact with a member.' },
      { term: 'Failed collection', meaning: 'A recurring payment the provider could not take, usually an expired, blocked or insufficient card.' },
      { term: 'Payment plan', meaning: 'A written agreement to clear the outstanding balance over stated dates, authorised by the spa manager.' },
      { term: 'Suspension', meaning: 'Access withdrawn while the membership remains live. Reversible on payment, and always preceded by written notice.' },
    ],
  },

  'MEM-FEEDBACK-QUARTERLY-SOP-183': {
    purpose:
      'To gather structured feedback from members every quarter, act on what it shows, and tell members what '
      + 'changed as a result.',
    scope:
      'Applies to membership, the spa manager and the heads of each service area, and covers survey design, '
      + 'distribution, analysis, the action plan and the response back to members.',
    whyItMatters:
      'Members leave quietly. A quarterly survey is the only structured opportunity to hear a problem while it is '
      + 'still a complaint rather than a cancellation, and a survey that is sent and never acted on teaches members '
      + 'that feedback is decoration, which is worse than not asking.',
    equipment: [
      'Survey platform capable of anonymous responses and trend comparison',
      'Fixed question set, so quarters can be compared against each other',
      'Member contact list, filtered to those with at least [minimum membership length] of membership',
      'Action plan template with an owner and a date against each item',
      'Communication channel for the response back to members',
    ],
    measuredBy: [
      'The survey is issued within the first [survey issue window] of each quarter, every quarter, with no quarter skipped',
      'Response rate is at or above [target response rate], reported to the spa manager',
      'Every theme raised by more than [theme threshold] of respondents has a named owner and a dated action within two weeks of the survey closing',
    ],
    responsibilities: [
      { role: 'Membership coordinator', responsibility: 'Builds and issues the survey, chases the response rate, and compiles the results.' },
      { role: 'Spa manager', responsibility: 'Owns the action plan, assigns each theme to a named person and signs off the response to members.' },
      { role: 'Heads of service area', responsibility: 'Take the themes relating to their area, agree an action and a date, and report progress at the next review.' },
      { role: 'Reception', responsibility: 'Encourages completion in person during the survey window without seeing or influencing any answer.' },
    ],
    steps: [
      {
        name: 'Keep the questions stable',
        action: 'Use the fixed question set. Add at most two questions specific to the quarter, and mark them clearly as one-off so they do not corrupt the trend.',
        standard: 'The core questions are identical to the previous quarter, word for word, and any added question is recorded as one-off in the survey record.',
      },
      {
        name: 'Issue it',
        action: 'Issue the survey within the first [survey issue window] of the quarter to every member of at least [minimum membership length] standing, stating how long it takes and when it closes.',
        standard: 'The survey is issued within the stated window, states a closing date, and takes no longer than [survey completion time] to complete.',
      },
      {
        name: 'Chase the response rate',
        action: 'Send one reminder at the halfway point and prompt in person at the desk. Do not send more than one reminder.',
        standard: 'Exactly one written reminder is sent, at the halfway point, and the final response rate is recorded against the target.',
      },
      {
        name: 'Read it properly',
        action: 'Group free text comments into themes rather than counting them individually, and report the score trend against the previous two quarters, not the previous one alone.',
        standard: 'The report shows each theme with the number of respondents raising it, and every score is shown against at least the two preceding quarters.',
      },
      {
        name: 'Build the action plan',
        action: 'For every theme above [theme threshold], agree one action, one named owner and one date. Where the answer is that nothing will change, record that and the reason.',
        standard: 'Every qualifying theme has an owner and a date within two weeks of the survey closing, including the themes where the decision is to make no change.',
      },
      {
        name: 'Tell the members',
        action: 'Publish a short summary to members: what was said, what is changing, and what is not changing and why.',
        standard: 'The summary is published within [member response window] of the survey closing and names at least one specific change.',
      },
      {
        name: 'Review at the next quarter',
        action: 'Open the next quarter by reporting progress against the previous action plan before issuing the new survey.',
        standard: 'No survey is issued until the previous action plan has been reviewed and its status recorded against each item.',
      },
    ],
    commonFailures: [
      'The questions get rewritten every quarter because somebody wants better wording, and two years of trend data becomes uncomparable.',
      'Results are read as an average score, so a single strong theme raised by a quarter of respondents disappears inside a number that looks fine.',
      'Nothing is published back to members, so the next survey gets half the responses and the ones who do reply are the ones already leaving.',
    ],
    definitions: [
      { term: 'Theme', meaning: 'A subject raised independently by several respondents in free text, grouped for action rather than counted as separate comments.' },
      { term: 'Trend', meaning: 'The direction of a score across at least three quarters. A single quarter movement is noise.' },
      { term: 'Action plan', meaning: 'The list of themes with a named owner and a date against each, reviewed before the next survey is issued.' },
      { term: 'Response rate', meaning: 'Completed surveys as a proportion of members invited. Reported every quarter against the target.' },
    ],
  },

  'MEM-RENEWAL-RECONTRACT-SOP-178': {
    purpose:
      'To contact members before their term ends, secure the renewal on the right terms, and record the new '
      + 'contract accurately before the old one expires.',
    scope:
      'Applies to membership, the spa manager and finance, and covers every recurring membership approaching the '
      + 'end of its committed term, from the first reminder to the signed re-contract or the recorded departure.',
    whyItMatters:
      'A renewal secured a month early is a conversation about value. A renewal chased a week late is a '
      + 'negotiation about price, and often a cancellation. Retaining an existing member costs a fraction of '
      + 'recruiting a replacement, and the members who leave without being asked rarely say why.',
    equipment: [
      'Membership system with a renewal date report running at least [renewal horizon] ahead',
      'Current rate card and the approved retention offers',
      'Member usage data for the term ending',
      'Contract or agreement template with the current terms',
      'Record of the renewal conversation against the member account',
    ],
    measuredBy: [
      'Every member is contacted at least [first renewal contact point] before their term ends, with the contact recorded',
      'Renewal rate is reported monthly against [target renewal rate], split by membership type',
      'No membership auto-renews onto new terms without a recorded conversation or a written acceptance',
    ],
    responsibilities: [
      { role: 'Membership coordinator', responsibility: 'Runs the renewal report, holds the conversation, records the outcome and issues the new agreement.' },
      { role: 'Spa manager', responsibility: 'Authorises any offer outside the approved retention list and reviews the renewal rate monthly.' },
      { role: 'Finance', responsibility: 'Applies the new rate from the correct date and confirms the collection schedule.' },
      { role: 'Reception', responsibility: 'Flags a renewing member who visits during the window so the conversation can happen face to face.' },
    ],
    steps: [
      {
        name: 'Run the horizon report',
        action: 'Run a report of every membership ending within [renewal horizon] and prepare each member usage summary for the term: visits, treatments, classes, retail.',
        standard: 'The report runs weekly and every member on it has a usage summary prepared before the first contact is made.',
      },
      {
        name: 'Lead with what they used',
        action: 'Open the conversation with what the member actually used over the term, then confirm the renewal terms. Do not open with the price.',
        standard: 'The recorded conversation note shows the usage summary was discussed, and the first figure mentioned is the value used rather than the fee due.',
      },
      {
        name: 'Offer within authority',
        action: 'Where the member hesitates, offer from the approved retention list only. Anything outside it goes to the spa manager before it is offered, not after.',
        standard: 'Every offer made is either on the approved list or carries a recorded manager authorisation dated before the offer was made.',
      },
      {
        name: 'Confirm in writing',
        action: 'Issue the new agreement in writing, stating the new rate, the start date, the term and the notice period, and obtain written acceptance.',
        standard: 'Written acceptance is on file before the previous term ends. A verbal yes is recorded as a note, never treated as acceptance.',
      },
      {
        name: 'Set the collection correctly',
        action: 'Pass the confirmed terms to finance so the new rate applies from the correct date, and check the first collection at the new rate.',
        standard: 'The first collection at the new rate is checked against the agreement within [first collection check window] of it being taken.',
      },
      {
        name: 'Record a departure honestly',
        action: 'Where the member does not renew, record the stated reason in their own words, not a category, and confirm the end date and final collection in writing.',
        standard: 'Every non-renewal has a reason recorded in the member own words and a written confirmation of the end date sent before it arrives.',
      },
      {
        name: 'Review the pattern monthly',
        action: 'Report renewals, non-renewals and the reasons given to the spa manager each month, grouped by theme.',
        standard: 'The monthly report shows the renewal rate by membership type and the leaving reasons grouped, with any theme raised more than [departure theme threshold] times flagged for action.',
      },
    ],
    commonFailures: [
      'The report is run at thirty days instead of the full horizon, so the conversation happens after the member has already booked elsewhere.',
      'A discount is offered at the desk to save the conversation, outside anybody authority, and it becomes the rate every member expects at renewal.',
      'A verbal yes is treated as done, the paperwork is never issued, and the member is collected at a rate they never agreed to.',
    ],
    definitions: [
      { term: 'Term', meaning: 'The committed period of a membership, after which it either renews on new terms or ends.' },
      { term: 'Re-contract', meaning: 'A new agreement replacing the expiring one, with its own rate, term and notice period, accepted in writing.' },
      { term: 'Retention offer', meaning: 'A pre-approved concession that may be offered without further authority. Anything else requires the spa manager.' },
      { term: 'Renewal horizon', meaning: 'How far ahead the renewal report looks. Sets when the first contact happens.' },
    ],
  },

  'RTL-STOCK-TRANSFER-SOP-309': {
    purpose:
      'To move retail stock between locations with a complete record at both ends, so that stock on the system '
      + 'matches stock on the shelf at every point in the transfer.',
    scope:
      'Applies to the retail team, spa supervisors and the duty manager at both the sending and receiving '
      + 'locations, and covers every movement of saleable retail stock outside a single location, whether between '
      + 'sister properties, to an event, or back to a central store. It does not apply to professional-use stock.',
    whyItMatters:
      'Stock in transit belongs to nobody. It has left one stock system and not yet joined another, and that gap '
      + 'is where high-value retail disappears without anyone being able to say when. A transfer with paperwork at '
      + 'one end only is not a transfer, it is a loss with a plausible explanation.',
    equipment: [
      'Stock control system at both locations, with a transfer function',
      'Numbered transfer note in triplicate, or its digital equivalent',
      'Secure, sealed transport container with a recorded seal number',
      'Goods received documentation at the receiving location',
      '[Approved carrier or transport arrangement]',
      '[Duty manager contact] at both locations',
    ],
    measuredBy: [
      'Every transfer has a numbered transfer note signed at both ends, matched within [transfer reconciliation window] of dispatch',
      'Variance between quantity dispatched and quantity received is zero, and any variance is investigated the same day',
      'No stock is dispatched without the receiving location having confirmed it is expected',
    ],
    responsibilities: [
      { role: 'Spa supervisor, sending', responsibility: 'Raises the transfer, counts and seals the stock, removes it from the sending stock system and signs the transfer note.' },
      { role: 'Spa supervisor, receiving', responsibility: 'Confirms the transfer is expected, checks the seal, counts the stock against the note and adds it to the receiving system.' },
      { role: 'Duty manager', responsibility: 'Authorises the transfer, reviews any variance and approves any write-off arising from it.' },
      { role: 'Retail-trained therapist or receptionist', responsibility: 'Assists with the count and signs as the second counter. Never counts alone.' },
    ],
    steps: [
      {
        name: 'Agree it before it moves',
        action: 'Confirm with the receiving location what is being sent, when it will arrive and who will receive it. Do not dispatch to a location that has not confirmed.',
        standard: 'A written confirmation from the receiving location exists before the stock is packed, naming the person who will receive it.',
      },
      {
        name: 'Count with two people',
        action: 'Two named people count the stock against the transfer note, item by item, and both sign. The transfer note records item reference, description and quantity.',
        standard: 'Every transfer note carries two signatures from the sending location and lists each item by its unique reference. A single-signature note is not valid.',
      },
      {
        name: 'Seal and record',
        action: 'Seal the container, record the seal number on all copies of the transfer note, and photograph the sealed container with the note visible.',
        standard: 'The seal number appears on every copy of the transfer note and in the photograph, taken before the container leaves the secure area.',
      },
      {
        name: 'Remove from the sending system',
        action: 'Remove the stock from the sending location system at the point of dispatch, not before and not after, and mark it as in transit against the transfer number.',
        standard: 'The system shows the stock as in transit within [dispatch posting window] of the container leaving, referenced to the transfer number.',
      },
      {
        name: 'Receive against the note',
        action: 'At the receiving location, check the seal is intact and matches the note before opening, then count against the note with two people and sign.',
        standard: 'The seal is checked and recorded as intact or broken before opening. A broken or mismatched seal stops the receipt and is escalated to [duty manager contact] immediately.',
      },
      {
        name: 'Add to the receiving system',
        action: 'Add the received quantity to the receiving stock system, referenced to the transfer number, on the day of receipt.',
        standard: 'The receiving system is updated on the day of receipt, and stock is not put on display before it has been added.',
      },
      {
        name: 'Reconcile both ends',
        action: 'Match dispatched against received within [transfer reconciliation window]. Any variance is investigated the same day and reported to the duty manager at both locations.',
        standard: 'Every transfer is reconciled within the window, and no variance is written off without duty manager approval at both ends.',
      },
    ],
    commonFailures: [
      'Stock is sent because someone asked for it urgently, with a note written afterwards, and the two counts never match because the first one never happened.',
      'The sending location removes the stock from its system at dispatch and the receiving location adds it a week later, so for a week the stock exists nowhere and nobody notices.',
      'A broken seal is opened anyway because the delivery is late and the shop is busy, and any chance of establishing where a shortfall happened is gone.',
    ],
    definitions: [
      { term: 'Transfer note', meaning: 'The numbered document listing what is being moved, signed by two people at each end. The only evidence a transfer took place.' },
      { term: 'In transit', meaning: 'Stock dispatched but not yet received. Recorded as a state on the system, never as an absence.' },
      { term: 'Seal number', meaning: 'The unique number on the tamper seal, recorded at dispatch and checked at receipt. Establishes whether the container was opened en route.' },
      { term: 'Variance', meaning: 'Any difference between quantity dispatched and quantity received. Investigated the same day, never absorbed.' },
    ],
  },

  'AUD-AUDIT-EVIDENCE-COLLECTION-SOP-462': {
    purpose:
      'To collect, file and retain the evidence that the spa operates the way its documents say it does, so that '
      + 'an audit is a retrieval exercise rather than a reconstruction.',
    scope:
      'Applies to the spa management team and every head of area, and covers the evidence supporting operational '
      + 'procedures, training, maintenance, cleaning, stock and guest safety records.',
    whyItMatters:
      'An auditor does not assess what the spa does, they assess what the spa can show. A well-run operation with '
      + 'no records fails; an average one with complete records passes. Evidence collected in the week before an '
      + 'audit is obvious to anyone who has done the job, and it undermines everything filed alongside it.',
    equipment: [
      'Evidence register listing each requirement, the evidence that satisfies it and where it is held',
      'Document management system or structured filing with controlled access',
      'Retention schedule stating how long each record type is kept',
      'Named owner for each evidence category',
      '[Audit framework or standard the property is assessed against]',
    ],
    measuredBy: [
      'Every requirement on the evidence register has current evidence filed against it, checked monthly',
      'No evidence item is more than [evidence currency period] out of date at any monthly check',
      'Any requested evidence can be produced within [evidence retrieval time] of being asked for',
    ],
    responsibilities: [
      { role: 'Spa manager', responsibility: 'Owns the evidence register, runs the monthly check and reports gaps to [property leadership contact].' },
      { role: 'Heads of area', responsibility: 'File the evidence for their area as it is created, not retrospectively, and confirm currency at the monthly check.' },
      { role: 'Administrator', responsibility: 'Maintains the filing structure, applies the retention schedule and controls access.' },
      { role: 'Duty manager', responsibility: 'Ensures records created on shift, such as checks and incident logs, are completed and filed before the shift ends.' },
    ],
    steps: [
      {
        name: 'Map requirement to evidence',
        action: 'For each requirement in [audit framework or standard the property is assessed against], record what evidence satisfies it, who owns it, how often it is produced and where it is filed.',
        standard: 'Every requirement has at least one named evidence item, a named owner and a filing location. No requirement is recorded as satisfied by an undocumented practice.',
      },
      {
        name: 'File as it happens',
        action: 'File each record at the point it is created, into the location the register names, with the date it relates to in the file name.',
        standard: 'Records are filed within [filing window] of being created. Nothing is held in a personal folder, inbox or notebook pending filing.',
      },
      {
        name: 'Keep it legible and attributable',
        action: 'Every record shows what was done, when, and by whom, with a name rather than initials where the record supports a safety or competence claim.',
        standard: 'No safety, training or competence record is accepted with an unattributable signature, an undated entry or a correction that obscures the original.',
      },
      {
        name: 'Check currency monthly',
        action: 'Run the register monthly and mark each item current, out of date or missing. Assign a date to every gap on the day it is found.',
        standard: 'The monthly check covers every line on the register and each gap has a named owner and a target date recorded within the check.',
      },
      {
        name: 'Apply the retention schedule',
        action: 'Retain each record for the period the schedule states, then dispose of it under the schedule. Do not keep everything indefinitely and do not clear records early.',
        standard: 'No record is disposed of before its retention period ends, and disposal is recorded with the date and the category disposed.',
      },
      {
        name: 'Rehearse the retrieval',
        action: 'Once a quarter, pick five requirements at random and time how long it takes to produce the evidence.',
        standard: 'All five are produced within [evidence retrieval time]. Any that are not become an action with an owner and a date.',
      },
    ],
    commonFailures: [
      'Records are completed on paper on the floor and filed at the end of the month, so a fortnight of checks are written up from memory in one sitting and the handwriting gives it away.',
      'Evidence lives in one person head and one person inbox, and when they leave the property cannot demonstrate six months of its own operation.',
      'The register is built once at the start and never reviewed, so a procedure that changed in March is still evidenced against the old requirement in November.',
    ],
    definitions: [
      { term: 'Evidence register', meaning: 'The list mapping each requirement to the record that satisfies it, its owner and where it is held.' },
      { term: 'Attributable', meaning: 'A record that identifies who made it. An initial that cannot be matched to a person is not attributable.' },
      { term: 'Retention schedule', meaning: 'How long each type of record is kept before disposal, and the reason for that period.' },
      { term: 'Currency', meaning: 'Whether a piece of evidence is recent enough to demonstrate the requirement now, rather than at some point in the past.' },
    ],
  },

  'AUD-INTERNAL-AUDIT-PROGRAMME-SCHEDULE-SOP-460': {
    purpose:
      'To run a planned programme of internal audits across the spa, so that problems are found by the property '
      + 'before they are found by anybody else.',
    scope:
      'Applies to the spa management team and the nominated internal auditors, and covers the audit schedule, the '
      + 'conduct of each audit, the report, and the link into corrective action.',
    whyItMatters:
      'Everything in the spa drifts: procedures get shortcut on busy days, records slip, training expires. An '
      + 'internal audit is the only mechanism that catches drift while it is still cheap to correct. Without one, '
      + 'the first person to notice is an external assessor, an insurer, or a guest.',
    equipment: [
      'Annual audit schedule covering every area and procedure at a stated frequency',
      'Audit checklists derived from the procedures themselves, not written separately',
      'Trained internal auditors, with a record of that training',
      'Non-conformance and corrective action process',
      'Audit report template with findings graded',
      '[Property leadership contact] for escalation of major findings',
    ],
    measuredBy: [
      'Every area on the annual schedule is audited at its stated frequency, with no audit more than [audit slippage tolerance] late',
      'No auditor audits their own area of responsibility, verified on every audit record',
      'Every finding has a corrective action with an owner and a date, closed within [corrective action window] or formally extended',
    ],
    responsibilities: [
      { role: 'Spa manager', responsibility: 'Owns the programme, appoints auditors, reviews every report and escalates major findings.' },
      { role: 'Internal auditor', responsibility: 'Conducts the audit against the procedure, records findings with evidence, and reports without softening.' },
      { role: 'Head of area audited', responsibility: 'Provides access and records, agrees corrective actions and dates, and closes them out.' },
      { role: 'Administrator', responsibility: 'Maintains the schedule, issues notice of each audit and files the reports.' },
    ],
    steps: [
      {
        name: 'Build the annual schedule',
        action: 'Set the frequency for each area by risk: higher frequency where a failure affects guest safety, lower where it affects only convenience. Publish the schedule at the start of the year.',
        standard: 'Every area appears on the schedule with a stated frequency and a stated reason for that frequency. The schedule is published before the first audit of the year.',
      },
      {
        name: 'Appoint independent auditors',
        action: 'Appoint auditors who do not work in the area being audited, and record their audit training.',
        standard: 'No audit record shows an auditor auditing their own area. Every named auditor has a dated training record on file.',
      },
      {
        name: 'Audit against the procedure',
        action: 'Use a checklist taken from the procedure itself. Observe the work being done, examine records, and speak to the people doing it.',
        standard: 'Every finding cites the specific clause of the procedure it relates to and the evidence seen. A finding with no cited evidence is not recorded as a finding.',
      },
      {
        name: 'Grade the findings',
        action: 'Grade each finding: major where guest safety or a legal duty is affected, minor where the procedure is not being met, observation where it is met but at risk.',
        standard: 'Every finding carries a grade, and any major finding is reported to the spa manager on the day it is raised, not at the end of the audit.',
      },
      {
        name: 'Report within the window',
        action: 'Issue the written report to the head of area and the spa manager within [audit report window] of the audit closing.',
        standard: 'The report is issued within the window, lists every finding with its grade and evidence, and states what was found to be working as well as what was not.',
      },
      {
        name: 'Raise corrective actions',
        action: 'Every finding becomes a corrective action with a named owner and a date, entered into the non-conformance process.',
        standard: 'No finding is closed at the report stage. Each one is entered as a corrective action with an owner and a date before the report is filed.',
      },
      {
        name: 'Review the programme',
        action: 'Review the programme at least [programme review frequency]: audits completed against schedule, findings by area, repeat findings, and actions overdue.',
        standard: 'The review is recorded, and any area producing the same finding twice in a year is escalated to [property leadership contact] with a proposed change.',
      },
    ],
    commonFailures: [
      'The audit is done by the person who runs the area, because they know it best, and it finds nothing every time.',
      'Audits are scheduled and then postponed when the spa is busy, which is precisely when the drift being looked for is happening.',
      'Findings are discussed in the room, agreed verbally and never written down, so the same issue is discovered again at the next audit and treated as new.',
    ],
    definitions: [
      { term: 'Internal audit', meaning: 'A planned check by the property on itself, against its own documented procedures.' },
      { term: 'Major finding', meaning: 'A failure affecting guest safety or a legal duty. Reported on the day it is found.' },
      { term: 'Observation', meaning: 'The procedure is being met, but something suggests it will not be for long. Recorded so it can be acted on early.' },
      { term: 'Independence', meaning: 'The auditor has no responsibility for the area audited. Without it the audit has no value.' },
    ],
  },

  'AUD-NONCONFORMANCE-CORRECTIVE-ACTION-SOP-461': {
    purpose:
      'To record every non-conformance, correct the immediate problem, find the reason it happened, and prevent '
      + 'it happening again.',
    scope:
      'Applies to every member of the spa team, and covers non-conformances found by audit, by a manager, by a '
      + 'guest complaint, by a supplier, or reported by the person who made the error.',
    whyItMatters:
      'The same problem recurring is the clearest signal an operation is not learning. Fixing the instance and '
      + 'not the cause guarantees the next instance, and a team that sees non-conformances used to blame people '
      + 'stops reporting them, at which point the property is blind.',
    equipment: [
      'Non-conformance log, accessible to every head of area',
      'Corrective action record with owner, date, action and verification',
      'Root cause method the team is trained in',
      'Trend report by area and by cause',
      '[Property leadership contact] for escalation',
    ],
    measuredBy: [
      'Every non-conformance is logged within [logging window] of being identified',
      'Every corrective action is verified as effective before it is closed, with the verification recorded',
      'Repeat non-conformances of the same cause are below [repeat threshold] per quarter, reported to the spa manager',
    ],
    responsibilities: [
      { role: 'Anyone in the team', responsibility: 'Reports a non-conformance as soon as it is seen, including their own. Reporting is never treated as fault.' },
      { role: 'Head of area', responsibility: 'Contains the immediate problem, investigates the cause, agrees the corrective action and closes it out.' },
      { role: 'Spa manager', responsibility: 'Reviews the log, approves closure of major non-conformances and reports trends.' },
      { role: 'Internal auditor', responsibility: 'Verifies that a corrective action worked, independently of the person who implemented it.' },
    ],
    steps: [
      {
        name: 'Log it',
        action: 'Record what happened, where, when, who identified it and what procedure or standard it departs from. Record the facts, not an explanation.',
        standard: 'The entry is logged within [logging window], cites the procedure or standard affected, and contains no attribution of blame to a named individual.',
      },
      {
        name: 'Contain it',
        action: 'Take immediate action to stop the problem affecting a guest or the operation: withdraw the product, close the area, stop the treatment, correct the record.',
        standard: 'Containment is recorded with the time it was applied. Where a guest was or may have been affected, [duty manager contact] is informed immediately.',
      },
      {
        name: 'Find the cause, not the culprit',
        action: 'Ask why the failure was possible, not who did it. Look at training, workload, equipment, procedure clarity and handover before looking at the individual.',
        standard: 'The recorded cause is a condition that made the failure possible. Human error alone is never accepted as a root cause; the question is why the system allowed it.',
      },
      {
        name: 'Agree the corrective action',
        action: 'Agree one action that removes the cause, with a named owner and a date. Retraining one person is a corrective action only where the cause was genuinely that person training.',
        standard: 'Every corrective action names an owner and a date, and addresses the recorded cause rather than the instance.',
      },
      {
        name: 'Verify it worked',
        action: 'After the action is implemented, check the same failure cannot now occur, by observation or by sampling records.',
        standard: 'Verification is carried out by somebody other than the person who implemented the action, is recorded with the evidence seen, and happens before closure.',
      },
      {
        name: 'Close it, or extend it openly',
        action: 'Close the non-conformance once verified. Where the date cannot be met, record an extension with a reason rather than letting it run silently overdue.',
        standard: 'No non-conformance is closed without recorded verification, and no action is more than [overdue tolerance] past its date without a recorded extension.',
      },
      {
        name: 'Report the trend',
        action: 'Report monthly on non-conformances by area and by cause, and flag any cause appearing more than [repeat threshold] times.',
        standard: 'The monthly report groups by cause rather than by incident, and every flagged repeat is escalated to [property leadership contact] with a proposed systemic change.',
      },
    ],
    commonFailures: [
      'The log becomes a disciplinary record, so the team stops reporting and the only non-conformances recorded are the ones a guest complained about.',
      'Retraining is the corrective action for everything, so the same failure recurs with a different person each time and the training record grows while nothing changes.',
      'Actions are marked complete on the day they are implemented, with no verification, so an action that did not work is closed as though it did.',
    ],
    definitions: [
      { term: 'Non-conformance', meaning: 'Any departure from a documented procedure, standard or requirement, however small and whoever found it.' },
      { term: 'Containment', meaning: 'The immediate action stopping the problem affecting anyone else, taken before the cause is understood.' },
      { term: 'Root cause', meaning: 'The condition that made the failure possible. Not the person, and not the last thing that happened.' },
      { term: 'Verification', meaning: 'Independent evidence that the corrective action has actually prevented recurrence. Required before closure.' },
    ],
  },

  'TRN-REFRESHER-SCHEDULING-SOP-407': {
    purpose:
      'To identify when refresher training is due or triggered, schedule it, and record it, so that no member of '
      + 'the team is working beyond the currency of their training.',
    scope:
      'Applies to the training team, heads of area and the spa manager, and covers scheduled refreshers by '
      + 'frequency and unscheduled refreshers triggered by an event.',
    whyItMatters:
      'Competence expires quietly. A therapist trained on a treatment two years ago and never rechecked is not '
      + 'obviously different from one trained last month, until the day something goes wrong and the training '
      + 'record is the first thing requested.',
    equipment: [
      'Training matrix listing every role, every required competence and its refresher frequency',
      'Training record for each individual, with dates and assessor',
      'Rota system able to release people for training',
      'Trigger list stating which events require an unscheduled refresher',
      '[Training provider or internal assessor contact] for competences that cannot be assessed in house',
    ],
    measuredBy: [
      'No individual is working on a competence more than [training currency tolerance] past its refresher date',
      'Every triggered refresher is scheduled within [trigger scheduling window] of the trigger occurring',
      'The training matrix is reviewed at least [matrix review frequency] and reflects the treatments and systems currently in use',
    ],
    responsibilities: [
      { role: 'Training lead', responsibility: 'Maintains the matrix, runs the expiry report, schedules refreshers and records completion.' },
      { role: 'Head of area', responsibility: 'Releases people for scheduled training and reports any trigger event on the day it happens.' },
      { role: 'Spa manager', responsibility: 'Authorises any temporary restriction on duties where a refresher is overdue, and reviews the expiry report monthly.' },
      { role: 'Individual', responsibility: 'Attends the refresher scheduled, and raises it where they do not feel current on a competence before it expires.' },
    ],
    steps: [
      {
        name: 'Run the expiry report',
        action: 'Run the training matrix expiry report monthly, listing every competence falling due within [refresher lead time].',
        standard: 'The report is run monthly, and every line falling due within the lead time is scheduled or recorded with a reason before the next run.',
      },
      {
        name: 'Act on triggers immediately',
        action: 'Where a trigger occurs, an incident, a near miss, a complaint about technique, a change to the procedure, a new product or system, or a return from extended absence, schedule the refresher without waiting for the next report.',
        standard: 'Every trigger is recorded on the day it occurs and the refresher is scheduled within [trigger scheduling window]. A trigger is never closed by a verbal reminder.',
      },
      {
        name: 'Schedule against the rota',
        action: 'Book the refresher into the rota as a duty, not as an addition to a full shift, and confirm cover for the area.',
        standard: 'Training time appears on the published rota with cover arranged. No refresher is scheduled on top of a full treatment column or a closing shift.',
      },
      {
        name: 'Refresh, do not repeat',
        action: 'Focus the session on what has changed, what commonly goes wrong, and the practical check. Do not re-deliver the original course from the beginning.',
        standard: 'Every refresher includes a practical or verbal check against the current procedure, and the assessor records the outcome as competent or requiring further training.',
      },
      {
        name: 'Record it properly',
        action: 'Record the date, the competence, the assessor name and the outcome against the individual training record, and set the next refresher date.',
        standard: 'The record is completed on the day, names the assessor, states the outcome, and carries the next due date. An attendance signature alone is not a competence record.',
      },
      {
        name: 'Restrict where overdue',
        action: 'Where a competence is overdue beyond tolerance, the spa manager restricts that individual from the relevant duty until the refresher is completed.',
        standard: 'Every restriction is recorded with the date it started, the duty restricted and the date it was lifted. No one performs a treatment or task whose competence is overdue beyond tolerance.',
      },
      {
        name: 'Review the matrix',
        action: 'Review the matrix at least [matrix review frequency] against the treatment menu, the equipment and the systems actually in use, and add or remove competences accordingly.',
        standard: 'The review is recorded, and every treatment or system introduced since the last review appears on the matrix with a frequency set.',
      },
    ],
    commonFailures: [
      'Refreshers are scheduled and then dropped when the spa gets busy, so the expiry report shows the same six names moving down the page every month.',
      'The session is delivered but only an attendance sheet is signed, so there is a record that people were in the room and none that anyone is competent.',
      'A new treatment is added to the menu and never added to the matrix, so its refresher never falls due and nobody is ever rechecked on it.',
    ],
    definitions: [
      { term: 'Training matrix', meaning: 'The grid of roles against required competences, with the refresher frequency for each.' },
      { term: 'Trigger', meaning: 'An event requiring a refresher regardless of the schedule, such as an incident, a procedure change or a return from extended absence.' },
      { term: 'Currency', meaning: 'Whether a competence is still within its refresher period. Expired currency means the person is not signed off to do the task.' },
      { term: 'Practical check', meaning: 'Observation of the task being performed to the current standard. The part of a refresher that produces the competence record.' },
    ],
  },
}

// authoredReferences moved to ./authored, which merges this with the six
// written later. A count that only knew about this file would be wrong the
// day anything was added beside it.
