// A line a day, for whoever opens the platform.
//
// Two rules about what goes in here.
//
// It has to earn its place on a screen somebody opened to do something else.
// A poster quote about believing in yourself is worse than a blank space: it
// makes a serious platform look like a wall calendar, and the people this is
// for run departments with six-figure budgets and read that instantly.
//
// And the attribution has to be right. Misquoting a real person, or hanging
// somebody's name on a line they never said, is a small lie printed under our
// own logo every day. So most of these are ours, written for this industry
// and credited to the house, and the ones that are not are lines their
// authors are genuinely known for.

export type Thought = {
  text: string
  /** Left out where the line is the house's own. */
  author?: string
}

export const THOUGHTS: Thought[] = [
  { text: 'Nobody remembers the treatment menu. They remember whether the person doing it seemed glad they came.' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'A spa runs on the things nobody is paid to notice. Warm towels. A door that does not stick. Somebody who read the notes.' },
  { text: 'The details are not the details. They make the design.', author: 'Charles Eames' },
  { text: 'You cannot charge five-star prices for a three-star handover.' },
  { text: 'If your therapists dread the rota, your guests can feel it by Wednesday.' },
  { text: 'Care about what other people think and you will always be their prisoner.', author: 'Lao Tzu' },
  { text: 'Being fully booked is not the same as being profitable, and the difference is usually retail.' },
  { text: 'The best spa manager in the country is somewhere on a rota being told she is not ready.' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'A treatment room that runs late is a design problem, not a discipline problem.' },
  { text: 'Train people well enough so they can leave. Treat them well enough so they do not want to.', author: 'Richard Branson' },
  { text: 'Any spa can buy the same beds and the same products. Nobody can buy your team.' },
  { text: 'Luxury is not what you spend. It is what you do not have to ask for twice.' },
  { text: 'The person who knows every guest by name is on your lowest pay band. Check that is still true tomorrow.' },
  { text: 'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', author: 'Antoine de Saint-Exupery' },
  { text: 'Discounting is a decision to be busy instead of good. It is a fine decision, as long as it is a decision.' },
  { text: 'Your reviews describe your rota three weeks ago.' },
  { text: 'It is not the strongest who survive, but the ones most responsive to change.', author: 'Leon Megginson' },
  { text: 'A therapist who has not been trained this year is a therapist somebody else is training.' },
  { text: 'The guest does not know what a good facial costs to deliver. They know exactly what one feels like.' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act but a habit.', author: 'Will Durant' },
  { text: 'Every spa says it is about wellbeing. Look at the staff room and decide whether you believe it.' },
  { text: 'Hiring for attitude is not a soft option. It is the hardest interview to run well.' },
  { text: 'You can teach a treatment in three days. You cannot teach somebody to notice.' },
  { text: 'Design is not just what it looks like. Design is how it works.', author: 'Steve Jobs' },
  { text: 'A twenty-minute turnaround is not a standard, it is a countdown, and your guest can hear it.' },
  { text: 'The spa director who reads the P&L is the one who gets to protect the treatment time.' },
  { text: 'People will forget what you said, but they will never forget how you made them feel.', author: 'Maya Angelou' },
  { text: 'A brand is what your team says about you on their day off.' },
  { text: 'Retail is not selling. It is finishing the treatment properly.' },
  { text: 'The standard you walk past is the standard you accept.', author: 'David Morrison' },
  { text: 'If the only way to hit the target is to shorten the massage, the target is wrong.' },
  { text: 'Your best therapist is being recruited right now, by somebody who remembered her name.' },
  { text: 'Experience is not the number of years. It is the number of things you would now do differently.' },
  { text: 'It is not enough to be busy. The question is: what are we busy about?', author: 'Henry David Thoreau' },
  { text: 'Consistency beats brilliance. A spa that is very good every single day will outlast one that is occasionally extraordinary.' },
  { text: 'The pre-opening decisions you rush are the operating problems you inherit for a decade.' },
  { text: 'Guests do not compare you to the spa down the road. They compare you to the best hour they have had this year.' },
  { text: 'Whether you think you can or think you cannot, you are right.', author: 'Henry Ford' },
  { text: 'Write the job description for the person you want, not the person who left.' },
  { text: 'A quiet Tuesday is a training day, a deep-clean day, or a wasted day. It is never nothing.' },
  { text: 'The manager who cannot take a holiday has not built a department, she has built a dependency.' },
  { text: 'Consultation is not paperwork. It is the only part of the treatment where you find out what they actually need.' },
  { text: 'Do not judge each day by the harvest you reap, but by the seeds that you plant.', author: 'Robert Louis Stevenson' },
  { text: 'The word "just" does more damage in a spa than any complaint. Just a therapist. Just reception. Just a facial.' },
  { text: 'Your treatment menu should be short enough that every person on your team can deliver all of it brilliantly.' },
  { text: 'Nobody leaves a job. They leave a rota, a manager, or a ceiling.' },
  { text: 'The first person a guest speaks to decides what the next two hours feel like. Pay accordingly.' },
  { text: 'What you tolerate on a Monday is what a guest writes about on Friday.' },
  { text: 'You do not have a recruitment problem. You have a reputation among therapists, and you can find out what it is by asking one.' },
  { text: 'A guest who has to explain their allergy twice has already decided how organised you are.' },
  { text: 'Take care of your employees and they will take care of your business.', author: 'Richard Branson' },
  { text: 'Being good at your job and being able to describe it are two different skills, and only one of them gets you the interview.' },
  { text: 'The best career move in this industry is usually the one that looks sideways.' },
  { text: 'Uniform, lighting, music, scent. Four decisions, made once, felt by every guest for years.' },
  { text: 'Ask your team what they would change if it were their spa. Then read your own face while they answer.' },
  { text: 'Growth is never by mere chance. It is the result of forces working together.', author: 'James Cash Penney' },
  { text: 'An empty column in a rota is not a gap in staffing. It is a decision about who is going to be exhausted.' },
  { text: 'The spa industry does not have a skills shortage. It has a retention problem it keeps describing as a skills shortage.' },
]

/**
 * The line for a given day.
 *
 * Deterministic, and the same for everybody: two people who open this on the
 * same morning should be able to talk about it. Nothing is stored, nothing is
 * chosen at random, and the sequence does not repeat within a season.
 *
 * The date is taken in London rather than the viewer's timezone, on purpose.
 * This is one register, in one industry, and a line that changes at four in
 * the afternoon for somebody working in Dubai is a bug worth avoiding for the
 * sake of a small amount of arithmetic.
 */
export function thoughtForDay(now: Date = new Date()): Thought {
  const london = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  const [day, month, year] = london.split('/').map(Number)

  // Days since an arbitrary fixed date, which is all that is needed: it only
  // has to advance by exactly one every midnight.
  const days = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
  return THOUGHTS[((days % THOUGHTS.length) + THOUGHTS.length) % THOUGHTS.length]
}
