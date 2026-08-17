import type { AcademyCourse } from '../academy'
import type { CourseExtras } from '../academy-extras'
import type { CourseContent } from '../academy-types'

export const course: AcademyCourse = {
  slug: 'spa-manager-programme',
  title: 'Spa Manager Programme',
  tagline: 'Run the floor, lead the team and understand the numbers behind a high-performing spa',
  category: 'Commercial',
  minutes: 120,
  lessons: [
    { title: 'The Spa Manager Role', content: 'Move from excellent therapist to operational leader: standards, communication, ownership, daily rhythm and management judgement.' },
    { title: 'People Leadership & Performance', content: 'Build a calm, accountable team through briefings, one-to-ones, coaching, feedback, fair performance conversations and clear expectations.' },
    { title: 'Rotas, Capacity & Payroll Control', content: 'Plan staffing around demand, protect breaks and service quality, manage absence and agency use, and understand the payroll impact of every rota decision.' },
    { title: 'Guest Journey, Standards & Service Recovery', content: 'Translate luxury standards into repeatable operating habits, audit the guest journey and recover complaints without losing trust.' },
    { title: 'Revenue, Retail & Treatment Profitability', content: 'Use utilisation, average treatment value, retail, rebooking and menu contribution to improve commercial performance without damaging the guest experience.' },
    { title: 'Manager Scorecards, SOPs & 30-Day Action Plan', content: 'Turn numbers and observations into an operating plan: KPIs, SOP ownership, weekly priorities and a practical first 30 days.' },
  ],
  quiz: [
    { q: 'The strongest Spa Manager mindset is to...', options: ['Personally fix every problem', 'Create standards and systems so the team can deliver consistently', 'Focus only on treatment quality', 'Avoid commercial targets'] },
    { q: 'A good performance conversation should begin with...', options: ['Rumour and general impressions', 'Observed facts and the impact of the behaviour', 'A threat of disciplinary action', 'Comparison with another employee'] },
    { q: 'The best starting point for a rota is...', options: ['Who wants which shift', 'Forecast demand and the skills needed to serve it safely', 'The previous week copied exactly', 'Minimum headcount regardless of demand'] },
    { q: 'If payroll is high while utilisation is low, the manager should first...', options: ['Add more hours', 'Compare scheduled capacity with booked demand and identify the mismatch', 'Discount every treatment', 'Stop measuring utilisation'] },
    { q: 'The purpose of service recovery is to...', options: ['Prove the guest is wrong', 'Restore trust quickly and prevent the problem repeating', 'Offer compensation every time', 'Avoid recording complaints'] },
    { q: 'Treatment profitability should consider...', options: ['Selling price only', 'Price, room time, direct product cost and contribution per available hour', 'Only therapist commission', 'Only retail sales'] },
    { q: 'A useful monthly manager scorecard includes...', options: ['Revenue only', 'Commercial, guest, people and operational KPIs with actions', 'Only complaints', 'Only payroll'] },
    { q: 'An SOP is most useful when it...', options: ['Is written once and never revisited', 'Makes the expected process, responsibility and escalation route clear', 'Uses the longest possible wording', 'Replaces manager judgement in every situation'] },
  ],
}

