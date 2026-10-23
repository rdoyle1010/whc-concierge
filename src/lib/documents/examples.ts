import type { SopDocument } from './types'
import { buildReference } from './reference'

// One worked document, at the standard the rest have to reach.
//
// The property is invented. A worked example in a code library naming a real
// client is a document that ends up screenshotted, quoted or indexed with
// somebody's name on it, and neither they nor we agreed to that.
//
// Deliberately the same procedure as the SOP this was modelled on, so the two
// can be put side by side and the difference argued about rather than
// guessed at. What is new is the document control block, the review date, the
// separation of author from owner, the line on why it matters, the measures,
// and the section on where it goes wrong, which is the part a trainer
// actually spends the session on.

export const EXAMPLE_SOP: SopDocument = {
  kind: 'sop',
  reference: buildReference({ department: 'Reception', title: 'Follow Up', kind: 'sop', sequence: 43 }),
  title: 'Post-Visit Follow-Up and Feedback Request',
  version: '1.0',
  issued: '18 January 2026',
  reviewBy: '18 January 2027',

  property: 'The Spa at Ashcombe Park Hotel',
  department: 'Reception',
  operationalStage: 'Post-visit follow-up',

  accountability: {
    author: 'Rebecca Doyle',
    authorRole: 'Spa Operations Consultant',
    owner: 'Spa Manager',
  },

  governance: [
    'Brand operating standards',
    'Booking system standards',
    'Talent House Collective operational standards',
  ],

  purpose:
    'To define the mandatory standard for post-visit follow-up from the reception team, so that every guest who '
    + 'leaves without rebooking is contacted, invited back, and asked for feedback within forty-eight hours.',
  scope:
    'All spa receptionist and reception supervisor roles. Covers follow-up communication to every guest who did '
    + 'not rebook at departure, in the forty-eight hours after their visit.',
  equipment: [
    'Shared spa email inbox',
    'Approved post-visit follow-up template',
    'Booking system',
    'Lead capture log',
  ],

  whyItMatters:
    'A guest who leaves without rebooking is not lost, they are undecided, and the window in which that changes '
    + 'is about two days wide. Rebooking an existing guest costs a two-minute email; replacing her costs a '
    + 'marketing budget.',
  measuredBy: [
    'Percentage of non-rebooking guests contacted within forty-eight hours, reviewed weekly.',
    'Follow-up to rebooking conversion rate, reviewed monthly against the previous quarter.',
    'Number of reviews generated from follow-up requests, reviewed monthly.',
    'Time from a negative response arriving to it being escalated, which should never exceed one shift.',
  ],

  responsibilities: [
    {
      role: 'Spa Receptionist',
      responsibility:
        'Generates the daily follow-up list, sends personalised follow-up emails within forty-eight hours using '
        + 'the approved template, logs every send, and actions replies the same shift.',
    },
    {
      role: 'Reception Supervisor',
      responsibility:
        'Checks the list has been worked each day, handles every escalated negative response before a reply is '
        + 'sent, and reports conversion in the weekly commercial review.',
    },
    {
      role: 'Spa Manager',
      responsibility:
        'Owns this procedure, approves any deviation from it, and reviews the measures below monthly.',
    },
  ],

  steps: [
    {
      name: 'Generate the follow-up list',
      action:
        'At the start of shift, review the booking system and the lead capture log for guests seen in the '
        + 'previous forty-eight hours who did not rebook at departure.',
      standard: 'A follow-up list is generated every day from both the booking system and the lead log.',
    },
    {
      name: 'Prepare and personalise',
      action:
        'Use the approved template. Personalise with the guest name, the treatment received, and one specific '
        + 'recommendation for their next visit based on what the therapist recorded.',
      standard: 'Every email names the guest, the treatment taken, and a specific recommended next treatment.',
    },
    {
      name: 'Include the feedback request',
      action:
        'Include the review invitation in every email, in the wording set out in the review management '
        + 'procedure. Never ask for a review and a rebooking in the same sentence.',
      standard: 'A feedback and review invitation appears in every follow-up without exception.',
    },
    {
      name: 'Send from the shared inbox',
      action:
        'Send from the shared spa inbox only, never a personal account. Proofread the whole email, including '
        + 'the guest name and treatment, before sending.',
      standard: 'All follow-ups are sent from the shared inbox and proofread before dispatch.',
    },
    {
      name: 'Log the send',
      action: 'Record the send against the guest on the lead log, with the date and the recommendation made.',
      standard: 'Every send is logged the same day, so the list cannot be worked twice or missed.',
    },
    {
      name: 'Action replies the same shift',
      action:
        'Answer every reply within the shift it arrives. Book anything that can be booked immediately rather '
        + 'than asking the guest to call back.',
      standard: 'No reply carries over to the next day unanswered.',
    },
    {
      name: 'Escalate a negative response',
      action:
        'Any reply containing a complaint goes to the supervisor before any answer is sent. Do not apologise, '
        + 'explain or offer anything first.',
      standard: 'Negative responses reach a supervisor before a reply leaves the inbox, every time.',
    },
  ],

  commonFailures: [
    'The list is generated but not worked on a busy day, and two days later the window has closed.',
    'The template is sent without personalisation, which reads as marketing and is treated as marketing.',
    'A recommendation is invented rather than taken from the therapist notes, and the guest can tell.',
    'A complaint is answered kindly and immediately by whoever opened it, which commits the property to '
      + 'something before anybody senior has seen it.',
    'Sends are not logged, so the same guest is contacted twice and the conversion rate cannot be measured.',
  ],

  definitions: [
    { term: 'Post-visit follow-up', meaning: 'An email sent within forty-eight hours of a visit to a guest who did not rebook.' },
    { term: 'Follow-up list', meaning: 'The daily list, drawn from the booking system and the lead log, of guests to contact.' },
    { term: 'Rebooking invitation', meaning: 'A direct, specific offer to book the next visit, included in every follow-up.' },
    { term: 'Feedback request', meaning: 'An invitation to share their experience, included in every follow-up.' },
    { term: 'Negative response', meaning: 'Any reply containing a complaint. Escalated to a supervisor before any reply is sent.' },
  ],

  references: [
    { name: 'Rebooking conversation and future booking capture', reference: 'REC-REBOOKING-SOP-042' },
    { name: 'Aftercare email dispatch and record', reference: 'REC-AFTERCARE-SOP-045' },
    { name: 'Review request and reputation management', reference: 'REC-REVIEW-SOP-047' },
    { name: 'Guest complaint intake and triage', reference: 'REC-COMPLAINT-SOP-033' },
  ],

  revisions: [
    { date: '18 January 2026', by: 'Rebecca Doyle', description: 'Document created, version 1.0.' },
  ],
}
