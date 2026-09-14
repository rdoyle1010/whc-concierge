import type { PlanSection } from '../plan-types'

// The training guide.
//
// The gap between a signed procedure and a team that follows it, which is
// where almost every operation actually fails. A spa with immaculate
// documents and a team who have never practised a rescue is in a worse
// position than one with neither, because it has written evidence that it
// knew what should happen.
//
// Written as session plans somebody can run rather than as principles they
// have to turn into sessions. A training guide that requires a trainer to
// design the training is a training guide nobody uses.

const WHY = 'A. What training has to achieve'
const WHO = 'B. Who needs to know what'
const SESSIONS = 'C. Session plans'
const DRILLS = 'D. Running a drill properly'
const ASSESS = 'E. Assessing competence'
const KEEP = 'F. Keeping it current'

const session = (
  heading: string,
  intro: string,
  paragraphs: string[],
  bullets: string[],
): PlanSection => ({
  part: SESSIONS, heading, intro, ownPage: true, paragraphs, bullets,
})

export const TRAINING_SECTIONS: PlanSection[] = [
  {
    part: WHY,
    heading: 'The gap this closes',
    paragraphs: [
      'A signed operating procedure and a signed emergency plan describe how the spa should run. Training is '
      + 'the only thing that makes them describe how it does run, and the distance between the two is where '
      + 'almost every serious incident lives.',
      'A spa with excellent documents and a team who have never practised a rescue is in a worse position than '
      + 'one with neither. It has written evidence that it knew what should happen, which is the first thing '
      + 'produced when it did not.',
      'So training here is not a signature on an attendance sheet. It is somebody demonstrating, in your '
      + 'building, with your equipment, that they can do the thing. The record of that is a competence record, '
      + 'and it is a different artefact from a register of who was in the room.',
    ],
    bullets: [
      'Everybody knows how to raise the alarm and where the assembly point is, without looking.',
      'Everybody knows what they personally do in the first minute of an emergency in their area.',
      'Anybody supervising water can recover a casualty from it, and has done so recently.',
      'Anybody testing water, dosing or entering the plant room is competent to, and it is recorded.',
      'Every therapist knows the consultation, the contraindications and that ending a treatment is permitted.',
      'Every new starter knows all of the above before their first shift alone, not within their first month.',
    ],
  },
  {
    part: WHO,
    heading: 'The training matrix',
    intro:
      'Complete this once for your spa, then use it to work out who needs which session. A role with a blank '
      + 'row is a role somebody will assume is covered.',
    table: {
      columns: [
        'Role', 'Emergency plan', 'Pool rescue', 'First aid', 'Water testing', 'Plant and chemicals',
        'Treatment protocols', 'Safeguarding',
      ],
      rows: [
        ['Spa manager', '', '', '', '', '', '', ''],
        ['Duty manager', '', '', '', '', '', '', ''],
        ['Spa supervisor', '', '', '', '', '', '', ''],
        ['Spa attendant', '', '', '', '', '', '', ''],
        ['Lifeguard or pool supervisor', '', '', '', '', '', '', ''],
        ['Therapist', '', '', '', '', '', '', ''],
        ['Receptionist', '', '', '', '', '', '', ''],
        ['Fitness instructor', '', '', '', '', '', '', ''],
        ['Pool plant operator', '', '', '', '', '', '', ''],
        ['Cleaner or housekeeping', '', '', '', '', '', '', ''],
        ['Agency or seasonal staff', '', '', '', '', '', '', ''],
        ['External instructor or hirer', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
      ],
      fillable: true,
    },
    mustBeChecked: true,
  },
  {
    part: WHO,
    heading: 'Before a first shift alone',
    paragraphs: [
      'Everything below happens before somebody works a shift without a named person alongside them. Not in '
      + 'their first week and not in their first month. A new starter working alone who does not know where '
      + 'the defibrillator is, is a new starter you have put in an impossible position.',
      'This applies to agency and seasonal staff in exactly the same way. A person who is only here for the '
      + 'summer is a person who will be on shift when something happens in August.',
    ],
    bullets: [
      'Walked the building, including the plant room door, every fire exit and the assembly point.',
      'Shown the alarm, the call points, the defibrillator, the first aid kits and the rescue equipment.',
      'Read the emergency plan and been asked three questions from it, verbally, and answered them.',
      'Told exactly what they do in the first minute of a casualty in the water, whether or not they can swim.',
      'Told what they must not do: enter the plant room, dose anything, deliver a treatment they are not qualified for, work in a facility they have not been shown.',
      'Told they may say they do not know, and that nobody will think less of them for it.',
      'Signed the briefing record in both documents.',
    ],
    mustBeChecked: true,
  },

  session(
    'Session one: the emergency plan, forty-five minutes',
    'Run this first, for everybody, including reception and housekeeping. It is the session that matters most '
    + 'and the one most often skipped for people who "do not work near the pool".',
    [
      'Do not read the plan aloud. Walk the building with it and stop at the things it names.',
      'The test of this session is not whether they were present. It is whether, a week later, somebody asked '
      + 'without warning can say where the assembly point is.',
    ],
    [
      'Stand at the poolside. Ask: what do you do first if somebody is face down in the water? Correct the answer until it is raise the alarm.',
      'Show the alarm and have every person operate it or make the signal themselves. Once each.',
      'Walk to the assembly point by the route guests would use. Time it.',
      'Stand at the door the ambulance comes to. Say the address out loud, the words somebody would say on the phone.',
      'Find the defibrillator. Open the case. Do not switch it on, but let everybody see inside it.',
      'Find the isolation points: plant, power, water. Point at each one.',
      'Hand out the laminated pages relevant to each person and ask them to read theirs now, in front of you.',
      'Finish by asking three people three different questions from the plan. Record who could not answer, and cover it again.',
    ],
  ),

  session(
    'Session two: casualty in the water, sixty minutes, quarterly',
    'For anybody who supervises water. Practical, in the water, with the real equipment.',
    [
      'This is not a swimming lesson and it does not replace a pool rescue qualification. It is the practice '
      + 'that keeps a qualification current in the only sense that matters, which is whether somebody can do '
      + 'it on the day.',
      'Rescue competence decays fast. A therapist who passed a course eighteen months ago and has not '
      + 'practised since is not somebody you should rely on, and they know it.',
    ],
    [
      'Start dry. Talk through the sequence: alarm, clear the water, reach or throw, recover, assess, resuscitate, call.',
      'Practise reaching and throwing with the actual pole and the actual buoyant aid, from the actual poolside.',
      'Practise the recovery with a weighted manikin or a willing colleague, by the shortest safe route out.',
      'Practise the spinal support in the water, with enough people, using your own board. Most teams have never touched theirs.',
      'Practise compressions on a manikin, on the poolside, wet. Time two minutes so everybody feels how long it is.',
      'Practise drying a chest and applying defibrillator pads. This is the step people forget in a spa.',
      'Run the whole thing once, from the alarm, against the clock, with somebody recording times.',
      'Debrief: what went wrong, what was slower than expected, what needs changing in the plan.',
    ],
  ),

  session(
    'Session three: the heat and cold experiences, thirty minutes',
    'For spa attendants, therapists and anybody who checks the thermal suite. The facilities guests are '
    + 'actually there for, and the ones least often trained on.',
    [
      'The single thing to get across is that a guest in difficulty in a sauna is invisible and silent, and the '
      + 'check frequency is the only control there is.',
    ],
    [
      'Walk the thermal suite. Name every facility, its temperature and its maximum time.',
      'Open each cabin the way a check should be done, and make the point: opening the door and looking, not glancing through glass.',
      'Find the emergency call point inside each one. Sit on the bench and check it can be reached from there.',
      'Cover the signs of heat exhaustion and heat stroke, and the difference, because one is an ambulance.',
      'Cover cold water shock: what it is, why it is involuntary, and why nobody submerges their head on entry.',
      'Practise getting somebody out of a plunge pool with a reaching aid.',
      'Cover who should be advised against which facility, and how to have that conversation with a guest.',
      'Finish at the closing check: every cabin, every door open, every time.',
    ],
  ),

  session(
    'Session four: water testing and what the readings mean, forty-five minutes',
    'For anybody who tests water. Not a plant qualification, which is separate and formal, but the competence '
    + 'to test correctly and know what to do with the answer.',
    [
      'A reading taken and not recorded did not happen, and that is the position you are in when asked to '
      + 'prove it. The recording is part of the test, not paperwork afterwards.',
    ],
    [
      'Show the test kit and how it is calibrated or checked. Show an out of date reagent and what it does.',
      'Take a sample properly: where from, what depth, and why not from the surface beside the inlet.',
      'Run a full test together, then have each person run one and compare.',
      'Go through your own acceptable ranges for each body of water, and why pH matters before disinfectant.',
      'Go through the action levels: what reading means adjust, what reading means tell somebody, what reading means close.',
      'Practise recording it, in the actual log, at the actual time.',
      'Cover what happens next: who is told, how quickly, and who decides about closure.',
      'Finish on the rule: if in doubt, close it and ask. Nobody will be criticised for that.',
    ],
  ),

  session(
    'Session five: treatment room safety and boundaries, sixty minutes',
    'For every therapist, including agency and new starters, and repeated annually.',
    [
      'This session protects the therapist as much as the guest, and it should be run that way round. A '
      + 'therapist who believes the policy exists to catch them out will not use it.',
    ],
    [
      'Go through the consultation: what is asked, why, what is recorded and where it is kept.',
      'Go through contraindications for each treatment on your menu, and who can decide to decline one.',
      'Practise the conversation where a treatment is declined. It is harder than it looks and it goes badly when unrehearsed.',
      'Cover patch testing: which treatments, what interval, how it is recorded.',
      'Cover adverse reactions: stop, remove, assess, call. Walk to where the first aid kit is.',
      'Cover anaphylaxis specifically, and read the page from the emergency plan together.',
      'Go through draping and consent, treatment by treatment where it differs.',
      'State plainly that ending a treatment because of a guest’s behaviour is permitted, supported and recorded. Say it out loud in the session.',
      'Cover what happens afterwards: who they tell, what is recorded, what support they get.',
      'Cover their own wellbeing: couch height, breaks, reporting early symptoms, and that reporting will not affect their rota.',
    ],
  ),

  session(
    'Session six: chemicals and the plant room, forty-five minutes',
    'Two audiences, and they need different sessions. Everybody needs the first half. Only trained plant '
    + 'operators need the second.',
    [
      'For everybody else the message is short and absolute: the plant room is not a room you go into, and a '
      + 'smell of chlorine over the water means get everybody out, not go and look.',
    ],
    [
      'For everybody: what the chemicals are for, in one sentence, and why they are dangerous.',
      'For everybody: the smell of chlorine over the water, what it means and what to do. Read the page from the emergency plan.',
      'For everybody: who may enter the plant room, and that it is nobody else, ever, for any reason.',
      'For everybody: where the eyewash is and how to use it.',
      'For trained operators: where the safety data sheets are and how to read one.',
      'For trained operators: the personal protective equipment for each task, and putting it on.',
      'For trained operators: the separation of incompatible chemicals, shown physically, and why it is absolute.',
      'For trained operators: the spill kit, opened, contents identified, and a dry run of a small spill.',
      'For trained operators: the delivery procedure, walked through on the actual route.',
      'For trained operators: isolation points and the lock-out procedure, demonstrated.',
    ],
  ),

  session(
    'Session seven: guests who need more from you, thirty minutes',
    'Children, older guests, disabled guests, pregnant guests and anybody who has told you something about '
    + 'their health. For everybody, and particularly reception.',
    [
      'Most of this session is conversation practice rather than information. The team generally know what the '
      + 'policy is and find the conversation difficult, which is why the policy gets quietly skipped.',
    ],
    [
      'Go through the age limits and ratios for each facility, and how they are enforced once a family is in the water.',
      'Practise the conversation where a parent is told a child cannot use a facility.',
      'Go through health screening: what is asked, and what happens when somebody discloses something.',
      'Practise advising a guest against a facility without frightening them or refusing service unnecessarily.',
      'Cover accessibility: what the spa can offer, what it cannot, and how to say so honestly.',
      'Cover evacuation arrangements for somebody who cannot use the normal route, and how you know who they are.',
      'Cover safeguarding: what to do, who to tell, and that it is not their job to investigate.',
      'Finish on dignity: screening an incident, covering a casualty, moving other guests away.',
    ],
  ),

  {
    part: DRILLS,
    heading: 'Running a drill that is worth running',
    paragraphs: [
      'A drill is not a training session. Training teaches the sequence; a drill tests whether the sequence '
      + 'survives the building, the equipment, the guests and the noise.',
      'Announce that drills happen, but not when. A drill everybody knew about tests nothing except attendance.',
      'Run at least one in trading hours, with guests present, having told reception to explain to anybody who '
      + 'asks. The entire difficulty of a real evacuation is the people who did not expect it.',
      'Expect the first one to go badly. Record what did not work rather than the fact that it happened, and '
      + 'change the plan rather than telling people to try harder.',
    ],
    bullets: [
      'Pick one scenario and rotate it. Fire, casualty in the water, chemical release, missing child, cardiac arrest, contamination.',
      'Appoint an observer who does nothing but watch and write times.',
      'Start the clock when the alarm is raised and record every step against it.',
      'Let it go wrong. Do not prompt somebody who has frozen: note it, and cover it afterwards.',
      'Stop it if anybody is at genuine risk, and say why.',
      'Debrief immediately, while it is fresh, and before anybody leaves.',
      'Ask the least senior person present what they thought first. They will say the useful thing, and only if asked first.',
      'Record what changed as a result. A drill that changes nothing was an attendance exercise.',
    ],
    mustBeChecked: true,
  },
  {
    part: DRILLS,
    heading: 'Drill scenarios, and how often',
    table: {
      columns: ['Scenario', 'Who attends', 'How often', 'Last run', 'Next due', 'Led by'],
      rows: [
        ['Fire and evacuation of the wet areas', '', '', '', '', ''],
        ['Casualty in the water', '', '', '', '', ''],
        ['Cardiac arrest, including defibrillator', '', '', '', '', ''],
        ['Chemical release from the plant room', '', '', '', '', ''],
        ['Faecal contamination and closure', '', '', '', '', ''],
        ['Missing child', '', '', '', '', ''],
        ['Guest collapse in a heat cabin', '', '', '', '', ''],
        ['Guest taken ill during a treatment', '', '', '', '', ''],
        ['Power failure with guests in the water', '', '', '', '', ''],
        ['Evacuating a guest who cannot use the normal route', '', '', '', '', ''],
        ['', '', '', '', '', ''],
      ],
      fillable: true,
    },
  },
  {
    part: ASSESS,
    heading: 'Competence is not attendance',
    paragraphs: [
      'An attendance sheet records that somebody was in a room. A competence record states that a named '
      + 'assessor watched them do the thing and judged that they could. Those are different documents and only '
      + 'one of them is worth anything when it is asked for.',
      'Assess by watching, not by asking. Somebody can describe a rescue perfectly and be unable to perform '
      + 'one, and the difference only shows in the water.',
      'Record the outcome as competent or requiring further training, and mean it. A record where everybody is '
      + 'always competent is a record nobody believes, including you.',
      'Where somebody is not yet competent, say what specifically, arrange the further training, and record the '
      + 'restriction in the meantime. Somebody who cannot yet perform a rescue does not supervise water. That '
      + 'is not a judgement about them, it is a rota decision.',
    ],
  },
  {
    part: ASSESS,
    heading: 'Competence record',
    intro: 'One line per person per competence. The next due column is the one that matters.',
    ownPage: true,
    table: {
      columns: ['Name', 'Role', 'Competence assessed', 'How assessed', 'Date', 'Outcome', 'Assessor', 'Next due'],
      rows: Array.from({ length: 22 }, () => ['', '', '', '', '', '', '', '']),
      fillable: true,
    },
  },
  {
    part: KEEP,
    heading: 'When to train again, without waiting for the date',
    intro:
      'Frequency is the floor, not the rule. Every one of these triggers a refresher regardless of when the '
      + 'last one was.',
    bullets: [
      'An incident or a near miss, for everybody involved and everybody who might have been.',
      'A drill that went badly, on the specific thing that went badly, within a fortnight.',
      'A change to the procedure or the emergency plan.',
      'A new facility, a new treatment, a new product or new equipment.',
      'A new starter, obviously, and also a returner after extended absence.',
      'A complaint about technique, or a guest reaction.',
      'A run of agency or seasonal staff, because a team can turn over without anybody noticing it has.',
      'Anybody saying they are not confident. That is the cheapest possible warning and it should never be met with impatience.',
    ],
    mustBeChecked: true,
  },
  {
    part: KEEP,
    heading: 'The annual plan',
    intro: 'Fill this in once a year and put it on the rota. Training that is not scheduled does not happen.',
    ownPage: true,
    table: {
      columns: ['Month', 'Session or drill', 'Who attends', 'Led by', 'Booked', 'Completed'],
      rows: [
        ['January', '', '', '', '', ''],
        ['February', '', '', '', '', ''],
        ['March', '', '', '', '', ''],
        ['April', '', '', '', '', ''],
        ['May', '', '', '', '', ''],
        ['June', '', '', '', '', ''],
        ['July', '', '', '', '', ''],
        ['August', '', '', '', '', ''],
        ['September', '', '', '', '', ''],
        ['October', '', '', '', '', ''],
        ['November', '', '', '', '', ''],
        ['December', '', '', '', '', ''],
      ],
      fillable: true,
    },
  },
  {
    part: KEEP,
    heading: 'What good looks like after a year',
    bullets: [
      'Anybody on shift, asked without warning, can say where the assembly point is and how to raise the alarm.',
      'Every person supervising water has performed a recovery in the last three months.',
      'The competence record has people on it marked as requiring further training, and dates showing they got it.',
      'The last drill has a written list of what did not work, and the plan has changed because of it.',
      'A new starter last month can tell you what they do first if somebody is face down in the water.',
      'Nobody is working on a competence that expired, and somebody owns checking that.',
      'The team say the procedures describe what actually happens. If they laugh at that question, the document is the problem.',
    ],
  },
]