export const extras: CourseExtras = {
  image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80&auto=format&fit=crop',
  lessons: [
    { guestView: '“The spa feels calm even when it is busy. Everyone seems to know what is happening.”', helpsYou: 'Operational control is what turns a strong therapist into someone trusted with a department.', tips: ['Start each day with priorities, risks and VIPs', 'Manage by standards, not moods', 'Fix the system as well as the immediate problem'] },
    { guestView: '“The team seem confident, warm and consistent rather than stressed or scripted.”', helpsYou: 'Managers are judged by the quality and stability of the team they build, not just by their own output.', tips: ['Use facts in feedback', 'Coach early before frustration grows', 'Keep expectations specific and measurable'] },
    { guestView: '“There was always someone available, but the spa never felt crowded or chaotic.”', helpsYou: 'Rota and payroll literacy is one of the clearest signs that you can be trusted with commercial responsibility.', tips: ['Plan from demand first', 'Protect skill mix as well as headcount', 'Track agency and overtime separately'] },
    { guestView: '“Something went wrong, but the way they handled it made me trust them more.”', helpsYou: 'Service recovery and standards management are core promotion-level skills in luxury hospitality.', tips: ['Audit the full journey, not just treatment rooms', 'Resolve first, explain second', 'Log root cause and prevention'] },
    { guestView: '“The recommendations made sense; nothing felt pushed.”', helpsYou: 'A manager who improves revenue without eroding guest trust becomes commercially valuable very quickly.', tips: ['Use contribution, not price alone', 'Grow utilisation before discounting', 'Coach recommendation quality, not just retail totals'] },
    { guestView: '“The spa feels organised because the basics are always right.”', helpsYou: 'The ability to turn KPIs into practical action is what separates management from supervision.', tips: ['One owner for every action', 'Review trends, not one-off numbers', 'Use SOPs as living operating tools'] },
  ],
}

