import type { HiringEntry } from './types'

// From offer accepted to day ninety.
//
// More spa hires are lost between acceptance and week four than at any other
// point, and almost none of it is about the job. Somebody accepts, hears
// nothing for five weeks, is counter-offered, and goes. Or they arrive on day
// one to a manager who is on the floor, no locker, no uniform, and a rota
// with their name spelled wrong, and they conclude in the first hour that
// this place is disorganised. They are rarely wrong.
//
// The fix is not warmth. It is a plan that exists before they arrive and that
// somebody owns.

const DEPT = 'HR & PEOPLE TEAM'

export const JOINING: HiringEntry[] = [
  {
    reference: 'HR-PREBOARD-GDE-908',
    title: 'Before Day One',
    department: DEPT,
    purpose:
      'To keep somebody who has accepted, through the weeks when they are still sitting opposite the manager '
      + 'they are leaving.',
    whenToUse: 'From the moment an offer is accepted until the evening before they start.',
    sections: [
      {
        part: 'Why this exists',
        heading: 'The notice period is where hires are lost',
        paragraphs: [
          'A therapist on four weeks’ notice spends every one of those days with their current employer, '
          + 'who has now been told they are leaving and has a month to change their mind for them. A spa that '
          + 'goes quiet during that month is competing badly and does not know it.',
          'Nothing here is elaborate. It is contact, on a schedule, that somebody owns.',
        ],
      },
      {
        part: 'The plan',
        heading: 'Within twenty-four hours of acceptance',
        bullets: [
          'Send the contract and the start date in writing. An acceptance without paperwork is not a hire.',
          'Name one person as their contact and give them a direct way to reach them.',
          'Tell them what will happen between now and day one, and roughly when.',
          'Ask how they would like to be contacted, and how their name is pronounced and spelled.',
        ],
      },
      {
        part: 'The plan',
        heading: 'Within the first week',
        bullets: [
          'Uniform sizes taken and the order placed. Arriving without a uniform is the most common day one failure.',
          'Right to work, references and any required checks under way, with the candidate told what is outstanding.',
          'Payroll, bank details and pension paperwork issued.',
          'Any training booked that has to happen before they can work: product house, first aid, safeguarding.',
          'Their first two weeks of rota drafted, so day one is not also the day they find out the pattern.',
        ],
      },
      {
        part: 'The plan',
        heading: 'Every week until they start',
        bullets: [
          'One contact a week from their named person. A message is enough; it does not have to be a call.',
          'Something real each time: a menu, a photograph of the team, the date of a training day, an introduction to somebody they will work with.',
          'Ask once, directly, whether anything has changed. Somebody who has been counter-offered will usually say so if asked plainly.',
          'Invite them in for a coffee before they start, on a day they are free. The ones who come rarely withdraw.',
        ],
      },
      {
        part: 'The plan',
        heading: 'The week before',
        bullets: [
          'Confirm the day, the time, where to park, which door, and who to ask for.',
          'Tell them what to wear on day one and what to bring.',
          'Tell them what the first day looks like, hour by hour, so they arrive knowing.',
          'Tell the team who is starting, what they will be doing, and where they came from.',
          'Check the physical things exist: locker, uniform, system login, name badge, a place to sit.',
        ],
      },
      {
        part: 'The plan',
        heading: 'The checklist',
        table: {
          columns: ['What', 'Owner', 'Due', 'Done'],
          rows: [
            ['Contract issued and signed', '', '', ''],
            ['Named contact assigned and introduced', '', '', ''],
            ['Uniform sized and ordered', '', '', ''],
            ['Right to work verified', '', '', ''],
            ['References received', '', '', ''],
            ['Payroll and pension paperwork complete', '', '', ''],
            ['Pre-start training booked', '', '', ''],
            ['First two weeks of rota shared', '', '', ''],
            ['System login and access requested', '', '', ''],
            ['Locker and name badge arranged', '', '', ''],
            ['Weekly contact made', '', '', ''],
            ['Day one details confirmed in writing', '', '', ''],
            ['Team told who is starting', '', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'If it goes wrong',
        heading: 'When somebody withdraws',
        bullets: [
          'Ask why, once, without arguing. The answer is usually useful and rarely what you assumed.',
          'Record it, because three withdrawals with the same reason is a pay problem or a reputation problem.',
          'Do not counter-offer above the range you set. It fixes one hire and creates a pay structure you cannot defend.',
          'Go back to your second choice quickly and honestly. Most people would rather be second choice and told so than strung along.',
        ],
      },
    ],
  },

  {
    reference: 'HR-DAYONE-GDE-909',
    title: 'Day One and Week One',
    department: DEPT,
    purpose:
      'To make the first week the reason somebody stays, in an industry where a third of leavers go inside '
      + 'ninety days.',
    whenToUse: 'Planned before they arrive. Owned by their manager, not by whoever is free.',
    sections: [
      {
        part: 'Day one',
        heading: 'What it is for',
        paragraphs: [
          'Day one is not for training. It is for belonging, safety and knowing where things are. Somebody who '
          + 'leaves day one able to find the fire exit, the toilets and one person they liked has had a good '
          + 'day one.',
          'The single thing that matters most is that their manager is there when they arrive. Not later in '
          + 'the morning. There.',
        ],
      },
      {
        part: 'Day one',
        heading: 'The shape of it',
        table: {
          columns: ['When', 'What', 'Who'],
          rows: [
            ['Arrival', 'Met at the door by their manager, by name. Not sent to reception.', 'Manager'],
            ['First thirty minutes', 'Coffee, sit down, no paperwork. Ask about them. Tell them the plan for the day.', 'Manager'],
            ['Then', 'Tour: their area first, then the whole spa, then back of house. Fire exits, muster point, first aid, toilets, lockers, where to eat.', 'Manager'],
            ['Before anything else', 'Safety induction: what to do in a fire, where the alarm points are, who the first aiders are, what to do if they find something unsafe.', 'Manager or trainer'],
            ['Mid morning', 'Introduced to everybody on shift, individually, with what each person does.', 'Manager'],
            ['Late morning', 'Paperwork, uniform, locker, system login. Get it done rather than spread it.', 'Manager or HR'],
            ['Lunch', 'With somebody, not alone. Arrange it rather than hoping.', 'Their buddy'],
            ['Afternoon', 'Shadow, watch, ask. No treatments, no desk, no responsibility.', 'Their buddy'],
            ['End of day', 'Fifteen minutes with their manager. How was it, what surprised you, what do you need tomorrow.', 'Manager'],
          ],
        },
      },
      {
        part: 'Day one',
        heading: 'What ruins it',
        bullets: [
          'The manager is on the floor and somebody else meets them.',
          'No uniform, no locker, no login.',
          'A morning of paperwork and policies before they have seen the building.',
          'Being left to eat lunch alone on the first day.',
          'Being put on the floor or in a room because somebody called in sick.',
          'Nobody knew they were starting.',
        ],
      },
      {
        part: 'Week one',
        heading: 'What has to happen',
        bullets: [
          'Every safety competence required before they work unsupervised: completed and recorded.',
          'The procedures for their own role: read, walked through, and questions answered.',
          'Shadowing across the shifts they will actually work, including a busy one.',
          'First supervised delivery: a treatment, a shift on the desk, whatever the role is, observed.',
          'One conversation with their manager every day, however short.',
          'Introduced to the wider property: hotel reception, kitchen, maintenance, whoever they will need.',
        ],
      },
      {
        part: 'Week one',
        heading: 'The buddy',
        paragraphs: [
          'Somebody other than their manager, at their level or one above, who is not responsible for assessing '
          + 'them. The job is to be the person they can ask the questions they would be embarrassed to ask a '
          + 'manager, which in the first week is most of them.',
        ],
        bullets: [
          'Chosen deliberately, asked in advance, and told what it involves.',
          'On the same shifts for the first week, wherever the rota allows.',
          'Not the person who is quietest or has most spare time. The person who is best at the job.',
          'Thanked, and noted. It is real work and it should count at their own review.',
        ],
      },
      {
        part: 'Week one',
        heading: 'End of week one',
        intro: 'Twenty minutes with their manager, sitting down, with these asked in this order.',
        table: {
          columns: ['Ask', 'What they said'],
          rows: [
            ['What has surprised you?', ''],
            ['What has been harder than you expected?', ''],
            ['Is there anything you have been asked to do that you are not confident doing?', ''],
            ['Is there anything you saw this week that you would change?', ''],
            ['Is this the job you thought you were accepting?', ''],
            ['What do you need from me next week?', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Week one',
        heading: 'Why the fourth question matters',
        paragraphs: [
          'Somebody in their first week sees the place as a stranger and will never see it that way again. '
          + 'They notice what everybody else stopped noticing two years ago. It is the single most valuable '
          + 'audit a spa gets, it is free, and almost nobody asks for it.',
          'Write down what they say. Act on one of them, and tell them you did.',
        ],
      },
    ],
  },

  {
    reference: 'HR-NINETYDAYS-GDE-910',
    title: 'The First Ninety Days',
    department: DEPT,
    purpose:
      'To decide honestly, and early, whether this hire is working, rather than confirming a probation at day '
      + 'eighty-nine because nobody wanted the conversation.',
    whenToUse: 'Set up in week one. Three reviews, in the diary before they start.',
    sections: [
      {
        part: 'How it works',
        heading: 'Three reviews, booked in advance',
        paragraphs: [
          'At thirty, sixty and ninety days, in the diary before day one. A probation review that gets arranged '
          + 'when somebody remembers is a probation review that happens at day eighty-five, by which point the '
          + 'only available answers are pass or an argument.',
          'Each one is against the measures in their job description, not against an impression. That is what '
          + 'the measures are for, and it is why the job description is worth writing properly.',
          'The purpose is not to catch somebody out. It is that nobody should reach day ninety and be surprised '
          + 'by the outcome, in either direction.',
        ],
      },
      {
        part: 'Thirty days',
        heading: 'What you are checking',
        bullets: [
          'Are they safe: every required competence in date and signed off.',
          'Do they know where things are and who people are.',
          'Are they delivering to standard under supervision.',
          'Has anything about the job turned out to be different from what they were told.',
          'Is the buddy arrangement working, or has it quietly stopped.',
        ],
        table: {
          columns: ['', 'Note'],
          rows: [
            ['Competences signed off, and any outstanding', ''],
            ['What is going well', ''],
            ['What needs to change, stated specifically', ''],
            ['What they need from us', ''],
            ['On track', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Sixty days',
        heading: 'What you are checking',
        bullets: [
          'Are they working unsupervised to standard.',
          'What do the numbers say: utilisation, retail, rebooking, or whatever the role is measured on.',
          'How are they with the rest of the team, asked of the team rather than assumed.',
          'Any concern raised at thirty days: has it moved.',
        ],
        table: {
          columns: ['', 'Note'],
          rows: [
            ['Performance against the measures in the job description', ''],
            ['Progress on anything raised at thirty days', ''],
            ['What is going well', ''],
            ['What has to change before ninety days, stated as a specific behaviour', ''],
            ['On track', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Sixty days',
        heading: 'The rule about sixty days',
        paragraphs: [
          'If somebody is not going to pass probation, they should know it at sixty days and they should know '
          + 'exactly what has to change. A person told at day eighty-nine that it is not working has been '
          + 'failed by their manager as much as by themselves, and they usually know it.',
        ],
      },
      {
        part: 'Ninety days',
        heading: 'The decision',
        table: {
          columns: ['', 'Note'],
          rows: [
            ['Performance against every measure in the job description', ''],
            ['All required competences current', ''],
            ['Feedback from the team and from guests', ''],
            ['Anything raised at thirty or sixty days, and whether it changed', ''],
            ['Decision: confirm, extend with a written plan, or do not confirm', ''],
            ['If extended: exactly what has to change, and by when', ''],
            ['Confirmed by, and date', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Ninety days',
        heading: 'Ask them, too',
        intro:
          'Probation runs both ways, and a spa that only asks its own questions learns nothing about why '
          + 'people leave at month five.',
        table: {
          columns: ['Ask', 'What they said'],
          rows: [
            ['Is this the job you thought you were accepting?', ''],
            ['What has been better than you expected?', ''],
            ['What would have made your first month easier?', ''],
            ['Is there anything you are still not confident doing?', ''],
            ['What do you want to be doing in a year?', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Ninety days',
        heading: 'When it is not working',
        bullets: [
          'Say so plainly, early, and with the specific behaviour named rather than a general impression.',
          'Separate cannot from will not. One is a training problem and the other is not, and they need opposite responses.',
          'Where it is a training problem, extend with a written plan and a date rather than hoping.',
          'Where it is not working at all, end it inside probation rather than carrying it. Carrying somebody is unkind to them, unfair to the team covering for them, and expensive.',
          'Follow the property procedure and take advice. This document is not that procedure.',
        ],
      },
    ],
  },

  {
    reference: 'HR-PANEL-GDE-911',
    title: 'Hiring Fairly and Consistently',
    department: DEPT,
    purpose:
      'To make sure the decision is about the work, and that it can still be explained in a year.',
    whenToUse: 'Read once by everybody who interviews. Used at every shortlisting and every debrief.',
    sections: [
      {
        part: 'The principle',
        heading: 'Same questions, same scoring, written down',
        paragraphs: [
          'Almost everything that makes hiring fair also makes it better. The same questions for every '
          + 'candidate removes the advantage held by people who steer conversations. Scoring before discussion '
          + 'removes the advantage held by whoever speaks first. Writing down the evidence removes the '
          + 'advantage held by whoever is most memorable.',
          'None of that is a compliance exercise. It is how you stop hiring the person who was most like you.',
        ],
      },
      {
        part: 'Where it goes wrong',
        heading: 'The failures that decide most bad hires',
        table: {
          columns: ['What happens', 'What it does'],
          rows: [
            ['The interview follows the conversation', 'Selects for people comfortable in interviews, which is not the job'],
            ['The panel discusses before scoring', 'The most senior voice sets the outcome and everybody else agrees with it'],
            ['"Culture fit" as a criterion', 'Means similarity to the people already there, and narrows the team every time it is used'],
            ['A CV read before the screening call', 'Anchors the whole process on how well somebody writes about themselves'],
            ['One interviewer', 'No check on a first impression, and nothing to compare afterwards'],
            ['Notes written after the fact', 'Records the conclusion rather than the evidence, which is exactly backwards'],
            ['Deciding in the first four minutes', 'It happens. Naming it is most of the defence against it'],
          ],
        },
      },
      {
        part: 'What to do instead',
        heading: 'Shortlisting',
        bullets: [
          'Shortlist against the essential criteria on the job description, written down before the first application.',
          'Two people shortlist independently where volume allows, and compare.',
          'Record why each candidate was or was not shortlisted, in terms of the criteria.',
          'Do not shortlist on the school, the accent, the name, the photograph or the gap in the dates.',
          'A gap in employment is a question, not a conclusion.',
        ],
      },
      {
        part: 'What to do instead',
        heading: 'Interviewing',
        bullets: [
          'The same six questions, in the same order, for every candidate for that role.',
          'Two interviewers, scoring independently, and neither says what they thought until both have scored.',
          'Adjustments made for anybody who asks, and recorded.',
          'Nothing asked about age, health, disability, pregnancy, caring responsibilities, religion or origin.',
          'A question about availability is a question about availability, not about why they might not be available.',
        ],
      },
      {
        part: 'What to do instead',
        heading: 'Deciding',
        bullets: [
          'Compare scores before opinions. Where they diverge widely, work out why: it usually means one of you heard something.',
          'Decide against the criteria, not against who you liked.',
          'Where the decision is close, look at the trade test rather than at the interview again.',
          'Record the reason for the decision in terms of the criteria, on the day.',
          '"They were not the right fit" is not a reason. Write the actual one, or accept that you do not have one.',
        ],
      },
      {
        part: 'Afterwards',
        heading: 'Records',
        bullets: [
          'Keep scorecards, shortlisting notes and decision records for the period the property sets.',
          'Keep them securely, and separately from the personnel file of whoever was appointed.',
          'A candidate can ask what was written about them. Write nothing you would not show them.',
          'Reply to every candidate who was interviewed, personally, whatever the outcome.',
          'Offer feedback to anybody who asks for it, against the criteria, and keep it factual.',
        ],
      },
    ],
  },

  {
    reference: 'HR-EXIT-GDE-912',
    title: 'Exit Interviews',
    department: DEPT,
    purpose:
      'To find out why people actually leave, which is almost never the reason given in the resignation '
      + 'letter.',
    whenToUse: 'Every leaver, including dismissals and including short-service leavers.',
    sections: [
      {
        part: 'Why bother',
        heading: 'The reason given is rarely the reason',
        paragraphs: [
          'Most resignation letters say a new opportunity, and most exit interviews conducted by the person '
          + 'being left say the same. People are careful: they may need a reference, they may come back, and '
          + 'the industry is small.',
          'You will get a truer answer by asking somebody other than their manager, by asking after the '
          + 'emotion has gone, and by asking a question that is easier to answer honestly than "why are you '
          + 'leaving".',
        ],
      },
      {
        part: 'How to run it',
        heading: 'The rules',
        bullets: [
          'Not conducted by the manager they are leaving. That is the single most important rule here.',
          'Held in the last week, not on the last day, when everybody is saying goodbye.',
          'Voluntary. Somebody who does not want to is told that is fine, and asked whether they would answer in writing instead.',
          'Told plainly what will be done with it and who will see it.',
          'Themes are reported. Individual comments are not attributed, and people find out fast if that is not true.',
        ],
      },
      {
        part: 'The questions',
        heading: 'Ask these, in this order',
        intro:
          'The order matters. The easy questions first build enough trust for the fourth and fifth to be '
          + 'answered honestly.',
        table: {
          columns: ['Ask', 'What they said'],
          rows: [
            ['What made you start looking?', ''],
            ['What has the new role offered that we did not?', ''],
            ['What was the best thing about working here?', ''],
            ['What would have made you stay?', ''],
            ['Was there a moment when you decided? What was it?', ''],
            ['What should we tell the person who replaces you?', ''],
            ['Would you work here again, and would you recommend it to a friend?', ''],
            ['Is there anything you have not said because you did not feel able to?', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'The questions',
        heading: 'The one that gets the truth',
        paragraphs: [
          '"Was there a moment when you decided" is the question that works. People rarely leave because of a '
          + 'gradual decline; they leave because of a specific Tuesday. A shift where nobody helped. A '
          + 'conversation with a manager. A rota published on a Friday night. A promise about training that '
          + 'went quiet.',
          'That moment is almost always fixable, and it is almost never in a resignation letter.',
        ],
      },
      {
        part: 'Afterwards',
        heading: 'What to do with it',
        bullets: [
          'Record it against a reason category, so the pattern is countable rather than anecdotal.',
          'Review leaver reasons quarterly alongside turnover by department and by length of service.',
          'Three leavers naming the same thing is not three opinions, it is a finding.',
          'Report themes to the management team without attributing them.',
          'Act on one thing per quarter and tell the team what changed and why. Otherwise people stop answering honestly.',
        ],
      },
      {
        part: 'Afterwards',
        heading: 'Leaving well',
        bullets: [
          'Say thank you, specifically, for something they actually did.',
          'Complete the leaver process properly: access, uniform, locker, final pay, reference arrangements.',
          'Tell them they would be welcome back if that is true, and do not say it if it is not.',
          'A spa that people leave well speaks for itself in an industry where everybody knows everybody.',
        ],
      },
    ],
  },
]
