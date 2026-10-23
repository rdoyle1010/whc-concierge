import type { PlanSection } from '../plan-types'

// The guide book that comes free with the safety operating procedure.
//
// A hundred and forty pages of blanks handed to somebody who has never
// completed one produces a hundred and forty pages of guesses, or more often
// a document that sits in a drawer because nobody knew where to start. This
// is the part that decides whether what they bought becomes their document or
// stays ours.
//
// It is free deliberately. A guide that costs extra is a guide the person who
// needs it most does not buy, and a customer who never completes what they
// bought does not buy anything else.

const START = 'A. Before you start'
const NOP = 'B. Working through the operating procedure'
const EAP = 'C. Working through the emergency plan'
const WRONG = 'D. The parts people get wrong'
const ALIVE = 'E. Keeping it alive'

export const GUIDE_SECTIONS: PlanSection[] = [
  {
    part: START,
    heading: 'What you have, and what it is not',
    paragraphs: [
      'You have two documents. The Normal Operating Procedure says how your spa runs on an ordinary day. The '
      + 'Emergency Action Plan says what each person does in the first minutes when it does not. Together they '
      + 'are what a pool operator is expected to have in writing, and what an insurer, an environmental health '
      + 'officer or an enforcing authority will ask for first.',
      'What you have is a professional template. It is not a completed procedure, it is not a certification, '
      + 'and it is not legal advice. It becomes your document when somebody who knows your building has '
      + 'completed every blank, checked the whole of it against the premises, and signed it. Until then it must '
      + 'not be issued to your team, relied on in training, or produced to anybody.',
      'That is not a disclaimer for our benefit. A procedure that describes a building nobody has walked is '
      + 'more dangerous than no procedure at all, because it gets believed. A muster point that is wrong is '
      + 'worse than no muster point written down, and it is wrong in a way nobody discovers until the day it '
      + 'matters.',
      'So the blanks are the document. There are several thousand of them, and every one is a fact about your '
      + 'spa that we had no business inventing.',
    ],
  },
  {
    part: START,
    heading: 'Who should do this',
    paragraphs: [
      'One person should own it, and it should be somebody with authority to change how the spa operates. A '
      + 'procedure completed by somebody who cannot decide the answers ends up describing what they assume '
      + 'happens rather than what does, and the difference is exactly where the risk is.',
      'In most spas that is the spa manager, with the pool plant operator answering the plant and water '
      + 'sections and the head therapist answering the treatment ones. That is three people, not one, and it is '
      + 'faster as well as better: the plant operator will answer in ten minutes what the manager would guess '
      + 'at for an hour.',
      'Some sections need somebody competent in a specific sense rather than a general one. Bather load, '
      + 'supervision arrangements, water treatment and the plant room are the four where an answer written by '
      + 'somebody without that competence is a liability rather than a gap. If nobody available holds it, that '
      + 'is itself a finding, and the action is to get it rather than to fill the box in anyway.',
    ],
    bullets: [
      'Spa manager: governance, staffing, routine, guests, incidents, review.',
      'Pool plant operator or water treatment contractor: the pools, the plant, water testing, chemicals, water safety.',
      'Head therapist or treatment lead: the treatment rooms, products, consultation and boundaries.',
      'Fitness lead: the gym, the studios and classes.',
      'Whoever holds health and safety for the property: fire, evacuation, contractors and reporting.',
    ],
  },
  {
    part: START,
    heading: 'How long it takes, honestly',
    paragraphs: [
      'Plan two full days for the operating procedure and one for the emergency plan, spread over two or three '
      + 'weeks rather than done in one sitting. Most of that is not writing. It is walking the building, '
      + 'finding out what the actual answer is, and in several cases discovering that there is not one yet.',
      'The sections that take longest are the ones where you find a gap rather than a fact: the bather load '
      + 'nobody has calculated, the check frequency nobody has set, the person who was supposed to hold a '
      + 'qualification that expired. Those are not delays. They are the return on doing this at all, and they '
      + 'are cheaper to find on a Tuesday with a document in your hand than on a Saturday with an inspector in '
      + 'the building.',
      'Do not try to finish a part in one go if you hit something you cannot answer. Write what you do not '
      + 'know, who can tell you, and move on. A document with six honest gaps and a date against each is '
      + 'defensible. A document with six plausible inventions is not.',
    ],
  },
  {
    part: START,
    heading: 'What to have with you',
    bullets: [
      'The building, and time to walk all of it including the plant room and the roof of anything.',
      'Your existing records: water tests, maintenance, training, incidents, previous assessments.',
      'Certificates and their expiry dates: electrical, gas, insurance, fire risk assessment, water safety.',
      'The rota, so staffing answers are what happens rather than what is intended.',
      'Your booking system, for occupancy and treatment data.',
      'Whoever runs the plant, for half a day.',
      'A camera. Photographing an isolation point is faster than describing it and settles the argument later.',
      'Adobe Reader, free, on a laptop rather than a phone. The documents are form-fillable and you will be typing a lot.',
    ],
  },
  {
    part: NOP,
    heading: 'Part A: governance and accountability',
    paragraphs: [
      'Do this part first and do not skip ahead, because every later part assumes somebody has said what the '
      + 'spa actually consists of and who is accountable for what.',
      'The facility list is the one to get complete. A facility missing from it has no procedure, no risk '
      + 'assessment, no cleaning schedule and nobody checking it. Walk round and write down every distinct '
      + 'space a guest or a member of staff uses, including the ones that feel too small to matter. The '
      + 'relaxation area, the foot bath, the outdoor shower.',
      'For accountability, put roles in the first column and names in the third. Roles are stable and names are '
      + 'not, and a document that has to be reissued every time somebody leaves is a document that stops being '
      + 'reissued. But do fill the name column in: a role accountable to nobody in particular is a role nobody '
      + 'holds.',
      'The competence table is where most spas find their first real gap. Work through it by asking, for each '
      + 'row, who is on the rota this week who could do that. If the honest answer for any row is nobody, that '
      + 'is not a box to fill in, it is a decision about whether that facility opens.',
    ],
  },
  {
    part: NOP,
    heading: 'Parts B and C: the water, the heat and the cold',
    paragraphs: [
      'These are the parts where an answer has to be right rather than reasonable, and where the plant operator '
      + 'earns their half day.',
      'Start with the facilities table and fill it in from the commissioning documents or the plant records '
      + 'rather than from memory. Dimensions, depth profile, volume and turnover are not things to estimate, '
      + 'and if nobody has them, obtaining them is a job in itself and worth doing once properly.',
      'Bather load deserves its own afternoon. Write the calculation down, not just the number: a figure with '
      + 'no method behind it cannot be defended, cannot be recalculated when the operation changes, and will be '
      + 'the first thing questioned. Then decide what happens when it is reached, and who says so, because that '
      + 'decision gets made at the busiest hour of the week by whoever is standing there.',
      'For supervision, be honest about which arrangement you actually operate. Constant poolside supervision '
      + 'and a documented alternative are different things with different consequences, and writing down the '
      + 'one you aspire to rather than the one you run is the single most common way these documents become '
      + 'useless. If you operate an alternative, the risk assessment supporting it is part of the answer.',
      'The heat and cold sections turn on check frequency more than anything else. Somebody who has fainted in '
      + 'a sauna is not visible through the glass and will not press anything, so the frequency and the '
      + 'instruction to open the door are the whole control. Set a frequency you will actually keep on a '
      + 'Saturday, not the one that sounds best.',
    ],
  },
  {
    part: NOP,
    heading: 'Part D: treatments',
    paragraphs: [
      'The treatment menu table is the fastest way to find a problem you already have. Fill in every treatment '
      + 'you offer, the qualification it requires, and whether anybody on the current rota holds it. Spas '
      + 'routinely discover a treatment still on the menu that nobody has been qualified for since somebody '
      + 'left.',
      'The boundaries and safeguarding section protects your therapists as much as your guests, and it is the '
      + 'one they will thank you for. The most important line in it is that ending a treatment is explicitly '
      + 'permitted. Without that written down a therapist will stay in the room, because they are not sure they '
      + 'are allowed to leave and they do not want to be accused of overreacting.',
      'On consultation: the spa asks, the guest answers, and somebody acts on the answer. The third step is the '
      + 'one that gets skipped and the only one that protects anybody. Decide who reads the form and what '
      + 'happens when it says something.',
    ],
  },
  {
    part: NOP,
    heading: 'Parts G to I: plant, hygiene and the routine',
    paragraphs: [
      'Water safety and pool water treatment are different subjects and get confused constantly. Pool water '
      + 'treatment is about the pools. Water safety is about the building water system: showers, taps, '
      + 'calorifiers, tanks and anything that makes an aerosol. Both are in Part G and both need an answer.',
      'The dead leg question catches almost every spa. A treatment room out of use for a fortnight has a shower '
      + 'on a warm water system that nobody is flushing, and it is the commonest one there is. Work out which '
      + 'of your outlets are infrequently used before you answer the flushing question, because the answer is '
      + 'usually longer than people expect.',
      'The routine sections are where the rest of the document becomes something that happens. Complete the '
      + 'opening, through the day and closing lists with the roles you actually have, then walk one shift with '
      + 'them and correct what does not work. A routine written at a desk survives about four days.',
      'The weekly, monthly and annual table is worth completing carefully, because it is the one that quietly '
      + 'stops happening. Put a name against every line. A frequency with no owner is a frequency nobody keeps.',
    ],
  },
  {
    part: EAP,
    heading: 'Complete the first page before anything else',
    paragraphs: [
      'The first page of the emergency plan is the one that has to be right, and the only one every member of '
      + 'the team has to know without looking. The alarm, the assembly point, the address you give the '
      + 'ambulance, the door they come to, the defibrillator, the isolation points.',
      'Walk the building and confirm each one physically rather than writing what you believe. The address '
      + 'given to emergency services in particular: a spa inside a hotel is often not at the address on the '
      + 'letterhead, and the entrance a crew should use is rarely the front door. Write the words somebody '
      + 'should say, not the postcode.',
      'Then test it. Ask somebody on shift where the assembly point is, without warning. If they hesitate, the '
      + 'document is not the problem and neither are they. The briefing is.',
    ],
  },
  {
    part: EAP,
    heading: 'Assigning the roles',
    paragraphs: [
      'Every emergency page has a done by column against each action, and every one of them is blank. That is '
      + 'deliberate and it is the part that takes the thought.',
      'Do not assign by name. Assign by role, then check that the role is on shift whenever the facility is '
      + 'open. An action assigned to somebody who works Tuesdays is an action that does not happen on a '
      + 'Saturday.',
      'Work through the command table in Part A first: incident lead, casualty care, the person who calls, the '
      + 'person who meets the ambulance, the person who clears the water, the person who records times. Then '
      + 'the individual pages become quick, because you are assigning from a list you have already thought '
      + 'about.',
      'Then check the arithmetic. If your minimum staffing is two people and an emergency page needs four '
      + 'distinct roles, one of those two things has to change. That is not a document problem, it is what the '
      + 'document is for.',
    ],
  },
  {
    part: EAP,
    heading: 'Putting it where it can be used',
    paragraphs: [
      'The emergency plan is laid out one emergency per page so it can be read at speed by somebody with wet '
      + 'hands. Use that. Print it, and put the pages that matter where the emergency happens rather than in a '
      + 'folder in an office.',
      'Casualty in the water, cardiac arrest and the first page belong at the poolside. Chlorine gas belongs '
      + 'outside the plant room, not inside it. A guest taken ill during a treatment belongs in the therapist '
      + 'corridor. Faecal contamination belongs where the person who deals with it will be standing.',
      'Laminate them. A spa is wet and paper on a poolside lasts a week.',
      'Keep the full document intact as well, signed, with the whole team briefing record. The laminated pages '
      + 'are for using. The document is the evidence that they exist.',
    ],
  },
  {
    part: WRONG,
    heading: 'The six most common mistakes',
    intro: 'Every one of these is a document that looks finished and is not.',
    bullets: [
      'Writing the arrangement you intend rather than the one you operate. Supervision is where this happens most, and a document describing an aspiration is a document that proves you knew better.',
      'A bather load with no calculation behind it. The number is not the answer, the method is, because the number changes when the operation does and nobody will be able to work out how.',
      'A check frequency chosen because it sounds right. Pick one you will keep on the busiest Saturday of the year, because that is the day it matters and the day it gets dropped.',
      'Names in the role column. The document gets reissued twice and then stops being reissued, and within a year it names three people who have left.',
      'Leaving a section blank because nobody knows the answer. Write what you do not know, who can tell you and by when. A gap with a date is a plan; a blank is a question nobody got to.',
      'Signing it off before somebody has walked the building with it. The signature is a statement that a competent person checked this against the premises. It is the only thing on the page that cannot be undone.',
    ],
  },
  {
    part: WRONG,
    heading: 'What an inspector will ask for, and where it is',
    intro:
      'Not a prediction of any particular visit, and the order below is roughly how these conversations go.',
    table: {
      columns: ['What they ask for', 'Where it is', 'Who produces it', 'Ready'],
      rows: [
        ['The pool safety operating procedure', 'Both documents, signed', '', ''],
        ['Bather load and how it was calculated', 'Operating procedure, Part B', '', ''],
        ['Water test records for the last month', 'Your own log', '', ''],
        ['Who supervises, and their qualification', 'Operating procedure, Part A and B', '', ''],
        ['The last emergency drill', 'Emergency plan, drill record', '', ''],
        ['Training records for the team on duty', 'Operating procedure, Part A', '', ''],
        ['Risk assessments', 'Your risk register', '', ''],
        ['COSHH assessments and safety data sheets', 'Operating procedure, Part G', '', ''],
        ['The water safety risk assessment', 'Held separately, referenced in Part G', '', ''],
        ['The last contamination incident and what was done', 'Emergency plan, closure record', '', ''],
        ['Your incident and accident records', 'Operating procedure, Part L', '', ''],
        ['Proof the team has read the procedures', 'Briefing record in both documents', '', ''],
      ],
      fillable: true,
    },
    paragraphs: [
      'Tick the ready column when you can produce that thing within five minutes without phoning anybody. '
      + 'Anything you cannot is a job, and it is a smaller job today than it is during a visit.',
    ],
  },
  {
    part: ALIVE,
    heading: 'Briefing the team',
    paragraphs: [
      'A document nobody has been briefed on changes nothing about how the spa operates. It is also, on its '
      + 'own, evidence that you wrote a procedure and did not implement it, which is a worse position than not '
      + 'having written one.',
      'Brief in sections rather than handing over a hundred and forty pages. The emergency plan first, because '
      + 'it is the one somebody might need this week. Then the parts of the operating procedure that concern '
      + 'each person: the therapists do not need the plant room and the plant operator does not need the '
      + 'consultation policy.',
      'Get signatures on the briefing record in both documents. Not because a signature proves understanding, '
      + 'but because the absence of one proves nothing happened.',
      'Then check. Ask somebody on a Tuesday where the assembly point is, or what the maximum sauna time is. '
      + 'That tells you more than any signature sheet, and it tells you before an incident rather than after.',
    ],
  },
  {
    part: ALIVE,
    heading: 'Drills',
    paragraphs: [
      'Everything in the emergency plan is paper until somebody has done it in your building, at speed, with '
      + 'the equipment that is actually there.',
      'Rotate the scenario. A spa that only ever drills a fire evacuation has a team that cannot recover a '
      + 'casualty from the water, and the fire drill is the less likely of the two.',
      'Run at least one in trading hours. A drill that only ever happens at seven in the morning is a drill for '
      + 'a spa nobody is in, and the whole difficulty of a real evacuation is the guests.',
      'Expect the first one to go badly. That is what it is for. A drill that is never failed is not testing '
      + 'anything, and the thing to record is what did not work and what changed as a result.',
    ],
  },
  {
    part: ALIVE,
    heading: 'Review, and version control',
    paragraphs: [
      'Review annually at the least, and immediately after an incident, a drill that went badly, a change to '
      + 'the facilities, a change to the team or a change to how you operate.',
      'When you revise it, change the version number and the date, brief the team on what changed, and '
      + 'physically withdraw the old copies. Two versions in circulation is worse than one out of date version, '
      + 'because nobody knows which one they are working to.',
      'Keep the superseded versions rather than destroying them. If an incident happened in March you will need '
      + 'to show what the procedure said in March, not what it says now.',
    ],
  },
  {
    part: ALIVE,
    heading: 'If you get stuck',
    paragraphs: [
      'Some of these questions do not have an answer at your property yet, and finding that out is the point '
      + 'rather than a failure of the document.',
      'Where the gap is a fact nobody holds, such as pool volume or turnover, the plant contractor usually has '
      + 'it and it takes one email.',
      'Where the gap is a decision nobody has made, such as the bather load or the check frequency, make it. '
      + 'You are allowed to. Write it down, try it for a month, and change it if it does not work.',
      'Where the gap is a competence nobody holds, that is the one to escalate rather than solve on the page. A '
      + 'spa operating without somebody competent in water treatment is not a documentation problem.',
      'And if a section asks the wrong question for your building, tell us. These are written from how spas '
      + 'generally work, and a question that does not fit yours is worth us knowing about.',
    ],
  },
]