export const content: CourseContent = {
  slug: 'spa-manager-programme',
  aims: 'A practical management programme for professionals stepping into, or already working in, day-to-day spa leadership. It combines people management, rota and payroll control, luxury service standards, commercial performance and operational systems so the learner can run a department with confidence rather than relying on instinct alone.',
  audience: 'Senior therapists, head therapists, supervisors, assistant spa managers and new Spa Managers working in luxury hotels, resorts, destination spas and premium day spas.',
  outcomes: [
    'Run a structured daily operating rhythm and set clear standards for a spa team',
    'Lead briefings, coaching and performance conversations using evidence and fair expectations',
    'Build rotas around demand, skill mix, breaks, payroll and operational resilience',
    'Audit and improve the luxury guest journey, including effective service recovery',
    'Interpret core commercial KPIs and improve utilisation, retail, rebooking and treatment contribution',
    'Build a practical scorecard, SOP framework and 30-day management action plan',
  ],
  lessons: [
    {
      title: 'The Spa Manager Role',
      objectives: ['Define the difference between supervising tasks and managing an operation', 'Build a daily management rhythm', 'Use ownership and escalation appropriately'],
      sections: [
        { heading: 'From expert doer to operational leader', body: 'The move into management is not a reward for being the best therapist; it is a change of job. Your output is now the consistency of the whole operation. A manager sets expectations, notices drift, allocates resources, removes obstacles and makes decisions early enough that the guest never sees the problem.' },
        { heading: 'The daily rhythm', body: 'A strong day starts before the first guest: staffing and sickness, room readiness, VIPs, maintenance risks, revenue gaps and team priorities. Use a short briefing, visible ownership and a handover process. The goal is not more meetings; it is fewer surprises.' },
        { heading: 'Ownership without heroics', body: 'Managers who personally fix everything create dependence. Solve urgent issues, then ask what system, training or ownership gap allowed the issue to happen. Your success is a team that can deliver when you are not standing beside them.' },
      ],
      keyTerms: [{ term: 'Operating rhythm', definition: 'The repeatable daily and weekly cadence used to brief, review, escalate and improve the operation.' }, { term: 'Ownership', definition: 'A named person accountable for completing an action and reporting the outcome.' }],
      caseStudy: { title: 'The fully booked Saturday', scenario: 'At 08:45 the spa has two sickness calls, a VIP couple arriving at 10:00 and one treatment room with a heating fault. The team immediately asks the manager what to do.', insight: 'The manager triages guest impact, reallocates skills, confirms room alternatives, communicates with reception and engineering, and gives each action an owner. After the day, the sickness-cover and room-fault procedures are reviewed so the same pressure does not require improvisation next time.' },
      summary: 'Management is the discipline of making standards, ownership and decisions visible before pressure reaches the guest.',
    },
    {
      title: 'People Leadership & Performance',
      objectives: ['Run effective briefings and one-to-ones', 'Give behavioural feedback without drama', 'Create fair performance follow-up'],
      sections: [
        { heading: 'Clarity before motivation', body: 'People cannot consistently meet a standard they cannot describe. Define expected behaviours: punctuality, consultation quality, room reset, retail recommendation, documentation and teamwork. Motivation improves when people understand what good looks like and believe the standard is applied fairly.' },
        { heading: 'Coaching in the moment', body: 'Use observed facts, explain the impact, restate the standard, ask for the employee perspective and agree the next action. Avoid labels such as lazy, negative or difficult. Behaviour can be coached; character accusations create defensiveness.' },
        { heading: 'Performance conversations', body: 'Serious or repeated issues need preparation and documentation. Separate capability, conduct, training and wellbeing. Follow company HR process, record what was discussed, what support is offered and when progress will be reviewed.' },
      ],
      keyTerms: [{ term: 'Behavioural feedback', definition: 'Feedback based on observable actions and their impact rather than personality labels.' }, { term: 'Review point', definition: 'A specific date when agreed performance actions are checked again.' }],
      caseStudy: { title: 'The brilliant but unreliable therapist', scenario: 'A highly requested therapist is repeatedly late for briefings and leaves room resets to colleagues. The rest of the team are becoming resentful.', insight: 'Popularity does not excuse behaviour. The manager uses specific examples, explains the operational and team impact, agrees a clear standard and review date, and follows the same process that would apply to anyone else.' },
      summary: 'Good leadership is clear, fair and evidence-based. It supports people while protecting the standard.',
    },
    {
      title: 'Rotas, Capacity & Payroll Control',
      objectives: ['Build a demand-led rota', 'Use utilisation and payroll together', 'Plan sickness, agency and overtime intelligently'],
      sections: [
        { heading: 'Start with demand, not preference', body: 'Forecast treatment hours by day and daypart, then layer the skill mix required to deliver them. Only after that should shift preferences be optimised. A rota that looks fair on paper but cannot serve the booked demand is not fair to guests or the team.' },
        { heading: 'Capacity and utilisation', body: 'Available treatment hours are the capacity you are paying for; booked treatment hours show how much of that capacity is used. Low utilisation with high payroll requires a scheduling response before it requires a marketing response.' },
        { heading: 'Resilience costs money too', body: 'Do not run permanently at the edge. Build realistic breaks, opening and closing duties, training, annual leave and known absence patterns. Track overtime and agency separately so emergency cover does not quietly become the normal staffing model.' },
      ],
      keyTerms: [{ term: 'Utilisation', definition: 'Booked treatment hours divided by available treatment hours.' }, { term: 'Skill mix', definition: 'The combination of qualifications and treatment capabilities required on a shift.' }],
      caseStudy: { title: 'The quiet Tuesday / overloaded Saturday problem', scenario: 'Payroll is above target, yet Saturday has a waiting list and Tuesday therapists have long gaps.', insight: 'The manager maps demand by daypart, changes shift patterns, reduces low-demand overlap, protects Saturday coverage and tracks the effect on utilisation, payroll and guest availability.' },
      summary: 'Rota quality is a commercial skill: the right people, with the right skills, at the times demand actually exists.',
    },
    {
      title: 'Guest Journey, Standards & Service Recovery',
      objectives: ['Map the full spa guest journey', 'Translate luxury standards into operating checks', 'Use structured service recovery'],
      sections: [
        { heading: 'The treatment is only one chapter', body: 'The guest experiences booking, arrival, changing areas, thermal spaces, waiting, treatment, retail and departure as one journey. A perfect treatment cannot fully erase a cold welcome or chaotic checkout.' },
        { heading: 'Standards become habits through checks', body: 'Use short, meaningful opening, mid-shift and closing checks. Audit what the guest can see, hear, smell and wait for. Standards should create consistency, not paperwork for its own sake.' },
        { heading: 'Recover trust fast', body: 'Listen without interruption, acknowledge impact, apologise without excuses, offer a concrete resolution within your authority, then record and prevent recurrence. Compensation is one tool, not the definition of recovery.' },
      ],
      keyTerms: [{ term: 'Service recovery', definition: 'The process of restoring guest trust after a service failure and preventing recurrence.' }, { term: 'Guest journey', definition: 'Every touchpoint the guest experiences before, during and after the treatment.' }],
      caseStudy: { title: 'The 25-minute delay', scenario: 'A guest booked for a birthday spa day is left waiting with no update while the therapist runs late.', insight: 'The manager owns the communication immediately, gives a realistic choice rather than vague reassurance, protects the paid treatment value where possible, records the root cause and addresses the scheduling behaviour that created the delay.' },
      summary: 'Luxury operations are judged across the whole journey, and recovery is strongest when it is fast, specific and followed by prevention.',
    },
    {
      title: 'Revenue, Retail & Treatment Profitability',
      objectives: ['Read the core revenue drivers', 'Understand contribution by treatment and room time', 'Coach commercial performance without creating pressure'],
      sections: [
        { heading: 'Revenue has drivers', body: 'Treatment revenue is shaped by available capacity, utilisation and average treatment value. Retail, rebooking, upgrades and memberships add value, but they should be diagnosed separately rather than blended into one sales number.' },
        { heading: 'Price is not profitability', body: 'A high-priced treatment can be weak commercially if it consumes too much room time or expensive product. Compare selling price, total room minutes, direct product cost and contribution per available treatment hour.' },
        { heading: 'Commercial coaching', body: 'Use consultation quality, relevant recommendation and clear next-step booking as service behaviours. Track outcomes, but coach the behaviour that creates the outcome. Pressure may create a short-term sale while damaging lifetime value.' },
      ],
      keyTerms: [{ term: 'Average treatment value', definition: 'Average treatment revenue generated per treatment sold.' }, { term: 'Contribution', definition: 'Revenue remaining after direct costs, used to compare the commercial value of treatments.' }],
      caseStudy: { title: 'The popular low-contribution ritual', scenario: 'A 90-minute signature ritual sells well but uses expensive product, long setup and reset time and blocks prime capacity.', insight: 'The manager calculates contribution per room hour, reviews price and protocol, tests whether some setup can be reduced and compares the result with shorter treatments during peak demand.' },
      summary: 'Commercial management means understanding the drivers behind revenue and protecting guest trust while improving them.',
    },
    {
      title: 'Manager Scorecards, SOPs & 30-Day Action Plan',
      objectives: ['Build a balanced scorecard', 'Write useful SOPs', 'Convert analysis into a focused 30-day plan'],
      sections: [
        { heading: 'The scorecard', body: 'A useful manager scorecard combines revenue, payroll, utilisation, average treatment value, retail, rebooking, guest feedback, complaints, sickness, agency spend and operational risks. Every red number should lead to a named investigation or action.' },
        { heading: 'SOPs that people can actually use', body: 'A strong SOP states purpose, scope, ownership, steps, safety points, exceptions, records and review date. Keep it clear enough that a trained team member can follow it under pressure.' },
        { heading: 'The first 30 days', body: 'Do not try to transform everything at once. Choose the three to five highest-impact priorities, define a baseline, owner, action, success measure and review date. Visible delivery builds confidence faster than a long wish list.' },
      ],
      keyTerms: [{ term: 'Balanced scorecard', definition: 'A small set of commercial, guest, people and operational measures reviewed together.' }, { term: 'SOP', definition: 'A documented standard operating procedure that defines the expected process and escalation points.' }],
      caseStudy: { title: 'The new manager with twenty ideas', scenario: 'A newly promoted manager identifies problems in retail, rota, standards, training, maintenance and guest communications in the first week.', insight: 'Rather than launch six initiatives, the manager chooses the highest guest and commercial risks, establishes baselines, assigns owners and reviews progress weekly. Other improvements move into a controlled backlog.' },
      summary: 'Strong managers turn information into a short list of owned actions, then review whether those actions changed the result.',
    },
  ],
}
