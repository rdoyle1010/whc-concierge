import type { HiringEntry } from './types'

// Advert, screening, interview, scoring.
//
// The single largest improvement available to most spa hiring is not a better
// question. It is asking every candidate the same questions and writing down
// a score before discussing it with anybody else. That removes the two
// failures that decide most bad hires: the candidate who interviewed well
// because the conversation went somewhere they were comfortable, and the
// panel member who talks first and anchors everybody.

const DEPT = 'HR & PEOPLE TEAM'

export const FINDING: HiringEntry[] = [
  {
    reference: 'HR-ADVERT-GDE-901',
    title: 'Writing a Spa Job Advert',
    department: DEPT,
    purpose: 'To write an advert that attracts the person you want and deters the person you do not.',
    whenToUse: 'Before a vacancy is posted anywhere, including internally.',
    sections: [
      {
        part: 'Before you write it',
        heading: 'What the advert is for',
        paragraphs: [
          'An advert is not a job description. A job description is what somebody will be held to once they '
          + 'have the job; an advert is an argument for applying, aimed at somebody currently employed '
          + 'elsewhere who was not looking this morning.',
          'The best spa candidates are almost never actively looking. They are working somewhere adequate, '
          + 'they are tired, and they will read three lines on a phone between treatments. Everything that '
          + 'matters has to be in those three lines.',
        ],
      },
      {
        part: 'Before you write it',
        heading: 'Decide these before the first sentence',
        bullets: [
          'The one thing about this job that is genuinely better than where they are now.',
          'The salary, or the range. An advert without one is filtered out by most good candidates.',
          'The pattern: full time or part time, weekends, evenings, and whether it is negotiable.',
          'What is non-negotiable, so unqualified applications do not consume a week of somebody’s time.',
          'Who they would report to and who they would work alongside.',
        ],
      },
      {
        part: 'The advert',
        heading: 'The structure that works',
        table: {
          columns: ['Part', 'What goes in it', 'Length'],
          rows: [
            ['Title', 'The role as candidates search for it. "Spa Therapist", not "Wellness Experience Ambassador".', 'Under 60 characters'],
            ['The hook', 'The one genuinely better thing. Named, specific, and true.', 'One or two sentences'],
            ['The property', 'What kind of spa this is, in a way somebody can picture. Size, facilities, the menu.', 'Two or three sentences'],
            ['The job', 'What the days actually look like. Not a duty list.', 'Four or five lines'],
            ['Who it suits', 'Qualifications and experience, stated as essential or wanted.', 'Four or five lines'],
            ['What you get', 'Salary, pattern, holiday, and the things that matter here: training, product house, treatment allowance.', 'A short list'],
            ['How to apply', 'One route, one click, and what happens next with a timescale.', 'Two lines'],
          ],
        },
      },
      {
        part: 'The advert',
        heading: 'Phrases that cost you candidates',
        intro: 'Each of these appears in most spa adverts and each of them narrows the field in the wrong direction.',
        bullets: [
          '"Competitive salary." Candidates read this as below market, because it usually is.',
          '"Fast-paced environment." Read as understaffed.',
          '"Wear many hats" or "no two days the same." Read as no job description and no boundaries.',
          '"Must be passionate." Everybody says it, so it filters nobody, and it reads as a substitute for paying properly.',
          '"Immediate start." Read as somebody left suddenly.',
          'A long list of duties. Nobody reads past the sixth, and it makes the job sound like a chore list.',
        ],
      },
      {
        part: 'The advert',
        heading: 'Phrases that earn you candidates',
        bullets: [
          'The actual salary or a real range.',
          'The number of treatment rooms, the product house, and the menu. Therapists judge a spa by these.',
          'The shift pattern, stated honestly including the weekends.',
          'What training is paid for and when.',
          'The size of the team, so somebody knows whether they are joining a floor or a department.',
          'One sentence about who they would report to, because most people leave a manager rather than a job.',
        ],
      },
      {
        part: 'Before it goes out',
        heading: 'The check',
        intro: 'Read the advert back against these before posting it.',
        bullets: [
          'Would somebody currently employed and not looking read past line three.',
          'Is every requirement in the essential list genuinely essential, or is one of them there out of habit.',
          'Does anything in it describe a person rather than a capability, which is where indirect discrimination starts.',
          'Is the pay stated. If it is not, say why in writing, because the reason is usually not one that survives being written down.',
          'Does it say what happens next and by when. A candidate who hears nothing for two weeks has taken another job.',
        ],
      },
      {
        part: 'Before it goes out',
        heading: 'Where to post it',
        table: {
          columns: ['Channel', 'Best for', 'Notes'],
          rows: [
            ['Talent House Collective', 'Spa and wellness professionals specifically', 'The audience is already qualified, so the advert can be shorter'],
            ['Your own team', 'Referrals, which hire best and stay longest', 'Ask directly rather than posting it internally and waiting'],
            ['Product house networks', 'Therapists trained on your brands', ''],
            ['Training providers and colleges', 'Entry level and newly qualified', 'Build the relationship before you need it'],
            ['General job boards', 'Reception and support roles', 'Expect volume and plan the screening time for it'],
          ],
        },
      },
    ],
  },

  {
    reference: 'HR-SCREENING-GDE-902',
    title: 'The Screening Call',
    department: DEPT,
    purpose:
      'To decide in fifteen minutes whether somebody is worth an hour, and to do it the same way for every '
      + 'applicant.',
    whenToUse: 'On every applicant who meets the essential criteria, before any interview is offered.',
    sections: [
      {
        part: 'Why this exists',
        heading: 'Fifteen minutes that saves a day',
        paragraphs: [
          'Most spas either interview everybody, which consumes a manager’s week, or shortlist from a CV, '
          + 'which selects for whoever writes the best CV rather than whoever does the best work.',
          'A structured screening call does neither. It confirms the facts that would end the conversation '
          + 'anyway, establishes whether the practical realities work, and gives the candidate enough to '
          + 'self-select out before either side has spent an hour.',
        ],
      },
      {
        part: 'The call',
        heading: 'What to confirm, in this order',
        bullets: [
          'That they hold the qualifications the role requires, and that they are current.',
          'Their notice period, and when they could actually start.',
          'That the pattern works: the weekends, the evenings, the travel.',
          'Their salary expectation, said out loud by them, before you say yours.',
          'Right to work, asked neutrally and asked of everybody.',
          'Why they are looking. Listen to the answer rather than to the first sentence of it.',
        ],
      },
      {
        part: 'The call',
        heading: 'Three questions worth asking every time',
        table: {
          columns: ['Ask', 'What you are listening for'],
          rows: [
            [
              'Talk me through a normal day where you are now.',
              'Volume, autonomy and standard. Somebody doing eight treatments a day in a busy day spa is a different hire from somebody doing three in a resort, and neither is wrong.',
            ],
            [
              'What would have to be true for you to stay where you are?',
              'The real reason they are leaving. It is rarely the reason given first, and knowing it tells you whether you can actually offer it.',
            ],
            [
              'What do you want to be doing in two years?',
              'Whether this job is a step or a stopgap. A stopgap is sometimes fine, and it changes what you invest in training.',
            ],
          ],
        },
      },
      {
        part: 'The call',
        heading: 'What to tell them',
        bullets: [
          'The salary or the range. Do not proceed to an interview with a gap you both know about.',
          'The pattern, honestly, including the weekend commitment.',
          'What the next stage is, what it involves, and when they will hear.',
          'One true thing about the property that is better than where they are.',
        ],
      },
      {
        part: 'Scoring it',
        heading: 'The screening record',
        intro:
          'Completed during the call rather than afterwards. Three minutes later, the answers have already '
          + 'started to merge with the last candidate.',
        table: {
          columns: ['', 'Candidate', 'Role', 'Date', 'Called by'],
          rows: [['', '', '', '', '']],
          fillable: true,
        },
      },
      {
        part: 'Scoring it',
        heading: 'Score each, one to four',
        intro:
          'Four points, not five. A five point scale collects threes, and a three tells you nothing about '
          + 'whether to spend an hour.',
        table: {
          columns: ['What', '1 to 4', 'Note'],
          rows: [
            ['Qualified and current for the role', '', ''],
            ['Availability and pattern work', '', ''],
            ['Salary expectation is within range', '', ''],
            ['Relevant experience at the right level', '', ''],
            ['Reason for leaving is one we can answer', '', ''],
            ['Communication: would a guest be at ease', '', ''],
            ['Decision: interview, hold, or no', '', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Scoring it',
        heading: 'Telling somebody no',
        paragraphs: [
          'Reply to every applicant, including the ones screened out on the call. It costs four minutes a week '
          + 'and it is the single cheapest thing a spa can do for its reputation as an employer.',
          'Say no clearly and without a reason that invites an argument. "We are progressing candidates with '
          + 'more experience in [x]" is honest and closed. "We will keep you on file" is neither.',
        ],
      },
    ],
  },

  {
    reference: 'HR-QUESTIONS-GDE-903',
    title: 'Interview Question Bank',
    department: DEPT,
    purpose:
      'To give every interviewer the same questions, chosen for what they reveal rather than for how they '
      + 'sound.',
    whenToUse: 'Chosen before the interview, used unchanged for every candidate for that role.',
    sections: [
      {
        part: 'How to use it',
        heading: 'Pick six, and ask all six of everybody',
        paragraphs: [
          'Choose six questions before you meet the first candidate: four from the competency sections that '
          + 'match the role, and two from the role-specific set. Ask those six, in that order, of every '
          + 'candidate, and score each one before discussing anybody.',
          'The consistency is the point. An interview where the questions follow the conversation selects for '
          + 'candidates who steer conversations well, which is a real skill and almost never the one being '
          + 'hired for.',
          'Follow up freely inside a question. "What did you do next" and "what happened as a result" are the '
          + 'two follow-ups that turn a rehearsed answer into a real one.',
        ],
      },
      {
        part: 'How to use it',
        heading: 'What a good answer contains',
        bullets: [
          'A specific situation, not a general policy. "I would usually" is not an answer to "tell me about a time".',
          'What they personally did, as distinct from what the team did.',
          'What happened as a result, including when it did not work.',
          'Something they would do differently, offered without being pushed.',
        ],
      },
      {
        part: 'Competencies',
        heading: 'Guest recovery and difficult conversations',
        intro:
          'Every one of these is asked because the answer cannot be rehearsed from a careers page. What you are listening for is in the right-hand column, and it is almost never the outcome: it is what they did and whether they know why.',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Tell me about a guest who was unhappy and you could not give them what they wanted. What did you do?',
              'The commonest situation in a spa and the one that separates people fastest. You are listening for what they offered instead, and whether they stayed in the conversation. Weak answers describe the guest at length and the therapist barely at all, or end at "I got my manager".',
            ],
            [
              'Describe a time you had to tell a guest no. How did you say it?',
              'Holding a boundary warmly is a trained skill and most people have never been taught it. You want the actual words. Weak answers give you the policy instead of the sentence, which means they have not found one that works.',
            ],
            [
              'Tell me about a complaint that was your fault. What happened afterwards?',
              'Tests whether they can say the words out loud. Anybody who cannot name one in an interview will not raise one on shift, and a complaint you hear about first from the guest is the expensive kind. Weak answers reach for a fault that turns out to be somebody else’s.',
            ],
            [
              'When did you last apologise to a guest for something that was not your fault?',
              'Separates people who represent the property from people who defend themselves. Weak answers explain why it was not their fault, which is the behaviour the question is looking for.',
            ],
          ],
        },
      },
      {
        part: 'Competencies',
        heading: 'Standards and judgement under pressure',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Tell me about a time you were running late and something had to give. What did you drop?',
              'Everybody runs late. What they sacrifice tells you their real standard, because it is the thing they decided mattered least when nobody was watching. Weak answers claim nothing was dropped, which means something was and they did not notice what.',
            ],
            [
              'Describe a time you noticed something unsafe. What did you do, and what happened?',
              'The most important question on this page for a wet area, and the answer you can verify against your own reporting culture. You want an action and a result. Weak answers report it to somebody and stop there, without ever finding out whether it was fixed.',
            ],
            [
              'When have you had to stop a treatment or refuse a guest? Talk me through it.',
              'Contraindications, intoxication, a guest who is unwell. A therapist who has never stopped one has either been lucky or has not been looking. Weak answers cannot recall an occasion, which is worth more probing than a clumsy answer.',
            ],
            [
              'Tell me about a standard you were asked to let slide. What did you do?',
              'Tests where their line is when the pressure comes from above rather than from a guest. Weak answers never mention having said anything, and that is the useful part of the answer.',
            ],
          ],
        },
      },
      {
        part: 'Competencies',
        heading: 'Working with other people',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Tell me about a colleague you found difficult to work with. What did you do about it?',
              'A small spa team is close quarters and one unresolved relationship costs you the rota. You want evidence they addressed it directly. Weak answers describe the colleague rather than the handling, and that is how they will describe your team to their next interviewer.',
            ],
            [
              'Describe a time you had to rely on somebody who let you down.',
              'Tells you what they do when a handover fails, which happens weekly. Weak answers end in resentment with no conversation in the middle.',
            ],
            [
              'When did you last give a colleague feedback they did not want?',
              'The single best predictor of whether a supervisory promotion will work. Weak answers give feedback upwards to a manager only, or describe telling somebody off rather than a conversation.',
            ],
            [
              'Tell me about a handover you received that was not good enough. What happened?',
              'Specific, common, and unrehearsable. You are listening for what they did with the gap, not how bad it was.',
            ],
          ],
        },
      },
      {
        part: 'Competencies',
        heading: 'Commercial instinct',
        intro:
          'Ask at least one of these of every candidate including therapists. Retail and rebooking are the difference between a spa that washes its face and one that does not, and it is a trainable skill only in somebody who is not embarrassed by it.',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Tell me about a product you recommended that the guest did not buy. Why do you think that was?',
              'Tests whether they think about selling at all. You want a reason that involves the guest rather than the price. Weak answers blame the price list, which is the answer of somebody who has decided the products are too expensive and is telling guests so without words.',
            ],
            [
              'Describe a time you rebooked somebody who had not planned to rebook.',
              'Rebooking at the bed is worth more than any marketing spend you can buy. You want the sentence they used. Weak answers describe reception doing it.',
            ],
            [
              'What do you say when a guest asks whether a treatment is worth the money?',
              'The hardest question in a luxury spa and the one nobody prepares for. A good answer talks about what the guest gets. Weak answers apologise for the price or dodge to a cheaper option.',
            ],
            [
              'Tell me about a target you did not hit. What did you change?',
              'Tests whether targets are something they own or something done to them. Weak answers explain why the target was unfair, and stop.',
            ],
          ],
        },
      },
      {
        part: 'By role',
        heading: 'Therapists',
        intro:
          'Two of these, alongside four from the competencies above. They are written to be asked by somebody who is not a therapist: the right-hand column tells you what a good answer contains so you can score it without having done the job yourself.',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Talk me through your consultation, from the guest sitting down to the treatment starting.',
              'The most revealing question you can ask a therapist. A good answer covers contraindications, pressure, expectations and what the guest wants from the hour, in a way that sounds like a conversation rather than a form. Weak answers are the form.',
            ],
            [
              'Tell me about a contraindication you found that the guest had not mentioned. What did you do?',
              'Tests whether the consultation is real or ceremonial. You want an adaptation or a refusal and a guest who was not embarrassed. Weak answers have never found one.',
            ],
            [
              'How do you decide pressure, and how do you check without interrupting the treatment?',
              'Pressure is the single commonest complaint in massage and the fix is entirely about checking early. A good answer checks in the first few minutes. Weak answers wait to be told.',
            ],
            [
              'What do you do in the fifteen minutes between guests?',
              'Tells you their standard when unobserved: the room, the linen, the notes, the next consultation. Weak answers describe a break.',
            ],
            [
              'Which treatment do you least enjoy giving, and how does the guest know?',
              'Everybody has one, so an honest answer is a good sign in itself. The second half is the real question. A good answer is specific about how they keep it off the bed.',
            ],
          ],
        },
      },
      {
        part: 'By role',
        heading: 'Reception',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'The diary has a two-hour gap this afternoon. What do you actually do about it?',
              'The most commercially valuable habit on reception, and one most people have never been asked to own. A good answer names who they would call and what they would offer. Weak answers wait for the manager to notice.',
            ],
            [
              'A guest arrives twenty minutes late for a sixty minute treatment. Walk me through the conversation.',
              'Happens weekly, and the cost of handling it badly is the therapist’s next guest. You want the words and the arithmetic. Weak answers either give away the full hour or deliver the bad news without an option.',
            ],
            [
              'Tell me about a booking you took that went wrong because of something you missed.',
              'Tests whether they check their own work. Weak answers blame the system, and every spa system does the same thing.',
            ],
            [
              'How do you sell a retail product from behind a desk without sounding like you are selling it?',
              'Retail at reception is almost entirely a confidence problem. A good answer ties it to what the guest has just had. Weak answers say they do not like to push, which is the whole answer.',
            ],
            [
              'The system is down and the phone is ringing. What is the first thing you do?',
              'Composure under a small crisis, which is most of the job. A good answer keeps the guest in front of them first and has a paper fallback. Weak answers go to find somebody.',
            ],
          ],
        },
      },
      {
        part: 'By role',
        heading: 'Supervisors and managers',
        table: {
          columns: ['Ask', 'Why this one, and what a weak answer sounds like'],
          rows: [
            [
              'Tell me about somebody you managed who was not performing. What did you do, and how did it end?',
              'The question that decides the hire. You want a conversation, a documented step and an outcome either way. Weak answers wait for the person to leave, or move straight to a process without ever having had the conversation.',
            ],
            [
              'Describe a decision you took on shift that you later found out was wrong.',
              'Tests whether they can be wrong out loud, which determines whether their team will tell them anything. Weak answers choose a decision that turned out fine.',
            ],
            [
              'How do you know whether a checklist was actually completed or just signed?',
              'Separates managers who audit from managers who collect paper. A good answer describes spot-checking the thing rather than the sheet. Weak answers trust the signature.',
            ],
            [
              'Tell me about a time you had to hold a standard that made you unpopular.',
              'A spa supervisor is usually promoted from the team they now manage, and this is the part that breaks people. Weak answers have never been unpopular, which usually means the standard moved.',
            ],
            [
              'What is the first number you look at in the morning, and why that one?',
              'Tells you whether they run the business or the rota. There is no single right answer: occupancy, average spend, tomorrow’s gaps and retail conversion are all defensible. Having no number is not.',
            ],
          ],
        },
      },
      {
        part: 'By role',
        heading: 'Questions to avoid, and why',
        table: {
          columns: ['Do not ask', 'Because'],
          rows: [
            ['Anything about age, health, disability, pregnancy, children, caring responsibilities or plans to have a family', 'Discriminatory, and the answer cannot lawfully inform the decision'],
            ['Where are you from, or where is your accent from', 'Discriminatory however warmly it is meant'],
            ['What is your current salary', 'It perpetuates whatever underpayment they arrived with. Ask their expectation instead'],
            ['Would you fit in here', 'Not a competency. It selects for similarity to the people already in the room'],
            ['Sell me this pen', 'Tests improvisation under artificial pressure, which is not the job'],
            ['Where do you see yourself in five years', 'Everybody has the same rehearsed answer, so it separates nobody'],
          ],
        },
      },
    ],
  },

  {
    reference: 'HR-SCORECARD-GDE-904',
    title: 'Interview Scorecard',
    department: DEPT,
    purpose:
      'To record a judgement before it is influenced by anybody else’s, and to make the decision '
      + 'explainable afterwards.',
    whenToUse: 'One per interviewer per candidate, completed in the room, before any discussion.',
    sections: [
      {
        part: 'How to use it',
        heading: 'Score before you talk',
        paragraphs: [
          'Every interviewer completes their own scorecard before anybody says what they thought. Whoever '
          + 'speaks first in an unscored debrief sets the outcome, and the more senior they are the more '
          + 'completely they set it.',
          'Score against what was said, not against how it felt. A candidate who gave a thin answer warmly '
          + 'gave a thin answer.',
          'Then compare. A wide spread between interviewers is useful information rather than a problem: it '
          + 'usually means one of you heard something the other missed, and that conversation is the value '
          + 'of interviewing in a pair.',
        ],
      },
      {
        part: 'The scorecard',
        heading: 'Candidate',
        table: {
          columns: ['Candidate', 'Role', 'Date', 'Interviewer'],
          rows: [['', '', '', '']],
          fillable: true,
        },
      },
      {
        part: 'The scorecard',
        heading: 'If you have not chosen six, ask these',
        intro:
          'The question bank holds thirty-four questions and tells you what each one is for. If there was '
          + 'no time to choose, these six work for almost any spa role, and the column on the right is what '
          + 'you are scoring so that somebody who has never interviewed can still score it honestly.',
        table: {
          columns: ['Ask', 'What the score is for'],
          rows: [
            [
              'Tell me about a guest who was unhappy and you could not give them what they wanted. What did you do?',
              'Guest recovery. Score what they offered instead and whether they stayed in the conversation, not how the story ended.',
            ],
            [
              'Tell me about a time you were running late and something had to give. What did you drop?',
              'Standards under pressure. Score the thing they sacrificed, because that is their real standard when nobody is watching.',
            ],
            [
              'Describe a time you noticed something unsafe. What did you do, and what happened?',
              'Safety behaviour. Score whether there was an action and whether they found out if it was fixed.',
            ],
            [
              'Tell me about a colleague you found difficult to work with. What did you do about it?',
              'Working in a small team. Score the handling. An answer that only describes the colleague scores low however reasonable it sounds.',
            ],
            [
              'What do you say when a guest asks whether a treatment is worth the money?',
              'Commercial confidence. Score whether they can talk about value without apologising for the price.',
            ],
            [
              'Tell me about something you got wrong at work. What happened afterwards?',
              'Whether they can be wrong out loud. Score the ownership, not the size of the mistake.',
            ],
          ],
        },
      },
      {
        part: 'The scorecard',
        heading: 'The six questions',
        intro:
          'Write the question, then the score, then one line of evidence. The evidence line is what makes '
          + 'this defensible three months later, and it is the part people skip. Ask the same six of every '
          + 'candidate for the role.',
        table: {
          columns: ['Question asked', '1 to 4', 'Evidence: what they actually said'],
          rows: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
          fillable: true,
        },
      },
      {
        part: 'The scorecard',
        heading: 'What the scores mean',
        table: {
          columns: ['Score', 'Means'],
          rows: [
            ['4', 'A specific example, what they did, what resulted, and reflection on it. Better than the standard we currently hold.'],
            ['3', 'A real example with a clear answer. Meets the standard.'],
            ['2', 'General or hypothetical. Would need support to reach the standard.'],
            ['1', 'No relevant answer, or an answer that concerns you.'],
          ],
        },
      },
      {
        part: 'The scorecard',
        heading: 'Against the essential criteria',
        intro:
          'Taken from the job description, not from the impression. Anything unmet here ends the decision '
          + 'whatever the interview scores were.',
        table: {
          columns: ['Essential criterion', 'Met', 'Evidence'],
          rows: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']],
          fillable: true,
        },
      },
      {
        part: 'The scorecard',
        heading: 'The decision',
        table: {
          columns: ['', 'Your answer'],
          rows: [
            ['Total score', ''],
            ['Would you want this person on your shift on a Saturday', ''],
            ['What is the one reservation', ''],
            ['If we hired them, what would they need in the first month', ''],
            ['Recommendation: appoint, appoint with reservations, second stage, or no', ''],
          ],
          fillable: true,
        },
      },
      {
        part: 'Afterwards',
        heading: 'Keeping it',
        bullets: [
          'Scorecards are the record of why a decision was made. Keep them for the period the property sets.',
          'Keep them securely and separately from the personnel file of whoever was appointed.',
          'A candidate may ask what was recorded about them. Write nothing you would not be willing to show them.',
          'Never write anything about a person rather than about their answers.',
        ],
      },
    ],
  },
]
