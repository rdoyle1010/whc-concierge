import type { HiringEntry } from './types'

// Watching somebody do the work.
//
// An interview predicts interview performance. A trade test predicts the job,
// and in a spa it is the only stage that reliably separates two candidates
// who both interviewed well. It is also the stage most often skipped, run
// informally, or run on a member of the team who then feels obliged to be
// kind about it.
//
// Each of these has a marking scheme written before the candidate arrives,
// because a trade test scored on impression afterwards is an interview with a
// couch in it.

const DEPT = 'HR & PEOPLE TEAM'

const FAIRNESS = {
  part: 'Running it fairly',
  heading: 'The rules that make it defensible',
  bullets: [
    'Every candidate for the role gets the same test, the same brief, the same time and the same model.',
    'Tell them in advance what the test is, how long it takes, and what to bring. A surprise tests nerves.',
    'Pay them for their time, or keep the test short enough that not paying is honest.',
    'Make any reasonable adjustment they ask for, and record that you did.',
    'Two assessors where possible, scoring independently before comparing.',
    'Score on the sheet during the test, not from memory afterwards.',
  ],
}

export const TRADE_TESTS: HiringEntry[] = [
  {
    reference: 'HR-TRADETEST-THER-GDE-905',
    title: 'Trade Test: Spa Therapist',
    department: DEPT,
    purpose:
      'To watch a therapist work before appointing them, against a scheme written in advance rather than a '
      + 'feeling formed afterwards.',
    whenToUse:
      'After a successful interview, before any offer. On every therapist candidate, including internal ones '
      + 'and including somebody recommended by a colleague.',
    sections: [
      {
        part: 'What it is',
        heading: 'Sixty minutes, one treatment, one consultation',
        paragraphs: [
          'A full consultation and a treatment from your own menu, on a model, in a room, with the assessor '
          + 'present for the consultation and for the first and last ten minutes of the treatment.',
          'Choose a treatment that is on the menu they would actually be delivering, and choose the same one '
          + 'for every candidate. A signature treatment is a fair test; an unusual one tests whether they '
          + 'happen to know it.',
          'The model is a member of the team or a regular guest who has agreed to it, and who knows they will '
          + 'be asked what it was like.',
        ],
      },
      {
        part: 'What it is',
        heading: 'Tell them this beforehand',
        bullets: [
          'The treatment, the duration and the products.',
          'That the consultation is part of the assessment.',
          'That they should treat the model exactly as they would treat a paying guest.',
          'What to bring and what to wear.',
          'That you will ask them afterwards how they thought it went.',
        ],
      },
      {
        part: 'Marking',
        heading: 'Consultation, before the treatment starts',
        intro: 'Scored one to four. This section predicts more about a therapist than the treatment does.',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Introduced themselves, explained what would happen, and put the model at ease', '', ''],
            ['Asked about medical history and contraindications properly, not as a formality', '', ''],
            ['Followed up on something disclosed rather than moving to the next question', '', ''],
            ['Asked what the model wanted from the treatment, and listened to the answer', '', ''],
            ['Explained what to remove, what would be covered, and left the room', '', ''],
            ['Recorded what they were told', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'The room and the setup',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Prepared the room and the trolley before collecting the model', '', ''],
            ['Hands and hygiene to standard, without being prompted', '', ''],
            ['Products checked, decanted correctly, nothing double dipped', '', ''],
            ['Anything applied warm was temperature checked', '', ''],
            ['Couch height set to them rather than left where it was', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'The treatment',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Draping maintained throughout; the model never exposed or uncertain', '', ''],
            ['Pressure checked early, then read rather than repeatedly asked', '', ''],
            ['Technique correct for the treatment, with their own body mechanics protected', '', ''],
            ['Flow and pace: no dead hands, no rushing the last ten minutes', '', ''],
            ['Presence: attentive without conversation the model has to maintain', '', ''],
            ['Finished on time without either cutting short or overrunning', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'The close',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Brought the model round properly rather than announcing the end', '', ''],
            ['Left the room while they dressed', '', ''],
            ['Gave aftercare advice specific to what was delivered', '', ''],
            ['Made a recommendation that followed from the treatment rather than from a list', '', ''],
            ['Left the room ready for the next person', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'Ask the model, privately',
        intro:
          'Out of the candidate’s hearing, before the assessor gives any view. The model noticed things '
          + 'the assessor could not, and will not say them in front of anybody.',
        table: {
          columns: ['Ask the model', 'What they said'],
          rows: [
            ['Did you feel looked after?', ''],
            ['Was there any moment you felt uncomfortable or exposed?', ''],
            ['Would you book this person again, and would you pay for it?', ''],
            ['Anything you would not say to their face?', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'Ask the candidate',
        intro:
          'Their answer to the first question is often the most useful thirty seconds of the whole process. '
          + 'Somebody who can name what they would change has judgement; somebody who says it went fine has '
          + 'either no judgement or no honesty.',
        table: {
          columns: ['Ask', 'What they said'],
          rows: [
            ['How do you think that went?', ''],
            ['What would you do differently?', ''],
            ['Was there anything you would normally do that you did not do today?', ''],
            ['Is there anything on our menu you would not be confident delivering yet?', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'Anything here ends it',
        intro:
          'Regardless of every other score. These are not preferences and they are not trainable in the first '
          + 'month.',
        bullets: [
          'Draping failure that left the model exposed.',
          'Skipped or perfunctory consultation, or a disclosed contraindication that was not acted on.',
          'Hygiene failure: hands, implements, or double dipping.',
          'Anything applied warm without a temperature check.',
          'A remark about the model’s body beyond what the treatment required.',
          'Defensiveness when asked how it went.',
        ],
      },
      FAIRNESS,
      {
        part: 'Running it fairly',
        heading: 'Decision',
        table: {
          columns: ['', 'Your answer'],
          rows: [
            ['Total score', ''],
            ['Any ending criterion triggered', ''],
            ['Would you put this person in a room with a paying guest next week', ''],
            ['If appointed, what is the first thing they need training on', ''],
            ['Recommendation', ''],
            ['Assessed by, and date', ''],
          ],
          fillable: true,
        },
      },
    ],
  },

  {
    reference: 'HR-TRADETEST-REC-GDE-906',
    title: 'Trade Test: Reception',
    department: DEPT,
    purpose:
      'To find out whether somebody can actually run a desk, which an interview does not reveal.',
    whenToUse: 'After a successful interview, before any offer, on every reception candidate.',
    sections: [
      {
        part: 'What it is',
        heading: 'Forty-five minutes at the desk',
        paragraphs: [
          'Three scenarios and a diary exercise, run away from live guests but at a real desk with a real '
          + 'system in front of them. Two of the scenarios are role-played by a member of the team who has '
          + 'been briefed; the third is written.',
          'They will not know your system. That is not what is being tested: tell them so, and score how they '
          + 'handle not knowing it, which is a genuine part of the job in the first month.',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'One: the late guest',
        paragraphs: [
          'Brief the role-player: you booked a sixty minute massage for two o’clock, it is now twenty past, '
          + 'you have come from a meeting, you are apologetic but you expect the full hour. The therapist has '
          + 'another guest at three.',
        ],
        bullets: [
          'Did they establish the facts before offering anything?',
          'Did they explain what was possible in terms of the next guest rather than in terms of a policy?',
          'Did they offer a real alternative rather than only an apology?',
          'Did the guest leave the conversation feeling dealt with rather than processed?',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'Two: the complaint at the desk',
        paragraphs: [
          'Brief the role-player: your treatment finished ten minutes early, the room was cold, and there are '
          + 'other people in reception. You are not shouting but you are clearly unhappy.',
        ],
        bullets: [
          'Did they move the conversation somewhere private, or at least lower the temperature?',
          'Did they listen without defending the therapist?',
          'Did they apologise for the experience without assigning blame to a colleague?',
          'Did they establish what the guest actually wanted before offering anything?',
          'Did they say what would happen next, with a timescale?',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'Three: the enquiry that should convert',
        paragraphs: [
          'Written, handed to them: a caller says "I am looking for something for my mother’s birthday, she '
          + 'is seventy-two and has had a hip replacement." Ask them to talk through what they would say.',
        ],
        bullets: [
          'Did they ask a question before recommending anything?',
          'Did they catch the medical detail and know it needed checking rather than guessing?',
          'Did they recommend something specific and say why it suited?',
          'Did they mention a voucher, and did they ask for the booking?',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'Four: the diary',
        paragraphs: [
          'Show them a printed day with a two-hour gap at eleven, a double booking at three, and a therapist '
          + 'finishing at four with a treatment booked until half past. Give them five minutes.',
        ],
        bullets: [
          'Did they spot all three problems, or only the one you would have pointed out?',
          'Which did they treat as urgent, and was that the right one?',
          'Did they propose something for the gap rather than only noting it?',
          'Did they ask a question about how the property usually handles it, which is the right instinct?',
        ],
      },
      {
        part: 'Marking',
        heading: 'Score each scenario as it happens',
        intro:
          'Filled in during the scenario rather than afterwards. Four scenarios scored from memory at the end '
          + 'become one impression with four supporting details attached to it.',
        table: {
          columns: ['Scenario', '1 to 4', 'What they actually did'],
          rows: [
            ['One: the late guest', '', ''],
            ['Two: the complaint at the desk', '', ''],
            ['Three: the enquiry that should convert', '', ''],
            ['Four: the diary', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Marking',
        heading: 'Across all four',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Warmth that does not disappear under pressure', '', ''],
            ['Established facts before offering solutions', '', ''],
            ['Protected a colleague without dismissing the guest', '', ''],
            ['Commercial instinct: asked for the booking, mentioned the add-on', '', ''],
            ['Spotted the diary problems and prioritised the right one', '', ''],
            ['Handled not knowing the system without freezing or bluffing', '', ''],
            ['Asked how the property does it rather than inventing an answer', '', ''],
            ['Written English in the note they left', '', ''],
          ],
          fillable: true,
        },
      },
      FAIRNESS,
      {
        part: 'Running it fairly',
        heading: 'Decision',
        table: {
          columns: ['', 'Your answer'],
          rows: [
            ['Total score', ''],
            ['Would you leave them alone on the desk on a Saturday after four weeks', ''],
            ['What is the one reservation', ''],
            ['Recommendation', ''],
            ['Assessed by, and date', ''],
          ],
          fillable: true,
        },
      },
    ],
  },

  {
    reference: 'HR-TRADETEST-MGT-GDE-907',
    title: 'Trade Test: Supervisor and Duty Manager',
    department: DEPT,
    purpose:
      'To find out how somebody decides, which is the whole of a duty management job and the thing an '
      + 'interview is worst at revealing.',
    whenToUse: 'After a successful interview, before any offer, on every supervisory or duty management candidate.',
    sections: [
      {
        part: 'What it is',
        heading: 'Four decisions and a walk',
        paragraphs: [
          'Three written scenarios with a decision required in each, followed by a walk of the spa with the '
          + 'assessor, during which the candidate says what they notice. About an hour.',
          'There is a right answer to two of the scenarios and no right answer to the third. Say so afterwards '
          + 'rather than before: how somebody handles a question with no clean answer is the point of '
          + 'including it.',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'One: the reading',
        paragraphs: [
          'It is Saturday, the spa is full, and the hourly water test comes back out of range. The retest '
          + 'twenty minutes later is still out of range. There are fourteen people in the pool and a wedding '
          + 'party arriving at two.',
        ],
        bullets: [
          'Did they close the pool? This is the one with a right answer.',
          'How quickly did they get there, and did they look for a way not to?',
          'Did they think about how to tell fourteen people, and the wedding party?',
          'Did they mention recording it, or telling anybody above them?',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'Two: the colleague',
        paragraphs: [
          'A therapist you supervise, who is popular and good, has twice this week left the room without '
          + 'completing the closing checks. You have mentioned it once, lightly. It is Sunday and you are the '
          + 'only manager in the building.',
        ],
        bullets: [
          'Did they address it directly rather than escalating it or leaving it for Monday?',
          'Did they separate the conversation from an audience?',
          'Did they record it, which is the part almost everybody misses?',
          'Did they treat the second occurrence differently from the first?',
        ],
      },
      {
        part: 'The scenarios',
        heading: 'Three: no clean answer',
        paragraphs: [
          'A regular member, who spends a great deal and knows the owner, has arrived for a treatment having '
          + 'clearly had a drink at lunch. They are not drunk. They are pleasant. The therapist has quietly '
          + 'told you they are uncomfortable.',
        ],
        bullets: [
          'Did they back the therapist? That is the answer, and how long it took them to get there matters.',
          'Did they think about how to say it to the member without humiliating them?',
          'Did they consider what to do about the treatment, the payment and the follow-up?',
          'Did they mention telling anybody, or recording it?',
          'Did they ask any question before deciding, or decide immediately?',
        ],
      },
      {
        part: 'The walk',
        heading: 'What did they notice',
        paragraphs: [
          'Walk the spa together for fifteen minutes and ask them to say what they see. Do not prompt. Note '
          + 'what they noticed, in the order they noticed it.',
        ],
        table: {
          columns: ['What they noticed', 'In what order', 'Was it worth noticing'],
          rows: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
          fillable: true,
        },
      },
      {
        part: 'The walk',
        heading: 'What to listen for',
        bullets: [
          'Whether they looked at safety before they looked at presentation.',
          'Whether they noticed anything in back of house, or only in guest areas.',
          'Whether they said what they would do about something, or only that it was wrong.',
          'Whether they asked about anything rather than assuming.',
          'Whether they were critical of the people rather than of the conditions.',
        ],
      },
      {
        part: 'Marking',
        heading: 'Score each, one to four',
        table: {
          columns: ['What you are watching for', '1 to 4', 'Note'],
          rows: [
            ['Decided rather than deferred, on the scenarios that have an answer', '', ''],
            ['Put safety ahead of revenue without being prompted to', '', ''],
            ['Backed a member of the team over a commercially important guest', '', ''],
            ['Addressed a performance issue directly and recorded it', '', ''],
            ['Thought about how something would be said, not only what would be decided', '', ''],
            ['Noticed the right things on the walk, in a sensible order', '', ''],
            ['Asked before assuming, where asking was available', '', ''],
            ['Handled the scenario with no clean answer without freezing', '', ''],
          ],
          fillable: true,
        },
      },
      FAIRNESS,
      {
        part: 'Running it fairly',
        heading: 'Decision',
        table: {
          columns: ['', 'Your answer'],
          rows: [
            ['Total score', ''],
            ['Would you leave the building with this person in charge of it', ''],
            ['What would they need support with in the first three months', ''],
            ['Recommendation', ''],
            ['Assessed by, and date', ''],
          ],
          fillable: true,
        },
      },
    ],
  },
]
