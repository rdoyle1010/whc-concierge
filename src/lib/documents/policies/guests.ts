import type { PolicyEntry } from './types'

// Guests and treatments.
//
// These are the ones nobody else writes, and the ones a spa most needs. A
// chaperone policy, an under-18s policy and a photography policy are each a
// single page that prevents an allegation nobody can disprove afterwards.
// Most spas have none of them and rely on everybody being sensible, which
// works until the day it does not.

export const GUEST_POLICIES: PolicyEntry[] = [
  {
    reference: 'GST-CHAPERONE-POL-811',
    title: 'Chaperone and Intimate Treatments Policy',
    department: 'SPA THERAPISTS',
    group: 'Guests and treatments',
    purpose:
      'To protect guests and therapists during treatments involving undress, close contact or intimate areas, '
      + 'by setting out consent, draping, chaperoning and what is recorded.',
    appliesTo:
      'Every treatment involving undress or contact with an intimate area, and every treatment on a person '
      + 'under eighteen. [The property lists which treatments on its menu this covers.]',
    position: [
      'A guest is never uncertain about what is going to happen, what they need to remove, or what will be '
      + 'covered. Explaining it every time, including to a regular, is the standard.',
      'A chaperone is available on request for any treatment, and offered as a matter of course for the '
      + 'treatments the property lists. Asking for one is never treated as a comment on the therapist.',
      'A therapist may also request a chaperone, for their own protection, and that request is met. A '
      + 'therapist who is uncomfortable may decline a treatment and will be supported.',
      'Draping is continuous. Only the area being worked on is exposed, and it is covered again before moving on.',
    ],
    rules: [
      {
        area: 'Before',
        items: [
          'Explain the treatment, the areas worked on, what to remove and what will be covered, before leaving the room.',
          'Take and record consent for the treatment, including consent for any intimate area listed on the menu.',
          'Offer a chaperone for any listed treatment, and record the answer either way.',
          'Leave the room while the guest undresses and knock before returning.',
          'For anybody under eighteen, a chaperone is not optional and consent comes from a person with parental responsibility.',
        ],
      },
      {
        area: 'During',
        items: [
          'Maintain draping throughout. Uncover only the area being worked on.',
          'Check in before moving to a new area rather than after.',
          'Stop immediately if the guest asks, hesitates, or appears uncomfortable, and do not resume without a clear yes.',
          'Do not make personal remarks about a guest’s body beyond what the treatment requires.',
          'The door is unlocked but privacy is protected. Nobody walks in without knocking.',
        ],
      },
      {
        area: 'Afterwards',
        items: [
          'Leave the room while the guest dresses.',
          'Record the treatment, the consent, whether a chaperone was present and who it was.',
          'Report any discomfort, allegation or awkwardness to the duty manager the same shift, however small it seemed.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Listing the treatments this covers, and the resourcing so a chaperone is actually available.' },
      { role: 'Spa Manager', duty: 'Rostering so a chaperone can be provided, and handling any allegation immediately.' },
      { role: 'Therapists', duty: 'Explanation, consent, draping, and recording it every time.' },
      { role: 'Duty manager', duty: 'Receiving a concern the same shift, and acting before the guest leaves where possible.' },
    ],
    records: [
      'Consent records for every treatment covered by this policy',
      'Whether a chaperone was offered, accepted or declined, and who chaperoned',
      'Any concern, complaint or allegation, and what was done immediately',
      'Training records for this policy, completed at induction',
    ],
    breach: [
      'Treating without recorded consent is a disciplinary matter.',
      'Treating anybody under eighteen without a chaperone and documented parental consent is gross misconduct.',
      'Continuing after a guest has asked to stop is gross misconduct and may be a criminal matter.',
      'Refusing a chaperone request, from a guest or from a colleague, is a serious breach.',
      'Failing to report an allegation the same shift is treated as seriously as the allegation.',
    ],
    reviewTriggers: [
      'Any allegation, complaint or concern under this policy',
      'A change to the treatment menu, particularly any new treatment involving undress or intimate areas',
      'Insurer or professional body guidance',
    ],
  },

  {
    reference: 'GST-UNDER18S-POL-812',
    title: 'Under Eighteens and Spa Access Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Guests and treatments',
    purpose:
      'To state who under eighteen may use which parts of the spa, what they may be treated with, and on whose '
      + 'consent.',
    appliesTo: 'Everybody working in the spa, and every guest bringing a person under eighteen onto the premises.',
    position: [
      'Age limits exist because of physiology and safety, not because of atmosphere. Heat experiences, cold '
      + 'plunges and some treatments are genuinely unsuitable for a developing body.',
      'The limits are published, and they are applied the same way to a member, to a hotel guest and to a '
      + 'stranger. An exception made once becomes the expectation.',
      'Consent for a treatment on a person under eighteen comes from a person with parental responsibility, in '
      + 'writing, and is recorded.',
      'A person under eighteen is never treated alone. A chaperone is present throughout.',
    ],
    rules: [
      {
        area: 'Access by area',
        items: [
          'Spa and thermal areas: [the property states the minimum age and any accompanied exception].',
          'Pool: [the property states the minimum age, the supervision ratio and any swim ability requirement].',
          'Gym floor: [the property states the minimum age and any induction requirement].',
          'Classes: [the property states which classes admit under eighteens and on what terms].',
          'Where a family or junior session exists, it is separately timetabled and separately supervised.',
        ],
      },
      {
        area: 'Treatments',
        items: [
          'Only [the treatments the property lists] are offered to anybody under eighteen.',
          'Written consent from a person with parental responsibility is taken before the treatment and kept.',
          'A chaperone is present for the whole treatment, without exception.',
          'The consultation is carried out with both the young person and the accompanying adult.',
        ],
      },
      {
        area: 'At the desk',
        items: [
          'Ask the age at booking, not on arrival, so nobody arrives to be turned away.',
          'Where age is uncertain, ask. Being wrong is worse than being awkward.',
          'Record the accompanying adult and their relationship.',
          'Refuse politely, explain the reason as safety, and offer the alternative the property has.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Setting and publishing the limits, and the assessment behind them.' },
      { role: 'Reception', duty: 'Asking at booking, checking at arrival, and recording the accompanying adult.' },
      { role: 'Therapists', duty: 'Confirming consent and a chaperone before starting, every time.' },
      { role: 'Lifeguards and hosts', duty: 'Enforcing supervision ratios and area limits on the floor.' },
    ],
    records: [
      'Parental consent records for treatments on under eighteens',
      'Booking records showing age and accompanying adult',
      'Refusals and the reason, where a guest was turned away',
      'The risk assessment behind each age limit',
    ],
    breach: [
      'Admitting somebody below a stated age limit is a disciplinary matter, and is a safeguarding matter as well.',
      'Treating a person under eighteen without written parental consent or without a chaperone is gross misconduct.',
      'Making an exception to an age limit without authority is treated seriously, because the next person will expect the same.',
    ],
    reviewTriggers: [
      'Any incident involving a person under eighteen',
      'A change to the facilities, the menu or the timetable',
      'A change to safeguarding guidance or insurer requirements',
    ],
  },

  {
    reference: 'GST-PREGNANCY-POL-813',
    title: 'Pregnancy and Treatment Suitability Policy',
    department: 'SPA THERAPISTS',
    group: 'Guests and treatments',
    purpose:
      'To state which treatments and facilities are suitable during pregnancy, and how that conversation is '
      + 'handled without embarrassing anybody.',
    appliesTo: 'Reception, therapists and anybody supervising heat or water areas.',
    position: [
      'Pregnancy is not a medical condition to be managed at a desk, and nobody here diagnoses, advises or '
      + 'reassures on a medical matter. What we do is say clearly what we offer, what we do not, and why.',
      'A guest is never asked whether they are pregnant in front of other people, and never asked twice by '
      + 'different members of the team.',
      'Where a treatment or facility is not offered during pregnancy, that is stated as our position rather '
      + 'than as advice about their health, and an alternative is offered.',
      'A guest who tells us their midwife or doctor has approved something we do not offer is still not given '
      + 'it. We are not in a position to verify that, and our position stands.',
    ],
    rules: [
      {
        area: 'At booking',
        items: [
          'The health questionnaire asks the question in writing, privately, as one of several.',
          'Where pregnancy is disclosed, offer only from [the treatments the property lists as suitable].',
          'State which facilities are not available, at the point of booking rather than at arrival.',
          'Do not ask how many weeks unless the menu genuinely distinguishes, and say why if you do.',
        ],
      },
      {
        area: 'Facilities',
        items: [
          'Heat experiences, saunas, steam rooms and hot tubs: [the property states its position].',
          'Cold plunge and contrast therapy: [the property states its position].',
          'Pool use: [the property states its position].',
          'Signage states the position at the entrance to each area, so nobody has to ask.',
        ],
      },
      {
        area: 'Treatments',
        items: [
          'Deliver only treatments the therapist is qualified and signed off for in pregnancy.',
          'Use the positioning, products and pressure the pregnancy protocol requires.',
          'Stop and refer if the guest becomes unwell or uncomfortable at any point.',
          'Record what was delivered and any adaptation.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Setting the position for each facility and treatment, and the basis for it.' },
      { role: 'Reception', duty: 'Asking privately and in writing, and stating the position at booking.' },
      { role: 'Therapists', duty: 'Working within their qualification and the protocol, and declining otherwise.' },
    ],
    records: [
      'Health questionnaires and disclosures, held under the data protection policy',
      'Consent and any adaptation recorded against the treatment',
      'The property position for each facility and treatment, and its basis',
      'Training records for pregnancy protocols',
    ],
    breach: [
      'Giving a treatment during pregnancy without the qualification for it is gross misconduct.',
      'Offering medical advice or reassurance is a disciplinary matter, however kindly meant.',
      'Admitting a guest to a facility the property has said is not available during pregnancy is a serious breach.',
      'Asking about pregnancy in a public area is a breach of this policy and of the data protection policy.',
    ],
    reviewTriggers: [
      'Any incident or complaint involving a pregnant guest',
      'A change to the menu, the facilities or a product house protocol',
      'New professional or insurer guidance',
    ],
  },

  {
    reference: 'GST-CONTRAINDICATION-POL-814',
    title: 'Medical Conditions and Contraindications Policy',
    department: 'SPA THERAPISTS',
    group: 'Guests and treatments',
    purpose:
      'To state how medical information is collected, what happens when something is disclosed, and where the '
      + 'line is between adapting a treatment and declining it.',
    appliesTo: 'Reception, therapists, fitness staff and anybody supervising heat or water areas.',
    position: [
      'We collect only what we need in order to deliver a treatment safely, and we keep it under the data '
      + 'protection policy rather than in a notebook at the desk.',
      'Nobody here diagnoses, advises, or tells a guest their condition is fine. We say what we can and cannot '
      + 'do, and we refer the rest.',
      'A disclosure that contraindicates a treatment ends that treatment. It does not end the visit: an '
      + 'alternative is offered wherever there is one.',
      'Declining a treatment is always supported. A therapist is never asked to proceed against their judgement '
      + 'because the guest has paid or is disappointed.',
    ],
    rules: [
      {
        area: 'Collecting it',
        items: [
          'Take the health questionnaire before the first treatment and confirm it at every subsequent visit.',
          'Ask in private, in writing, and never at a desk within earshot of others.',
          'Record what was disclosed factually, without opinion, on the guest record.',
          'Flag anything that affects future visits so it is known before the guest next arrives.',
        ],
      },
      {
        area: 'Acting on it',
        items: [
          'Check the disclosure against the contraindications for the treatment booked, before the guest is on the couch.',
          'Adapt within the protocol where the protocol allows it, and record the adaptation.',
          'Decline where it is outside the protocol or outside your competence, and say so plainly and kindly.',
          'Refer anything requiring a medical opinion to the guest’s own clinician. Never suggest one.',
          'Where a guest asks us to proceed against the protocol, we do not, however firmly they ask.',
        ],
      },
      {
        area: 'Medical clearance',
        items: [
          'Where the property requires written clearance, it is obtained before the treatment rather than promised afterwards.',
          'Clearance covers the treatment named on it, and nothing else.',
          'Clearance is kept with the guest record and has an expiry the property sets.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'The contraindication standards for the menu, and where clearance is required.' },
      { role: 'Reception', duty: 'Collecting the questionnaire properly and flagging the record.' },
      { role: 'Therapists', duty: 'Checking before treating, adapting or declining, and recording it.' },
      { role: 'Spa Manager', duty: 'Supporting a decision to decline, including when the guest complains.' },
    ],
    records: [
      'Health questionnaires and updates, held securely',
      'Consent, adaptation and any declined treatment with the reason',
      'Medical clearances, with their scope and expiry',
      'Any adverse reaction and the investigation into it',
    ],
    breach: [
      'Treating against a known contraindication is gross misconduct.',
      'Giving medical advice, or telling a guest a condition is not a problem, is a disciplinary matter.',
      'Failing to record a disclosure is a serious breach, because the next therapist relies on it.',
      'Pressuring a therapist to proceed after they have declined is a breach by the person applying pressure.',
    ],
    reviewTriggers: [
      'Any adverse reaction or incident linked to a medical condition',
      'A change to the menu, the products or a protocol',
      'New guidance from a professional body or the property insurer',
    ],
  },

  {
    reference: 'GST-PHOTOGRAPHY-POL-815',
    title: 'Photography, Filming and Privacy Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Guests and treatments',
    purpose:
      'To protect the privacy of guests and the team in a building where people are undressed, and to set out '
      + 'when photography is permitted at all.',
    appliesTo:
      'Guests, the team, contractors, influencers, press and anybody else holding a camera or a phone on the '
      + 'premises.',
    position: [
      'No photography or filming in changing areas, wet areas, relaxation areas or treatment rooms, by anybody, '
      + 'at any time. There is no version of this that is acceptable.',
      'Elsewhere in the spa, photography of yourself and your own party is permitted provided nobody else is in '
      + 'the frame. A guest who does not want to be photographed does not have to explain why.',
      'Commercial photography, filming, press and influencer visits happen only with written permission, '
      + 'arranged in advance, with the areas and the times agreed.',
      'The team do not photograph guests, the building or each other for personal use, including when it seems '
      + 'harmless and including in back of house.',
    ],
    rules: [
      {
        area: 'Guests',
        items: [
          'Signage states the position at the entrance to every area where photography is not permitted.',
          'Ask once, politely and privately, and explain it as other guests’ privacy rather than as a rule.',
          'Where somebody refuses, involve the duty manager rather than escalating it yourself.',
          'Where an image of another guest has been taken, ask for it to be deleted and record that you asked.',
        ],
      },
      {
        area: 'The team',
        items: [
          'No photographs of guests, ever, including for a treatment record, unless consent is documented under the treatment protocol.',
          'Clinical or before-and-after photographs are taken only where the protocol requires them, with written consent, and stored on the property system rather than on a personal device.',
          'No photographs of the building, back of house or colleagues for personal or social use.',
          'Personal phones are not carried on the treatment floor. [The property states where they are kept.]',
        ],
      },
      {
        area: 'Commercial and press',
        items: [
          'Written permission from [the role the property names] before anything is arranged.',
          'Areas, times and whether guests may be present are agreed in advance and communicated to the team.',
          'Where guests could appear, the area is closed or written consent is taken from everybody in it.',
          'A member of the team accompanies any shoot throughout.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Approving commercial photography and holding the agreements.' },
      { role: 'Duty manager', duty: 'Handling a refusal, and any incident involving an image.' },
      { role: 'Everybody', duty: 'Enforcing the position kindly, and never photographing a guest.' },
    ],
    records: [
      'Written permissions for commercial photography, with areas and times',
      'Consent records for any clinical or treatment photography',
      'Incidents involving photography, and what was done',
      'Signage in place at each area',
    ],
    breach: [
      'Photographing a guest without documented consent is gross misconduct and may be a criminal matter.',
      'Photography in a changing or wet area by a member of the team is gross misconduct.',
      'Posting an image of the property, a guest or a colleague without permission is a disciplinary matter.',
      'Allowing a shoot to proceed without written permission is a serious breach by whoever allowed it.',
    ],
    reviewTriggers: [
      'Any incident involving photography or an image',
      'A change to the treatment protocols requiring clinical photography',
      'A change to the areas or the signage',
    ],
  },

  {
    reference: 'GST-QUIETAREAS-POL-816',
    title: 'Mobile Phones and Quiet Areas Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Guests and treatments',
    purpose:
      'To protect the thing guests are actually paying for, which is quiet, and to give the team a position '
      + 'to enforce rather than an opinion to defend.',
    appliesTo: 'Guests and the team, in every area the property designates as quiet.',
    position: [
      'The spa is a quiet environment. That is the product, not a preference, and a guest who cannot have it '
      + 'has not received what they paid for.',
      'Phones are permitted only where the property says so, on silent, without calls, and without a camera. '
      + 'Where they are not permitted, that is stated at the entrance rather than enforced by surprise.',
      'Enforcement is kind and immediate. A reminder in the first minute is easier than a conversation in the '
      + 'twentieth, and far easier than an apology to everybody else afterwards.',
      'The team hold the standard too. Conversations between colleagues in a relaxation area are as disruptive '
      + 'as a phone call.',
    ],
    rules: [
      {
        area: 'The areas',
        items: [
          'Quiet areas are defined by the property and signed at every entrance: [list them here].',
          'Where phone use is permitted anywhere, it is one designated area and it is stated.',
          'Silent mode, no calls, no speaker, no video, no camera.',
        ],
      },
      {
        area: 'Holding it',
        items: [
          'Approach quietly and privately. Never address a guest across a room.',
          'State it as the standard for everybody, not as a complaint about them.',
          'Offer the alternative: where they can take the call, and that we will keep their space.',
          'Escalate a repeated or refused request to the duty manager rather than repeating yourself.',
        ],
      },
      {
        area: 'The team',
        items: [
          'Personal phones are not used in guest areas at any time.',
          'Conversation between colleagues in a quiet area is limited to what the work needs, at a low voice.',
          'Music, volume and lighting are set to the standard rather than to the preference of whoever is on shift.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Spa Director', duty: 'Defining the quiet areas and the standard, and resourcing the signage.' },
      { role: 'Hosts and therapists', duty: 'Holding the standard in the moment, kindly.' },
      { role: 'Duty manager', duty: 'Handling a refusal or a repeated breach.' },
    ],
    records: [
      'The designated quiet areas and where phone use is permitted',
      'Complaints about noise, and what was done',
      'Escalations where a guest refused',
    ],
    breach: [
      'A guest who refuses after a manager has asked may be asked to leave the area, under the property procedure.',
      'A member of the team using a personal phone in a guest area is a disciplinary matter.',
      'Failing to address a breach is treated as a service failure, because everybody else in the room paid for quiet.',
    ],
    reviewTriggers: [
      'A pattern of complaints about noise',
      'A change to the areas or the layout',
      'Feedback showing the standard is not being held',
    ],
  },

  {
    reference: 'GST-COMPLAINTS-POL-817',
    title: 'Complaints and Guest Recovery Policy',
    department: 'SPA MANAGEMENT TEAM',
    group: 'Guests and treatments',
    purpose:
      'To state how a complaint is received, who may resolve it and on what authority, and what the property '
      + 'does with what it learns.',
    appliesTo: 'Everybody who works in the spa, whatever their role.',
    position: [
      'A complaint is received by whoever hears it. It is never passed to somebody else before it has been '
      + 'listened to and written down.',
      'The person in front of the guest resolves it wherever they can. A complaint that has to travel is a '
      + 'complaint that gets worse on the journey.',
      'Recovery is not a discount reflex. Understanding what went wrong and putting it right is worth more '
      + 'than money off, and money off without understanding buys nothing.',
      'Every complaint is recorded, including the ones resolved in thirty seconds. Three small complaints '
      + 'about the same thing are one large problem.',
    ],
    rules: [
      {
        area: 'In the moment',
        items: [
          'Listen without interrupting and without defending. Apologise for the experience without allocating blame.',
          'Establish what the guest actually wants, which is often not what the first sentence suggests.',
          'Act within your authority: [the property states the limit for each role].',
          'Escalate immediately, in person, where it is beyond your authority or involves safety, injury or an allegation.',
          'Tell the guest what will happen and by when, and then make sure it does.',
        ],
      },
      {
        area: 'Afterwards',
        items: [
          'Record it the same shift: what happened, what was done, what it cost, and what the guest said at the end.',
          'Anything involving injury, safety or an allegation goes to the Spa Director the same day.',
          'A complaint that reaches a second contact or a public review is owned by a manager from that point.',
          'Review complaints weekly by theme, and act on the theme rather than on the loudest single case.',
        ],
      },
      {
        area: 'What recovery is',
        items: [
          'Fix the thing first. A re-treatment done properly beats a refund in almost every case.',
          'Where money is involved, the limits are [the property states them by role].',
          'Never offer a goodwill gesture in place of an explanation.',
          'Follow up afterwards. A guest who is contacted a week later is a guest who comes back.',
        ],
      },
    ],
    responsibilities: [
      { role: 'Everybody', duty: 'Receiving, listening, resolving within authority, and recording.' },
      { role: 'Duty manager', duty: 'Anything beyond first-line authority, and same-shift escalation of anything serious.' },
      { role: 'Spa Manager', duty: 'Weekly theme review and the actions from it.' },
      { role: 'Spa Director', duty: 'Anything involving injury, safety, an allegation or a public review.' },
    ],
    records: [
      'Every complaint, including those resolved immediately',
      'What was done, what it cost, and the outcome',
      'Escalations and who owned them',
      'Weekly theme review and the actions taken',
    ],
    breach: [
      'Not recording a complaint is a breach, because the pattern is the point.',
      'Exceeding your authority on a goodwill gesture is a disciplinary matter.',
      'Failing to escalate an injury, safety concern or allegation the same day is a serious breach.',
      'Arguing with a guest, or discussing a colleague with them, is a disciplinary matter.',
    ],
    reviewTriggers: [
      'A recurring theme that has not reduced after action',
      'Any complaint escalating to an external body or a legal claim',
      'A change to the authority limits',
    ],
  },
]
